"use client";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/client";
import { money, type PublicOrder } from "@/lib/types";
export function OrderTracking({ token }: { token: string }) {
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [retryKey, setRetryKey] = useState<string | null>(null);
  async function load() {
    const { data, error } = await browserClient().rpc("track_order", {
      p_token: token,
    });
    if (error) throw error;
    if (!data)
      throw new Error("Order not found. Check your private order link.");
    setOrder(data as PublicOrder);
  }
  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const { data, error } = await browserClient().rpc("track_order", {
          p_token: token,
        });
        if (error) throw error;
        if (!data)
          throw new Error("Order not found. Check your private order link.");
        if (active) {
          setOrder(data as PublicOrder);
          setMessage("");
        }
      } catch (e) {
        if (active)
          setMessage(e instanceof Error ? e.message : "Unable to load order.");
      }
    }
    void poll();
    const timer = setInterval(() => void poll(), 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [token]);
  async function retry(outcome: string) {
    setBusy(true);
    const key = retryKey ?? crypto.randomUUID();
    setRetryKey(key);
    try {
      const { error } = await browserClient().rpc("retry_simulated_payment", {
        p_token: token,
        p_request: key,
        p_outcome: outcome,
      });
      if (error) throw error;
      await load();
      setRetryKey(null);
      setMessage("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to retry payment.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="narrow">
      {!order ? (
        <>
          <h1>Your order</h1>
          <p role="status">{message || "Loading…"}</p>
        </>
      ) : (
        <>
          <p className="eyebrow">
            {order.business_name} · {order.location_name}
          </p>
          <h1>
            {order.payment_status === "declined"
              ? "Payment declined"
              : "Your order"}
          </h1>
          <p className="muted">
            Reference {order.id.slice(0, 8).toUpperCase()}
          </p>
          <div className="panel">
            <span className="badge">
              Simulated payment · {order.payment_status.replaceAll("_", " ")}
            </span>
            <div className="status-steps">
              {["received", "in_progress", "ready", "completed"].map((s) => (
                <span key={s} className={order.status === s ? "current" : ""}>
                  {s.replaceAll("_", " ")}
                </span>
              ))}
            </div>
            {order.status === "cancelled" && (
              <p>This order has been cancelled.</p>
            )}
            {order.payment_status === "declined" && (
              <div className="notice">
                <p>
                  This order has not entered fulfillment. Retry the simulated
                  payment.
                </p>
                <button disabled={busy} onClick={() => retry("approved")}>
                  Simulate successful retry
                </button>
              </div>
            )}
            {order.items.map((l, i) => (
              <div className="cart-line" key={i}>
                <strong>
                  {l.name} × {l.quantity}
                </strong>
                <p>
                  <small>{l.options.map((o) => o.name).join(", ")}</small>
                </p>
                <span>{money(l.unit_cents * l.quantity)}</span>
              </div>
            ))}
            <div className="row" style={{ marginTop: 20 }}>
              <strong>Order total</strong>
              <strong>{money(order.total_cents)}</strong>
            </div>
            {order.refunded_cents > 0 && (
              <p>Simulated refund: {money(order.refunded_cents)}</p>
            )}
            <p className="muted" style={{ marginTop: 20 }}>
              Keep this private link to follow your order. It refreshes every 10
              seconds. Order emails are not enabled in this release.
            </p>
          </div>
          <p role="status">{message}</p>
        </>
      )}
    </main>
  );
}
