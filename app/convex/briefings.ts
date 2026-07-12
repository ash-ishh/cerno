import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireWorkspace } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { workspace } = await requireWorkspace(ctx);
    const briefings = await ctx.db
      .query("briefings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .collect();
    return await Promise.all(
      briefings
        .sort((a, b) => b.publishedAt - a.publishedAt)
        .map(async (briefing) => {
          const [focus, run] = await Promise.all([
            ctx.db.get(briefing.focusThreadId),
            ctx.db.get(briefing.runId),
          ]);
          return { ...briefing, focus, run };
        }),
    );
  },
});

export const get = query({
  args: { briefingId: v.id("briefings") },
  handler: async (ctx, { briefingId }) => {
    const { workspace } = await requireWorkspace(ctx);
    const briefing = await ctx.db.get(briefingId);
    if (!briefing || briefing.workspaceId !== workspace._id) return null;
    const [focus, run, sectionRecords, candidates] = await Promise.all([
      ctx.db.get(briefing.focusThreadId),
      ctx.db.get(briefing.runId),
      ctx.db
        .query("briefingSections")
        .withIndex("by_briefing", (q) => q.eq("briefingId", briefingId))
        .collect(),
      ctx.db
        .query("candidates")
        .withIndex("by_run", (q) => q.eq("runId", briefing.runId))
        .collect(),
    ]);

    const findings = await Promise.all(
      sectionRecords
        .sort((a, b) => a.order - b.order)
        .map(async (section) => {
          const judgment = await ctx.db.get(section.judgmentId);
          if (!judgment) return null;
          const claim = await ctx.db.get(judgment.claimId);
          if (!claim) return null;
          const [candidate, chunk] = await Promise.all([
            ctx.db.get(claim.candidateId),
            ctx.db.get(claim.evidenceChunkId),
          ]);
          return { section, judgment, claim, candidate, chunk };
        }),
    );

    return {
      ...briefing,
      focus,
      run,
      findings: findings.filter((item): item is NonNullable<typeof item> => item !== null),
      rejections: candidates.filter((candidate) => candidate.status === "rejected" || candidate.status === "unavailable"),
    };
  },
});

export const markReviewed = mutation({
  args: { briefingId: v.id("briefings") },
  handler: async (ctx, { briefingId }) => {
    const { workspace } = await requireWorkspace(ctx);
    const briefing = await ctx.db.get(briefingId);
    if (!briefing || briefing.workspaceId !== workspace._id) throw new Error("Briefing not found.");
    if (briefing.status === "reviewed") return;
    await ctx.db.patch(briefingId, { status: "reviewed", reviewedAt: Date.now() });
  },
});
