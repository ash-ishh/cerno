import { useEffect, useState } from "react";

export type Route =
  | { name: "desk" }
  | { name: "new-focus" }
  | { name: "threads" }
  | { name: "thread"; id: string }
  | { name: "runs" }
  | { name: "run"; id: string }
  | { name: "briefing"; id: string }
  | { name: "taste" };

export function parseRoute(hash = window.location.hash): Route {
  const path = hash.replace(/^#\/?/, "");
  const [name, id] = path.split("/");
  if (name === "briefing" && id) return { name: "briefing", id };
  if (name === "run" && id) return { name: "run", id };
  if (name === "thread" && id) return { name: "thread", id };
  if (name === "threads") return { name: "threads" };
  if (name === "runs") return { name: "runs" };
  if (name === "taste") return { name: "taste" };
  if (name === "new-focus") return { name: "new-focus" };
  if (name === "desk") return { name: "desk" };
  return { name: "new-focus" };
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(() => parseRoute());
  useEffect(() => {
    const update = () => setRoute(parseRoute());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return route;
}

export function navigate(path: string) {
  window.location.hash = path.startsWith("/") ? path : `/${path}`;
}
