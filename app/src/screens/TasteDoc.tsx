import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ArrowRight, Check, FileDiff, History, PenLine, Save, ShieldCheck, Sparkles, X } from "lucide-react";
import { LoadingState, Status } from "../components/UI";
import { formatDate } from "../lib/format";

export default function TasteDoc() {
  const data = useQuery(api.taste.current, {});
  const saveManual = useMutation(api.taste.saveManual);
  const resolve = useMutation(api.taste.resolveProposal);
  const [markdown, setMarkdown] = useState("");
  const [selectedProposalId, setSelectedProposalId] = useState<string>();
  const [editedRule, setEditedRule] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const pending = useMemo(() => data?.proposals.filter((proposal) => proposal.status === "pending") ?? [], [data]);
  const selected = data?.proposals.find((proposal) => proposal._id === selectedProposalId) ?? pending[0];

  useEffect(() => {
    if (data?.version) setMarkdown(data.version.markdown);
  }, [data?.version?._id]);
  useEffect(() => {
    if (selected) {
      setSelectedProposalId(selected._id);
      setEditedRule(selected.proposedRule);
    }
  }, [selected?._id]);

  if (data === undefined) return <LoadingState label="Opening your legible TasteDoc…" />;
  if (!data?.version) return <div className="paper"><div className="form-error">TasteDoc not initialized.</div></div>;

  async function saveDocument() {
    setSaving(true);
    await saveManual({ markdown });
    setNotice("A new approved TasteDoc version was created.");
    setSaving(false);
  }

  async function decide(decision: "approved" | "rejected") {
    if (!selected) return;
    setSaving(true);
    await resolve({
      proposalId: selected._id as Id<"tasteChangeProposals">,
      decision,
      editedRule: decision === "approved" ? editedRule : undefined,
    });
    setNotice(decision === "approved" ? "Reviewed change approved as a new TasteDoc version." : "Proposal rejected. Durable taste did not change.");
    setSelectedProposalId(undefined);
    setSaving(false);
  }

  return (
    <div className="screen-grid taste-layout">
      <section className="paper taste-paper">
        <div className="screen-heading taste-heading">
          <div><code>TASTEDOC v{data.version.version} · APPROVED</code><h1>Your quality bar stays visible.</h1><p>Cerno can propose changes from explicit corrections. Only reviewed text becomes durable taste.</p></div>
          <Status tone="good">versioned</Status>
        </div>
        <div className="taste-editor-heading"><div><PenLine size={15} /><span><strong>Current approved document</strong><small>Plain markdown · canonical in Convex</small></span></div><code>LAST CHANGE · {formatDate(data.version.approvedAt)}</code></div>
        <textarea className="taste-markdown" value={markdown} onChange={(event) => setMarkdown(event.target.value)} spellCheck="false" />
        {notice && <div className="inline-notice"><Check size={14} />{notice}</div>}
        <div className="taste-save"><div><ShieldCheck size={15} /><span><strong>Manual edits are explicit versions</strong><small>Research runs retain the exact TasteDoc version they used.</small></span></div><button className="button primary" disabled={saving || markdown.trim() === data.version.markdown.trim()} onClick={saveDocument}><Save size={14} />{saving ? "Saving…" : "Save as new version"}</button></div>
      </section>

      <aside className="side-panel taste-side">
        <code>REVIEW QUEUE</code>
        <h2>{pending.length ? `${pending.length} proposed change${pending.length === 1 ? "" : "s"}` : "No hidden learning"}</h2>
        <p className="serif-intro">Feedback creates an immutable event. Durable changes wait here until you edit, approve, or reject the readable rule.</p>
        <div className="panel-rule" />
        {pending.length === 0 ? (
          <div className="proposal-empty"><Sparkles size={19} /><strong>Your TasteDoc is stable.</strong><p>Correct a judgment inside a briefing to create a reviewable proposal.</p></div>
        ) : (
          <>
            <div className="proposal-tabs">{pending.map((proposal) => <button key={proposal._id} className={selected?._id === proposal._id ? "active" : ""} onClick={() => setSelectedProposalId(proposal._id)}><FileDiff size={13} />Proposal · {formatDate(proposal.createdAt)}</button>)}</div>
            {selected && <div className="proposal-review">
              <span><FileDiff size={14} /><code>READABLE DIFF</code></span>
              <div className="diff-line removed"><i>−</i><p>{selected.oldRule}</p></div>
              <div className="diff-line added"><i>+</i><textarea value={editedRule} onChange={(event) => setEditedRule(event.target.value)} rows={4} /></div>
              <div className="proposal-rationale"><strong>WHY THIS CHANGE</strong><p>{selected.rationale}</p></div>
              <div className="impact-preview"><code>EXPECTED RANKING EFFECT</code><div><span>Future candidates matching this correction</span><strong>Re-scored</strong></div><div><span>Published briefings</span><strong>Immutable</strong></div><div><span>Current Focus Thread context</span><strong>Separate</strong></div></div>
              <div className="proposal-actions"><button className="button secondary" disabled={saving} onClick={() => decide("rejected")}><X size={13} /> Reject</button><button className="button primary" disabled={saving || !editedRule.trim()} onClick={() => decide("approved")}><Check size={13} /> Approve v{data.version.version + 1}</button></div>
            </div>}
          </>
        )}
        <div className="panel-rule" />
        <div className="version-note"><History size={15} /><div><strong>{data.proposals.length} feedback-derived proposal{data.proposals.length === 1 ? "" : "s"}</strong><p>Approvals add versions; they never overwrite the historical rule set used by an earlier run.</p></div></div>
        <button className="text-link" onClick={() => window.location.hash = "/desk"}>Return to Briefing Desk <ArrowRight size={13} /></button>
      </aside>
    </div>
  );
}
