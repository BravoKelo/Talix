"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SubscriptionSummary } from "./subscription-summary";
import { LocationForm, ProductEditor } from "./product-editor";
import { browserClient } from "@/lib/supabase/client";
import {
  cents,
  money,
  type Subscription,
  type Location,
  type Product,
  type Order,
} from "@/lib/types";
type Membership = { subscription_id: string; role: string };
type Event = {
  id: string;
  kind: string;
  amount_cents: number;
  reason: string;
  created_at: string;
};
export function Workspace({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [adminAccess, setAdminAccess] = useState(false);
  useEffect(() => {
    void browserClient()
      .rpc("talix_admin_access")
      .then(({ data }) => setAdminAccess(data === true));
  }, []);
  const [subs, setSubs] = useState<Subscription[]>([]),
    [members, setMembers] = useState<Membership[]>([]),
    [sid, setSid] = useState(""),
    [locations, setLocations] = useState<Location[]>([]),
    [lid, setLid] = useState(""),
    [products, setProducts] = useState<Product[]>([]),
    [orders, setOrders] = useState<Order[]>([]),
    [events, setEvents] = useState<Event[]>([]),
    [selected, setSelected] = useState(""),
    [tab, setTab] = useState("orders"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [role, setRole] = useState("viewer");
  const refundRequests = useRef<Record<string, string>>({});
  const router = useRouter();
  const owner = members.some(
    (m) => m.subscription_id === sid && m.role === "owner",
  );
  const sub = subs.find((s) => s.id === sid);
  const location = locations.find((l) => l.id === lid);
  const loadSubscriptions = useCallback(async () => {
    const db = browserClient();
    const [s, m] = await Promise.all([
      db.from("subscriptions").select("*").order("name"),
      db
        .from("memberships")
        .select("subscription_id,role")
        .eq("user_id", userId),
    ]);
    if (s.error) throw s.error;
    if (m.error) throw m.error;
    setSubs(s.data);
    setMembers(m.data);
    setSid((old) => old || s.data[0]?.id || "");
  }, [userId]);
  useEffect(() => {
    void Promise.resolve()
      .then(loadSubscriptions)
      .catch(() => setMessage("Unable to load workspace."));
  }, [loadSubscriptions]);
  useEffect(() => {
    let alive = true;
    if (!sid) return;
    async function load() {
      const db = browserClient();
      const [l, p] = await Promise.all([
        db
          .from("locations")
          .select("*")
          .eq("subscription_id", sid)
          .order("name"),
        db
          .from("products")
          .select("*")
          .eq("subscription_id", sid)
          .order("name"),
      ]);
      if (l.error || p.error) {
        setMessage("Unable to load business data.");
        return;
      }
      if (alive) {
        setLocations(l.data);
        setProducts(p.data);
        setLid(l.data[0]?.id || "");
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [sid]);
  async function loadOrders() {
    if (!lid) return;
    const { data, error } = await browserClient()
      .from("orders")
      .select(
        "id,location_id,subscription_id,total_cents,payment_status,refunded_cents,status,customer_name,email,phone,items,created_at",
      )
      .eq("location_id", lid)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    setOrders(data);
  }
  useEffect(() => {
    let alive = true;
    if (!lid) return;
    async function load() {
      const db = browserClient();
      const [o, a] = await Promise.all([
        db
          .from("orders")
          .select(
            "id,location_id,subscription_id,total_cents,payment_status,refunded_cents,status,customer_name,email,phone,items,created_at",
          )
          .eq("location_id", lid)
          .order("created_at", { ascending: false })
          .limit(100),
        db
          .from("location_access")
          .select("role")
          .eq("location_id", lid)
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      if (alive) {
        if (o.error) setMessage("Unable to load orders.");
        else setOrders(o.data);
        setRole(a.data?.role || "viewer");
      }
    }
    void load();
    const timer = setInterval(() => void load(), 10000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [lid, userId]);
  useEffect(() => {
    if (!selected) {
      return;
    }
    let alive = true;
    void browserClient()
      .from("payment_events")
      .select("*")
      .eq("order_id", selected)
      .order("created_at")
      .then(({ data, error }) => {
        if (alive) {
          if (error) setMessage("Unable to load payment history.");
          else setEvents(data);
        }
      });
    return () => {
      alive = false;
    };
  }, [selected, orders]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      setMessage("Saved.");
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : (e as { message?: string })?.message || "Unable to save.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function rpc(name: string, args: Record<string, unknown>) {
    const { error } = await browserClient().rpc(name, args);
    if (error) throw error;
  }
  const order = orders.find((o) => o.id === selected);
  const active = orders.filter(
    (o) =>
      ["paid", "partially_refunded"].includes(o.payment_status) &&
      o.status !== "completed" &&
      o.status !== "cancelled",
  );
  const createForm = (
    <section className="panel">
      <h2>Add a subscription</h2>
      <p>Choose a business type, plan and extras for your next business.</p>
      <Link className="button" href="/onboarding?new=1">
        Choose a plan →
      </Link>
    </section>
  );
  return (
    <main className="workspace">
      <div className="row">
        <div>
          <p className="eyebrow">BUSINESS WORKSPACE</p>
          <h1>{sub?.name || "Your businesses"}</h1>
          <p className="muted">{email}</p>
          {adminAccess && <Link href="/admin">Talix admin</Link>}
        </div>
        <button
          className="secondary"
          onClick={() =>
            void browserClient()
              .auth.signOut()
              .then(() => router.replace("/login"))
          }
        >
          Sign out
        </button>
      </div>
      <p role="status">{message}</p>
      {!subs.length ? (
        createForm
      ) : (
        <>
          <div className="selectors">
            <label>
              Subscription
              <select
                value={sid}
                disabled={busy}
                onChange={(e) => {
                  setSid(e.target.value);
                  setLid("");
                  setLocations([]);
                  setProducts([]);
                  setOrders([]);
                  setEvents([]);
                  setTab("orders");
                  setSelected("");
                }}
              >
                {subs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Location
              <select
                value={lid}
                disabled={busy}
                onChange={(e) => {
                  setLid(e.target.value);
                  setOrders([]);
                  setSelected("");
                  setEvents([]);
                  setRole("viewer");
                }}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            {sub && (
              <a href={`/shop/${sub.slug}`} target="_blank" rel="noreferrer">
                Open storefront ↗
              </a>
            )}
          </div>
          <nav className="tabs" aria-label="Workspace sections">
            {[
              "orders",
              "products",
              ...(owner ? ["settings", "access"] : []),
            ].map((t) => (
              <button
                key={t}
                className={tab === t ? "active" : "secondary"}
                onClick={() => setTab(t)}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </nav>
          {tab === "orders" && (
            <div className="workspace-grid">
              <section className="panel">
                <div className="row">
                  <h2>Orders</h2>
                  <button
                    className="secondary small"
                    disabled={busy}
                    onClick={() => void run(loadOrders)}
                  >
                    Refresh
                  </button>
                </div>
                <p className="muted">
                  {active.length} active · Latest 100 orders at this location
                </p>
                {!orders.length ? (
                  <div className="empty">No orders yet.</div>
                ) : (
                  orders.map((o) => (
                    <button
                      className="order-row secondary"
                      key={o.id}
                      onClick={() => setSelected(o.id)}
                    >
                      <span>
                        <strong>{o.customer_name}</strong>
                        <small>{new Date(o.created_at).toLocaleString()}</small>
                      </span>
                      <span>
                        {money(o.total_cents)}
                        <small>
                          {o.status.replace("_", " ")} ·{" "}
                          {o.payment_status.replace("_", " ")}
                        </small>
                      </span>
                    </button>
                  ))
                )}
              </section>
              <section className="panel">
                {!order ? (
                  <div className="empty">
                    Select an order to view its details.
                  </div>
                ) : (
                  <>
                    <h2>{order.customer_name}</h2>
                    <p>
                      {order.email}
                      <br />
                      {order.phone}
                    </p>
                    <p className="muted">Order {order.id}</p>
                    {order.items.map((i, n) => (
                      <div className="cart-line" key={n}>
                        <strong>
                          {i.name} × {i.quantity}
                        </strong>
                        <p>
                          {i.options.map((o) => o.name).join(", ")} ·{" "}
                          {money(i.unit_cents * i.quantity)}
                        </p>
                      </div>
                    ))}
                    <p>
                      <strong>Total {money(order.total_cents)}</strong> ·
                      Refunded {money(order.refunded_cents)}
                    </p>
                    {(owner || role === "fulfillment") &&
                      ["paid", "partially_refunded"].includes(
                        order.payment_status,
                      ) &&
                      ["received", "in_progress", "ready"].includes(
                        order.status,
                      ) && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await rpc("advance_order", {
                                p_order: order.id,
                                p_status: (
                                  {
                                    received: "in_progress",
                                    in_progress: "ready",
                                    ready: "completed",
                                  } as Record<string, string>
                                )[order.status],
                              });
                              await loadOrders();
                            })
                          }
                        >
                          Mark{" "}
                          {
                            (
                              {
                                received: "in progress",
                                in_progress: "ready",
                                ready: "completed",
                              } as Record<string, string>
                            )[order.status]
                          }
                        </button>
                      )}
                    {owner &&
                      ["paid", "partially_refunded"].includes(
                        order.payment_status,
                      ) && (
                        <form
                          className="stack"
                          key={`${order.id}-${order.refunded_cents}`}
                          style={{ marginTop: 24 }}
                          onSubmit={(e) => {
                            e.preventDefault();
                            const f = new FormData(e.currentTarget);
                            const signature = JSON.stringify([
                              order.id,
                              f.get("amount"),
                              f.get("reason"),
                            ]);
                            const request =
                              refundRequests.current[signature] ??
                              crypto.randomUUID();
                            refundRequests.current[signature] = request;
                            void run(async () => {
                              await rpc("refund_simulated", {
                                p_order: order.id,
                                p_request: request,
                                p_amount: cents(String(f.get("amount"))),
                                p_reason: f.get("reason"),
                              });
                              delete refundRequests.current[signature];
                              await loadOrders();
                            });
                          }}
                        >
                          <h3>Simulated refund</h3>
                          <label>
                            Amount (USD)
                            <input
                              name="amount"
                              inputMode="decimal"
                              defaultValue={(
                                (order.total_cents - order.refunded_cents) /
                                100
                              ).toFixed(2)}
                              required
                            />
                          </label>
                          <label>
                            Reason
                            <input name="reason" required maxLength={500} />
                          </label>
                          <button className="secondary" disabled={busy}>
                            Record simulated refund
                          </button>
                        </form>
                      )}
                    <h3>Payment history</h3>
                    {events.map((e) => (
                      <p key={e.id}>
                        {e.kind} · {money(e.amount_cents)}{" "}
                        {e.reason && `— ${e.reason}`}
                        <br />
                        <small>{new Date(e.created_at).toLocaleString()}</small>
                      </p>
                    ))}
                  </>
                )}
              </section>
            </div>
          )}
          {tab === "products" && (
            <section>
              <div className="row">
                <h2>Products</h2>
              </div>
              {owner && (
                <ProductEditor
                  sid={sid}
                  locations={locations}
                  busy={busy}
                  save={(p) =>
                    run(async () => {
                      const { error } = await browserClient()
                        .from("products")
                        .insert(p);
                      if (error) throw error;
                      const { data } = await browserClient()
                        .from("products")
                        .select("*")
                        .eq("subscription_id", sid)
                        .order("name");
                      setProducts(data || []);
                    })
                  }
                />
              )}
              <div className="catalog" style={{ marginTop: 24 }}>
                {products
                  .filter((p) => !p.location_id || p.location_id === lid)
                  .map((p) => (
                    <article className="panel" key={p.id}>
                      <h3>{p.name}</h3>
                      <p>{p.description}</p>
                      <p>
                        {money(p.price_cents)} ·{" "}
                        {p.location_id ? "Location specific" : "General"} ·{" "}
                        {p.available ? "Available" : "Hidden"}
                      </p>
                      {owner && (
                        <>
                          <button
                            className="small secondary"
                            disabled={busy}
                            onClick={() =>
                              void run(async () => {
                                const { error } = await browserClient()
                                  .from("products")
                                  .update({ available: !p.available })
                                  .eq("id", p.id);
                                if (error) throw error;
                                setProducts(
                                  products.map((x) =>
                                    x.id === p.id
                                      ? { ...x, available: !x.available }
                                      : x,
                                  ),
                                );
                              })
                            }
                          >
                            {p.available ? "Hide" : "Make available"}
                          </button>
                          <ProductEditor
                            key={p.id}
                            sid={sid}
                            locations={locations}
                            product={p}
                            busy={busy}
                            save={(v) =>
                              run(async () => {
                                const { subscription_id: ignored, ...updates } =
                                  v;
                                void ignored;
                                const { error } = await browserClient()
                                  .from("products")
                                  .update(updates)
                                  .eq("id", p.id);
                                if (error) throw error;
                                setProducts(
                                  products.map((x) =>
                                    x.id === p.id ? { ...x, ...v } : x,
                                  ),
                                );
                              })
                            }
                          />
                        </>
                      )}
                    </article>
                  ))}
              </div>
            </section>
          )}
          {tab === "settings" && owner && sub && (
            <div>
              <SubscriptionSummary key={sid} id={sid} />
              <div className="workspace-grid">
                <section className="panel">
                  <details>
                    <summary>Add another subscription</summary>
                    {createForm}
                  </details>
                  <h2>Branding</h2>
                  <form
                    className="stack"
                    key={sub.id}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      void run(async () => {
                        const v = {
                          name: String(f.get("name")),
                          description: String(f.get("description")),
                          accent: String(f.get("accent")),
                        };
                        const { error } = await browserClient()
                          .from("subscriptions")
                          .update(v)
                          .eq("id", sid);
                        if (error) throw error;
                        setSubs(
                          subs.map((s) => (s.id === sid ? { ...s, ...v } : s)),
                        );
                      });
                    }}
                  >
                    <label>
                      Business name
                      <input
                        name="name"
                        defaultValue={sub.name}
                        required
                        maxLength={100}
                      />
                    </label>
                    <label>
                      Introduction
                      <textarea
                        name="description"
                        defaultValue={sub.description}
                        maxLength={1000}
                      />
                    </label>
                    <label>
                      Brand color
                      <input
                        type="color"
                        name="accent"
                        defaultValue={sub.accent}
                      />
                    </label>
                    <button disabled={busy}>Save branding</button>
                  </form>
                </section>
                <section className="panel">
                  <h2>{location ? "Location settings" : "Create location"}</h2>
                  {location && (
                    <LocationForm
                      key={location.id}
                      location={location}
                      busy={busy}
                      save={(v) =>
                        run(async () => {
                          const { error } = await browserClient()
                            .from("locations")
                            .update(v)
                            .eq("id", lid);
                          if (error) throw error;
                          setLocations(
                            locations.map((l) =>
                              l.id === lid ? { ...l, ...v } : l,
                            ),
                          );
                        })
                      }
                    />
                  )}
                  <h3>Add a location</h3>
                  <form
                    className="stack"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      void run(async () => {
                        const { data, error } = await browserClient()
                          .from("locations")
                          .insert({
                            subscription_id: sid,
                            name: String(f.get("name")),
                          })
                          .select()
                          .single();
                        if (error) throw error;
                        setLocations([...locations, data]);
                        setLid(data.id);
                      });
                    }}
                  >
                    <label>
                      Name
                      <input name="name" required maxLength={100} />
                    </label>
                    <button disabled={busy}>Add location</button>
                  </form>
                </section>
              </div>
            </div>
          )}
          {tab === "access" && owner && (
            <section className="panel">
              <h2>Employee location access</h2>
              <p>
                Team members need a Talix account before you grant access.
                Choose access separately for each location. Viewer reads orders
                and products; fulfillment also advances orders. Owners manage
                settings, products, access and refunds.
              </p>
              <form
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void run(() =>
                    rpc("grant_location_access", {
                      p_location: lid,
                      p_email: f.get("email"),
                      p_role: f.get("role"),
                    }),
                  );
                }}
              >
                <label>
                  Employee email
                  <input name="email" type="email" required />
                </label>
                <label>
                  Access at {location?.name}
                  <select name="role">
                    <option value="fulfillment">Fulfillment</option>
                    <option value="viewer">Viewer</option>
                    <option value="none">Remove location access</option>
                  </select>
                </label>
                <button disabled={busy || !lid}>Save access</button>
              </form>
            </section>
          )}
        </>
      )}
    </main>
  );
}
