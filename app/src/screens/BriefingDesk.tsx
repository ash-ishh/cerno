import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowRight, BookOpen, CheckCircle2, Database, FileCheck2, Plus, Search, Sparkles } from "lucide-react";
import { compactId, formatDate } from "../lib/format";
import { navigate } from "../lib/routes";
import { EmptyState, LoadingState, Metric, Status } from "../components/UI";

export default function BriefingDesk() {
  const briefings = useQuery(api.briefings.list, {});
  const [selectedId, setSelectedId] = useState<string>();
  const [filter, setFilter] = useState<"all" | "published" | "reviewed">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!selectedId && briefings?.[0]) setSelectedId(briefings[0]._id);
  }, [briefings, selectedId]);

  const filtered = useMemo(() => (briefings ?? []).filter((briefing) => {
    const statusMatches = filter === "all" || briefing.status === filter;
    const text = `${briefing.title} ${briefing.summary} ${briefing.focus?.title ?? ""}`.toLowerCase();
    return statusMatches && text.includes(search.toLowerCase());
  }), [briefings, filter, search]);
  const selected = briefings?.find((briefing) => briefing._id === selectedId) ?? filtered[0];

  if (briefings === undefined) return <LoadingState label="Opening the Briefing Desk…" />;
  if (briefings.length === 0) {
    return (
      <section className="paper empty-paper">
        <EmptyState
          eyebrow="BRIEFING DESK · CANONICAL OUTPUTS"
          title="No manufactured digest. Start with a real question."
          copy="The Desk fills only when a bounded Research Run publishes evidence-backed findings. A date alone never creates a briefing."
          action="Create your first Focus Thread"
          onAction={() => navigate("new-focus")}
        />
      </section>
    );
  }

  return (
    <div className="screen-grid desk-layout">
      <section className="paper desk-paper">
        <div className="screen-heading desk-heading">
          <div><code>BRIEFING DESK · CANONICAL LIBRARY</code><h1>Finite documents, not another feed.</h1><p>Every briefing belongs to one bounded run. Threads link context; they never create duplicate content streams.</p></div>
          <button className="button primary" onClick={() => navigate("new-focus")}><Plus size={15} /> New Focus Thread</button>
        </div>

        <div className="desk-principle">
          <div><BookOpen size={18} /><span><strong>One run → one briefing</strong><small>The Desk and originating Focus Thread always link the same canonical document.</small></span></div>
          <div className="desk-stats"><Metric label="DOCUMENTS" value={briefings.length} /><Metric label="DAILY DIGESTS" value="0" /><Metric label="LIVE EVIDENCE" value={briefings.reduce((sum, item) => sum + item.findingCount, 0)} /></div>
        </div>

        <div className="desk-toolbar">
          <div className="segmented">
            {(["all", "published", "reviewed"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item[0].toUpperCase() + item.slice(1)}<span>{item === "all" ? briefings.length : briefings.filter((briefing) => briefing.status === item).length}</span></button>)}
          </div>
          <label className="search-field"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search finite briefings" /></label>
        </div>

        <div className="desk-list">
          {filtered.map((briefing) => (
            <button key={briefing._id} className={`desk-row ${selected?._id === briefing._id ? "selected" : ""}`} onClick={() => setSelectedId(briefing._id)}>
              <div className="document-index"><BookOpen size={17} /><code>{compactId(briefing._id)}</code></div>
              <div className="document-copy"><span><code>{compactId(briefing._id, "BRIEFING ")} · {compactId(briefing.runId, "RUN ")}</code><Status tone={briefing.status === "reviewed" ? "neutral" : "good"}>{briefing.status}</Status></span><strong>{briefing.title}</strong><p>{briefing.focus?.title} · {briefing.focus?.currentWork}</p><small><Sparkles size={11} /> Director-titled after evidence validation · {formatDate(briefing.publishedAt)}</small></div>
              <div className="document-metrics"><span><strong>{briefing.findingCount}</strong><small>findings</small></span><span><strong>{briefing.sourceCount}</strong><small>sources</small></span><code>{briefing.attentionMinutes} min</code><ArrowRight size={15} /></div>
            </button>
          ))}
          {filtered.length === 0 && <p className="no-results">No finite briefing matches this view.</p>}
        </div>
        <footer className="desk-footer"><span><i /> Sorted by publication time, never engagement</span><code>CONVEX CANONICAL STORE</code></footer>
      </section>

      {selected && <aside className="side-panel desk-detail">
        <code>CANONICAL OUTPUT</code>
        <div className="desk-detail-heading"><code>{compactId(selected._id, "BRIEFING ")}</code><Status tone={selected.status === "reviewed" ? "neutral" : "good"}>{selected.status}</Status><h2>{selected.title}</h2></div>
        <p className="serif-intro">Published {formatDate(selected.publishedAt)}. The run owns this document; its Focus Thread supplies context and provenance.</p>
        <div className="detail-metrics"><Metric label="FINDINGS" value={selected.findingCount} /><Metric label="SOURCES" value={selected.sourceCount} /><Metric label="ATTENTION" value={`${selected.attentionMinutes}m`} /></div>
        <div className="panel-rule" />
        <div className="side-section-title"><FileCheck2 size={14} /><span><code>DOCUMENT PROVENANCE</code><strong>One unbroken chain</strong></span></div>
        <div className="provenance-line">
          <div><i className="filled" /><span><strong>Focus Thread</strong><small>{selected.focus?.title}</small></span></div>
          <div><i /><span><strong>{compactId(selected.runId, "Research Run ")}</strong><small>{selected.run?.candidateCount} candidates · TasteDoc snapshot</small></span></div>
          <div><i /><span><strong>Exact evidence validation</strong><small>Fetched primary-source chunks, not snippets</small></span></div>
          <div><i className="filled" /><span><strong>Published briefing</strong><small>One canonical document in this Desk</small></span></div>
        </div>
        <div className="panel-rule" />
        <div className="source-summary"><Database size={15} /><span><strong>Persisted evidence</strong><small>{selected.findingCount} claims linked to exact chunks across {selected.sourceCount} sources</small></span></div>
        <div className="scope-card"><CheckCircle2 size={14} /><div><strong>No Daily Brief was generated</strong><p>Publication time is metadata—not a reason to manufacture another summary.</p></div></div>
        <div className="detail-actions"><button className="button primary" onClick={() => navigate(`briefing/${selected._id}`)}>Open briefing and evidence<ArrowRight size={14} /></button><button className="button secondary" onClick={() => navigate(`thread/${selected.focusThreadId}`)}>View originating Focus Thread</button></div>
      </aside>}
    </div>
  );
}
