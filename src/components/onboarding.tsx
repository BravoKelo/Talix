"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  browserClient,
  configured,
  immediateSignupClient,
} from "@/lib/supabase/client";
import { money } from "@/lib/types";
import {
  accountMessage,
  emptyBusiness,
  type BusinessDetails,
  type BusinessType,
  type Draft,
  type Offering,
  type Quote,
} from "@/lib/onboarding";
export function Onboarding({
  email = "",
  draft = null,
  confirmationPending = false,
}: {
  email?: string;
  draft?: Draft | null;
  confirmationPending?: boolean;
}) {
  const router = useRouter();
  const [types, setTypes] = useState<BusinessType[]>([]),
    [offerings, setOfferings] = useState<Offering[]>([]),
    [business, setBusiness] = useState<BusinessDetails>(
      draft?.business ?? emptyBusiness,
    ),
    [type, setType] = useState(draft?.businessType ?? ""),
    [plan, setPlan] = useState(draft?.plan ?? ""),
    [addons, setAddons] = useState<string[]>(draft?.addons ?? []),
    [quote, setQuote] = useState<Quote | null>(null),
    [step, setStep] = useState(1),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [message, setMessage] = useState(""),
    [sentEmail, setSentEmail] = useState("");
  const request = useRef(draft?.request ?? "");
  async function loadCatalog() {
    const db = browserClient();
    const [t, o] = await Promise.all([
      db.from("business_types").select("*").eq("active", true).order("name"),
      db
        .from("talix_offerings")
        .select("*")
        .eq("active", true)
        .order("price_cents"),
    ]);
    if (t.error || o.error)
      throw new Error(
        "We couldn’t load the available plans. Please try again.",
      );
    setTypes(t.data);
    setOfferings(o.data);
  }
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        if (!configured())
          throw new Error(
            "Signup is temporarily unavailable. Please try again shortly.",
          );
        await loadCatalog();
        if (draft) {
          const { data, error } = await browserClient().rpc(
            "subscription_quote",
            {
              p_type: draft.businessType,
              p_plan: draft.plan,
              p_addons: draft.addons,
            },
          );
          if (error) {
            if (alive) {
              setStep(2);
              setMessage(
                "Your previous selection is no longer available. Please choose a plan.",
              );
            }
          } else if (alive) {
            setQuote(data);
            setStep(3);
            if (JSON.stringify(data) !== JSON.stringify(draft.quote))
              setMessage(
                "Please review the current pricing before continuing.",
              );
          }
        }
      } catch (e) {
        if (alive)
          setMessage(e instanceof Error ? e.message : "Please try again.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [draft]);
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
  async function review(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await browserClient().rpc("subscription_quote", {
        p_type: type,
        p_plan: plan,
        p_addons: addons,
      });
      if (error) throw error;
      setQuote(data);
      setStep(3);
    } catch {
      setMessage(
        "Please review the available plans and extras, then try again.",
      );
      await loadCatalog().catch(() => {});
    } finally {
      setBusy(false);
    }
  }
  async function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!quote) return;
    const f = new FormData(e.currentTarget);
    const accountEmail = email || String(f.get("email")).trim();
    const password = String(f.get("password") ?? "");
    if (!email && password !== String(f.get("confirm_password"))) {
      setMessage("Your passwords do not match.");
      return;
    }
    if (!request.current) request.current = crypto.randomUUID();
    const saved: Draft = {
      business,
      businessType: type,
      plan,
      addons,
      quote,
      request: request.current,
    };
    setBusy(true);
    setMessage("");
    try {
      const db = browserClient();
      if (!email) {
        if (confirmationPending) {
          // Do not attempt signup/mail while the development service still requires email.
          const response = await fetch(
            process.env.NEXT_PUBLIC_SUPABASE_URL + "/auth/v1/settings",
            {
              headers: {
                apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
              },
              cache: "no-store",
            },
          );
          const settings = response.ok ? await response.json() : null;
          if (settings?.mailer_autoconfirm !== true) {
            setMessage(
              "Signup is temporarily unavailable. Please try again shortly.",
            );
            return;
          }
        }
        const { data, error } = await (
          confirmationPending ? immediateSignupClient() : db
        ).auth.signUp({
          email: accountEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth/confirm",
            data: { talix_onboarding: saved },
          },
        });
        if (error) {
          setMessage(accountMessage(error.code));
          return;
        }
        if (!data.session) {
          if (confirmationPending) {
            setMessage("We couldn’t complete signup. Please try again.");
            return;
          }
          setSentEmail(accountEmail);
          return;
        }
        if (confirmationPending) {
          const { error: sessionError } = await db.auth.setSession(
            data.session,
          );
          if (sessionError) {
            setMessage("Your account is ready. Please sign in to continue.");
            return;
          }
        }
        router.replace(
          confirmationPending ? "/signup/confirmation" : "/onboarding",
        );
        router.refresh();
        return;
      }
      const { error: saveError } = await db.auth.updateUser({
        data: { talix_onboarding: saved },
      });
      if (saveError) {
        setMessage(accountMessage(saveError.code));
        return;
      }
      const { error } = await db.rpc("start_subscription", {
        p_request: request.current,
        p_business: business,
        p_type: type,
        p_plan: plan,
        p_addons: addons,
        p_quote: quote,
      });
      if (error) {
        setMessage(
          error.code === "P0001"
            ? error.message
            : "We couldn’t start your subscription. Please try again.",
        );
        setStep(2);
        setQuote(null);
        await loadCatalog().catch(() => {});
        return;
      }
      await db.auth
        .updateUser({ data: { talix_onboarding: null } })
        .catch(() => {});
      router.replace("/workspace");
      router.refresh();
    } catch {
      setMessage("We couldn’t complete signup. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    setBusy(true);
    setMessage("");
    try {
      const { error } = await browserClient().auth.resend({
        type: "signup",
        email: sentEmail,
        options: { emailRedirectTo: window.location.origin + "/auth/confirm" },
      });
      setMessage(
        error
          ? accountMessage(error.code)
          : "If your account needs confirmation, a new email is on its way.",
      );
    } catch {
      setMessage("We couldn’t resend the email. Please try again shortly.");
    } finally {
      setBusy(false);
    }
  }
  if (sentEmail)
    return (
      <main className="narrow">
        <p className="eyebrow">ONE MORE STEP</p>
        <h1>Check your email.</h1>
        <div className="panel stack">
          <p>
            If this is a new account, we’ve sent a confirmation link to{" "}
            <strong>{sentEmail}</strong>. Open it to review your selection and
            finish signup.
          </p>
          <p>
            Your business details and selection are saved with your account. You
            can continue on another device.
          </p>
          <p>
            Already have an account? <Link href="/login">Sign in</Link>.
          </p>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => void resend()}
          >
            Resend confirmation email
          </button>
          <p role="status">{message}</p>
        </div>
      </main>
    );
  return (
    <main className="onboarding">
      <div className="signup-heading">
        <p className="eyebrow">YOUR BUSINESS, CONNECTED</p>
        <h1>
          {email
            ? "Set up your subscription."
            : "Bring your business to Talix."}
        </h1>
        <p className="lead">
          Tell us about your business, choose a plan, and make it yours.
        </p>
        <p className="notice">
          Sample plans and pricing for this preview. No payment will be taken.
          Plans and extras do not add new features during this preview.
        </p>
      </div>
      <ol className="signup-steps" aria-label="Signup progress">
        {["Your business", "Your plan", "Review & confirm"].map((label, i) => (
          <li key={label} aria-current={step === i + 1 ? "step" : undefined}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>
      <p role="status" className={message ? "message" : ""}>
        {message}
      </p>
      {loading ? (
        <p>Loading your options…</p>
      ) : (
        <>
          {step === 1 && (
            <form
              className="panel stack"
              onSubmit={(e) => {
                e.preventDefault();
                setMessage("");
                setStep(2);
              }}
            >
              <h2>Your business</h2>
              <div className="form-grid">
                {(
                  [
                    ["business_name", "Business name", "organization", 100],
                    ["contact_name", "Your full name", "name", 100],
                    ["phone", "Business phone", "tel", 40],
                    [
                      "billing_address",
                      "Billing address",
                      "street-address",
                      500,
                    ],
                    ["location_name", "First location name", "off", 100],
                    ["location_address", "Location address", "off", 500],
                    ["slug", "Your online store address", "off", 63],
                  ] as const
                ).map(([key, label, auto, max]) => (
                  <label
                    key={key}
                    className={
                      key.includes("address") || key === "slug" ? "wide" : ""
                    }
                  >
                    {label}
                    <input
                      required
                      name={key}
                      autoComplete={auto}
                      maxLength={max}
                      type={key === "phone" ? "tel" : "text"}
                      pattern={
                        key === "slug" ? "[a-z0-9][a-z0-9-]{2,62}" : undefined
                      }
                      value={business[key]}
                      onChange={(e) =>
                        setBusiness({ ...business, [key]: e.target.value })
                      }
                    />
                    {key === "slug" && (
                      <small>
                        Choose 3–63 lowercase letters, numbers or dashes, such
                        as your-business.
                      </small>
                    )}
                  </label>
                ))}
              </div>
              <button disabled={!types.length}>Choose your plan →</button>
              {!types.length && (
                <p>Signup is currently unavailable. Please check back soon.</p>
              )}
              {!email && (
                <p>
                  Already using Talix? <Link href="/login">Sign in</Link>
                </p>
              )}
            </form>
          )}
          {step === 2 && (
            <form className="panel stack" onSubmit={review}>
              <h2>Choose what works for you.</h2>
              <label>
                Business type
                <select
                  required
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setPlan("");
                    setAddons([]);
                  }}
                >
                  <option value="">Choose your business type</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset>
                <legend>Your plan</legend>
                <div className="plan-grid">
                  {plans.map((p) => (
                    <label className="plan-card" key={p.id}>
                      <input
                        type="radio"
                        name="plan"
                        value={p.id}
                        required
                        checked={plan === p.id}
                        onChange={() => {
                          setPlan(p.id);
                          setAddons([]);
                        }}
                      />
                      <strong>{p.name}</strong>
                      <span>
                        {money(p.price_cents)} / {p.billing_interval}
                      </span>
                      <small>{p.description}</small>
                    </label>
                  ))}
                </div>
                {type && !plans.length && (
                  <p>
                    No plans are currently available for this business type.
                  </p>
                )}
              </fieldset>
              {selectedPlan && (
                <fieldset>
                  <legend>Optional extras</legend>
                  {extras.length ? (
                    extras.map((a) => (
                      <label className="extra-card" key={a.id}>
                        <input
                          type="checkbox"
                          checked={addons.includes(a.id)}
                          onChange={(e) =>
                            setAddons(
                              e.target.checked
                                ? [...addons, a.id]
                                : addons.filter((id) => id !== a.id),
                            )
                          }
                        />
                        <span>
                          <strong>{a.name}</strong> · {money(a.price_cents)} /{" "}
                          {a.billing_interval}
                          <small>{a.description}</small>
                        </span>
                      </label>
                    ))
                  ) : (
                    <p>No extras are currently available with this plan.</p>
                  )}
                </fieldset>
              )}
              <div className="actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button disabled={busy || !selectedPlan}>
                  Review your selection →
                </button>
              </div>
            </form>
          )}
          {step === 3 && quote && (
            <form className="signup-review" onSubmit={confirm}>
              <section className="panel stack">
                <h2>Review your business</h2>
                <dl className="summary-list">
                  <div>
                    <dt>Business</dt>
                    <dd>{business.business_name}</dd>
                  </div>
                  <div>
                    <dt>Business type</dt>
                    <dd>{quote.business_type.name}</dd>
                  </div>
                  <div>
                    <dt>Contact</dt>
                    <dd>
                      {business.contact_name}
                      <br />
                      {business.phone}
                    </dd>
                  </div>
                  <div>
                    <dt>Billing address</dt>
                    <dd>{business.billing_address}</dd>
                  </div>
                  <div>
                    <dt>First location</dt>
                    <dd>
                      {business.location_name}
                      <br />
                      {business.location_address}
                    </dd>
                  </div>
                  <div>
                    <dt>Online store address</dt>
                    <dd>{business.slug}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={() => setStep(1)}
                >
                  Edit business details
                </button>
                <h2>{email ? "Your account" : "Create your account"}</h2>
                {email ? (
                  <p>{email}</p>
                ) : (
                  <>
                    <label>
                      Email
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        maxLength={254}
                      />
                    </label>
                    <label>
                      Password
                      <input
                        type="password"
                        name="password"
                        aria-describedby="password-help"
                        autoComplete="new-password"
                        required
                        minLength={12}
                        maxLength={128}
                      />
                    </label>
                    <small id="password-help">
                      Use at least 12 characters.
                    </small>
                    <label>
                      Confirm password
                      <input
                        type="password"
                        name="confirm_password"
                        autoComplete="new-password"
                        required
                        minLength={12}
                        maxLength={128}
                      />
                    </label>
                  </>
                )}
              </section>
              <aside className="panel stack price-summary">
                <h2>Your selection</h2>
                {quote.items.map((item) => (
                  <div className="row" key={item.id}>
                    <span>{item.name}</span>
                    <strong>{money(item.price_cents)}</strong>
                  </div>
                ))}
                <div className="price-total">
                  <span>Sample total</span>
                  <strong>
                    {money(quote.total_cents)} / {quote.billing_interval}
                  </strong>
                </div>
                <p>
                  USD. This preview uses sample pricing. You will not be
                  charged.
                </p>
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={() => setStep(2)}
                >
                  Change plan or extras
                </button>
                <button disabled={busy}>
                  {busy
                    ? "Please wait…"
                    : email
                      ? "Confirm subscription"
                      : "Sign up"}
                </button>
                {!email && !confirmationPending && (
                  <small>
                    We’ll ask you to confirm your email before starting your
                    subscription.
                  </small>
                )}
              </aside>
            </form>
          )}
        </>
      )}
    </main>
  );
}
