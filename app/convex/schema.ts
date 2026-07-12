import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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

const focusSnapshot = v.object({
  title: v.string(),
  currentWork: v.string(),
  outcome: v.string(),
  assignment: v.string(),
  knownContext: v.string(),
  sourceScope: v.array(v.string()),
  freshness: v.string(),
  briefingSize: v.string(),
  serendipity: v.number(),
});

export default defineSchema({
  workspaces: defineTable({
    key: v.string(),
    name: v.string(),
    createdAt: v.number(),
  }).index("by_key", ["key"]),

  tasteDocVersions: defineTable({
    workspaceId: v.id("workspaces"),
    version: v.number(),
    markdown: v.string(),
    rules: v.array(v.string()),
    status: v.union(v.literal("draft"), v.literal("approved")),
    changeNote: v.string(),
    createdAt: v.number(),
    approvedAt: v.optional(v.number()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_version", ["workspaceId", "version"]),

  focusThreads: defineTable({
    workspaceId: v.id("workspaces"),
    title: v.string(),
    currentWork: v.string(),
    outcome: v.string(),
    assignment: v.string(),
    knownContext: v.string(),
    sourceScope: v.array(v.string()),
    freshness: v.string(),
    briefingSize: v.string(),
    serendipity: v.number(),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("complete")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_status", ["workspaceId", "status"]),

  researchRuns: defineTable({
    workspaceId: v.id("workspaces"),
    focusThreadId: v.id("focusThreads"),
    focusSnapshot,
    tasteDocVersionId: v.id("tasteDocVersions"),
    status: runStatus,
    phase: v.string(),
    hermesRunId: v.optional(v.string()),
    briefingId: v.optional(v.id("briefings")),
    candidateCount: v.number(),
    consumedCount: v.number(),
    acceptedCount: v.number(),
    rejectedCount: v.number(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    estimatedCostUsd: v.number(),
    error: v.optional(v.string()),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_focus", ["focusThreadId"])
    .index("by_status", ["status"]),

  agentSteps: defineTable({
    runId: v.id("researchRuns"),
    parentStepId: v.optional(v.id("agentSteps")),
    role: v.string(),
    label: v.string(),
    assignment: v.string(),
    status: stepStatus,
    order: v.number(),
    summary: v.optional(v.string()),
    toolCalls: v.number(),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index("by_run", ["runId"])
    .index("by_parent", ["parentStepId"]),

  runEvents: defineTable({
    runId: v.id("researchRuns"),
    type: v.string(),
    label: v.string(),
    detail: v.string(),
    createdAt: v.number(),
  }).index("by_run", ["runId"]),

  candidates: defineTable({
    runId: v.id("researchRuns"),
    url: v.string(),
    title: v.string(),
    sourceName: v.string(),
    publishedAt: v.optional(v.string()),
    description: v.string(),
    contentType: v.union(v.literal("web"), v.literal("paper"), v.literal("video"), v.literal("archive")),
    status: v.union(
      v.literal("discovered"),
      v.literal("selected"),
      v.literal("consumed"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("unavailable"),
    ),
    rejectionReason: v.optional(v.string()),
    discoveredBy: v.string(),
    createdAt: v.number(),
  })
    .index("by_run", ["runId"])
    .index("by_run_status", ["runId", "status"]),

  sourceChunks: defineTable({
    runId: v.id("researchRuns"),
    candidateId: v.id("candidates"),
    text: v.string(),
    locator: v.string(),
    contentHash: v.string(),
    createdAt: v.number(),
  })
    .index("by_run", ["runId"])
    .index("by_candidate", ["candidateId"]),

  claims: defineTable({
    runId: v.id("researchRuns"),
    candidateId: v.id("candidates"),
    evidenceChunkId: v.id("sourceChunks"),
    text: v.string(),
    evidenceQuote: v.string(),
    confidence: v.number(),
    validated: v.boolean(),
    validationNote: v.string(),
    createdAt: v.number(),
  })
    .index("by_run", ["runId"])
    .index("by_candidate", ["candidateId"]),

  judgments: defineTable({
    runId: v.id("researchRuns"),
    claimId: v.id("claims"),
    verdict: v.union(v.literal("accepted"), v.literal("rejected")),
    section: v.union(v.literal("must_know"), v.literal("exact_moment"), v.literal("archive"), v.literal("serendipity")),
    focusRelevance: v.number(),
    tasteFit: v.number(),
    novelty: v.number(),
    evidenceQuality: v.number(),
    sourceTrust: v.number(),
    redundancy: v.number(),
    explanation: v.string(),
    whyNow: v.string(),
    tasteRules: v.array(v.string()),
    attentionMinutes: v.number(),
    createdAt: v.number(),
  })
    .index("by_run", ["runId"])
    .index("by_claim", ["claimId"]),

  briefings: defineTable({
    workspaceId: v.id("workspaces"),
    runId: v.id("researchRuns"),
    focusThreadId: v.id("focusThreads"),
    title: v.string(),
    summary: v.string(),
    status: v.union(v.literal("published"), v.literal("reviewed")),
    findingCount: v.number(),
    sourceCount: v.number(),
    attentionMinutes: v.number(),
    publishedAt: v.number(),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_run", ["runId"])
    .index("by_focus", ["focusThreadId"]),

  briefingSections: defineTable({
    briefingId: v.id("briefings"),
    judgmentId: v.id("judgments"),
    section: v.union(v.literal("must_know"), v.literal("exact_moment"), v.literal("archive"), v.literal("serendipity")),
    order: v.number(),
  })
    .index("by_briefing", ["briefingId"])
    .index("by_judgment", ["judgmentId"]),

  feedbackEvents: defineTable({
    workspaceId: v.id("workspaces"),
    briefingId: v.id("briefings"),
    judgmentId: v.id("judgments"),
    reason: v.string(),
    note: v.string(),
    scope: v.union(v.literal("focus"), v.literal("durable_taste")),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_judgment", ["judgmentId"]),

  tasteChangeProposals: defineTable({
    workspaceId: v.id("workspaces"),
    feedbackEventId: v.id("feedbackEvents"),
    baseVersionId: v.id("tasteDocVersions"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    oldRule: v.string(),
    proposedRule: v.string(),
    rationale: v.string(),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
    resultingVersionId: v.optional(v.id("tasteDocVersions")),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_status", ["status"]),

  personalIndex: defineTable({
    workspaceId: v.id("workspaces"),
    claimId: v.optional(v.id("claims")),
    title: v.string(),
    claimText: v.string(),
    sourceUrl: v.string(),
    topics: v.array(v.string()),
    indexedAt: v.number(),
  }).index("by_workspace", ["workspaceId"]),
});
