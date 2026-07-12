import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const ensure = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (existing) return existing._id;

    const now = Date.now();
    const workspaceId = await ctx.db.insert("workspaces", {
      key,
      name: "Personal intelligence desk",
      createdAt: now,
    });

    await ctx.db.insert("tasteDocVersions", {
      workspaceId,
      version: 1,
      markdown: `# TasteDoc\n\n## Quality bar\n- Prefer primary evidence and implementation detail over commentary.\n- Reward honest failure analysis, measured production results, and explicit tradeoffs.\n- Reject introductory explainers when the underlying idea is already familiar.\n\n## Trusted patterns\n- First-party engineering reports\n- Papers with reproducible evaluation\n- Long-form practitioners who expose operational detail\n\n## Anti-interests\n- Unsourced certainty\n- Repackaged consensus\n- Engagement-led predictions`,
      rules: [
        "Prefer primary evidence and implementation detail over commentary.",
        "Reward measured production results and explicit tradeoffs.",
        "Reject introductory explainers for already-familiar concepts.",
        "Penalize unsourced certainty and repackaged consensus.",
      ],
      status: "approved",
      changeNote: "Initial legible quality bar",
      createdAt: now,
      approvedAt: now,
    });

    await Promise.all([
      ctx.db.insert("personalIndex", {
        workspaceId,
        title: "Durable memory needs explicit evaluation boundaries",
        claimText: "Memory quality is not recall alone; evaluation should test whether stored context remains relevant, scoped, and correct after later updates.",
        sourceUrl: "personal://archive/memory-evaluation",
        topics: ["agent memory", "evaluation", "reliability"],
        indexedAt: now - 1000 * 60 * 60 * 24 * 45,
      }),
      ctx.db.insert("personalIndex", {
        workspaceId,
        title: "Temporal evidence beats isolated benchmark frames",
        claimText: "Video systems should be evaluated on temporal consistency and event-level reasoning rather than isolated frame recognition.",
        sourceUrl: "personal://archive/video-temporal-evaluation",
        topics: ["video reasoning", "evaluation", "temporal consistency"],
        indexedAt: now - 1000 * 60 * 60 * 24 * 72,
      }),
    ]);

    return workspaceId;
  },
});

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return await ctx.db
      .query("workspaces")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
  },
});
