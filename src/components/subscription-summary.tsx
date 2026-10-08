"use client";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/client";
import { money } from "@/lib/types";
import type { Quote } from "@/lib/onboarding";
export function SubscriptionSummary({ id }: { id: string }) {
  const [selection, setSelection] = useState<Quote | null>(null),
    [message, setMessage] = useState("Loading your subscription…");
  useEffect(() => {
    let alive = true;
    void browserClient()
      .from("subscription_purchases")
      .select("selection")
      .eq("subscription_id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (alive) {
          setSelection(data?.selection ?? null);
          setMessage(
            error
              ? "Your subscription details are temporarily unavailable."
              : data
                ? ""
                : "No plan has been selected for this business yet.",
          );
        }
      });
    return () => {
      alive = false;
    };
  }, [id]);
  return (
    <section className="panel" style={{ marginBottom: 24 }}>
      <h2>Your Talix subscription</h2>
      {selection ? (
        <>
          <p>
            {selection.business_type.name} ·{" "}
            {selection.items.map((i) => i.name).join(", ")}
          </p>
          <p>
            <strong>
              {money(selection.total_cents)} / {selection.billing_interval}
            </strong>
          </p>
          <p>Preview subscription. No payment is being collected.</p>
        </>
      ) : (
        <p>{message}</p>
      )}
    </section>
  );
}
