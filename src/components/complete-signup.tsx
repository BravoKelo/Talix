"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";
import { type Draft } from "@/lib/onboarding";
import { businessErrors, subscriptionProblem } from "@/lib/business-details";

export function CompleteSignup({ draft }: { draft: Draft }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [repair, setRepair] = useState("");
  async function complete() {
    if (busy) return;
    if (Object.keys(businessErrors(draft.business)).length) {
      setMessage("Please check your business details before continuing.");
      setRepair("/onboarding?edit=1");
      return;
    }
    setBusy(true);
    setMessage("");
    setRepair("");
    try {
      const db = browserClient();
      const { error } = await db.rpc("start_subscription", {
        p_request: draft.request,
        p_business: draft.business,
        p_type: draft.businessType,
        p_plan: draft.plan,
        p_addons: draft.addons,
        p_quote: draft.quote,
      });
      if (error) {
        const problem = subscriptionProblem(
          error.code === "P0001" ? error.message : undefined,
        );
        setMessage(problem.message);
        setRepair(
          problem.area === "business"
            ? "/onboarding?edit=1"
            : problem.area === "plan"
              ? "/onboarding?review=1"
              : "",
        );
        return;
      }
      await db.auth
        .updateUser({ data: { talix_onboarding: null } })
        .catch(() => {});
      router.replace("/workspace");
      router.refresh();
    } catch {
      setMessage(
        "We couldn’t finish setting up your business. Your details are saved. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button disabled={busy} onClick={() => void complete()}>
        {busy ? "Finishing setup…" : "Continue →"}
      </button>
      <p role="status">{message}</p>
      {repair && (
        <Link className="button secondary" href={repair}>
          {repair.includes("edit")
            ? "Check business details"
            : "Review your selection"}
        </Link>
      )}
    </>
  );
}
