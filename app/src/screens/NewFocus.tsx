import { useMemo, useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowRight, Check, Database, FileSearch, Globe2, ShieldCheck, Sparkles, Video } from "lucide-react";
import { navigate } from "../lib/routes";

const scopes = [
  { id: "Live web", label: "Live web", detail: "LinkUp discovery + full page fetch", icon: Globe2, available: true },
  { id: "Research papers", label: "Research papers", detail: "arXiv, DOI, and technical reports", icon: FileSearch, available: true },
  { id: "Personal archive", label: "Personal archive", detail: "Novelty and redundancy comparison", icon: Database, available: true },
  { id: "Long-form video", label: "Long-form video", detail: "VideoDB transcript + playable timestamps", icon: Video, available: true },
];

export default function NewFocus() {
  const createAndRun = useMutation(api.focusThreads.createAndRun);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "Production agent memory",
    currentWork: "Shipping reliable memory for a production research agent",
    outcome: "Choose the evaluation and architecture decisions we should implement first",
    assignment: "Find recent primary evidence about how production teams evaluate durable agent memory, especially temporal correctness, updates, and operational tradeoffs.",
    knownContext: "Skip generic RAG primers and framework roundups without measured results.",
    freshness: "Past 12 months",
    briefingSize: "3 findings",
    serendipity: 15,
  });
  const [selectedScopes, setSelectedScopes] = useState(["Live web", "Research papers", "Personal archive", "Long-form video"]);

  const complete = useMemo(
    () => form.title.trim() && form.currentWork.trim() && form.outcome.trim() && form.assignment.trim(),
    [form],
  );
  const hasLiveSource = selectedScopes.includes("Live web") || selectedScopes.includes("Research papers") || selectedScopes.includes("Long-form video");

  function update(field: keyof typeof form, value: string | number) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleScope(scope: string) {
    setSelectedScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!complete || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await createAndRun({
        ...form,
        title: form.title.trim(),
        currentWork: form.currentWork.trim(),
        outcome: form.outcome.trim(),
        assignment: form.assignment.trim(),
        knownContext: form.knownContext.trim(),
        sourceScope: selectedScopes,
      });
      navigate(`run/${result.runId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the research run.");
      setSubmitting(false);
    }
  }

  return (
    <div className="screen-grid focus-layout">
      <section className="paper focus-paper">
        <div className="screen-heading">
          <div>
            <code>NEW FOCUS THREAD · RESEARCH CONTRACT</code>
            <h1>Tell Cerno what deserves attention.</h1>
            <p>The project and desired decision stay separate from the bounded assignment Cerno will execute.</p>
          </div>
          <span className="step-marker">01 / 03</span>
        </div>

        <form onSubmit={submit}>
          <div className="field-grid two compact-fields">
            <label>
              <span>FOCUS THREAD TITLE</span>
              <input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="A stable name for this work" />
            </label>
            <label>
              <span>CURRENT WORK OR PROJECT</span>
              <input value={form.currentWork} onChange={(event) => update("currentWork", event.target.value)} placeholder="What are you working on?" />
            </label>
          </div>

          <label className="field feature-field">
            <span>DECISION OR DESIRED OUTCOME</span>
            <textarea value={form.outcome} onChange={(event) => update("outcome", event.target.value)} rows={2} placeholder="What should this research help you decide or produce?" />
          </label>

          <label className="field feature-field assignment-field">
            <span>RESEARCH ASSIGNMENT</span>
            <textarea value={form.assignment} onChange={(event) => update("assignment", event.target.value)} rows={4} placeholder="What should Cerno find out for this work?" />
            <small>Specific questions produce stronger evidence contracts than broad topics.</small>
          </label>

          <label className="field">
            <span>WHAT YOU ALREADY KNOW · WHAT TO SKIP</span>
            <textarea value={form.knownContext} onChange={(event) => update("knownContext", event.target.value)} rows={2} placeholder="Known arguments, prior decisions, low-value patterns…" />
          </label>

          <fieldset className="scope-fieldset">
            <legend>SOURCE SCOPE</legend>
            <div className="scope-options">
              {scopes.map((scope) => {
                const Icon = scope.icon;
                const selected = selectedScopes.includes(scope.id);
                return (
                  <button
                    type="button"
                    key={scope.id}
                    className={`${selected ? "selected" : ""} ${!scope.available ? "disabled" : ""}`}
                    onClick={() => scope.available && toggleScope(scope.id)}
                    disabled={!scope.available}
                  >
                    <Icon size={16} />
                    <span><strong>{scope.label}</strong><small>{scope.detail}</small></span>
                    <i>{selected ? <Check size={11} /> : null}</i>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="boundary-grid">
            <label><span>FRESHNESS</span><select value={form.freshness} onChange={(event) => update("freshness", event.target.value)}><option>Past 30 days</option><option>Past 6 months</option><option>Past 12 months</option><option>Any date</option></select></label>
            <label><span>BRIEFING BUDGET</span><select value={form.briefingSize} onChange={(event) => update("briefingSize", event.target.value)}><option>3 findings</option><option>4 findings</option><option>5 findings</option></select></label>
            <label className="range-label"><span>SERENDIPITY · {form.serendipity}%</span><input type="range" min="0" max="30" step="5" value={form.serendipity} onChange={(event) => update("serendipity", Number(event.target.value))} /></label>
          </div>

          {error && <div className="form-error">{error}</div>}
          <div className="form-submit">
            <div><ShieldCheck size={15} /><p><strong>Publication boundary</strong><br />Search snippets can create candidates, but never evidence. Every published claim must match fetched source text exactly.</p></div>
            <button className="button primary large" disabled={!complete || !hasLiveSource || submitting}>
              {submitting ? "Creating live run…" : "Create focus and run research"}<ArrowRight size={16} />
            </button>
          </div>
        </form>
      </section>

      <aside className="side-panel contract-panel">
        <code>LIVE RESEARCH CONTRACT</code>
        <h2>What Cerno will do</h2>
        <p className="serif-intro">One bounded run will discover candidates, consume selected primary sources, ask Hermes specialists to judge them, and publish at most one finite briefing.</p>
        <div className="panel-rule" />
        <ol className="contract-steps">
          <li><span>1</span><div><strong>Scout live sources</strong><p>LinkUp returns candidate metadata. No snippet becomes a citation.</p></div></li>
          <li><span>2</span><div><strong>Consume selectively</strong><p>Cerno fetches primary pages and asks VideoDB for timestamped transcript moments.</p></div></li>
          <li><span>3</span><div><strong>Delegate judgment</strong><p>Hermes runs parallel Evidence Analysts and a Personal Editor.</p></div></li>
          <li><span>4</span><div><strong>Validate and publish</strong><p>Exact-match evidence checks run before a canonical briefing is written.</p></div></li>
        </ol>
        <div className="panel-rule" />
        <div className="runtime-proof"><Sparkles size={16} /><div><strong>Real services, no fixture path</strong><p>Convex stores provenance. LinkUp discovers. VideoDB resolves moments. Hermes plans and delegates.</p></div></div>
        <div className="contract-limit"><code>BOUNDARIES</code><strong>7 discovered · 4 consumed · 3 published</strong><small>At most one video lane. One run. One document.</small></div>
      </aside>
    </div>
  );
}
