import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowRight, CheckCircle2, CircleDashed, ListTree, Plus, ShieldAlert } from "lucide-react";
import { EmptyState, LoadingState, Status } from "../components/UI";
import { compactId, duration, formatDate, sentenceCase } from "../lib/format";
import { navigate } from "../lib/routes";

export default function ResearchRuns() {
  const runs = useQuery(api.research.list, {});
  if (runs === undefined) return <LoadingState label="Opening research run ledger…" />;
  if (runs.length === 0) return <section className="paper empty-paper"><EmptyState eyebrow="RESEARCH RUNS · VERIFIABLE EXECUTION" title="No hidden agent work." copy="Every live run will retain its Director plan, specialist steps, source candidates, exceptions, Hermes correlation ID, and publication result." action="Create a Focus Thread" onAction={() => navigate("new-focus")} /></section>;

  return (
    <section className="paper runs-paper">
      <div className="screen-heading desk-heading"><div><code>RESEARCH RUNS · EXECUTION LEDGER</code><h1>Inspectable work, including failure.</h1><p>Runs are sorted by start time—not engagement or output volume.</p></div><button className="button primary" onClick={() => navigate("new-focus")}><Plus size={15} /> New research</button></div>
      <div className="runs-summary"><div><ListTree size={17} /><span><strong>{runs.length} bounded run{runs.length === 1 ? "" : "s"}</strong><small>{runs.filter((run) => run.status === "published").length} published · {runs.filter((run) => run.status === "failed").length} exceptions</small></span></div><code>CONVEX REALTIME LEDGER</code></div>
      <div className="runs-table-heading"><span>RUN · FOCUS</span><span>EXECUTION</span><span>OUTPUT</span><span /></div>
      <div className="runs-list">
        {runs.map((run) => {
          const running = !["published", "failed", "cancelled"].includes(run.status);
          const Icon = run.status === "published" ? CheckCircle2 : run.status === "failed" ? ShieldAlert : CircleDashed;
          return <button key={run._id} onClick={() => navigate(`run/${run._id}`)}>
            <div className={`run-list-icon ${run.status}`}><Icon size={16} /></div>
            <div className="run-list-copy"><span><code>{compactId(run._id, "RUN ")}</code><Status tone={run.status === "published" ? "good" : run.status === "failed" ? "bad" : running ? "live" : "warn"}>{sentenceCase(run.status)}</Status></span><strong>{run.focus?.title}</strong><p>{run.focusSnapshot.assignment}</p></div>
            <div className="run-list-execution"><span><strong>{run.candidateCount}</strong><small>candidates</small></span><span><strong>{run.consumedCount}</strong><small>consumed</small></span><code>{duration(run.startedAt, run.finishedAt)}</code></div>
            <div className="run-list-output"><strong>{run.briefingId ? compactId(run.briefingId, "Briefing ") : "No briefing"}</strong><small>{formatDate(run.createdAt)}</small></div>
            <ArrowRight size={15} />
          </button>;
        })}
      </div>
    </section>
  );
}
