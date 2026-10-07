"use client";
import { useCallback, useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/client";
import { cents, money } from "@/lib/types";
import {
  type BusinessType,
  type Offering,
  type Quote,
  type BusinessDetails,
} from "@/lib/onboarding";
type Purchase = {
  subscription_id: string;
  client_id: string;
  selection: Quote;
  business_details: BusinessDetails;
  total_cents: number;
  billing_interval: string;
  billing_status: string;
  created_at: string;
};
type Client = {
  id: string;
  business_name: string;
  contact_name: string;
  contact_email: string;
  phone: string;
  billing_address: string;
};
function OfferingEditor({
  types,
  offering,
  busy,
  save,
}: {
  types: BusinessType[];
  offering?: Offering;
  busy: boolean;
  save: (value: Omit<Offering, "id">) => Promise<void>;
}) {
  const [kind, setKind] = useState(offering?.kind ?? "plan");
  const [message, setMessage] = useState("");
  return (
    <form
      className="panel stack"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          const price = cents(String(f.get("price")));
          setMessage("");
          void save({
            name: String(f.get("name")).trim(),
            description: String(f.get("description")),
            kind,
            business_type_id: String(f.get("business_type")) || null,
            price_cents: price,
            billing_interval: String(
              f.get("interval"),
            ) as Offering["billing_interval"],
            active: f.get("active") === "on",
          });
        } catch {
          setMessage(
            "Enter a valid price, with no more than two decimal places.",
          );
        }
      }}
    >
      <h2>{offering ? "Edit offering" : "Add an offering"}</h2>
      <label>
        Offering type
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as Offering["kind"])}
        >
          <option value="plan">Subscription plan</option>
          <option value="addon">Optional extra</option>
        </select>
      </label>
      <label>
        Business type
        <select
          name="business_type"
          required={kind === "plan"}
          defaultValue={offering?.business_type_id ?? ""}
        >
          <option value="">
            {kind === "addon" ? "All business types" : "Choose a business type"}
          </option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {!t.active ? " (unavailable)" : ""}
            </option>
          ))}
        </select>
      </label>
      <label>
        Name
        <input
          name="name"
          required
          maxLength={100}
          defaultValue={offering?.name}
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          maxLength={1000}
          defaultValue={offering?.description}
        />
      </label>
      <div className="form-grid">
        <label>
          Price (USD)
          <input
            name="price"
            required
            inputMode="decimal"
            defaultValue={
              offering ? (offering.price_cents / 100).toFixed(2) : ""
            }
          />
        </label>
        <label>
          Billing frequency
          <select
            name="interval"
            defaultValue={offering?.billing_interval ?? "month"}
          >
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
        </label>
      </div>
      <label>
        <input
          name="active"
          type="checkbox"
          defaultChecked={offering?.active ?? true}
        />
        Available for new subscriptions
      </label>
      <p>
        Changes affect new selections. Existing subscriptions retain their
        agreed names and prices.
      </p>
      <button disabled={busy}>{busy ? "Saving…" : "Save offering"}</button>
      <p role="status">{message}</p>
    </form>
  );
}
export function TalixAdmin() {
  const [types, setTypes] = useState<BusinessType[]>([]),
    [offerings, setOfferings] = useState<Offering[]>([]),
    [clients, setClients] = useState<Client[]>([]),
    [purchases, setPurchases] = useState<Purchase[]>([]),
    [tab, setTab] = useState("catalog"),
    [editing, setEditing] = useState<Offering | undefined>(),
    [editingType, setEditingType] = useState<BusinessType | undefined>(),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [message, setMessage] = useState("");
  const load = useCallback(async () => {
    const db = browserClient();
    const [t, o, c, p] = await Promise.all([
      db.from("business_types").select("*").order("name"),
      db.from("talix_offerings").select("*").order("name"),
      db
        .from("clients")
        .select(
          "id,business_name,contact_name,contact_email,phone,billing_address",
        )
        .order("business_name"),
      db
        .from("subscription_purchases")
        .select(
          "subscription_id,client_id,selection,business_details,total_cents,billing_interval,billing_status,created_at",
        )
        .order("created_at", { ascending: false }),
    ]);
    if (t.error || o.error || c.error || p.error)
      throw new Error("Unable to load Talix admin. Please try again.");
    setTypes(t.data);
    setOfferings(o.data);
    setClients(c.data);
    setPurchases(p.data);
  }, []);
  useEffect(() => {
    void Promise.resolve()
      .then(load)
      .catch(() => setMessage("Unable to load Talix admin. Please try again."))
      .finally(() => setLoading(false));
  }, [load]);
  async function save(
    table: "talix_offerings" | "business_types",
    id: string | undefined,
    value: Record<string, unknown>,
  ) {
    setBusy(true);
    setMessage("");
    try {
      const query = browserClient().from(table);
      const { error, data } = await (id
        ? query.update(value).eq("id", id).select("id")
        : query.insert(value).select("id"));
      if (error || !data?.length) throw new Error();
      await load();
      setEditing(undefined);
      setEditingType(undefined);
      setMessage("Changes saved.");
    } catch {
      setMessage(
        "The changes couldn’t be saved. Please check the details and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="workspace">
      <div className="row">
        <div>
          <p className="eyebrow">TALIX ADMIN</p>
          <h1>Your offerings and customers.</h1>
        </div>
        <a href="/workspace">Business workspace</a>
      </div>
      <p className="notice">
        Sample pricing. Subscription payments are not being collected.
      </p>
      <nav className="tabs" aria-label="Talix admin sections">
        <button
          className={tab === "catalog" ? "active" : ""}
          onClick={() => {
            setTab("catalog");
            void load().catch(() =>
              setMessage("Unable to refresh. Please try again."),
            );
          }}
        >
          Offerings
        </button>
        <button
          className={tab === "customers" ? "active" : ""}
          onClick={() => {
            setTab("customers");
            void load().catch(() =>
              setMessage("Unable to refresh. Please try again."),
            );
          }}
        >
          Customers
        </button>
      </nav>
      <p role="status">{message}</p>
      {loading ? (
        <p>Loading…</p>
      ) : tab === "catalog" ? (
        <>
          <div className="workspace-grid">
            <section className="panel stack">
              <div className="row">
                <h2>Business types</h2>
                <button
                  className="secondary small"
                  disabled={busy}
                  onClick={() => setEditingType(undefined)}
                >
                  Add business type
                </button>
              </div>
              {types.map((t) => (
                <div className="row" key={t.id}>
                  <span>
                    {t.name}
                    <small> · {t.active ? "Available" : "Unavailable"}</small>
                  </span>
                  <button
                    disabled={busy}
                    className="secondary small"
                    onClick={() => setEditingType(t)}
                  >
                    Edit {t.name}
                  </button>
                </div>
              ))}
              <form
                className="stack"
                key={editingType?.id ?? "new-type"}
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void save("business_types", editingType?.id, {
                    name: String(f.get("name")).trim(),
                    description: String(f.get("description")),
                    active: f.get("active") === "on",
                  });
                }}
              >
                <h3>
                  {editingType ? "Edit business type" : "New business type"}
                </h3>
                <label>
                  Name
                  <input
                    name="name"
                    required
                    maxLength={100}
                    defaultValue={editingType?.name}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    name="description"
                    maxLength={1000}
                    defaultValue={editingType?.description}
                  />
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={editingType?.active ?? true}
                  />
                  Available for new subscriptions
                </label>
                <button disabled={busy}>Save business type</button>
              </form>
            </section>
            <OfferingEditor
              key={editing?.id ?? "new-offering"}
              types={types}
              offering={editing}
              busy={busy}
              save={(v) => save("talix_offerings", editing?.id, v)}
            />
          </div>
          <section className="panel" style={{ marginTop: 24 }}>
            <div className="row">
              <h2>Talix products and plans</h2>
              <button
                disabled={busy}
                className="secondary"
                onClick={() => setEditing(undefined)}
              >
                Add offering
              </button>
            </div>
            <div className="catalog">
              {offerings.map((o) => (
                <article className="list-item" key={o.id}>
                  <span className="badge">
                    {o.kind === "plan" ? "Plan" : "Extra"} ·{" "}
                    {o.active ? "Available" : "Unavailable"}
                  </span>
                  <h3>{o.name}</h3>
                  <p>
                    {types.find((t) => t.id === o.business_type_id)?.name ??
                      "All business types"}
                  </p>
                  <p>{o.description}</p>
                  <p>
                    <strong>
                      {money(o.price_cents)} / {o.billing_interval}
                    </strong>
                  </p>
                  <button
                    className="secondary small"
                    disabled={busy}
                    onClick={() => {
                      setEditing(o);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Edit {o.name}
                  </button>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="panel stack">
          <h2>Customer accounts</h2>
          {!clients.length && <p>No business accounts yet.</p>}
          {clients.map((c) => (
            <article className="list-item" key={c.id}>
              <h3>{c.business_name}</h3>
              <p>
                {c.contact_name} · {c.contact_email}
                <br />
                {c.phone}
                <br />
                {c.billing_address}
              </p>
              {purchases
                .filter((p) => p.client_id === c.id)
                .map((p) => (
                  <div className="cart-line" key={p.subscription_id}>
                    <strong>{p.business_details.business_name}</strong> ·{" "}
                    {p.selection.business_type.name}
                    <p>
                      {p.selection.items.map((i) => i.name).join(", ")}
                      <br />
                      {money(p.total_cents)} / {p.billing_interval} · Preview
                      subscription · No payment collected
                      <br />
                      Joined{" "}
                      {new Date(p.created_at).toLocaleDateString("en-US")}
                    </p>
                  </div>
                ))}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
