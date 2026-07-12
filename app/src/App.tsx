import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Shell from "./components/Shell";
import { useRoute } from "./lib/routes";
import BriefingDesk from "./screens/BriefingDesk";
import NewFocus from "./screens/NewFocus";
import ResearchRun from "./screens/ResearchRun";
import Briefing from "./screens/Briefing";
import TasteDoc from "./screens/TasteDoc";
import FocusThreads from "./screens/FocusThreads";
import ResearchRuns from "./screens/ResearchRuns";
import { LoaderCircle } from "lucide-react";

function routeMeta(route: ReturnType<typeof useRoute>) {
  switch (route.name) {
    case "desk": return ["BRIEFING DESK", "Finite outputs across your Focus Threads"];
    case "new-focus": return ["NEW FOCUS", "Create a bounded research contract"];
    case "threads": case "thread": return ["FOCUS THREADS", "Temporary context for work that matters now"];
    case "runs": return ["RESEARCH RUNS", "Verifiable execution across every mission"];
    case "run": return ["LIVE RESEARCH", "Director and specialist execution trace"];
    case "briefing": return ["FINITE BRIEFING", "Decision-ready findings with exact evidence"];
    case "taste": return ["TASTEDOC", "Your visible, versioned quality bar"];
  }
}

export default function App() {
  const route = useRoute();
  const ensure = useMutation(api.workspaces.ensure);
  const workspace = useQuery(api.workspaces.get, {});
  const [setupError, setSetupError] = useState("");

  useEffect(() => {
    ensure({}).catch((error) => setSetupError(error instanceof Error ? error.message : "Could not initialize Cerno."));
  }, [ensure]);

  const [eyebrow, title] = routeMeta(route);
  let screen;
  switch (route.name) {
    case "desk": screen = <BriefingDesk />; break;
    case "new-focus": screen = <NewFocus />; break;
    case "threads": screen = <FocusThreads />; break;
    case "thread": screen = <FocusThreads initialId={route.id} />; break;
    case "runs": screen = <ResearchRuns />; break;
    case "run": screen = <ResearchRun id={route.id} />; break;
    case "briefing": screen = <Briefing id={route.id} />; break;
    case "taste": screen = <TasteDoc />; break;
  }

  if (setupError) {
    return <div className="boot-screen error"><strong>Cerno could not open its canonical store.</strong><p>{setupError}</p></div>;
  }
  if (workspace === undefined || workspace === null) {
    return <div className="boot-screen"><LoaderCircle className="spin" size={21} /><strong>Preparing your intelligence desk…</strong><small>Convex is creating the initial approved TasteDoc and personal archive.</small></div>;
  }

  return <Shell route={route} eyebrow={eyebrow} title={title}>{screen}</Shell>;
}
