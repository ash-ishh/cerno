# Cerno hackathon pitch script

## Recommended live run of show

Use **slides 1, 3, 6, and 7** in the judged four-minute slot. Keep slides 2, 4, and 5 as Q&A backups.

### 0:00–0:15 — Opening · slide 1

> The internet does not have an information shortage. It has a judgment problem. Cerno is the judgment layer between the internet and your attention: an agent-run personal research desk that returns a finite, cited briefing instead of another feed.

### 0:15–2:15 — Live product demo · move from slide 3 to the app

1. **Assign the work**
   - Open **New focus**.
   - Use the prepared production-memory Focus Thread, or enter a judge-supplied research question.
   - Say: “A Focus Thread is temporary mission context. It never silently rewrites my durable taste.”
   - Start a fresh run immediately so it can execute in the background.

2. **Inspect a completed live run while the fresh run works**
   - Open **Research runs** and the verified published run.
   - Point to the Research Director, Evidence Analyst, Video Analyst, Personal Editor, and review step.
   - Say: “LinkUp discovered candidates, VideoDB resolved one selected video into timestamped transcript moments, and Hermes used one native delegation with three parallel specialist assignments. The Director published only after deterministic evidence checks passed.”

3. **Open the finite briefing**
   - Point to **3 findings / 3 sources / 15 minutes / 4 rejected**.
   - Select the first finding.
   - In the Evidence Spine, point to the exact passage, source locator, personal judgment, and component scores.
   - Say: “A search snippet can create a candidate, but it can never become evidence. This quote is an exact substring of the fetched primary source.”
   - Open the verified VideoDB briefing and play the **0:30–0:44** exact moment. Point out that the transcript quote, timestamp, VideoDB asset ID, player URL, and content hash are persisted together.

4. **Close the learning loop**
   - Click **Correct reasoning**.
   - Choose **Strong idea, weak evidence**.
   - Open **TasteDoc** and show the readable proposal.
   - Say: “Cerno does not silently retrain a hidden profile. Feedback becomes a reviewable rule diff; approval creates a new immutable TasteDoc version.”

If the fresh run has completed, briefly show its new canonical briefing. If not, do not wait—its persisted status is still visible and the verified run proves the complete loop.

### 2:15–3:15 — Proof · slide 6

> Here is the receipt for the verified text run: 102.6 seconds wall-clock, seven candidates discovered, four primary sources fetched beyond snippets, three exact-matched findings published, and four rejections preserved. A separate 61.8-second VideoDB run published one exact spoken claim at 0:30–0:44 with a playable evidence stream. Hermes recorded native delegation in both runs. The original text run remains bound to TasteDoc v1; reviewed feedback created v2 without rewriting history. We deliberately claim no verified model cost, product users, or production traffic.

Optional ID proof if asked:

- Cerno Research Run: `k974m4398jvw3xgxa0yarvn56x8adwgn`
- Hermes Run: `run_c29dce25bb4c41b4982000a3ca8c8b53`
- Published Briefing: `jd7axbcc6jn9h1t7hc4wx30ygh8ad4m9`
- VideoDB Briefing: `jd7cbrmt7e5nfwg559p4x59yr58ad971`
- VideoDB asset: `m-z-019f55b8-4690-7251-88be-152defcc68b9`

### 3:15–3:25 — Close · slide 7

> Most tools help you consume faster. Cerno decides what deserves to be consumed at all. Consume less. Understand more.

Then stop. Leave the remaining time for questions.

## Q&A answers

### “How is this different from Perplexity or a summarizer?”

Search answers a query. Summarizers shorten a source. Cerno performs a persistent function: it plans research around a current mission, consumes selected primary sources, compares findings with personal history and visible taste, rejects redundancy, and publishes one finite briefing with inspectable evidence.

### “Where is Hermes load-bearing?”

The Convex backend starts a bearer-protected Hermes `/v1/runs` execution on Azure. Hermes acts as Research Director and uses native `delegate_task` once with three parallel specialist assignments: Evidence Analyst, Video Analyst when a video lane exists (otherwise a second Evidence Analyst), and Personal Editor. Its run ID, token usage, and delegation event are persisted with the Cerno run.

### “Can the model fabricate a citation?”

It can propose one, but it cannot publish one. Deterministic code checks that every quote is an exact contiguous substring of fetched primary-source text or one timestamped VideoDB transcript segment, then stores the locator and SHA-256 content hash. A video claim additionally requires a playable moment stream. Invalid evidence is rejected before briefing publication.

### “What is the memory?”

Convex is canonical memory: Focus Threads, immutable run snapshots, candidates, reusable VideoDB asset references, source chunks, claims, judgments, briefings, feedback, TasteDoc versions, and the personal index. Hermes session state is orchestration state—not the hidden source of truth.

### “How does feedback improve the system?”

A correction is an immutable typed event. Contextual feedback stays with the Focus Thread. Potentially durable feedback creates a readable TasteDoc proposal. Only user approval creates a new version; previous briefings and their profile snapshots remain unchanged.

### “Does this create a filter bubble?”

Exploration is explicit. A Focus Thread includes a visible serendipity budget instead of mixing exploration invisibly into relevance. The user can inspect and change both the mission and the durable rules.

### “What is live today, and what is not?”

Live today: the React application, local Convex canonical store, Firebase Google authentication and identity-owned workspaces, live LinkUp discovery and full-source fetching, VideoDB spoken-word indexing with playable timestamp evidence, remote bearer-protected Hermes execution on Azure, deterministic validation, briefing publication, structured feedback, and TasteDoc versioning. The presentation site is public on Cloudflare Pages; the product app is not yet publicly deployed. Not claimed: scheduled monitoring, product users, production traffic, or verified model cost.

## Deck map

1. **Cover** — one-line product category and promise
2. **Problem** — feeds, read-later, and summaries solve consumption, not judgment
3. **Product** — Focus Thread → agent team → exact evidence → visible taste
4. **Agency architecture** — manager, specialists, deterministic gate, and service boundaries
5. **Trust loop** — claim-to-evidence spine and reviewable profile updates
6. **Verified proof** — live metrics, evidence receipt, and honesty boundary
7. **Close** — positioning and Q&A

## Source of truth for claims

All run metrics, artifact IDs, quotes, hashes, and honesty boundaries come from [`../docs/LIVE-VERIFICATION.md`](../docs/LIVE-VERIFICATION.md).
