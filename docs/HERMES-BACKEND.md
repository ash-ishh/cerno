# Hermes backend plan for Cerno

> Runtime architecture and next-stage plugin plan. Azure deployment automation lives in `infra/azure/hermes/`. The live `app/` vertical slice now uses Convex to discover/fetch sources before a Hermes run and validate/persist its structured output afterward. The narrower Cerno plugin described below remains the next step for tool-driven writes and observer telemetry.

## Decision

Use Hermes as Cerno's runtime agent harness through its OpenAI-compatible **Runs API** and native `delegate_task` subagents.

Do not use Hermes Kanban for the first live briefing loop. Kanban is excellent for durable, scheduled, restart-safe work between named profiles, but adds dispatcher and profile lifecycle complexity. A research briefing needs a synchronous manager that can spawn parallel specialists and review their output within roughly one minute. Native delegation fits that path.

Kanban remains a strong post-MVP option for scheduled monitoring and long-running research missions.

## Runtime topology

```text
Browser
  │
  ▼
Cerno UI ──► Convex action ──► Hermes API Server /v1/runs
  ▲                                  │
  │                                  ▼
  │                         Cerno Director profile
  │                                  │
  │                         native delegate_task
  │                      ┌───────────┼───────────┐
  │                      ▼           ▼           ▼
  │                    Scout    Web Analyst  Video Analyst
  │                      └───────────┬───────────┘
  │                                  ▼
  │                           Personal Editor
  │                                  │
  │                           Director review
  │                                  │
  │                                  ▼
  └──── Convex realtime ◄── Cerno tools + observer hooks
```

Hermes runs on a small Azure VM with Caddy terminating HTTPS and a normal managed-disk filesystem for SQLite. The current spike endpoint is internet-routable but bearer-protected, has no CORS, and exposes only planning/delegation tools. Only server-side Cerno code receives the Hermes bearer token; add a private relay or network-layer restriction before production use.

## Why Hermes fits

Current Hermes provides the load-bearing primitives Cerno needs:

- `POST /v1/runs` starts an asynchronous run and returns a `run_id`.
- `GET /v1/runs/{id}` reports status and usage.
- `GET /v1/runs/{id}/events` streams lifecycle and tool events over SSE.
- `POST /v1/runs/{id}/stop` interrupts safely.
- `delegate_task` starts isolated child `AIAgent` instances in parallel.
- Each child receives only an explicit `goal` and `context`, making handoffs bounded and inspectable.
- Observer hooks expose LLM, tool, approval, session, and subagent lifecycle events with correlation IDs.
- Plugins can register custom tools and hooks without forking Hermes.
- Profiles isolate the Director's config, SOUL, skills, sessions, and credentials.

References:

- https://hermes-agent.nousresearch.com/docs/developer-guide/programmatic-integration
- https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server
- https://hermes-agent.nousresearch.com/docs/user-guide/features/delegation
- https://hermes-agent.nousresearch.com/docs/developer-guide/plugins

## One profile, dynamic specialists

Create one Hermes profile: `cerno-director`.

The Director is persistent and receives the user's mission. Specialists are spawned dynamically through `delegate_task` based on the plan. This better demonstrates request-specific organization than a fixed chain of five permanently running profiles.

Example specialist task:

```json
{
  "goal": "Video Analyst — find the exact moment that answers research question q_02",
  "context": {
    "cerno_run_id": "run_01J...",
    "focus_thread_id": "focus_07",
    "taste_doc_version": 3,
    "question": "How are production teams evaluating memory durability?",
    "candidate_ids": ["item_14", "item_21"],
    "relevant_history_ids": ["claim_034", "claim_052"],
    "policies": [
      "Every claim must reference source chunk IDs",
      "Do not publish search snippets as evidence",
      "Escalate if no timestamped evidence exists"
    ]
  },
  "toolsets": ["cerno-context", "cerno-video", "cerno-claims"],
  "max_iterations": 12
}
```

The role name is included in the child goal and persisted in Cerno's `AgentStep`. Hermes' child-session IDs preserve the actual parent/child execution lineage.

## Cerno Hermes plugin

During the sprint, create a project-local plugin under:

```text
.hermes/plugins/cerno/
├── plugin.yaml
├── __init__.py
├── schemas.py
├── tools.py
└── telemetry.py
```

Project plugins require `HERMES_ENABLE_PROJECT_PLUGINS=true` and explicit enablement.

### Toolsets

Keep toolsets narrow so each specialist can perform only its job.

| Toolset | Tools | Used by |
|---|---|---|
| `cerno-context` | `get_research_context`, `get_candidates` | All agents |
| `cerno-discovery` | `search_linkup`, `search_personal_archive`, `save_candidates` | Scout |
| `cerno-web` | `fetch_source_chunks`, `save_claims` | Web/Paper Analyst |
| `cerno-video` | `search_video`, `get_transcript_chunks`, `save_moments` | Video Analyst |
| `cerno-editorial` | `retrieve_similar_claims`, `save_judgment` | Personal Editor |
| `cerno-review` | `validate_evidence`, `request_revision`, `record_exception` | Director |
| `cerno-publish` | `publish_briefing` | Director only |
| `cerno-taste` | `get_feedback`, `propose_taste_change` | Taste Editor |

All handlers return JSON strings and catch failures as structured errors, following the Hermes plugin contract.

The tools call deterministic Cerno services. Agents do not write directly to the database or fabricate citations.

## Director protocol

1. Call `get_research_context(cerno_run_id)`.
2. Create and persist a request-specific research plan.
3. Delegate discovery lanes to Scouts when useful.
4. Read candidate IDs from Cerno state.
5. Delegate selected candidates to Web, Paper, or Video Analysts in parallel.
6. Delegate evaluated claims to the Personal Editor.
7. Call deterministic `validate_evidence`.
8. Re-delegate only failed items once with concrete revision instructions.
9. Record unresolved exceptions instead of silently dropping them.
10. Call `publish_briefing` only when completion criteria pass.
11. Return a small final summary containing the published briefing ID and exception count.

Specialists store structured artifacts through tools and return IDs in their summaries. The Director does not depend on prose summaries as the source of truth.

## State and memory boundary

Convex is Cerno's canonical memory:

- Focus Threads
- TasteDoc versions
- Processed corpus
- Personal index
- Claims and evidence
- Feedback events
- Briefings
- Run traces

Hermes session memory is not the canonical taste model. Disable opaque Hermes memory tools for the runtime profile so TasteDoc changes remain visible and reviewed.

Every handoff explicitly carries:

1. current mission,
2. relevant personal-history IDs,
3. TasteDoc version and applicable rules,
4. agent assignment,
5. output and evidence contract.

## Observability

The plugin registers these observer hooks:

- `on_session_start`, `on_session_end`
- `pre_api_request`, `post_api_request`, `api_request_error`
- `pre_tool_call`, `post_tool_call`
- `subagent_start`, `subagent_stop`
- approval lifecycle hooks if approvals remain enabled

Each hook sends a bounded, sanitized event to a protected Convex HTTP endpoint. Use the Hermes IDs directly:

```text
session_id           → Cerno ResearchRun
turn_id              → Director turn
api_request_id       → model span
parent_session_id    → parent AgentStep
child_session_id     → child AgentStep
parent_turn_id       → delegation edge
tool_call_id         → tool span
```

The UI reads Convex subscriptions rather than exposing the Hermes API key or connecting directly to Hermes SSE.

Langfuse can run in parallel as backup proof, but Cerno's run screen should remain the primary judge-facing trace.

## API call from Cerno

Use the Cerno run ID as Hermes' `session_id` so telemetry joins without heuristics.

```http
POST /v1/runs
Authorization: Bearer $HERMES_API_KEY
Idempotency-Key: cerno-run-run_01J...
Content-Type: application/json

{
  "input": "Execute Cerno research run run_01J... and publish its briefing.",
  "session_id": "run_01J...",
  "instructions": "Operate as Cerno's Research Director. Load the cerno-director skill before planning."
}
```

Persist the returned Hermes `run_id` on the Cerno `ResearchRun` record.

## Runtime restrictions

This is a public product backend, so the Director should not inherit Hermes' broad default tool surface.

Disable at least:

- terminal and process execution
- file mutation
- browser automation
- generic messaging
- cron for the live path
- code execution
- built-in opaque memory

Keep only:

- delegation
- the Cerno skill
- Cerno plugin toolsets
- minimal planning support

The API server stays private, requires `API_SERVER_KEY`, and should be called server-to-server. Do not put the key in browser code or enable broad CORS.

## `delegate_task` versus Kanban

### Use now: `delegate_task`

- Parallel children within one live run
- Low latency
- Natural manager review loop
- Parent/child trace IDs
- Explicit bounded context

### Add later: Hermes Kanban + profiles

- Scheduled monitoring
- Research that must survive restarts
- Human comments and unblock flows
- Persistent named specialist memories
- Multi-hour or multi-day missions

Kanban can later dispatch `scout`, `analyst`, and `editor` profiles, while each worker still uses `delegate_task` internally.

## Deployed runtime spike

The Azure deployment at `https://cerno-hermes-74d2dc62.eastus.cloudapp.azure.com` currently proves:

- Hermes `0.18.2` health and authenticated capabilities endpoints over HTTPS.
- Keyless Azure AI access through the VM's system-assigned managed identity.
- A completed `/v1/runs` inference with a caller-provided `session_id`.
- A completed two-child parallel `delegate_task` run.
- Successful cancellation through `/v1/runs/{id}/stop`.
- A restricted API tool surface: only `delegation` and `todo` are enabled; CORS is off.
- Healthy SQLite state on the VM's local managed disk.

A Container Apps experiment was rejected: Azure Files/SMB does not satisfy Hermes' SQLite WAL locking and s6 POSIX permission requirements.

## First technical spike

Before building the product integration, prove this vertical slice:

1. Install Hermes and create `cerno-director` profile.
2. Enable API server and verify `/health` plus `/v1/capabilities`.
3. Start one `/v1/runs` request with a known `session_id`.
4. Have the Director call one temporary Cerno tool.
5. Have the Director delegate two parallel read-only children.
6. Verify `subagent_start`/`subagent_stop`, model usage, and tool events reach a test sink.
7. Stop a run and verify children are cancelled.
8. Confirm terminal/file/browser tools are unavailable.

Only after this spike passes should the UI be wired to Hermes.