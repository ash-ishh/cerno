import type { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  BookOpen,
  Clock3,
  FileText,
  FlaskConical,
  ListTree,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import type { Route } from "../lib/routes";
import { navigate } from "../lib/routes";
import { WORKSPACE_KEY } from "../lib/config";
import { compactId } from "../lib/format";

const navItems = [
  { id: "desk", label: "Briefing desk", icon: BookOpen, target: "desk" },
  { id: "threads", label: "Focus threads", icon: Clock3, target: "threads" },
  { id: "taste", label: "TasteDoc", icon: FileText, target: "taste" },
  { id: "runs", label: "Research runs", icon: ListTree, target: "runs" },
];

function activeNav(route: Route) {
  if (route.name === "briefing" || route.name === "desk") return "desk";
  if (route.name === "run" || route.name === "runs") return "runs";
  if (route.name === "taste") return "taste";
  return "threads";
}

export function Mark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export default function Shell({
  route,
  eyebrow,
  title,
  children,
}: {
  route: Route;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  const briefings = useQuery(api.briefings.list, { workspaceKey: WORKSPACE_KEY });
  const runs = useQuery(api.research.list, { workspaceKey: WORKSPACE_KEY });
  const running = runs?.filter((run) => !["published", "failed", "cancelled"].includes(run.status)).length ?? 0;
  const active = activeNav(route);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <button className="brand" onClick={() => navigate("desk")} aria-label="Cerno home">
            <Mark />
            <span>
              <strong>CERNO</strong>
              <small>PERSONAL INTELLIGENCE</small>
            </span>
          </button>
          <nav className="primary-nav" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={active === item.id ? "active" : ""}
                  onClick={() => navigate(item.target)}
                >
                  <Icon size={17} strokeWidth={1.7} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="sidebar-output">
            <code>FINITE OUTPUTS</code>
            {(briefings ?? []).slice(0, 3).map((briefing) => (
              <button
                key={briefing._id}
                className={route.name === "briefing" && route.id === briefing._id ? "selected" : ""}
                onClick={() => navigate(`briefing/${briefing._id}`)}
              >
                <span className="live-dot" />
                <strong>{compactId(briefing._id, "Briefing ")}</strong>
                <small>{briefing.title}</small>
              </button>
            ))}
            {briefings?.length === 0 && <p>Your published briefings will appear here.</p>}
          </div>
        </div>
        <div className="runtime-card">
          <span><FlaskConical size={13} /> LIVE APPLICATION</span>
          <strong>{running ? `${running} research run${running === 1 ? "" : "s"} active` : "Runtime ready"}</strong>
          <code>CONVEX · LINKUP · HERMES</code>
        </div>
      </aside>

      <div className="app-body">
        <header className="topbar">
          <div>
            <code>{eyebrow}</code>
            <strong>{title}</strong>
          </div>
          <div className="topbar-runtime">
            <span className={running ? "pulse" : ""} />
            {running ? `${running} live run${running === 1 ? "" : "s"}` : "Systems ready"}
          </div>
          <div className="topbar-actions">
            <button className="button secondary compact" onClick={() => navigate("threads")}>
              <SlidersHorizontal size={14} /> Focus threads
            </button>
            <button className="button primary compact" onClick={() => navigate("new-focus")}>
              <Plus size={15} /> New focus
            </button>
          </div>
        </header>
        <main className="screen-wrap">{children}</main>
      </div>
    </div>
  );
}
