# Cerno hackathon pitch script

## The one idea

**Cerno is your personal research desk, staffed by agents. One mission goes in. One finite, cited briefing comes out.**

The presentation should feel like a product reveal, not an architecture tour. Show the finished work first. Then reveal the agency, evidence system, and production receipt behind it.

## Stage setup

Prepare three surfaces before presenting:

1. **Cover slide** — full screen.
2. **Live Cerno application** — signed into `ashishchoithani05@gmail.com`, with the **Temporal video intelligence** briefing ready.
3. **Production proof slide** — ready to present after the live product.

Preload the VideoDB player so the exact 8.72-second clip opens immediately. Keep notifications off and browser zoom at 100%. Do not start a fresh multi-minute run during the judged demo.

## Three-minute presentation

### 0:00–0:18 — The reveal · cover

> Something remarkable has happened.
>
> We can find almost anything humans have written, recorded, or published in seconds.
>
> But deciding what deserves our attention is still manual.
>
> So I built Cerno: your personal research desk, staffed by agents.

Pause, then switch directly to the live product.

### 0:18–0:38 — The assignment · live app

Open the **Temporal video intelligence** briefing and point to its Focus Thread provenance.

> I gave Cerno one mission: tell me which evaluation cases should gate our next long-video intelligence release.
>
> It received the decision I am making, what I already know, the source boundaries, and my durable quality bar.

Do not explain every field. The assignment should feel as simple as briefing a trusted research team.

### 0:38–1:02 — The work product

Point to the briefing summary and counts.

> This is what came back.
>
> Seven candidates were discovered. The team consumed four full sources. Three findings survived review. Four were rejected and preserved with reasons.
>
> This is a finished research document, not an agent conversation.

Select the VideoDB finding.

### 1:02–1:28 — The exact moment

> One finding came from an eighteen-minute video.
>
> Cerno did not hand me the video. It found the 8.72 seconds that changed the decision.

Click **Play exact VideoDB moment** and let the clip play for approximately five seconds.

> The published claim is attached to the exact spoken words, start and end timestamps, and a timestamp-bounded VideoDB stream.

Return to the briefing.

### 1:28–1:48 — The trust reveal

Point to the claim, transcript passage, locator, and evidence metadata.

> The model can propose a claim. Deterministic code decides whether it is allowed to publish.
>
> Every quote must match one exact fetched passage or one timestamped transcript segment. Video evidence must also produce a playable clip for those exact bounds.

Show the retained NEST rejection.

> This source was rejected because the fetched material contained structure, but not enough substantive evidence. Cerno shows its judgment in what it leaves out.

### 1:48–2:08 — The agency reveal

Open the associated Research Run and point to the Director, specialist steps, Hermes event, and candidate ledger.

> Behind this briefing is a complete research function.
>
> A Hermes Research Director plans the work and delegates parallel evidence, video, and personal-judgment assignments. LinkUp discovers and fetches the sources. VideoDB resolves exact moments. Convex preserves the mission, evidence, decisions, and history.
>
> The deterministic gate reviews the work before anything reaches me.

### 2:08–2:48 — Production proof · proof slide

Switch to the production proof slide.

> These are two completed production missions in my authenticated workspace.
>
> Together, they discovered fourteen candidates, consumed eight full sources, published six evidence-backed findings, and preserved eight rejections.
>
> All six quotes exact-match their persisted evidence. Both video findings resolve to timestamp-bounded clips. Both runs contain native Hermes delegation receipts.
>
> The application is public, the workspace is identity-isolated, and every number on this slide can be inspected in the live product and Convex.

Do not read IDs aloud. Keep them available for verification.

### 2:48–3:00 — Close

Return to the closing slide or remain on the proof slide.

> The internet will keep getting bigger. Your attention will not.
>
> Cerno decides what deserves it.
>
> **One mission in. One trusted briefing out.**

Stop. Leave the final minute for questions.

## One-minute Q&A

### “How is this different from Perplexity?”

Perplexity answers a query. Cerno completes a persistent research function: it works from an explicit mission, consumes selected primary sources, evaluates novelty against personal history, preserves rejections, and delivers one canonical briefing with exact evidence.

### “Where is Hermes load-bearing?”

Convex starts a bearer-protected Hermes run on Azure. Hermes acts as Research Director and performs native `delegate_task` orchestration across specialist assignments. The Hermes run ID, usage, latency, and delegation events are persisted with the Cerno Research Run.

### “Can the model fabricate a citation?”

It can propose unsupported text, but it cannot publish it. Deterministic validation requires an exact contiguous match against fetched primary-source text or one VideoDB transcript segment. Video claims also require a timestamp-bounded playable stream. A failed check blocks the briefing.

### “Why is this an agency rather than a workflow?”

The Director interprets the assignment, delegates bounded work, reviews specialist output, and delivers a customer-facing work product. Mission context, personal history, evidence, exceptions, and immutable run snapshots persist across the handoffs.

### “What does Cerno remember?”

Convex is canonical memory: Focus Threads, TasteDoc versions, personal history, candidates, evidence chunks, claims, judgments, feedback, briefings, and run traces. Hermes carries orchestration state, not hidden product memory.

### “How does it learn without creating a filter bubble?”

Feedback becomes a readable TasteDoc proposal. The user must approve a new immutable version. Exploration is controlled by an explicit serendipity budget, and previous briefings remain bound to the profile version that produced them.

### “What happens when the evidence is weak?”

Cerno fails closed. Unsupported claims are rejected. If too few findings pass exact validation, the run records the exception instead of publishing a weak briefing.

### “What is live?”

The public React application, Firebase authentication, identity-owned Convex workspaces, LinkUp discovery and full-source retrieval, VideoDB indexing and timestamp-bounded streams, remote Hermes delegation, deterministic validation, briefing publication, and reviewed TasteDoc versioning are live. Product users, external traffic, and verified model cost are not claimed.

## Production receipts

### Temporal video intelligence

- Cerno Run: `k97d9j6f1nx4mmqn4hyt2rpnpd8ad3ct`
- Hermes Run: `run_9e63b15efa0e4cef8a88c840510a0670`
- Briefing: `jd7dejh7xj8g04sex917nnkgt98ad6sm`
- Evidence clip: `1:06.64–1:15.36` · 8.72 seconds
- Result: 7 candidates → 4 consumed → 3 findings · 4 rejections

### Production agent memory

- Cerno Run: `k97645banchf27j0chj4y3f9858acaev`
- Hermes Run: `run_223b1f7497274d0fa161528c1e3f7789`
- Briefing: `jd74q5ckv3w6cjy5zcy46k0a3h8acz0t`
- Evidence clip: `51:21.49–51:38.15` · 16.66 seconds
- Result: 7 candidates → 4 consumed → 3 findings · 4 rejections

## Deck map

### Judged path

1. **Cover** — your personal research desk, staffed by agents
2. **Live application** — briefing → exact clip → rejection → run trace
3. **Production proof** — aggregate receipts from two completed missions
4. **Close** — one mission in, one trusted briefing out

### Q&A backup

- Problem and category
- Product workflow
- Agency architecture
- Evidence and TasteDoc trust loop
- Production IDs and service boundaries
