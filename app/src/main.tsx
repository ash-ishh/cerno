import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";
import AuthGate from "./components/AuthGate";
import { FirebaseConvexProvider } from "./lib/firebase";
import "./styles.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
// Vite hard-codes DEV=false in production builds, so this browser bypass cannot
// be enabled in a deployed bundle even if the variable is copied accidentally.
const localAuthDisabled = import.meta.env.DEV && import.meta.env.VITE_AUTH_DISABLED === "true";
const firebaseConfigured = [
  import.meta.env.VITE_FIREBASE_API_KEY,
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  import.meta.env.VITE_FIREBASE_PROJECT_ID,
  import.meta.env.VITE_FIREBASE_APP_ID,
].every(Boolean);

function ConfigurationError() {
  return (
    <div className="boot-screen error">
      <strong>Cerno authentication is not configured.</strong>
      <p>Set the Convex URL and all VITE_FIREBASE_* client variables before starting the application.</p>
    </div>
  );
}

const client = convexUrl ? new ConvexReactClient(convexUrl) : null;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {client && localAuthDisabled ? (
      <ConvexProvider client={client}><App /></ConvexProvider>
    ) : client && firebaseConfigured ? (
      <FirebaseConvexProvider client={client}>
        <AuthGate><App /></AuthGate>
      </FirebaseConvexProvider>
    ) : <ConfigurationError />}
  </StrictMode>,
);
