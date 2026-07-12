import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Archive,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileWarning,
  Fingerprint,
  Lightbulb,
  Link2,
  MessageSquareText,
  Quote,
  Scale,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { LoadingState, Metric, Status } from "../components/UI";
import { compactId, formatDate, scoreTone, sentenceCase } from "../lib/format";
import { navigate } from "../lib/routes";
import { WORKSPACE_KEY } from "../lib/config";

const sectionLabels: Record<string, { label: string; icon: typeof Sparkles }> = {
  must_know: { label: "Must know now", icon: Sparkles },
  exact_moment: { label: "Exact moment", icon: Clock3 },
  archive: { label: "From your archive", icon: Archive },
  serendipity: { label: "Serendipity", icon: Lightbulb },
};

type BriefingResult = NonNullable<FunctionReturnType<typeof api.briefings.get>>;
type BriefingFinding = BriefingResult["findings"][number];

const feedbackReasons = [
  "Too introductory for me",
  "I already know this argument",
  "Strong idea, weak evidence",
  "Right author, wrong topic",
  "Relevant, but not right now",
  "This changed how I think",
];

function FeedbackDialog({
  finding,
  onClose,
  onSaved,
}: {
  finding: BriefingFinding;
  onClose: () => void;
  onSaved: (proposalId: string | null, focusOnly: boolean) => void;
}) {
  const record = useMutation(api.taste.recordFeedback);
  const [reason, setReason] = useState(feedbackReasons[0]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const result = await record({
      workspaceKey: WORKSPACE_KEY,
      briefingId: finding.section.briefingId,
      judgmentId: finding.judgment._id,
      reason,
      note,
    });
    onSaved(result.proposalId, reason === "Relevant, but not right now");
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="feedback-dialog" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close feedback"><X size={16} /></button>
        <code>STRUCTURED CORRECTION</code>
        <h2>Correct Cerno’s reasoning.</h2>
        <p>Feedback targets this judgment, not an ambiguous like or dislike.</p>
        <blockquote>{finding.claim.text}</blockquote>
        <div className="reason-grid">
          {feedbackReasons.map((item) => <button type="button" key={item} className={reason === item ? "selected" : ""} onClick={() => setReason(item)}><i>{reason === item && <Check size={10} />}</i>{item}</button>)}
        </div>
        <label><span>WHAT SHOULD CERNO UNDERSTAND?</span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Add the context behind this correction…" /></label>
        <div className="feedback-boundary"><ShieldCheck size={14} /><p>{reason === "Relevant, but not right now" ? "This stays in the Focus Thread. It will not alter durable taste." : "Cerno will propose a readable TasteDoc rule. Nothing changes until you approve it."}</p></div>
        <button className="button primary large" disabled={saving}>{saving ? "Saving correction…" : "Save correction"}<ArrowRight size={14} /></button>
      </form>
    </div>
  );
}

export default function Briefing({ id }: { id: string }) {
  const briefing = useQuery(api.briefings.get, { briefingId: id as Id<"briefings"> });
  const markReviewed = useMutation(api.briefings.markReviewed);
  const [selectedId, setSelectedId] = useState<string>();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!selectedId && briefing?.findings[0]) setSelectedId(briefing.findings[0].judgment._id);
  }, [briefing, selectedId]);

  if (briefing === undefined) return <LoadingState label="Opening canonical briefing…" />;
  if (briefing === null) return <div className="paper"><div className="form-error">Briefing not found.</div></div>;

  const selected = briefing.findings.find((finding) => finding.judgment._id === selectedId) ?? briefing.findings[0];

  function feedbackSaved(proposalId: string | null, focusOnly: boolean) {
    setFeedbackOpen(false);
    if (focusOnly) {
      setNotice("Correction saved to this Focus Thread. Durable taste was not changed.");
      return;
    }
    setNotice("TasteDoc proposal created. Review it before any durable rule changes.");
    if (proposalId) window.setTimeout(() => navigate("taste"), 700);
  }

  return (
    <>
      <div className="briefing-layout">
        <section className="paper briefing-paper">
          <div className="briefing-heading">
            <div><code>{compactId(briefing._id, "FINITE BRIEFING ")} · {formatDate(briefing.publishedAt)}</code><h1>{briefing.title}</h1><p>Focus Thread: <button onClick={() => navigate(`thread/${briefing.focusThreadId}`)}>{briefing.focus?.title}</button></p></div>
            <Status tone={briefing.status === "reviewed" ? "neutral" : "good"}>{briefing.status}</Status>
          </div>
          <div className="briefing-summary"><Quote size={18} /><p>{briefing.summary}</p></div>
          <div className="briefing-metrics"><Metric label="FINDINGS" value={briefing.findingCount} /><Metric label="SOURCES" value={briefing.sourceCount} /><Metric label="ATTENTION" value={`${briefing.attentionMinutes} min`} /><Metric label="REJECTED" value={briefing.rejections.length} /></div>

          <div className="section-heading"><div><BookOpenCheck size={15} /><span><code>DIRECTOR’S CUT</code><strong>Selected after exact-evidence review</strong></span></div><small>Choose a finding to inspect its evidence spine</small></div>
          <div className="finding-list">
            {briefing.findings.map((finding, index) => {
              const meta = sectionLabels[finding.section.section] ?? sectionLabels.must_know;
              const Icon = meta.icon;
              return (
                <article key={finding.judgment._id} className={`finding-card ${selected?.judgment._id === finding.judgment._id ? "selected" : ""}`} onClick={() => setSelectedId(finding.judgment._id)}>
                  <div className="finding-number"><Icon size={15} /><code>0{index + 1}</code></div>
                  <div className="finding-copy"><span><code>{meta.label}</code><Status tone="good">validated</Status></span><h2>{finding.claim.text}</h2><p>{finding.judgment.explanation}</p><div><span><Clock3 size={11} /> {finding.judgment.attentionMinutes} min</span><span><Link2 size={11} /> {finding.candidate?.sourceName}</span></div></div>
                  <ArrowRight size={16} />
                </article>
              );
            })}
          </div>

          {briefing.rejections.length > 0 && <div className="rejection-block">
            <div className="section-heading"><div><FileWarning size={15} /><span><code>REJECTED AS NOISE</code><strong>Processed, preserved, not published</strong></span></div><small>{briefing.rejections.length} candidates</small></div>
            {briefing.rejections.slice(0, 3).map((candidate) => <article key={candidate._id}><X size={13} /><div><strong>{candidate.title}</strong><p>{candidate.rejectionReason}</p></div><a href={candidate.url} target="_blank" rel="noreferrer"><ExternalLink size={13} /></a></article>)}
          </div>}

          {notice && <div className="inline-notice"><CheckCircle2 size={14} />{notice}</div>}
          <footer className="briefing-actions"><div><Fingerprint size={15} /><span><strong>Immutable run output</strong><small>Feedback can improve future judgment; it never rewrites this published evidence record.</small></span></div><button className="button secondary" onClick={() => markReviewed({ briefingId: briefing._id })}>Mark reviewed</button><button className="button primary" disabled={!selected} onClick={() => setFeedbackOpen(true)}><MessageSquareText size={14} /> Correct reasoning</button></footer>
        </section>

        {selected && <aside className="evidence-panel">
          <div className="evidence-heading"><code>EVIDENCE SPINE · {compactId(selected.claim._id, "CLAIM ")}</code><Status tone="good">exact match</Status><h2>{selected.claim.text}</h2></div>
          <div className="panel-rule" />
          <div className="evidence-section"><span><Quote size={14} /><code>EXACT SOURCE PASSAGE</code></span><blockquote>{selected.claim.evidenceQuote}</blockquote><div className="citation"><strong>{selected.candidate?.title}</strong><small>{selected.chunk?.locator}</small><a href={selected.candidate?.url} target="_blank" rel="noreferrer">Open primary source <ExternalLink size={12} /></a></div></div>
          <div className="panel-rule" />
          <div className="evidence-section"><span><Scale size={14} /><code>PERSONAL JUDGMENT</code></span><p>{selected.judgment.explanation}</p><div className="why-now"><strong>WHY NOW</strong><p>{selected.judgment.whyNow}</p></div></div>
          <div className="score-grid">
            {([
              ["Focus", selected.judgment.focusRelevance],
              ["Taste", selected.judgment.tasteFit],
              ["Novelty", selected.judgment.novelty],
              ["Evidence", selected.judgment.evidenceQuality],
              ["Trust", selected.judgment.sourceTrust],
              ["Redundancy", selected.judgment.redundancy],
            ] as const).map(([label, score]) => <div key={label}><span><small>{label}</small><strong className={scoreTone(label === "Redundancy" ? 100 - score : score)}>{score}</strong></span><i><b style={{ width: `${score}%` }} /></i></div>)}
          </div>
          <div className="panel-rule" />
          <div className="evidence-section"><span><Sparkles size={14} /><code>TASTEDOC RULES USED</code></span><ul>{selected.judgment.tasteRules.map((rule) => <li key={rule}>{rule}</li>)}</ul></div>
          <div className="evidence-proof"><ShieldCheck size={16} /><div><strong>Publication check passed</strong><p>{selected.claim.validationNote}</p><code>SHA-256 {selected.chunk?.contentHash.slice(0, 14)}…</code></div></div>
        </aside>}
      </div>
      {feedbackOpen && selected && <FeedbackDialog finding={selected} onClose={() => setFeedbackOpen(false)} onSaved={feedbackSaved} />}
    </>
  );
}
