import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { requireWorkspace } from "./auth";

const runStatus = v.union(
  v.literal("queued"),
  v.literal("planning"),
  v.literal("discovering"),
  v.literal("analyzing"),
  v.literal("editing"),
  v.literal("validating"),
  v.literal("published"),
  v.literal("failed"),
  v.literal("cancelled"),
);

const stepStatus = v.union(
  v.literal("waiting"),
  v.literal("running"),
  v.literal("complete"),
  v.literal("failed"),
);

export const loadContext = internalQuery({
  args: { runId: v.id("researchRuns") },
  handler: async (ctx, { runId }) => {
    const run = await ctx.db.get(runId);
    if (!run) throw new Error("Research run not found.");
    const [focus, tasteDoc, archive] = await Promise.all([
      ctx.db.get(run.focusThreadId),
      ctx.db.get(run.tasteDocVersionId),
      ctx.db
        .query("personalIndex")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", run.workspaceId))
        .collect(),
    ]);
    if (!focus || !tasteDoc) throw new Error("Run context is incomplete.");
    return { run, focus, tasteDoc, archive: archive.slice(-8) };
  },
});

export const getStatus = internalQuery({
  args: { runId: v.id("researchRuns") },
  handler: async (ctx, { runId }) => (await ctx.db.get(runId))?.status ?? "failed",
});

export const updateRun = internalMutation({
  args: {
    runId: v.id("researchRuns"),
    status: v.optional(runStatus),
    phase: v.optional(v.string()),
    hermesRunId: v.optional(v.string()),
    candidateCount: v.optional(v.number()),
    consumedCount: v.optional(v.number()),
    acceptedCount: v.optional(v.number()),
    rejectedCount: v.optional(v.number()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    estimatedCostUsd: v.optional(v.number()),
    error: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
  },
  handler: async (ctx, { runId, ...patch }) => {
    const cleanPatch = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
    await ctx.db.patch(runId, cleanPatch);
  },
});

export const addEvent = internalMutation({
  args: {
    runId: v.id("researchRuns"),
    type: v.string(),
    label: v.string(),
    detail: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("runEvents", { ...args, createdAt: Date.now() });
  },
});

export const createStep = internalMutation({
  args: {
    runId: v.id("researchRuns"),
    parentStepId: v.optional(v.id("agentSteps")),
    role: v.string(),
    label: v.string(),
    assignment: v.string(),
    status: stepStatus,
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentSteps", {
      ...args,
      toolCalls: 0,
      startedAt: args.status === "running" ? Date.now() : undefined,
    });
  },
});

export const updateStep = internalMutation({
  args: {
    stepId: v.id("agentSteps"),
    status: stepStatus,
    summary: v.optional(v.string()),
    toolCalls: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { stepId, status, summary, toolCalls, error }) => {
    await ctx.db.patch(stepId, {
      status,
      summary,
      toolCalls,
      error,
      startedAt: status === "running" ? Date.now() : undefined,
      finishedAt: status === "complete" || status === "failed" ? Date.now() : undefined,
    });
  },
});

export const saveCandidates = internalMutation({
  args: {
    runId: v.id("researchRuns"),
    candidates: v.array(
      v.object({
        url: v.string(),
        title: v.string(),
        sourceName: v.string(),
        description: v.string(),
        contentType: v.union(v.literal("web"), v.literal("paper"), v.literal("video")),
        discoveredBy: v.string(),
      }),
    ),
  },
  handler: async (ctx, { runId, candidates }) => {
    const ids = [];
    for (const candidate of candidates) {
      ids.push(
        await ctx.db.insert("candidates", {
          runId,
          ...candidate,
          status: "discovered",
          createdAt: Date.now(),
        }),
      );
    }
    await ctx.db.patch(runId, { candidateCount: ids.length });
    return ids;
  },
});

export const attachVideoMetadata = internalMutation({
  args: {
    candidateId: v.id("candidates"),
    videoDbId: v.string(),
    streamUrl: v.optional(v.string()),
    playerUrl: v.optional(v.string()),
    durationSeconds: v.number(),
  },
  handler: async (ctx, { candidateId, ...metadata }) => {
    await ctx.db.patch(candidateId, metadata);
  },
});

export const getVideoAsset = internalQuery({
  args: { workspaceId: v.id("workspaces"), sourceUrl: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("videoAssets")
      .withIndex("by_workspace_source", (q) => q.eq("workspaceId", args.workspaceId).eq("sourceUrl", args.sourceUrl))
      .unique();
  },
});

export const upsertVideoAsset = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    sourceUrl: v.string(),
    videoDbId: v.string(),
    name: v.string(),
    lengthSeconds: v.number(),
    streamUrl: v.optional(v.string()),
    playerUrl: v.optional(v.string()),
    status: v.union(v.literal("uploaded"), v.literal("indexed"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("videoAssets")
      .withIndex("by_workspace_source", (q) => q.eq("workspaceId", args.workspaceId).eq("sourceUrl", args.sourceUrl))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("videoAssets", { ...args, createdAt: now, updatedAt: now });
  },
});

export const markCandidate = internalMutation({
  args: {
    candidateId: v.id("candidates"),
    status: v.union(
      v.literal("discovered"),
      v.literal("selected"),
      v.literal("consumed"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("unavailable"),
    ),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, { candidateId, status, rejectionReason }) => {
    await ctx.db.patch(candidateId, { status, rejectionReason });
  },
});

const findingValidator = v.object({
  candidateId: v.id("candidates"),
  claim: v.string(),
  evidenceQuote: v.string(),
  chunkText: v.string(),
  locator: v.string(),
  contentHash: v.string(),
  startSeconds: v.optional(v.number()),
  endSeconds: v.optional(v.number()),
  streamUrl: v.optional(v.string()),
  playerUrl: v.optional(v.string()),
  confidence: v.number(),
  section: v.union(v.literal("must_know"), v.literal("exact_moment"), v.literal("archive"), v.literal("serendipity")),
  explanation: v.string(),
  whyNow: v.string(),
  tasteRules: v.array(v.string()),
  attentionMinutes: v.number(),
  focusRelevance: v.number(),
  tasteFit: v.number(),
  novelty: v.number(),
  evidenceQuality: v.number(),
  sourceTrust: v.number(),
  redundancy: v.number(),
});

export const publish = internalMutation({
  args: {
    runId: v.id("researchRuns"),
    title: v.string(),
    summary: v.string(),
    findings: v.array(findingValidator),
    rejections: v.array(v.object({ candidateId: v.id("candidates"), reason: v.string() })),
    inputTokens: v.number(),
    outputTokens: v.number(),
    estimatedCostUsd: v.number(),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Research run not found during publication.");
    if (run.status === "cancelled") throw new Error("Cancelled runs cannot publish.");
    if (args.findings.length === 0) throw new Error("A briefing requires at least one evidence-backed finding.");

    for (const finding of args.findings) {
      if (!finding.chunkText.includes(finding.evidenceQuote)) {
        throw new Error(`Evidence quote failed exact-match validation for candidate ${finding.candidateId}.`);
      }
      const candidate = await ctx.db.get(finding.candidateId);
      if (!candidate || candidate.runId !== args.runId) {
        throw new Error("Finding references a candidate outside this run.");
      }
    }

    const briefingId = await ctx.db.insert("briefings", {
      workspaceId: run.workspaceId,
      runId: args.runId,
      focusThreadId: run.focusThreadId,
      title: args.title,
      summary: args.summary,
      status: "published",
      findingCount: args.findings.length,
      sourceCount: new Set(args.findings.map((finding) => finding.candidateId)).size,
      attentionMinutes: args.findings.reduce((total, finding) => total + finding.attentionMinutes, 0),
      publishedAt: Date.now(),
    });

    for (let index = 0; index < args.findings.length; index += 1) {
      const finding = args.findings[index];
      const chunkId = await ctx.db.insert("sourceChunks", {
        runId: args.runId,
        candidateId: finding.candidateId,
        text: finding.chunkText,
        locator: finding.locator,
        contentHash: finding.contentHash,
        startSeconds: finding.startSeconds,
        endSeconds: finding.endSeconds,
        streamUrl: finding.streamUrl,
        playerUrl: finding.playerUrl,
        createdAt: Date.now(),
      });
      const claimId = await ctx.db.insert("claims", {
        runId: args.runId,
        candidateId: finding.candidateId,
        evidenceChunkId: chunkId,
        text: finding.claim,
        evidenceQuote: finding.evidenceQuote,
        confidence: finding.confidence,
        validated: true,
        validationNote: finding.startSeconds !== undefined
          ? "Exact quote found in VideoDB's timestamped spoken-word transcript."
          : "Exact quote found in fetched primary-source markdown.",
        createdAt: Date.now(),
      });
      const judgmentId = await ctx.db.insert("judgments", {
        runId: args.runId,
        claimId,
        verdict: "accepted",
        section: finding.section,
        focusRelevance: finding.focusRelevance,
        tasteFit: finding.tasteFit,
        novelty: finding.novelty,
        evidenceQuality: finding.evidenceQuality,
        sourceTrust: finding.sourceTrust,
        redundancy: finding.redundancy,
        explanation: finding.explanation,
        whyNow: finding.whyNow,
        tasteRules: finding.tasteRules,
        attentionMinutes: finding.attentionMinutes,
        createdAt: Date.now(),
      });
      await ctx.db.insert("briefingSections", {
        briefingId,
        judgmentId,
        section: finding.section,
        order: index,
      });
      const candidate = await ctx.db.get(finding.candidateId);
      await ctx.db.patch(finding.candidateId, { status: "accepted", rejectionReason: undefined });
      await ctx.db.insert("personalIndex", {
        workspaceId: run.workspaceId,
        claimId,
        title: candidate?.title ?? finding.claim,
        claimText: finding.claim,
        sourceUrl: candidate?.url ?? "",
        topics: [],
        indexedAt: Date.now(),
      });
    }

    for (const rejection of args.rejections) {
      const candidate = await ctx.db.get(rejection.candidateId);
      if (candidate?.runId === args.runId && candidate.status !== "accepted") {
        await ctx.db.patch(rejection.candidateId, { status: "rejected", rejectionReason: rejection.reason });
      }
    }

    const allCandidates = await ctx.db
      .query("candidates")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();
    for (const candidate of allCandidates) {
      if (!["accepted", "rejected", "unavailable"].includes(candidate.status)) {
        await ctx.db.patch(candidate._id, {
          status: "rejected",
          rejectionReason: "Not selected within the bounded briefing budget.",
        });
      }
    }

    const rejectedCount = allCandidates.length - args.findings.length;
    await ctx.db.patch(args.runId, {
      status: "published",
      phase: "Briefing published",
      briefingId,
      acceptedCount: args.findings.length,
      rejectedCount,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      estimatedCostUsd: args.estimatedCostUsd,
      finishedAt: Date.now(),
    });
    await ctx.db.insert("runEvents", {
      runId: args.runId,
      type: "briefing.published",
      label: "Finite briefing published",
      detail: `${args.findings.length} evidence-backed findings passed exact locator checks; ${rejectedCount} candidates remain in the processed corpus.`,
      createdAt: Date.now(),
    });
    return briefingId;
  },
});

export const fail = internalMutation({
  args: { runId: v.id("researchRuns"), error: v.string() },
  handler: async (ctx, { runId, error }) => {
    const run = await ctx.db.get(runId);
    if (!run || run.status === "cancelled") return;
    await ctx.db.patch(runId, {
      status: "failed",
      phase: "Research stopped with an exception",
      error: error.slice(0, 800),
      finishedAt: Date.now(),
    });
    const steps = await ctx.db
      .query("agentSteps")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .collect();
    for (const step of steps.filter((item) => item.status === "running" || item.status === "waiting")) {
      await ctx.db.patch(step._id, {
        status: "failed",
        error: "Run ended before this step completed.",
        finishedAt: Date.now(),
      });
    }
    await ctx.db.insert("runEvents", {
      runId,
      type: "run.failed",
      label: "Run exception recorded",
      detail: error.slice(0, 500),
      createdAt: Date.now(),
    });
  },
});

export const cancel = mutation({
  args: { runId: v.id("researchRuns") },
  handler: async (ctx, { runId }) => {
    const { workspace } = await requireWorkspace(ctx);
    const run = await ctx.db.get(runId);
    if (!run || run.workspaceId !== workspace._id) throw new Error("Research run not found.");
    if (["published", "failed", "cancelled"].includes(run.status)) return;
    await ctx.db.patch(runId, {
      status: "cancelled",
      phase: "Cancelled by user",
      finishedAt: Date.now(),
    });
    await ctx.db.insert("runEvents", {
      runId,
      type: "run.cancelled",
      label: "Run cancelled",
      detail: "Cerno retained completed discovery artifacts and stopped publication.",
      createdAt: Date.now(),
    });
    if (run.hermesRunId) {
      await ctx.scheduler.runAfter(0, internal.researchAction.stopHermes, {
        hermesRunId: run.hermesRunId,
      });
    }
  },
});

export const get = query({
  args: { runId: v.id("researchRuns") },
  handler: async (ctx, { runId }) => {
    const { workspace } = await requireWorkspace(ctx);
    const run = await ctx.db.get(runId);
    if (!run || run.workspaceId !== workspace._id) return null;
    const [focus, tasteDoc, steps, events, candidates] = await Promise.all([
      ctx.db.get(run.focusThreadId),
      ctx.db.get(run.tasteDocVersionId),
      ctx.db.query("agentSteps").withIndex("by_run", (q) => q.eq("runId", runId)).collect(),
      ctx.db.query("runEvents").withIndex("by_run", (q) => q.eq("runId", runId)).collect(),
      ctx.db.query("candidates").withIndex("by_run", (q) => q.eq("runId", runId)).collect(),
    ]);
    return {
      ...run,
      focus,
      tasteDoc,
      steps: steps.sort((a, b) => a.order - b.order),
      events: events.sort((a, b) => a.createdAt - b.createdAt),
      candidates,
    };
  },
});

export const cleanupFailedRuns = internalMutation({
  args: {},
  handler: async (ctx) => {
    const runs = await ctx.db.query("researchRuns").collect();
    const failedRuns = runs.filter((run) => run.status === "failed" || run.status === "cancelled");
    const focusIds = new Set(failedRuns.map((run) => run.focusThreadId));
    for (const run of failedRuns) {
      const [steps, events, candidates, chunks, claims, judgments] = await Promise.all([
        ctx.db.query("agentSteps").withIndex("by_run", (q) => q.eq("runId", run._id)).collect(),
        ctx.db.query("runEvents").withIndex("by_run", (q) => q.eq("runId", run._id)).collect(),
        ctx.db.query("candidates").withIndex("by_run", (q) => q.eq("runId", run._id)).collect(),
        ctx.db.query("sourceChunks").withIndex("by_run", (q) => q.eq("runId", run._id)).collect(),
        ctx.db.query("claims").withIndex("by_run", (q) => q.eq("runId", run._id)).collect(),
        ctx.db.query("judgments").withIndex("by_run", (q) => q.eq("runId", run._id)).collect(),
      ]);
      for (const document of [...steps, ...events, ...candidates, ...chunks, ...claims, ...judgments]) {
        await ctx.db.delete(document._id);
      }
      await ctx.db.delete(run._id);
    }
    for (const focusId of focusIds) {
      const remaining = await ctx.db.query("researchRuns").withIndex("by_focus", (q) => q.eq("focusThreadId", focusId)).collect();
      if (remaining.length === 0) await ctx.db.delete(focusId);
    }
    return { deletedRuns: failedRuns.length };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { workspace } = await requireWorkspace(ctx);
    const runs = await ctx.db
      .query("researchRuns")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .collect();
    return await Promise.all(
      runs
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(async (run) => ({ ...run, focus: await ctx.db.get(run.focusThreadId) })),
    );
  },
});
