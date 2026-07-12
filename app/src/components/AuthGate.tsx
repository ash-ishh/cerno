import { useState, type ReactNode } from "react";
import { useConvexAuth } from "convex/react";
import { LogIn } from "lucide-react";
import { Mark } from "./Shell";
import { useFirebaseSession } from "../lib/firebase";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, isLoading: firebaseLoading, signIn } = useFirebaseSession();
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  if (firebaseLoading || (user && convexLoading)) {
    return (
      <div className="boot-screen">
        <Mark />
        <strong>Opening your private intelligence desk…</strong>
        <small>Verifying your Google identity with Cerno.</small>
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    async function handleSignIn() {
      setSigningIn(true);
      setError("");
      try {
        await signIn();
      } catch (cause) {
        const code = typeof cause === "object" && cause && "code" in cause ? String(cause.code) : "";
        if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
          setError(cause instanceof Error ? cause.message : "Google sign-in could not be completed.");
        }
        setSigningIn(false);
      }
    }

    return (
      <main className="auth-screen">
        <section className="auth-card">
          <div className="auth-brand"><Mark /><span><strong>CERNO</strong><small>PERSONAL INTELLIGENCE</small></span></div>
          <h1>Sign in to Cerno.</h1>
          <p>Open your personal research workspace.</p>
          {error && <div className="form-error">{error}</div>}
          <button className="button primary large auth-button" onClick={handleSignIn} disabled={signingIn}>
            <LogIn size={16} />{signingIn ? "Opening Google…" : "Continue with Google"}
          </button>
        </section>
      </main>
    );
  }

  return children;
}
