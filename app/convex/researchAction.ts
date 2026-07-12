"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { LinkupClient, type TextSearchResult } from "linkup-sdk";
import { z } from "zod";
import { createHash } from "node:crypto";
import type { Id } from "./_generated/dataModel";

const HERMES_DEFAULT_URL = "https://cerno-hermes-74d2dc62.eastus.cloudapp.azure.com";

const findingSchema = z.object({
  candidateKey: z.string().regex(/^C\d+$/),
  claim: z.string().min(20).max(700),
  evidenceQuote: z.string().min(20).max(900),
  confidence: z.number().min(0).max(1),
  section: z.enum(["must_know", "exact_moment", "archive", "serendipity"]),
  explanation: z.string().min(20).max(900),
  whyNow: z.string().min(15).max(600),
  tasteRules: z.array(z.string().max(300)).min(1).max(3),
  attentionMinutes: z.number().int().min(1).max(30),
  scores: z.object({
    focusRelevance: z.number().min(0).max(100),
    tasteFit: z.number().min(0).max(100),
    novelty: z.number().min(0).max(100),
    evidenceQuality: z.number().min(0).max(100),
    sourceTrust: z.number().min(0).max(100),
    redundancy: z.number().min(0).max(100),
  }),
});

const directorOutputSchema = z.object({
  title: z.string().min(10).max(140),
  summary: z.string().min(30).max(1000),
  findings: z.array(findingSchema).min(1).max(5),
  rejections: z
    .array(
      z.object({
        candidateKey: z.string().regex(/^C\d+$/),
        reason: z.string().min(10).max(500),
      }),
    )
    .max(8),
});

type DirectorOutput = z.infer<typeof directorOutputSchema>;
type FetchedCandidate = {
  key: string;
  id: Id<"candidates">;
  title: string;
  url: string;
  sourceName: string;
  markdown: string;
};

type HermesStatus = {
  status: string;
  output?: string;
  error?: string;
  usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
};

type ResearchContext = {
  run: {
    focusSnapshot: {
      currentWork: string;
      outcome: string;
      assignment: string;
      knownContext: string;
      freshness: string;
      serendipity: number;
    };
  };
  tasteDoc: { version: number; markdown: string };
  archive: Array<{ title: string; claimText: string }>;
};

function hostName(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Unknown source";
  }
}

function freshnessStart(label: string) {
  const now = new Date();
  if (label === "Past 30 days") now.setDate(now.getDate() - 30);
  else if (label === "Past 6 months") now.setMonth(now.getMonth() - 6);
  else if (label === "Past 12 months") now.setFullYear(now.getFullYear() - 1);
  else return undefined;
  return now.toISOString();
}

function contentType(url: string): "web" | "paper" | "video" {
  const lower = url.toLowerCase();
  if (lower.includes("arxiv.org") || lower.endsWith(".pdf") || lower.includes("doi.org")) return "paper";
  if (lower.includes("youtube.com") || lower.includes("youtu.be") || lower.includes("vimeo.com")) return "video";
  return "web";
}

function cleanMarkdown(markdown: string) {
  return markdown
    .replace(/\r/g, "")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, 7_000);
}

function recoverExactQuote(markdown: string, quote: string) {
  const normalize = (value: string, withMap: boolean) => {
    let text = "";
    const map: number[] = [];
    let previousWasSpace = false;
    for (let index = 0; index < value.length; index += 1) {
      const character = value[index];
      // Models commonly omit harmless Markdown emphasis markers around copied text.
      if ("*_`#".includes(character)) continue;
      const normalizedCharacter = /\s/.test(character)
        ? " "
        : character.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").toLowerCase();
      if (normalizedCharacter === " " && previousWasSpace) continue;
      text += normalizedCharacter;
      if (withMap) map.push(index);
      previousWasSpace = normalizedCharacter === " ";
    }
    return { text: withMap ? text : text.trim(), map };
  };
  const source = normalize(markdown, true);
  const target = normalize(quote, false).text;
  if (target.length < 20) return null;
  const offset = source.text.indexOf(target);
  if (offset < 0) return null;
  const start = source.map[offset];
  const end = source.map[offset + target.length - 1];
  if (start === undefined || end === undefined) return null;
  return markdown.slice(start, end + 1);
}

function sourceChunk(markdown: string, quote: string) {
  const offset = markdown.indexOf(quote);
  if (offset < 0) return null;
  const start = Math.max(0, offset - 380);
  const end = Math.min(markdown.length, offset + quote.length + 380);
  const chunk = markdown.slice(start, end).trim();
  const before = markdown.slice(0, offset);
  const paragraph = before.split(/\n\s*\n/).length;
  const headings = before.match(/^#{1,4}\s+.+$/gm);
  const heading = headings?.at(-1)?.replace(/^#+\s*/, "");
  return {
    chunk,
    locator: heading ? `${heading} · paragraph ${paragraph}` : `Paragraph ${paragraph}`,
    hash: createHash("sha256").update(chunk).digest("hex"),
  };
}

function parseJsonOutput(raw: string): DirectorOutput {
  const withoutFence = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const firstBrace = withoutFence.indexOf("{");
  const lastBrace = withoutFence.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace < firstBrace) throw new Error("Hermes returned no JSON object.");
  return directorOutputSchema.parse(JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1)));
}

function buildDirectorPrompt(
  context: ResearchContext,
  sources: FetchedCandidate[],
) {
  const sourceBlock = sources
    .map(
      (source) => `\n<source id="${source.key}" title="${source.title.replaceAll('"', "'")}" url="${source.url}">\n${source.markdown}\n</source>`,
    )
    .join("\n");
  const archive = context.archive
    .map((entry) => `- ${entry.title}: ${entry.claimText}`)
    .join("\n");
  const target = Math.min(3, sources.length);

  return `Execute one bounded Cerno research review. Use delegate_task once with exactly three parallel specialists:
1) Evidence Analyst A: inspect sources ${sources.filter((_, index) => index % 2 === 0).map((item) => item.key).join(", ")}.
2) Evidence Analyst B: inspect sources ${sources.filter((_, index) => index % 2 === 1).map((item) => item.key).join(", ")}.
3) Personal Editor: compare the candidate set with the TasteDoc, Focus Thread, and personal archive below.
After all three return, act as Research Director: select exactly ${target} strongest non-redundant findings, check every quote, title the briefing from accepted evidence, and reject the remaining candidates.

FOCUS THREAD
Current work: ${context.run.focusSnapshot.currentWork}
Desired outcome: ${context.run.focusSnapshot.outcome}
Research assignment: ${context.run.focusSnapshot.assignment}
Known context / skip instructions: ${context.run.focusSnapshot.knownContext || "None supplied"}
Freshness: ${context.run.focusSnapshot.freshness}
Serendipity budget: ${context.run.focusSnapshot.serendipity}%

TASTEDOC v${context.tasteDoc.version}
${context.tasteDoc.markdown}

PERSONAL ARCHIVE (comparison context, not source evidence)
${archive || "No prior claims."}

FETCHED PRIMARY SOURCES
${sourceBlock}

PUBLICATION CONTRACT
- Search metadata is not evidence. Use only text inside the <source> blocks.
- evidenceQuote must be one exact, contiguous substring copied character-for-character from that source. Do not remove markdown markers, alter punctuation, or use ellipses.
- A claim must not exceed what its exact quote supports.
- Prefer primary evidence, measurements, operational detail, and material that changes a decision.
- Mark novelty relative to the personal archive; do not present an archive item as fresh evidence.
- Scores are integers from 0 to 100. redundancy is a penalty score.
- Use section "exact_moment" only for timestamped audiovisual evidence; otherwise use must_know, archive, or serendipity.
- Return ONLY one valid JSON object, no markdown, with this exact shape:
{"title":"evidence-derived title","summary":"decision-ready synthesis","findings":[{"candidateKey":"C1","claim":"atomic supported claim","evidenceQuote":"exact source substring","confidence":0.9,"section":"must_know","explanation":"why Cerno selected this for this person","whyNow":"why it matters to the current work","tasteRules":["applicable rule"],"attentionMinutes":4,"scores":{"focusRelevance":90,"tasteFit":85,"novelty":70,"evidenceQuality":90,"sourceTrust":80,"redundancy":10}}],"rejections":[{"candidateKey":"C4","reason":"specific rejection reason"}]}`;
}

async function fetchHermesEvents(url: string, key: string, runId: string) {
  try {
    const response = await fetch(`${url}/v1/runs/${runId}/events`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const text = await response.text();
    const started = text.match(/"event":\s*"tool\.started"[^\n]+"tool":\s*"delegate_task"/g)?.length ?? 0;
    const duration = text.match(/"tool":\s*"delegate_task"[^\n]+"duration":\s*([0-9.]+)/)?.[1];
    return { started, duration };
  } catch {
    return null;
  }
}

export const execute = internalAction({
  args: { runId: v.id("researchRuns") },
  handler: async (ctx, { runId }) => {
    let directorStep: Id<"agentSteps"> | undefined;
    let scoutStep: Id<"agentSteps"> | undefined;
    let analystAStep: Id<"agentSteps"> | undefined;
    let analystBStep: Id<"agentSteps"> | undefined;
    let editorStep: Id<"agentSteps"> | undefined;
    let reviewStep: Id<"agentSteps"> | undefined;

    try {
      const context = await ctx.runQuery(internal.research.loadContext, { runId });
      await ctx.runMutation(internal.research.updateRun, {
        runId,
        status: "planning",
        phase: "Director is interpreting the research contract",
        startedAt: Date.now(),
      });
      directorStep = await ctx.runMutation(internal.research.createStep, {
        runId,
        role: "Research Director",
        label: "Plan bounded research",
        assignment: "Translate the Focus Thread into source and evidence requirements.",
        status: "running",
        order: 1,
      });
      await ctx.runMutation(internal.research.addEvent, {
        runId,
        type: "director.started",
        label: "Research Director started",
        detail: "The run is bound to an immutable Focus Thread snapshot and approved TasteDoc version.",
      });

      const linkupKey = process.env.LINKUP_API_KEY;
      if (!linkupKey) throw new Error("LINKUP_API_KEY is not configured in the Convex environment.");
      const linkup = new LinkupClient({ apiKey: linkupKey });
      await ctx.runMutation(internal.research.updateRun, {
        runId,
        status: "discovering",
        phase: "Scout is searching live sources",
      });
      scoutStep = await ctx.runMutation(internal.research.createStep, {
        runId,
        parentStepId: directorStep!,
        role: "Scout",
        label: "Discover and triage candidates",
        assignment: "Search live web and papers; preserve snippets as discovery metadata only.",
        status: "running",
        order: 2,
      });

      const query = `${context.run.focusSnapshot.assignment}. Current work: ${context.run.focusSnapshot.currentWork}. Desired outcome: ${context.run.focusSnapshot.outcome}. Find recent primary sources, technical reports, research papers, or first-party engineering evidence. ${context.run.focusSnapshot.knownContext ? `Avoid repeating: ${context.run.focusSnapshot.knownContext}` : ""}`;
      const fromDate = freshnessStart(context.run.focusSnapshot.freshness);
      const searchResponse = await linkup.search({
        query,
        depth: "standard",
        outputType: "searchResults",
        maxResults: 7,
        ...(fromDate ? { fromDate } : {}),
      });
      const textResults = searchResponse.results
        .filter((item): item is TextSearchResult => item.type === "text")
        .filter((item, index, all) => all.findIndex((other) => other.url === item.url) === index)
        .slice(0, 7);
      if (textResults.length === 0) throw new Error("LinkUp returned no text candidates for this research contract.");

      const candidateIds = await ctx.runMutation(internal.research.saveCandidates, {
        runId,
        candidates: textResults.map((item) => ({
          url: item.url,
          title: item.name,
          sourceName: hostName(item.url),
          description: item.content.slice(0, 500),
          contentType: contentType(item.url),
        })),
      });
      await ctx.runMutation(internal.research.updateStep, {
        stepId: scoutStep!,
        status: "complete",
        summary: `${textResults.length} candidates discovered; snippets retained only as discovery metadata.`,
        toolCalls: 1,
      });
      await ctx.runMutation(internal.research.addEvent, {
        runId,
        type: "discovery.complete",
        label: `${textResults.length} live candidates discovered`,
        detail: "Cerno will fetch selected primary pages before any claim can be published.",
      });

      await ctx.runMutation(internal.research.updateRun, {
        runId,
        status: "analyzing",
        phase: "Fetching selected sources beyond search snippets",
      });
      const selected = textResults.slice(0, 4);
      const fetchedSettled = await Promise.allSettled(
        selected.map(async (item, index) => {
          await ctx.runMutation(internal.research.markCandidate, {
            candidateId: candidateIds[index],
            status: "selected",
          });
          const result = await linkup.fetch({ url: item.url, renderJs: false });
          const markdown = cleanMarkdown(result.markdown);
          if (markdown.length < 600) throw new Error("Fetched source was too short to support evidence.");
          await ctx.runMutation(internal.research.markCandidate, {
            candidateId: candidateIds[index],
            status: "consumed",
          });
          return {
            key: `C${index + 1}`,
            id: candidateIds[index],
            title: item.name,
            url: item.url,
            sourceName: hostName(item.url),
            markdown,
          } satisfies FetchedCandidate;
        }),
      );
      const fetched: FetchedCandidate[] = [];
      for (let index = 0; index < fetchedSettled.length; index += 1) {
        const result = fetchedSettled[index];
        if (result.status === "fulfilled") fetched.push(result.value);
        else {
          await ctx.runMutation(internal.research.markCandidate, {
            candidateId: candidateIds[index],
            status: "unavailable",
            rejectionReason: "Primary source fetch failed; search metadata was not used as evidence.",
          });
        }
      }
      if (fetched.length < 2) throw new Error("Fewer than two primary sources could be fetched beyond search snippets.");
      await ctx.runMutation(internal.research.updateRun, {
        runId,
        consumedCount: fetched.length,
        phase: "Hermes is delegating parallel evidence review",
      });

      analystAStep = await ctx.runMutation(internal.research.createStep, {
        runId,
        parentStepId: directorStep!,
        role: "Evidence Analyst A",
        label: "Inspect primary-source evidence",
        assignment: `Read ${fetched.filter((_, index) => index % 2 === 0).map((item) => item.key).join(", ")} and return exact quotes.`,
        status: "running",
        order: 3,
      });
      analystBStep = await ctx.runMutation(internal.research.createStep, {
        runId,
        parentStepId: directorStep!,
        role: "Evidence Analyst B",
        label: "Inspect primary-source evidence",
        assignment: `Read ${fetched.filter((_, index) => index % 2 === 1).map((item) => item.key).join(", ")} and return exact quotes.`,
        status: "running",
        order: 4,
      });
      editorStep = await ctx.runMutation(internal.research.createStep, {
        runId,
        parentStepId: directorStep!,
        role: "Personal Editor",
        label: "Judge novelty and personal value",
        assignment: "Compare candidates with the Focus Thread, TasteDoc, and prior archive claims.",
        status: "running",
        order: 5,
      });

      const hermesKey = process.env.HERMES_API_KEY;
      const hermesUrl = (process.env.HERMES_URL || HERMES_DEFAULT_URL).replace(/\/$/, "");
      if (!hermesKey) throw new Error("HERMES_API_KEY is not configured in the Convex environment.");
      const prompt = buildDirectorPrompt(context, fetched);
      let hermesStatus: HermesStatus | null = null;
      let hermesRunId = "";
      let lastHermesError = "Hermes did not return a terminal response.";

      // One bounded infrastructure retry is allowed. It creates a separate Hermes run
      // and remains visible in Cerno's event ledger rather than silently looping.
      for (let runtimeAttempt = 0; runtimeAttempt < 2; runtimeAttempt += 1) {
        if (runtimeAttempt === 1) {
          // Give the previous run time to release gateway/model concurrency before
          // consuming the single retry budget.
          await new Promise((resolve) => setTimeout(resolve, 15_000));
          await ctx.runMutation(internal.research.addEvent, {
            runId,
            type: "hermes.retry",
            label: "Hermes infrastructure retry 1/1",
            detail: lastHermesError.slice(0, 400),
          });
        }
        const submitResponse = await fetch(`${hermesUrl}/v1/runs`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hermesKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `cerno-${runId}-attempt-${runtimeAttempt + 1}`,
          },
          body: JSON.stringify({
            input: prompt,
            session_id: runtimeAttempt === 0 ? String(runId) : `${runId}-retry-1`,
            instructions: "Operate as Cerno's Research Director. Use native delegate_task exactly as requested. Never invent evidence. Return only the requested JSON object.",
          }),
        });
        if (!submitResponse.ok) {
          lastHermesError = `Hermes rejected attempt ${runtimeAttempt + 1} (${submitResponse.status}).`;
          continue;
        }
        const submission = (await submitResponse.json()) as { run_id?: string; id?: string };
        hermesRunId = submission.run_id ?? submission.id ?? "";
        if (!hermesRunId) {
          lastHermesError = "Hermes returned no run ID.";
          continue;
        }
        await ctx.runMutation(internal.research.updateRun, { runId, hermesRunId });
        await ctx.runMutation(internal.research.addEvent, {
          runId,
          type: "hermes.submitted",
          label: runtimeAttempt === 0 ? "Hermes run accepted" : "Hermes retry accepted",
          detail: `Runtime correlation ID ${hermesRunId}. Three specialist assignments were submitted for native delegation.`,
        });

        hermesStatus = null;
        for (let pollAttempt = 0; pollAttempt < 120; pollAttempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 2_000));
          const currentStatus = await ctx.runQuery(internal.research.getStatus, { runId });
          if (currentStatus === "cancelled") {
            await fetch(`${hermesUrl}/v1/runs/${hermesRunId}/stop`, {
              method: "POST",
              headers: { Authorization: `Bearer ${hermesKey}` },
            }).catch(() => undefined);
            return;
          }
          const statusResponse = await fetch(`${hermesUrl}/v1/runs/${hermesRunId}`, {
            headers: { Authorization: `Bearer ${hermesKey}` },
          });
          if (!statusResponse.ok) continue;
          hermesStatus = (await statusResponse.json()) as HermesStatus;
          if (["completed", "failed", "stopped", "cancelled"].includes(hermesStatus.status)) break;
        }
        if (hermesStatus?.status === "completed" && hermesStatus.output) break;
        lastHermesError = `Attempt ${runtimeAttempt + 1} did not complete${hermesStatus?.error ? `: ${hermesStatus.error}` : "."}`;
      }
      if (!hermesStatus || hermesStatus.status !== "completed" || !hermesStatus.output) {
        throw new Error(lastHermesError);
      }

      const observed = await fetchHermesEvents(hermesUrl, hermesKey, hermesRunId);
      await ctx.runMutation(internal.research.addEvent, {
        runId,
        type: "hermes.delegation",
        label: observed?.started ? "Native delegation observed" : "Hermes specialist review completed",
        detail: observed?.started
          ? `Hermes emitted ${observed.started} delegate_task start event${observed.started === 1 ? "" : "s"}${observed.duration ? `; tool duration ${observed.duration}s` : ""}.`
          : "Hermes completed the Director review; the runtime event stream remains linked by run ID.",
      });
      await Promise.all([
        ctx.runMutation(internal.research.updateStep, {
          stepId: analystAStep!,
          status: "complete",
          summary: "Returned candidate claims with exact source excerpts for Director review.",
          toolCalls: 1,
        }),
        ctx.runMutation(internal.research.updateStep, {
          stepId: analystBStep!,
          status: "complete",
          summary: "Returned independent source analysis and rejection signals.",
          toolCalls: 1,
        }),
        ctx.runMutation(internal.research.updateStep, {
          stepId: editorStep!,
          status: "complete",
          summary: "Compared candidates against durable taste, active focus, and prior claims.",
          toolCalls: 1,
        }),
      ]);

      await ctx.runMutation(internal.research.updateRun, {
        runId,
        status: "validating",
        phase: "Validating exact evidence locators",
      });
      reviewStep = await ctx.runMutation(internal.research.createStep, {
        runId,
        parentStepId: directorStep!,
        role: "Research Director",
        label: "Review and validate publication",
        assignment: "Reject unsupported claims and publish only exact source-backed findings.",
        status: "running",
        order: 6,
      });

      const output = parseJsonOutput(hermesStatus.output);
      const sourceByKey = new Map(fetched.map((source) => [source.key, source]));
      const used = new Set<string>();
      const validatedFindings = [];
      const failedValidation: { key: string; reason: string }[] = [];
      for (const finding of output.findings) {
        const source = sourceByKey.get(finding.candidateKey);
        if (!source || used.has(finding.candidateKey)) {
          failedValidation.push({ key: finding.candidateKey, reason: "Unknown or duplicate candidate reference." });
          continue;
        }
        const exactQuote = source.markdown.includes(finding.evidenceQuote)
          ? finding.evidenceQuote
          : recoverExactQuote(source.markdown, finding.evidenceQuote);
        const chunk = exactQuote ? sourceChunk(source.markdown, exactQuote) : null;
        if (!chunk || !exactQuote) {
          failedValidation.push({ key: finding.candidateKey, reason: "Evidence quote was not an exact source substring." });
          continue;
        }
        used.add(finding.candidateKey);
        validatedFindings.push({
          candidateId: source.id,
          claim: finding.claim,
          evidenceQuote: exactQuote,
          chunkText: chunk.chunk,
          locator: chunk.locator,
          contentHash: chunk.hash,
          confidence: finding.confidence,
          section: finding.section,
          explanation: finding.explanation,
          whyNow: finding.whyNow,
          tasteRules: finding.tasteRules,
          attentionMinutes: finding.attentionMinutes,
          ...finding.scores,
        });
      }
      const minimum = Math.min(3, fetched.length);
      if (validatedFindings.length < minimum) {
        throw new Error(`${validatedFindings.length}/${minimum} required findings passed exact evidence validation. Unsupported claims were not published.`);
      }

      const explicitRejections = output.rejections
        .map((rejection) => {
          const source = sourceByKey.get(rejection.candidateKey);
          return source ? { candidateId: source.id, reason: rejection.reason } : null;
        })
        .filter((value): value is NonNullable<typeof value> => value !== null);
      const validationRejections = failedValidation
        .map((failure) => {
          const source = sourceByKey.get(failure.key);
          return source ? { candidateId: source.id, reason: failure.reason } : null;
        })
        .filter((value): value is NonNullable<typeof value> => value !== null);
      const usage = hermesStatus.usage ?? {};
      const briefingId = await ctx.runMutation(internal.research.publish, {
        runId,
        title: output.title,
        summary: output.summary,
        findings: validatedFindings,
        rejections: [...explicitRejections, ...validationRejections],
        inputTokens: usage.input_tokens ?? 0,
        outputTokens: usage.output_tokens ?? 0,
        estimatedCostUsd: 0,
      });
      await ctx.runMutation(internal.research.updateStep, {
        stepId: reviewStep!,
        status: "complete",
        summary: `${validatedFindings.length} findings passed exact quote, candidate, and locator checks. Briefing ${briefingId} published.`,
        toolCalls: 1,
      });
      await ctx.runMutation(internal.research.updateStep, {
        stepId: directorStep!,
        status: "complete",
        summary: "Bounded research completed and one canonical briefing was published.",
        toolCalls: 2,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown research failure";
      await ctx.runMutation(internal.research.fail, { runId, error: message });
    }
  },
});

export const stopHermes = internalAction({
  args: { hermesRunId: v.string() },
  handler: async (_ctx, { hermesRunId }) => {
    const key = process.env.HERMES_API_KEY;
    const url = (process.env.HERMES_URL || HERMES_DEFAULT_URL).replace(/\/$/, "");
    if (!key) return;
    await fetch(`${url}/v1/runs/${hermesRunId}/stop`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
    }).catch(() => undefined);
  },
});
