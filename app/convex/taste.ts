import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { requireWorkspace } from "./auth";

async function latestApproved(
  ctx: Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">,
  workspaceId: Id<"workspaces">,
) {
  const versions = await ctx.db
    .query("tasteDocVersions")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .collect();
  return versions
    .filter((version) => version.status === "approved")
    .sort((a, b) => b.version - a.version)[0];
}

export const current = query({
  args: {},
  handler: async (ctx) => {
    const { workspace } = await requireWorkspace(ctx);
    const currentVersion = await latestApproved(ctx, workspace._id);
    const proposals = await ctx.db
      .query("tasteChangeProposals")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .collect();
    return {
      version: currentVersion ?? null,
      proposals: proposals.sort((a, b) => b.createdAt - a.createdAt),
    };
  },
});

export const saveManual = mutation({
  args: { markdown: v.string() },
  handler: async (ctx, { markdown }) => {
    const { workspace } = await requireWorkspace(ctx);
    const currentVersion = await latestApproved(ctx, workspace._id);
    if (!currentVersion) throw new Error("No current TasteDoc.");
    const versionId = await ctx.db.insert("tasteDocVersions", {
      workspaceId: workspace._id,
      version: currentVersion.version + 1,
      markdown: markdown.trim(),
      rules: currentVersion.rules,
      status: "approved",
      changeNote: "Manual TasteDoc edit",
      createdAt: Date.now(),
      approvedAt: Date.now(),
    });
    return versionId;
  },
});

export const recordFeedback = mutation({
  args: {
    briefingId: v.id("briefings"),
    judgmentId: v.id("judgments"),
    reason: v.string(),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const { workspace } = await requireWorkspace(ctx);
    const [briefing, judgment] = await Promise.all([
      ctx.db.get(args.briefingId),
      ctx.db.get(args.judgmentId),
    ]);
    if (!briefing || briefing.workspaceId !== workspace._id || !judgment || judgment.runId !== briefing.runId) {
      throw new Error("Feedback target not found.");
    }
    const section = await ctx.db
      .query("briefingSections")
      .withIndex("by_judgment", (q) => q.eq("judgmentId", args.judgmentId))
      .first();
    if (!section || section.briefingId !== briefing._id) throw new Error("Feedback target not found.");
    const focusOnly = args.reason === "Relevant, but not right now";
    const feedbackEventId = await ctx.db.insert("feedbackEvents", {
      workspaceId: workspace._id,
      briefingId: args.briefingId,
      judgmentId: args.judgmentId,
      reason: args.reason,
      note: args.note.trim(),
      scope: focusOnly ? "focus" : "durable_taste",
      createdAt: Date.now(),
    });

    if (focusOnly) {
      const focus = await ctx.db.get(briefing.focusThreadId);
      if (focus) {
        const addition = `Feedback: ${args.note.trim() || args.reason}`;
        await ctx.db.patch(focus._id, {
          knownContext: [focus.knownContext, addition].filter(Boolean).join("\n"),
          updatedAt: Date.now(),
        });
      }
      return { feedbackEventId, proposalId: null };
    }

    const currentVersion = await latestApproved(ctx, workspace._id);
    if (!currentVersion) throw new Error("No approved TasteDoc found.");
    const proposals: Record<string, { rule: string; rationale: string }> = {
      "Too introductory for me": {
        rule: "Require implementation detail, failure analysis, or measured tradeoffs when a topic is already familiar.",
        rationale: "Raise the depth threshold without suppressing genuinely new work on the topic.",
      },
      "I already know this argument": {
        rule: "Penalize claims that are semantically redundant with the personal index unless the evidence or consequence materially changed.",
        rationale: "Relevance alone should not override redundancy.",
      },
      "Strong idea, weak evidence": {
        rule: "Do not elevate an attractive claim without primary evidence, explicit methodology, or reproducible measurements.",
        rationale: "Separate intellectual appeal from evidence quality.",
      },
      "Right author, wrong topic": {
        rule: "Treat source trust as a supporting signal, never a substitute for Focus Thread relevance.",
        rationale: "A trusted voice can still be irrelevant to the current mission.",
      },
      "This changed how I think": {
        rule: "Reward well-supported claims that materially revise an existing personal-index belief.",
        rationale: "Make belief-changing novelty visible in future judgments.",
      },
    };
    const selected = proposals[args.reason] ?? {
      rule: `Apply this reviewed quality signal in future judgments: ${args.reason}.`,
      rationale: "Convert the explicit correction into a legible rule rather than hidden retraining.",
    };
    const oldRule = currentVersion.rules[0] ?? "No matching rule in the current TasteDoc.";
    const proposalId = await ctx.db.insert("tasteChangeProposals", {
      workspaceId: workspace._id,
      feedbackEventId,
      baseVersionId: currentVersion._id,
      status: "pending",
      oldRule,
      proposedRule: selected.rule,
      rationale: selected.rationale,
      createdAt: Date.now(),
    });
    return { feedbackEventId, proposalId };
  },
});

export const resolveProposal = mutation({
  args: {
    proposalId: v.id("tasteChangeProposals"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    editedRule: v.optional(v.string()),
  },
  handler: async (ctx, { proposalId, decision, editedRule }) => {
    const { workspace } = await requireWorkspace(ctx);
    const proposal = await ctx.db.get(proposalId);
    if (!proposal || proposal.workspaceId !== workspace._id) throw new Error("Taste proposal not found.");
    if (proposal.status !== "pending") return proposal.resultingVersionId ?? null;
    if (decision === "rejected") {
      await ctx.db.patch(proposalId, { status: "rejected", resolvedAt: Date.now() });
      return null;
    }

    const base = await latestApproved(ctx, proposal.workspaceId) ?? await ctx.db.get(proposal.baseVersionId);
    if (!base) throw new Error("Base TasteDoc version not found.");
    const rule = editedRule?.trim() || proposal.proposedRule;
    const rules = base.rules.includes(proposal.oldRule)
      ? base.rules.map((item) => (item === proposal.oldRule ? rule : item))
      : [...base.rules, rule];
    const versionId = await ctx.db.insert("tasteDocVersions", {
      workspaceId: proposal.workspaceId,
      version: base.version + 1,
      markdown: `${base.markdown}\n\n## Reviewed change in v${base.version + 1}\n- ${rule}`,
      rules,
      status: "approved",
      changeNote: proposal.rationale,
      createdAt: Date.now(),
      approvedAt: Date.now(),
    });
    await ctx.db.patch(proposalId, {
      status: "approved",
      proposedRule: rule,
      resolvedAt: Date.now(),
      resultingVersionId: versionId,
    });
    return versionId;
  },
});
