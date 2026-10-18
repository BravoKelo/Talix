"use client";
import { useEffect, useRef, useState } from "react";
import { browserClient } from "@/lib/supabase/client";
import { money } from "@/lib/types";
import type { BusinessType, Offering, Quote } from "@/lib/onboarding";
import { TaskDialog } from "./order-dialog";

type ChangeState = {
  selection: Quote | null;
  version: number;
  history: {
    version: number;
    previous_selection: Quote;
    selection: Quote;
    created_at: string;
  }[];
};
type Review = { previous_selection: Quote; selection: Quote; version: number };
const unavailable = (code?: string) => code === "PGRST202" || code === "42883";
function PlanSummary({ selection }: { selection: Quote }) {
  return (
    <>
      <p>
        {selection.business_type.name} ·{" "}
        {selection.items.map((i) => i.name).join(", ")}
      </p>
      <p>
        <strong>
          {money(selection.total_cents)} /{" "}
          {selection.billing_interval === "month" ? "month" : "year"}
        </strong>
      </p>
    </>
  );
}
export function SubscriptionSummary({
  id,
  readOnly = false,
}: {
  id: string;
  readOnly?: boolean;
}) {
  const [state, setState] = useState<ChangeState | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("Loading your subscription…");
  const [open, setOpen] = useState(false);
  const [types, setTypes] = useState<BusinessType[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [type, setType] = useState("");
  const [plan, setPlan] = useState("");
  const [addons, setAddons] = useState<string[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const request = useRef("");
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const industrySelect = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    if (!open || busy) return;
    if (review) reviewHeading.current?.focus({ preventScroll: true });
    else industrySelect.current?.focus({ preventScroll: true });
    (reviewHeading.current ?? industrySelect.current)
      ?.closest("dialog")
      ?.scrollTo(0, 0);
  }, [open, busy, review]);
  useEffect(() => {
    let alive = true;
    void (async () => {
      const db = browserClient();
      const result = await db.rpc("subscription_change_state", {
        p_subscription: id,
      });
      if (!alive) return;
      if (!result.error) {
        setState(result.data);
        setEnabled(true);
        setMessage(
          result.data?.selection
            ? ""
            : "No plan has been selected for this business yet.",
        );
        return;
      }
      if (!unavailable(result.error.code)) {
        setMessage("Your subscription details are temporarily unavailable.");
        return;
      }
      const legacy = await db
        .from("subscription_purchases")
        .select("selection")
        .eq("subscription_id", id)
        .maybeSingle();
      if (!alive) return;
      setState({
        selection: legacy.data?.selection ?? null,
        version: 0,
        history: [],
      });
      setMessage(
        legacy.error
          ? "Your subscription details are temporarily unavailable."
          : legacy.data
            ? ""
            : "No plan has been selected for this business yet.",
      );
    })();
    return () => {
      alive = false;
    };
  }, [id]);
  const close = () => {
    if (!busy) {
      setOpen(false);
      setReview(null);
      setProblem("");
      request.current = "";
    }
  };
  const selectedPlan = offerings.find((o) => o.id === plan);
  const plans = offerings.filter(
    (o) => o.kind === "plan" && o.business_type_id === type,
  );
  const extras = offerings.filter(
    (o) =>
      o.kind === "addon" &&
      (!o.business_type_id || o.business_type_id === type) &&
      o.billing_interval === selectedPlan?.billing_interval,
  );
  async function begin() {
    setOpen(true);
    setBusy(true);
    setProblem("");
    setReview(null);
    setType("");
    setPlan("");
    setAddons([]);
    request.current = "";
    try {
      const db = browserClient();
      const [current, t, o] = await Promise.all([
        db.rpc("subscription_change_state", { p_subscription: id }),
        db.from("business_types").select("*").eq("active", true).order("name"),
        db
          .from("talix_offerings")
          .select("*")
          .eq("active", true)
          .order("price_cents"),
      ]);
      if (current.error || t.error || o.error)
        throw new Error(
          "We couldn’t load the current plans. Close and try again.",
        );
      setState(current.data);
      setTypes(t.data);
      setOfferings(o.data);
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Unable to load plans.");
    } finally {
      setBusy(false);
    }
  }
  async function reviewChange() {
    setBusy(true);
    setProblem("");
    try {
      const { data, error } = await browserClient().rpc(
        "subscription_change_quote",
        {
          p_subscription: id,
          p_type: type,
          p_plan: plan,
          p_addons: addons,
          p_version: state?.version,
        },
      );
      if (error) throw error;
      setReview(data);
      request.current = crypto.randomUUID();
    } catch {
      setProblem(
        "We couldn’t review this selection. Check the available plans. If this subscription changed in another tab, close and reopen to reload its current plan.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    if (!review) return;
    setBusy(true);
    setProblem("");
    try {
      const { data, error } = await browserClient().rpc(
        "confirm_subscription_change",
        {
          p_subscription: id,
          p_request: request.current,
          p_type: type,
          p_plan: plan,
          p_addons: addons,
          p_quote: review.selection,
          p_version: review.version,
        },
      );
      if (error) throw error;
      setState(data);
      setOpen(false);
      setReview(null);
      request.current = "";
      setMessage(
        data.version > review.version + 1
          ? "Your earlier change was already recorded. This business has a newer plan; its current plan is shown here."
          : "Your industry and plan have been updated. No payment was collected.",
      );
    } catch {
      setProblem(
        "The change could not be confirmed. Retry confirmation safely, or go Back to review the latest selection. If another tab changed this subscription, close and reopen to reload its current plan.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="panel subscription-summary"
      style={{ marginBottom: 24 }}
    >
      <h2>{readOnly ? "Current subscription" : "Your Talix subscription"}</h2>
      {state?.selection && (
        <>
          <PlanSummary selection={state.selection} />
          <p>Preview subscription. No payment is being collected.</p>
          {enabled && !readOnly && (
            <button onClick={() => void begin()}>Change industry</button>
          )}
          {!enabled && !readOnly && (
            <p className="muted">Industry changes are not available yet.</p>
          )}
          {state.history.length > 0 && (
            <details>
              <summary>Industry change history</summary>
              {state.history.map((change) => (
                <article className="subscription-change" key={change.version}>
                  <p>{new Date(change.created_at).toLocaleString()}</p>
                  <p>
                    {change.previous_selection.business_type.name} →{" "}
                    {change.selection.business_type.name}
                  </p>
                  <PlanSummary selection={change.selection} />
                </article>
              ))}
            </details>
          )}
        </>
      )}
      <p role="status">{message}</p>
      {open && (
        <TaskDialog
          className="industry-dialog"
          title="Change your business industry"
          close={close}
          busy={busy}
        >
          {problem && <p role="alert">{problem}</p>}
          {!review ? (
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                void reviewChange();
              }}
            >
              <p>
                Choose the industry and plan that fit this business. Your login
                and storefront address stay the same.
              </p>
              <fieldset className="stack" disabled={busy}>
                <label>
                  Industry
                  <select
                    ref={industrySelect}
                    aria-label="Industry"
                    required
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      setPlan("");
                      setAddons([]);
                    }}
                  >
                    <option value="">Choose an industry</option>
                    {types
                      .filter(
                        (t) => t.id !== state?.selection?.business_type.id,
                      )
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Plan
                  <select
                    aria-label="Plan"
                    required
                    disabled={!type}
                    value={plan}
                    onChange={(e) => {
                      setPlan(e.target.value);
                      setAddons([]);
                    }}
                  >
                    <option value="">Choose a plan</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {money(p.price_cents)} /{" "}
                        {p.billing_interval === "month" ? "month" : "year"}
                      </option>
                    ))}
                  </select>
                </label>
                {!!type && !plans.length && (
                  <p>
                    No plans are available for this industry. Choose another
                    industry.
                  </p>
                )}
                {extras.map((extra) => (
                  <label className="check" key={extra.id}>
                    <input
                      type="checkbox"
                      checked={addons.includes(extra.id)}
                      onChange={(e) =>
                        setAddons(
                          e.target.checked
                            ? [...addons, extra.id]
                            : addons.filter((a) => a !== extra.id),
                        )
                      }
                    />
                    {extra.name} · {money(extra.price_cents)} /{" "}
                    {extra.billing_interval}
                  </label>
                ))}
              </fieldset>
              <p>
                Example plans only. Industry-specific features are not available
                in this preview.
              </p>
              <div className="actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={close}
                >
                  Cancel
                </button>
                <button disabled={busy || !plan}>Review change</button>
              </div>
            </form>
          ) : (
            <div className="stack industry-review">
              <div className="industry-plan-comparison">
                <section>
                  <h3 ref={reviewHeading} tabIndex={-1}>
                    Current plan
                  </h3>
                  <PlanSummary selection={review.previous_selection} />
                </section>
                <section>
                  <h3>New plan</h3>
                  <PlanSummary selection={review.selection} />
                </section>
              </div>
              <h3>What stays with your business</h3>
              <ul>
                <li>Products, options, images and locations</li>
                <li>
                  Staff permissions and customer details on existing orders
                </li>
                <li>Orders, refunds and their original purchase details</li>
                <li>Storefront settings and ordering address</li>
              </ul>
              <p>
                The change takes effect after confirmation. Original purchase
                terms stay in history. Billing is simulated; no charge or
                proration occurs.
              </p>
              <div className="actions">
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => {
                    setReview(null);
                    setProblem("");
                    request.current = "";
                  }}
                >
                  Back
                </button>
                <button className="secondary" disabled={busy} onClick={close}>
                  Cancel
                </button>
                <button disabled={busy} onClick={() => void confirm()}>
                  {busy ? "Confirming…" : "Confirm change"}
                </button>
              </div>
            </div>
          )}
        </TaskDialog>
      )}
    </section>
  );
}
