import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  BookOpenCheck,
  Check,
  CircleDashed,
  Clock3,
  Database,
  ExternalLink,
  Network,
  OctagonX,
  Search,
  ShieldCheck,
  Sparkles,
  Square,
} from "lucide-react";
import { compactId, duration, formatDate, sentenceCase } from "../lib/format";
import { navigate } from "../lib/routes";
import { LoadingState, Metric, Status } from "../components/UI";

const statusOrder = ["queued", "planning", "discovering", "analyzing", "editing", "validating", "published"];

function StepIcon({ status }: { status: string }) {
  if (status === "complete") return <Check size={13} />;
  if (status === "failed") return <OctagonX size={13} />;
  if (status === "running") return <Sparkles size={13} />;
  return <CircleDashed size={13} />;
}

export default function ResearchRun({ id }: { id: string }) {
  const run = useQuery(api.research.get, { runId: id as Id<"researchRuns"> });
  const cancel = useMutation(api.research.cancel);
  const rerun = useMutation(api.focusThreads.rerun);
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => tick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (run === undefined) return <LoadingState label="Opening live research trace…" />;
  if (run === null) return <div className="paper"><div className="form-error">Research run not found.</div></div>;

  const terminal = ["published", "failed", "cancelled"].includes(run.status);
  const currentIndex = statusOrder.indexOf(run.status);
  const progress = run.status === "failed" || run.status === "cancelled" ? 100 : Math.max(5, ((currentIndex + 1) / statusOrder.length) * 100);
  const canOpen = Boolean(run.briefingId);
  const focusThreadId = run.focusThreadId;

  async function tryAgain() {
    const next = await rerun({ focusThreadId });
    navigate(`run/${next}`);
  }

  return (
    <div className="screen-grid run-layout">
      <section className="paper run-paper">
        <div className="run-heading">
          <div>
            <code>{compactId(run._id, "RESEARCH RUN ")} · LIVE TRACE</code>
            <h1>{run.focusSnapshot.assignment}</h1>
            <p>{run.focusSnapshot.currentWork} · TasteDoc v{run.tasteDoc?.version}</p>
          </div>
          <Status tone={run.status === "published" ? "good" : run.status === "failed" ? "bad" : run.status === "cancelled" ? "warn" : "live"}>{sentenceCase(run.status)}</Status>
        </div>

        <div className="run-progress">
          <div><span style={{ width: `${progress}%` }} /></div>
          <strong>{run.phase}</strong>
          <code>{terminal ? duration(run.startedAt, run.finishedAt) : `${duration(run.startedAt)} elapsed`}</code>
        </div>

        <div className="run-metrics">
          <Metric label="DISCOVERED" value={run.candidateCount} note="live candidates" />
          <Metric label="CONSUMED" value={run.consumedCount} note="full sources" />
          <Metric label="ACCEPTED" value={run.acceptedCount} note="validated claims" />
          <Metric label="MODEL USAGE" value={run.inputTokens + run.outputTokens ? `${((run.inputTokens + run.outputTokens) / 1000).toFixed(1)}k` : "—"} note="Hermes tokens" />
        </div>

        <div className="section-heading"><div><Network size={15} /><span><code>AGENT ORGANIZATION</code><strong>Director-led, request-specific team</strong></span></div><small>{run.steps.length} persisted steps</small></div>
        <div className="agent-trace">
          {run.steps.length === 0 && <div className="trace-placeholder"><CircleDashed size={17} /><span>The Director step will appear when the scheduled action starts.</span></div>}
          {run.steps.map((step) => (
            <article key={step._id} className={`agent-step ${step.status}`}>
              <div className="step-state"><StepIcon status={step.status} /></div>
              <div className="step-copy">
                <span><strong>{step.role}</strong><code>{sentenceCase(step.status)}</code></span>
                <h3>{step.label}</h3>
                <p>{step.summary ?? step.assignment}</p>
              </div>
              <div className="step-meta"><code>{step.toolCalls} TOOLS</code><small>{step.finishedAt ? duration(step.startedAt, step.finishedAt) : step.startedAt ? duration(step.startedAt) : "waiting"}</small></div>
            </article>
          ))}
        </div>

        <div className="section-heading candidate-heading"><div><Search size={15} /><span><code>PROCESSED CORPUS</code><strong>Every candidate leaves a trace</strong></span></div><small>Snippets are metadata only</small></div>
        <div className="candidate-ledger">
          {run.candidates.length === 0 && <p>No candidates discovered yet.</p>}
          {run.candidates.map((candidate) => (
            <article key={candidate._id}>
              <span className={`candidate-state ${candidate.status}`} />
              <div><strong>{candidate.title}</strong><small>{candidate.sourceName} · {candidate.contentType}</small>{candidate.rejectionReason && <p>{candidate.rejectionReason}</p>}</div>
              <Status tone={candidate.status === "accepted" ? "good" : candidate.status === "unavailable" ? "bad" : candidate.status === "rejected" ? "warn" : candidate.status === "consumed" ? "live" : "neutral"}>{candidate.status}</Status>
              <a href={candidate.url} target="_blank" rel="noreferrer" aria-label={`Open ${candidate.title}`}><ExternalLink size={13} /></a>
            </article>
          ))}
        </div>

        {run.error && <div className="run-exception"><AlertTriangle size={17} /><div><strong>Exception retained</strong><p>{run.error}</p></div></div>}

        <div className="run-actions">
          <div><ShieldCheck size={15} /><span><strong>Publication invariant</strong><small>A briefing exists only after exact evidence validation passes.</small></span></div>
          {!terminal && <button className="button secondary" onClick={() => cancel({ runId: run._id })}><Square size={13} /> Stop run</button>}
          {(run.status === "failed" || run.status === "cancelled") && <button className="button secondary" onClick={tryAgain}>Start a fresh run<ArrowRight size={14} /></button>}
          {canOpen && <button className="button primary" onClick={() => navigate(`briefing/${run.briefingId}`)}>Open finite briefing<ArrowRight size={14} /></button>}
        </div>
      </section>

      <aside className="side-panel run-side">
        <code>RUN LEDGER</code>
        <h2>Verifiable execution</h2>
        <p className="serif-intro">This screen subscribes to Convex. Events are persisted by deterministic backend steps, not animated in the browser.</p>
        <div className="panel-rule" />
        <dl className="run-ledger">
          <div><dt>CERNO RUN</dt><dd>{compactId(run._id)}</dd></div>
          <div><dt>HERMES RUN</dt><dd>{run.hermesRunId ? compactId(run.hermesRunId) : "Pending"}</dd></div>
          <div><dt>CREATED</dt><dd>{formatDate(run.createdAt)}</dd></div>
          <div><dt>TASTEDOC</dt><dd>v{run.tasteDoc?.version ?? "—"}</dd></div>
          <div><dt>MODEL COST</dt><dd>Not estimated</dd></div>
          <div><dt>OUTPUT</dt><dd>{run.briefingId ? compactId(run.briefingId, "Briefing ") : "Not published"}</dd></div>
        </dl>
        <div className="panel-rule" />
        <div className="side-section-title"><Database size={14} /><span><code>EVENT STREAM</code><strong>Canonical Convex record</strong></span></div>
        <div className="event-stream">
          {run.events.map((event) => (
            <article key={event._id}>
              <i />
              <div><span><strong>{event.label}</strong><code>{new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</code></span><p>{event.detail}</p></div>
            </article>
          ))}
        </div>
        <div className={`runtime-seal ${run.status}`}>
          {run.status === "published" ? <BookOpenCheck size={17} /> : run.status === "cancelled" ? <Ban size={17} /> : <Clock3 size={17} />}
          <div><strong>{run.status === "published" ? "Canonical output sealed" : run.status === "failed" ? "Exception preserved" : run.status === "cancelled" ? "Cancellation preserved" : "Run in progress"}</strong><small>{run.status === "published" ? "The Briefing Desk and Focus Thread link the same document." : "No output is fabricated while work is incomplete."}</small></div>
        </div>
      </aside>
    </div>
  );
}
