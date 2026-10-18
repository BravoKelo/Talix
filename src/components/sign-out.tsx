"use client";
import { useState } from "react";
import { browserClient } from "@/lib/supabase/client";
export function SignOut() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="public-sign-out">
      <button
        type="button"
        className="secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const { error } = await browserClient().auth.signOut();
            if (error) throw error;
            window.location.replace("/");
          } catch {
            setError("We couldn’t sign you out. Please try again.");
            setBusy(false);
          }
        }}
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
