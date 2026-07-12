import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const focusArgs = {
  workspaceKey: v.string(),
  title: v.string(),
  currentWork: v.string(),
  outcome: v.string(),
  assignment: v.string(),
  knownContext: v.string(),
  sourceScope: v.array(v.string()),
  freshness: v.string(),
  briefingSize: v.string(),
  serendipity: v.number(),
};

export const createAndRun = mutation({
  args: focusArgs,
  handler: async (ctx, args) => {
    if (!args.sourceScope.some((scope) => scope === "Live web" || scope === "Research papers")) {
      throw new Error("Select Live web or Research papers for the current research lane.");
    }
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_key", (q) => q.eq("key", args.workspaceKey))
      .unique();
    if (!workspace) throw new Error("Workspace is not initialized.");

    const tasteVersions = await ctx.db
      .query("tasteDocVersions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .collect();
    const tasteDoc = tasteVersions
      .filter((version) => version.status === "approved")
      .sort((a, b) => b.version - a.version)[0];
    if (!tasteDoc) throw new Error("An approved TasteDoc is required before research starts.");

    const now = Date.now();
    const focusThreadId = await ctx.db.insert("focusThreads", {
      workspaceId: workspace._id,
      title: args.title.trim(),
      currentWork: args.currentWork.trim(),
      outcome: args.outcome.trim(),
      assignment: args.assignment.trim(),
      knownContext: args.knownContext.trim(),
      sourceScope: args.sourceScope,
      freshness: args.freshness,
      briefingSize: args.briefingSize,
      serendipity: Math.max(0, Math.min(30, args.serendipity)),
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const runId = await ctx.db.insert("researchRuns", {
      workspaceId: workspace._id,
      focusThreadId,
      focusSnapshot: {
        title: args.title.trim(),
        currentWork: args.currentWork.trim(),
        outcome: args.outcome.trim(),
        assignment: args.assignment.trim(),
        knownContext: args.knownContext.trim(),
        sourceScope: args.sourceScope,
        freshness: args.freshness,
        briefingSize: args.briefingSize,
        serendipity: Math.max(0, Math.min(30, args.serendipity)),
      },
      tasteDocVersionId: tasteDoc._id,
      status: "queued",
      phase: "Queued for the Research Director",
      candidateCount: 0,
      consumedCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
      createdAt: now,
    });

    await ctx.db.insert("runEvents", {
      runId,
      type: "run.queued",
      label: "Research run queued",
      detail: `TasteDoc v${tasteDoc.version} and the Focus Thread snapshot were frozen for this run.`,
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.researchAction.execute, { runId });
    return { focusThreadId, runId };
  },
});

export const rerun = mutation({
  args: { focusThreadId: v.id("focusThreads") },
  handler: async (ctx, { focusThreadId }) => {
    const focus = await ctx.db.get(focusThreadId);
    if (!focus) throw new Error("Focus Thread not found.");
    const tasteVersions = await ctx.db
      .query("tasteDocVersions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", focus.workspaceId))
      .collect();
    const tasteDoc = tasteVersions
      .filter((version) => version.status === "approved")
      .sort((a, b) => b.version - a.version)[0];
    if (!tasteDoc) throw new Error("No approved TasteDoc found.");

    const now = Date.now();
    const runId = await ctx.db.insert("researchRuns", {
      workspaceId: focus.workspaceId,
      focusThreadId,
      focusSnapshot: {
        title: focus.title,
        currentWork: focus.currentWork,
        outcome: focus.outcome,
        assignment: focus.assignment,
        knownContext: focus.knownContext,
        sourceScope: focus.sourceScope,
        freshness: focus.freshness,
        briefingSize: focus.briefingSize,
        serendipity: focus.serendipity,
      },
      tasteDocVersionId: tasteDoc._id,
      status: "queued",
      phase: "Queued for the Research Director",
      candidateCount: 0,
      consumedCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
      createdAt: now,
    });
    await ctx.db.insert("runEvents", {
      runId,
      type: "run.queued",
      label: "Fresh research run queued",
      detail: `This run uses TasteDoc v${tasteDoc.version}; the previous briefing remains immutable.`,
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.researchAction.execute, { runId });
    return runId;
  },
});

export const list = query({
  args: { workspaceKey: v.string() },
  handler: async (ctx, { workspaceKey }) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_key", (q) => q.eq("key", workspaceKey))
      .unique();
    if (!workspace) return [];
    const threads = await ctx.db
      .query("focusThreads")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .order("desc")
      .collect();
    return await Promise.all(
      threads.map(async (thread) => {
        const runs = await ctx.db
          .query("researchRuns")
          .withIndex("by_focus", (q) => q.eq("focusThreadId", thread._id))
          .collect();
        const sortedRuns = runs.sort((a, b) => b.createdAt - a.createdAt);
        const briefings = await ctx.db
          .query("briefings")
          .withIndex("by_focus", (q) => q.eq("focusThreadId", thread._id))
          .collect();
        return {
          ...thread,
          runCount: runs.length,
          briefingCount: briefings.length,
          latestRun: sortedRuns[0] ?? null,
          latestBriefing: briefings.sort((a, b) => b.publishedAt - a.publishedAt)[0] ?? null,
        };
      }),
    );
  },
});

export const get = query({
  args: { focusThreadId: v.id("focusThreads") },
  handler: async (ctx, { focusThreadId }) => {
    const thread = await ctx.db.get(focusThreadId);
    if (!thread) return null;
    const runs = await ctx.db
      .query("researchRuns")
      .withIndex("by_focus", (q) => q.eq("focusThreadId", focusThreadId))
      .collect();
    const briefings = await ctx.db
      .query("briefings")
      .withIndex("by_focus", (q) => q.eq("focusThreadId", focusThreadId))
      .collect();
    return {
      ...thread,
      runs: runs.sort((a, b) => b.createdAt - a.createdAt),
      briefings: briefings.sort((a, b) => b.publishedAt - a.publishedAt),
    };
  },
});
