"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient, configured } from "@/lib/supabase/client";
export function Login() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const f = new FormData(event.currentTarget);
      const { error } = await browserClient().auth.signInWithPassword({
        email: String(f.get("email")),
        password: String(f.get("password")),
      });
      if (error) throw error;
      router.push("/workspace");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="panel stack">
      <label>
        Email
        <input name="email" type="email" required autoComplete="username" />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </label>
      <button disabled={busy || !configured()}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p role="status">
        {message ||
          (!configured()
            ? "Database connection is not configured."
            : "Use an account provisioned for your business.")}
      </p>
    </form>
  );
}
