# Cerno interactive prototype

A fixture-only React click-through based on the approved static mocks. It expands the Focus Thread form with current-work, outcome, and source-boundary fields while keeping all research evidence explicitly illustrative.

## Run

```bash
npm install
npm run dev
```

Then open the URL printed by Vite.

## Prototype flow

1. Open **Briefing desk** to inspect the cross-thread library: one canonical document per completed run, with no Daily Brief or per-thread feed.
2. Edit the Focus Thread, boundaries, and source scope, then click **Create focus and plan research**.
3. Watch the clearly labelled local simulation or click **Finish simulation**.
4. Open the fixture briefing and select each finding to change the evidence inspector.
5. Play the mocked exact video moment.
6. Correct any selected judgment; the feedback target and reason-specific TasteDoc diff are preserved.
7. Save **Relevant, but not right now** to Focus Thread context, or approve a durable TasteDoc proposal.
8. Inspect/edit the current TasteDoc and see the approved rule affect the matching fixture judgment.

## Boundary

This is a disposable design prototype. It uses local React state and fixture data only. A persistent in-product notice identifies it as a static fixture, and all timing, token, cost, source, and citation values are illustrative. It contains no API clients, database schema, Hermes integration, research logic, citations pipeline, authentication, persistence, or production components. It should not be submitted as the buildathon application or used as proof of a live run.