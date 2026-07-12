# Cerno application

The production-path Cerno application built from the approved Evidence Desk mocks. Unlike `prototype/`, this app has a canonical Convex data model and executes live research through LinkUp and Hermes.

## Verified live path

```text
Focus Thread
  → Convex ResearchRun + immutable context snapshot
  → LinkUp live discovery
  → LinkUp full primary-source fetch
  → Hermes Research Director
  → native delegate_task specialists
  → deterministic exact-quote validation
  → canonical finite Briefing
  → structured feedback
  → reviewed TasteDoc version
```

The browser never receives LinkUp or Hermes credentials. Search snippets are retained only as candidate metadata; every published claim points to a fetched source chunk, exact quote, locator, and SHA-256 hash.

## Local development

Requirements: Node.js 22+ and the Convex CLI.

```bash
cd app
npm install
CONVEX_AGENT_MODE=anonymous npx convex init
```

Configure server-side Convex environment variables:

```bash
npx convex env set LINKUP_API_KEY '<key>'
npx convex env set HERMES_API_KEY '<key>'
npx convex env set HERMES_URL 'https://your-hermes-host.example.com'
```

When the VideoDB lane is enabled, its key belongs in the same server-side Convex environment—not in `.env.local` or a `VITE_*` variable:

```bash
npx convex env set VIDEODB_API_KEY '<key>'
```

The current code does not consume `VIDEODB_API_KEY` yet; setting it prepares the secret boundary but does not by itself enable video processing.

Then run both Convex and Vite:

```bash
npm run dev
```

The frontend is served at `http://127.0.0.1:4180/` and the local Convex backend at `http://127.0.0.1:3210/`.

## Commands

```bash
npm run dev          # Convex watcher + Vite
npm run dev:web      # Vite only
npm run convex:dev   # Convex only
npm run typecheck
npm run build
```

## Canonical collections

`convex/schema.ts` defines workspaces, Focus Threads, TasteDoc versions, research runs, agent steps, run events, candidates, source chunks, claims, judgments, briefings, briefing sections, feedback events, TasteDoc proposals, and the personal index.

## Current product boundaries

- Live web and paper discovery/fetch are connected through LinkUp.
- Hermes is bearer-protected on Azure and exposes only `delegation` and `todo` to API runs.
- Long-form video is visibly unavailable until VideoDB credentials and the video evidence lane are connected.
- The current buildathon workspace is single-user and intentionally has no authentication. Add identity before opening mutations to a general public audience.
- The checked-in app is configured against a local anonymous Convex deployment. Public deployment requires linking `app/` to a Convex cloud project and deploying the Vite build.

## Prototype boundary

`prototype/` remains the disposable fixture click-through used to validate information architecture. No fixture research data or simulated run logic is imported by this application.
