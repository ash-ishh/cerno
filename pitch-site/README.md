# Cerno presentation website

A responsive, presentation-style website for the GrowthX × Hermes Buildathon.

## Run locally

```bash
cd pitch-site
uv run python -m http.server 4173 --directory public
```

Open <http://127.0.0.1:4173>.

## Live site

<https://cerno-buildathon.pages.dev>

## Deploy to Cloudflare Pages

```bash
cd pitch-site
wrangler pages deploy public --project-name cerno-buildathon --branch main
```

`wrangler.jsonc` points Cloudflare Pages at `public/` for edge delivery.

## Presentation controls

- Use the navigation or scroll normally.
- `PageDown` / `ArrowDown` advances between major sections.
- `PageUp` / `ArrowUp` goes back.
- The live product section switches between the briefing and execution trace.

## Sponsor stack shown on the site

- **Convex** — canonical database and realtime backend
- **LinkUp** — live web and long-form video discovery
- **VideoDB** — spoken-word indexing, semantic moment search, and playable timestamp evidence
- **Cloudflare** — public edge hosting for this website
- **Hermes** — Research Director orchestration and native delegation

Verified metrics and honesty boundaries are sourced from `../docs/LIVE-VERIFICATION.md`.
