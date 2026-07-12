import type { ReactNode } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";

export function Status({ tone = "neutral", children }: { tone?: "live" | "good" | "warn" | "bad" | "neutral"; children: ReactNode }) {
  return <span className={`status status-${tone}`}><i />{children}</span>;
}

export function LoadingState({ label = "Loading Cerno…" }: { label?: string }) {
  return <div className="loading-state"><LoaderCircle size={20} className="spin" /><strong>{label}</strong></div>;
}

export function EmptyState({
  eyebrow,
  title,
  copy,
  action,
  onAction,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="empty-state">
      <span className="empty-rings"><i /><i /><i /></span>
      <code>{eyebrow}</code>
      <h2>{title}</h2>
      <p>{copy}</p>
      <button className="button primary" onClick={onAction}>{action}<ArrowRight size={15} /></button>
    </div>
  );
}

export function Metric({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return <div className="metric"><code>{label}</code><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}
