"use client";
import Link from "next/link";
import { accountMessage } from "@/lib/onboarding";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient, configured } from "@/lib/supabase/client";
export function Login({
  next = "workspace",
  confirmationFailed = false,
}: {
  next?: "workspace" | "admin" | "onboarding";
  confirmationFailed?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(
    confirmationFailed
      ? "That confirmation link could not be opened. Please request a new one or sign in if your email is already confirmed."
      : "",
  );
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
      if (error) {
        setMessage(accountMessage(error.code));
        return;
      }
      router.push("/" + next);
      router.refresh();
    } catch {
      setMessage(
        "We couldn’t sign you in. Please check your email and password and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function resend(form: HTMLFormElement) {
    const email = form.elements.namedItem("email") as HTMLInputElement;
    if (!email.reportValidity()) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await browserClient().auth.resend({
        type: "signup",
        email: email.value.trim(),
        options: { emailRedirectTo: window.location.origin + "/auth/confirm" },
      });
      setMessage(
        error
          ? accountMessage(error.code)
          : "If your account needs confirmation, a new email is on its way.",
      );
    } catch {
      setMessage("We couldn’t request a new email. Please try again shortly.");
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
      <button
        type="button"
        className="secondary"
        disabled={busy || !configured()}
        onClick={(e) => void resend(e.currentTarget.form!)}
      >
        Resend confirmation email
      </button>
      <p role="status">
        {message ||
          (!configured() ? "Sign-in is temporarily unavailable." : "")}
      </p>
      <p>
        New to Talix? <Link href="/signup">Sign up</Link>
      </p>
    </form>
  );
}
