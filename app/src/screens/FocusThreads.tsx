import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ArrowRight, BookOpen, Clock3, FileText, ListTree, Plus, RefreshCw, Search, Target } from "lucide-react";
import { EmptyState, LoadingState, Status } from "../components/UI";
import { compactId, formatDate, sentenceCase } from "../lib/format";
import { navigate } from "../lib/routes";

export default function FocusThreads({ initialId }: { initialId?: string }) {
  const threads = useQuery(api.focusThreads.list, {});
  const rerun = useMutation(api.focusThreads.rerun);
  const [selectedId, setSelectedId] = useState<string | undefined>(initialId);
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");
  const [search, setSearch] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (initialId) setSelectedId(initialId);
    else if (!selectedId && threads?.[0]) setSelectedId(threads[0]._id);
  }, [initialId, selectedId, threads]);

  const filtered = useMemo(() => (threads ?? []).filter((thread) => {
    const statusMatches = filter === "all" || thread.status === filter;
    const text = `${thread.title} ${thread.currentWork} ${thread.assignment}`.toLowerCase();
    return statusMatches && text.includes(search.toLowerCase());
  }), [threads, filter, search]);
  const selected = threads?.find((thread) => thread._id === selectedId) ?? filtered[0];

  if (threads === undefined) return <LoadingState label="Opening Focus Threads…" />;
  if (threads.length === 0) return <section className="paper empty-paper"><EmptyState eyebrow="FOCUS THREADS · TEMPORARY CONTEXT" title="Start with the work, not a topic feed." copy="A Focus Thread keeps your current project and desired outcome separate from durable taste. Each fresh run can publish one finite briefing." action="Create a Focus Thread" onAction={() => navigate("new-focus")} /></section>;

  async function startFreshRun() {
    if (!selected || starting) return;
    setStarting(true);
    const runId = await rerun({ focusThreadId: selected._id });
    navigate(`run/${runId}`);
  }

  return (
    <div className="screen-grid threads-layout">
      <section className="paper threads-paper">
        <div className="screen-heading desk-heading"><div><code>FOCUS THREADS · ACTIVE WORK CONTEXT</code><h1>Projects with a beginning and an end.</h1><p>Threads hold mission context and run history. They are never content feeds.</p></div><button className="button primary" onClick={() => navigate("new-focus")}><Plus size={15} /> New Focus Thread</button></div>
        <div className="desk-toolbar"><div className="segmented">{(["all", "active", "paused"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item[0].toUpperCase() + item.slice(1)}<span>{item === "all" ? threads.length : threads.filter((thread) => thread.status === item).length}</span></button>)}</div><label className="search-field"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search work context" /></label></div>
        <div className="thread-list">
          {filtered.map((thread) => (
            <button key={thread._id} className={`thread-row ${selected?._id === thread._id ? "selected" : ""}`} onClick={() => setSelectedId(thread._id)}>
              <div className="thread-index"><Target size={16} /><code>{compactId(thread._id)}</code></div>
              <div className="thread-copy"><span><code>{compactId(thread._id, "FOCUS ")}</code><Status tone={thread.status === "active" ? "good" : "neutral"}>{thread.status}</Status></span><strong>{thread.title}</strong><p>{thread.currentWork}</p><small>{thread.assignment}</small></div>
              <div className="thread-counts"><span><strong>{thread.runCount}</strong><small>runs</small></span><span><strong>{thread.briefingCount}</strong><small>briefings</small></span><ArrowRight size={15} /></div>
            </button>
          ))}
        </div>
      </section>

      {selected && <aside className="side-panel thread-detail">
        <code>CURRENT WORK CONTEXT</code>
        <div className="thread-detail-heading"><Status tone={selected.status === "active" ? "good" : "neutral"}>{selected.status}</Status><h2>{selected.title}</h2><p>{selected.currentWork}</p></div>
        <div className="panel-rule" />
        <div className="context-section"><span><Target size={14} /><code>DESIRED OUTCOME</code></span><p>{selected.outcome}</p></div>
        <div className="context-section"><span><FileText size={14} /><code>RESEARCH ASSIGNMENT</code></span><p>{selected.assignment}</p></div>
        {selected.knownContext && <div className="context-section"><span><BookOpen size={14} /><code>KNOWN · SKIP</code></span><p>{selected.knownContext}</p></div>}
        <div className="context-meta"><div><span>FRESHNESS</span><strong>{selected.freshness}</strong></div><div><span>SOURCES</span><strong>{selected.sourceScope.join(" · ")}</strong></div><div><span>CREATED</span><strong>{formatDate(selected.createdAt)}</strong></div></div>
        <div className="panel-rule" />
        <div className="thread-history-title"><ListTree size={14} /><span><code>LATEST RUN</code><strong>{selected.latestRun ? sentenceCase(selected.latestRun.status) : "No run"}</strong></span></div>
        {selected.latestRun && <div className="latest-run-card"><span><Clock3 size={14} /><strong>{compactId(selected.latestRun._id, "Run ")}</strong><Status tone={selected.latestRun.status === "published" ? "good" : selected.latestRun.status === "failed" ? "bad" : "live"}>{selected.latestRun.status}</Status></span><p>{selected.latestRun.phase}</p><button className="text-link" onClick={() => navigate(`run/${selected.latestRun?._id}`)}>Open execution trace <ArrowRight size={12} /></button></div>}
        <div className="detail-actions"><button className="button primary" onClick={startFreshRun} disabled={starting}><RefreshCw size={14} />{starting ? "Starting…" : "Run fresh research"}</button>{selected.latestBriefing && <button className="button secondary" onClick={() => navigate(`briefing/${selected.latestBriefing?._id}`)}>Open latest briefing</button>}</div>
      </aside>}
    </div>
  );
}
