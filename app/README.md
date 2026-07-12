# Cerno application

The production-path Cerno application built from the approved Evidence Desk mocks. Unlike `prototype/`, this app has a canonical Convex data model and executes live research through LinkUp, VideoDB, and Hermes.

## Verified live path

```text
Focus Thread
  → Convex ResearchRun + immutable context snapshot
  → LinkUp live discovery
  → LinkUp full primary-source fetch
  → VideoDB upload, spoken-word index, semantic moment search
  → Hermes Research Director
  → native delegate_task specialists
  → deterministic exact-quote validation
  → canonical finite Briefing
  → structured feedback
  → reviewed TasteDoc version
```

The browser never receives LinkUp, VideoDB, or Hermes credentials. Search snippets are retained only as candidate metadata; every published claim points to a fetched source chunk, exact quote, locator, and SHA-256 hash. Video findings additionally require a timestamped VideoDB transcript match and playable moment stream.

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

The VideoDB SDK convention is `VIDEO_DB_API_KEY`. If it is already in the repository root `.env`, copy it into the active Convex server environment without printing it or placing it in browser configuration:

```bash
cd app
set -a; source ../.env; set +a
printf '%s' "$VIDEO_DB_API_KEY" | npx convex env set VIDEO_DB_API_KEY
unset VIDEO_DB_API_KEY
```

For a linked production deployment, authenticate the Convex CLI and add `--prod` to the `convex env set` command. Never use `.env.local` or a `VITE_*` variable for this secret.

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

`convex/schema.ts` defines workspaces, Focus Threads, TasteDoc versions, research runs, agent steps, run events, candidates, reusable VideoDB assets, source chunks, claims, judgments, briefings, briefing sections, feedback events, TasteDoc proposals, and the personal index.

## Current product boundaries

- Live web, paper, and long-form video discovery begin through LinkUp.
- One selected video per run is uploaded to VideoDB, spoken-word indexed, and searched semantically. Only after a transcript quote passes exact validation does Cerno call VideoDB stream generation with that segment’s start and end timestamps; full-asset and search-result streams are never published as evidence moments.
- Hermes is bearer-protected on Azure and exposes only `delegation` and `todo` to API runs.
- Firebase Google sign-in is wired to Convex token verification, and every public query/mutation resolves an identity-owned workspace. `AUTH_DISABLED` is limited to local development.
- The current app still runs against a local anonymous Convex deployment. Public deployment requires linking `app/` to Convex cloud, configuring Firebase’s authorized domain, and deploying the Vite build.

## Prototype boundary

`prototype/` remains the disposable fixture click-through used to validate information architecture. No fixture research data or simulated run logic is imported by this application.
