# Cerno mock UI direction

> Static design preparation only. These artifacts are wireframes/high-fidelity mocks, not the submitted application.

## Product subject

- **Audience:** a founder, researcher, or operator who needs a finite briefing without reading every source.
- **Primary job:** assign a Focus Thread, inspect the resulting briefing, and verify why each finding was selected.
- **Interface posture:** Cerno should feel like a quiet research instrument—not a feed, chatbot, generic agent dashboard, or news site.

## Design thesis: the evidence desk

The briefing is the main object. Agent activity stays backstage until the user asks to inspect it. Every selected claim has a visible path back to evidence and personal context.

The interface uses an **evidence spine**: a thin vertical provenance rail connecting a finding to its supporting source, exact passage or timestamp, comparison against the personal index, and Cerno's judgment. This is the signature interaction and visual device.

## Visual system

### Palette

| Token | Hex | Use |
|---|---:|---|
| Porcelain | `#F3F6F5` | App background |
| Paper | `#FCFDFC` | Briefing surface |
| Carbon | `#182320` | Primary text |
| Verdigris | `#1C665A` | Selection, active states, evidence spine |
| Sea glass | `#DCEBE7` | Quiet selected backgrounds |
| Amber | `#D79A42` | Uncertainty and review |
| Oxide | `#A45C52` | Rejection and exceptions |
| Hairline | `#D5DEDA` | Rules and boundaries |

### Type

- **Interface/display:** Avenir Next / Manrope fallback. Humanist geometry, restrained weights.
- **Briefing prose:** Literata / Georgia fallback. Used only where the product asks the user to read.
- **Evidence/data:** IBM Plex Mono / SFMono fallback. Timestamps, run IDs, scores, source locators.

### Shape and depth

- 10–14px radii, never pill-shaped containers around whole sections.
- One level of quiet shadow only for the briefing sheet and active inspector.
- Hairline dividers carry most of the structure.
- Color is semantic: green = selected/evidenced, amber = uncertain/review, oxide = rejected/failed.

## Layout

```text
┌─────────────┬────────────────────────────────────┬───────────────────────┐
│ Product nav │ Finite briefing                    │ Evidence inspector    │
│             │                                    │                       │
│ Brief desk  │ Focus Thread + run status          │ Why this made the cut │
│ Focus       │ ─────────────────────────────────  │ Component judgment    │
│ TasteDoc    │ Must know now                      │ Evidence spine        │
│ Runs        │ Exact moment                       │ Personal-index match  │
│             │ From your archive                  │ Correct reasoning     │
│             │ Rejected as noise                  │                       │
└─────────────┴────────────────────────────────────┴───────────────────────┘
```

The center behaves like a bounded document, not an infinite card grid. The right inspector changes with the selected finding. Agent names do not dominate the briefing; they belong in the run trace.

## Signature interaction

Selecting a finding opens its evidence spine:

```text
Finding
  ● claim selected
  │
  ● exact quote / timestamp
  │
  ● source provenance
  │
  ● nearest prior claim
  │
  ● judgment + TasteDoc rules used
```

Hovering a node highlights the corresponding sentence, source citation, or personal-index entry. A missing node is visibly an exception and prevents publication.

## Core screens

1. **Briefing desk** — cross-thread library of canonical run outputs; never a Daily Brief or feed.
2. **Briefing workspace** — the primary reading and evidence-inspection surface.
3. **Research run** — Director plan, dynamic specialist tree, review/revision, cost, latency, and exceptions.
4. **TasteDoc change** — structured feedback, readable diff, approval, and ranking impact preview.

A Focus Thread owns context and run history, not a content feed. Each successful run may publish one briefing, and every surface links to that same canonical document.

## Self-critique and revision

The first instinct was a cream editorial/newspaper treatment. That is common for AI research products and would make Cerno look like another reading app. The revised direction uses a cool mineral palette and instrument-like information architecture, while reserving editorial typography only for the briefing itself. The evidence spine—not decorative newspaper styling—creates the product-specific identity.

The deliberate risk is the persistent right-hand evidence inspector. It gives up some center width, but makes trust and provenance impossible to miss, which is the product's core differentiator and the strongest competition proof.