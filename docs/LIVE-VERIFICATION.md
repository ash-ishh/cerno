# Live vertical-slice verification

Verified on **12 July 2026** against the local Convex deployment, live LinkUp API, and bearer-protected Hermes `0.18.2` runtime on Azure.

## Persisted identifiers

| Artifact | ID |
|---|---|
| Cerno Research Run | `k974m4398jvw3xgxa0yarvn56x8adwgn` |
| Hermes Run | `run_c29dce25bb4c41b4982000a3ca8c8b53` |
| Published Briefing | `jd7axbcc6jn9h1t7hc4wx30ygh8ad4m9` |
| TasteDoc used for research | v1 |
| TasteDoc after reviewed feedback | v2 |

## Observed run

- Status: `published`
- Wall-clock runtime: 102.6 seconds
- Live candidates discovered: 7
- Primary sources fetched beyond snippets: 4
- Findings exact-matched and published: 3
- Candidates rejected/preserved: 4
- Hermes usage: 23,737 input tokens + 9,026 output tokens
- Hermes event receipt: `delegate_task` started once with three parallel assignments; observed tool duration 14.705 seconds
- Estimated model cost: intentionally not claimed because the Azure deployment's exact effective rate was not verified

## Published evidence

### 1. State-level memory failure modes

- Source: https://arxiv.org/html/2605.26252v1
- Locator: `Is Agent Memory a Database? · paragraph 12`
- Stored chunk SHA-256: `61475cf3c2b017c4fde403db7d7fee952fdb8d2441c48c864a9dc8db97fa7564`
- Exact stored quote: “The result is four recurring failure modes: unregulated growth, missing semantic revision, capacity-driven forgetting, and read-only retrieval.”

### 2. Workload-aligned architecture

- Source: https://arxiv.org/html/2606.24775v1
- Locator: `Are We Ready For An Agent-Native Memory System? · paragraph 13`
- Stored chunk SHA-256: `e678aa3dcc073f47285a39495d4d44fab47a105fd6f81fabbec6b532cfa3b4f7`
- Exact stored quote: “Our extensive end-to-end evaluation shows that no single architecture dominates across all scenarios; instead, effectiveness depends heavily on how well the memory structure aligns with the workload bottleneck.”

### 3. Live governance probes

- Source: https://arxiv.org/pdf/2606.24535
- Locator: `Paragraph 1`
- Stored chunk SHA-256: `8824141f8978adda940b6c8f59137c0dc90c0d77c6f546d55fe8af291cf31b75`
- Exact stored quote: “live evaluation is necessary to expose the enforcement and pipeline-ordering failures that design-only treatments miss.”

All three published quotes were independently checked as exact substrings of their persisted fetched chunks. Search-result snippets were not used as evidence.

## VideoDB evidence-lane proof

A separate live run verified the complete long-form video path:

| Artifact | ID |
|---|---|
| Cerno Research Run | `k97d8r99ag50qwgff7gf4f2qn58acbdw` |
| Hermes Run | `run_08723790047e43a48a008b20ad00232f` |
| Published Briefing | `jd7cbrmt7e5nfwg559p4x59yr58ad971` |
| VideoDB asset | `m-z-019f55b8-4690-7251-88be-152defcc68b9` |

- LinkUp discovered three YouTube candidates; one bounded video lane was consumed and the other two were retained as rejections.
- VideoDB reused an indexed asset, semantically searched its spoken-word index, and returned nine relevant timestamped transcript segments.
- Hermes emitted one native `delegate_task` event with 16.241 seconds of observed tool time.
- Total wall-clock runtime was 61.8 seconds; Hermes used 10,548 input tokens and 2,588 output tokens.
- Source: https://www.youtube.com/watch?v=mY3bR9qjZr4
- Exact stored quote: “what will help you for efficient token usage in a memory system for AI agents.”
- Locator: `VideoDB spoken-word transcript · 0:30–0:44`
- Stored chunk SHA-256: `0d9e7959cafced60a1f5aeb1ca77141a2bad735b3d1c39ccd9a62f17390fa8a0`
- The persisted quote was independently checked as an exact substring of its timestamped transcript chunk.
- The generated `console.videodb.io` player link returned HTTP 200, and the briefing UI exposed it as **Play exact VideoDB moment**.

## Feedback proof

The third judgment received structured feedback: **Strong idea, weak evidence**. Cerno created a pending readable rule diff rather than changing the profile silently. Approval created TasteDoc v2 with this explicit addition:

> Do not elevate an attractive claim without primary evidence, explicit methodology, or reproducible measurements.

The original briefing and its TasteDoc v1 run snapshot remained immutable.

## UI and build checks

- `npm run typecheck`: passed for frontend and Convex functions
- `npm run build`: passed
- `npm audit`: zero vulnerabilities
- Desktop workflow test: Focus Thread → live run → briefing → feedback → TasteDoc v2, with zero browser/page errors
- VideoDB browser test: exact timestamp and playable-moment control visible with zero browser/page errors
- Mobile test at 390×844: zero horizontal overflow and zero browser/page errors
- Saved screenshots:
  - [`../assets/cerno-live-run.png`](../assets/cerno-live-run.png)
  - [`../assets/cerno-live-briefing.png`](../assets/cerno-live-briefing.png)
  - [`../assets/cerno-videodb-briefing.png`](../assets/cerno-videodb-briefing.png)

## Honesty boundary

This receipt proves the current local vertical slice, remote Hermes execution, and one real VideoDB timestamp-evidence run. It is not evidence of a public deployment, production authentication traffic, scheduled monitoring, or production-scale reliability. Those capabilities are not claimed.
