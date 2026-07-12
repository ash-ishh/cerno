import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";
import "./styles.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

function ConfigurationError() {
  return (
    <div className="boot-screen error">
      <strong>VITE_CONVEX_URL is not configured.</strong>
      <p>Run <code>CONVEX_AGENT_MODE=anonymous npx convex init</code> for local development, or connect a Convex cloud deployment.</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {convexUrl ? <ConvexProvider client={new ConvexReactClient(convexUrl)}><App /></ConvexProvider> : <ConfigurationError />}
  </StrictMode>,
);
