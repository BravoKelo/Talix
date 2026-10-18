"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ResponsiveNavigation } from "@/components/responsive-navigation";

import { deleteStoredImage, type ImageBucket } from "@/lib/image-draft";
import { AppearanceEditor } from "./appearance-editor";
import { OrderDialog } from "./order-dialog";
import { Users } from "./users";
import { type Permission } from "@/lib/permissions";
import { SubscriptionSummary } from "./subscription-summary";
import { LocationForm, ProductEditor } from "./product-editor";
import { browserClient } from "@/lib/supabase/client";
import {
  cents,
  money,
  orderReference,
  type Subscription,
  type Location,
  type Product,
  type Order,
} from "@/lib/types";
const orderColumns =
  "id,location_id,subscription_id,total_cents,payment_status,refunded_cents,status,customer_name,email,phone,items,created_at";
async function readOrders(locationId: string) {
  const query = (columns: string) =>
    browserClient()
      .from("orders")
      .select(columns)
      .eq("location_id", locationId)
      .order("created_at", { ascending: false })
      .limit(100);
  let result = await query(`${orderColumns},order_number`);
  if (result.error?.code === "42703" || result.error?.code === "PGRST204")
    result = await query(orderColumns);
  return {
    data: result.data as unknown as Order[] | null,
    error: result.error,
  };
}
const plannedFeatures = [
  {
    id: "customers",
    label: "Customers & CRM",
    description: "Customer relationships and history across your business.",
  },
  {
    id: "inventory",
    label: "Inventory",
    description: "Materials, finished products and inventory adjustments.",
  },
  {
    id: "materials",
    label: "Materials & BOM",
    description: "Materials used to make each product and their costs.",
  },
  {
    id: "reports",
    label: "Reports & finances",
    description: "Business performance, costs and financial tracking.",
  },
  {
    id: "employees",
    label: "Scheduling & time",
    description: "Staff schedules, time tracking and payroll exports.",
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Campaigns and promotions for your customers.",
  },
  {
    id: "communications",
    label: "Communications",
    description: "Business messages, email and text updates.",
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Connect the other tools your business uses.",
  },
  {
    id: "website",
    label: "Website builder",
    description: "Tools to create and manage your business website.",
  },
  {
    id: "industry",
    label: "Industry tools",
    description: "Business-specific ordering and fulfillment workflows.",
  },
  {
    id: "support",
    label: "Support & training",
    description: "Help, guides and learning resources.",
  },
];
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
  const [settingsArea, setSettingsArea] = useState("");
  const [productEditor, setProductEditor] = useState<Product | "new" | null>(
    null,
  );
  const [imageCleanup, setImageCleanup] = useState<
    { url: string; bucket: ImageBucket; sid: string }[]
  >([]);
  const [cleanupBusy, setCleanupBusy] = useState(false);
  async function cleanupImage(url: string, bucket: ImageBucket, scope: string) {
    try {
      await deleteStoredImage(url, bucket, scope);
    } catch {
      setImageCleanup((previous) =>
        previous.some((x) => x.url === url)
          ? previous
          : [...previous, { url, bucket, sid: scope }],
      );
    }
  }
  const [settingsSearch, setSettingsSearch] = useState("");
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
    [, setRole] = useState("viewer");
  const [permissionScope, setPermissionScope] = useState<{
    sid: string;
    lid: string;
    local: Permission[];
    shared: Permission[];
  }>({ sid: "", lid: "", local: [], shared: [] });
  const can = (p: Permission) =>
    owner ||
    (permissionScope.sid === sid &&
      permissionScope.lid === lid &&
      permissionScope.local.includes(p));
  const shared = (p: Permission) =>
    owner ||
    (permissionScope.sid === sid && permissionScope.shared.includes(p));
  const refundRequests = useRef<Record<string, string>>({});
  const owner = members.some(
    (m) => m.subscription_id === sid && m.role === "owner",
  );
  useEffect(() => {
    let alive = true;
    if (!sid) return;
    const refresh = () =>
      Promise.all([
        browserClient().rpc("workspace_permissions", {
          p_subscription: sid,
          p_location: lid || null,
        }),
        browserClient().rpc("workspace_permissions", { p_subscription: sid }),
      ]).then(([local, global]) => {
        if (alive) {
          setPermissionScope({
            sid,
            lid,
            local: local.data ?? [],
            shared: global.data ?? [],
          });
        }
      });
    void refresh();
    const timer = setInterval(() => void refresh(), 10000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [sid, lid]);
  useEffect(() => {
    const { data } = browserClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT")
        setTimeout(() => window.location.replace("/login"), 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);
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
  }, [userId, setSubs, setMembers, setSid]);
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
    const { data, error } = await readOrders(lid);
    if (error) throw error;
    setOrders(data ?? []);
  }
  useEffect(() => {
    let alive = true;
    if (!lid) return;
    async function load() {
      const db = browserClient();
      const [o, a] = await Promise.all([
        readOrders(lid),
        db
          .from("location_access")
          .select("role")
          .eq("location_id", lid)
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      if (alive) {
        if (o.error) setMessage("Unable to load orders.");
        else setOrders(o.data ?? []);
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
  const sections = [
    ...(can("orders.view") ? ["orders"] : []),
    ...(can("products.view") ? ["products"] : []),
    ...(shared("settings.view") || can("settings.view") ? ["settings"] : []),
    ...(shared("users.view") ? ["users"] : []),
  ];
  const settingTiles = [
    ...(shared("settings.view")
      ? [
          {
            id: "appearance",
            title: "Storefront appearance",
            description: "Business logo, name, introduction and color",
            icon: "◈",
            available: true,
          },
        ]
      : []),
    ...(can("settings.view")
      ? [
          {
            id: "location",
            title: "Locations & ordering",
            description: "Location details, hours and online availability",
            icon: "⌖",
            available: true,
          },
        ]
      : []),
    ...(owner
      ? [
          {
            id: "subscription",
            title: "Your subscription",
            description: "Current plan, products and subscription details",
            icon: "◇",
            available: true,
          },
        ]
      : []),
    ...(shared("users.view")
      ? [
          {
            id: "users",
            title: "Users & permissions",
            description: "Team access, users and custom roles",
            icon: "◎",
            available: true,
          },
        ]
      : []),
    ...plannedFeatures.map((f) => ({
      id: f.id,
      title: f.label,
      description: f.description,
      icon: "○",
      available: false,
    })),
    {
      id: "security",
      title: "Account security",
      description: "Password recovery and additional account protection",
      icon: "◇",
      available: false,
    },
  ].filter((f) =>
    `${f.title} ${f.description}`
      .toLowerCase()
      .includes(settingsSearch.trim().toLowerCase()),
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
      <header
        className="workspace-header"
        aria-label="Business workspace header"
      >
        <Link href="/" className="wordmark">
          talix<span>•</span>
        </Link>
        <nav className="workspace-shortcuts" aria-label="Workspace shortcuts">
          {sections.map((section) => (
            <button
              key={section}
              type="button"
              className={tab === section ? "active" : "secondary"}
              onClick={() => {
                setTab(section);
                setSettingsArea("");
                setSelected("");
              }}
            >
              {section[0].toUpperCase() + section.slice(1)}
            </button>
          ))}
          {sub && (
            <a
              className="button secondary"
              href={`/shop/${sub.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              Open storefront ↗
            </a>
          )}
          {members.some((m) => m.role === "owner") && (
            <Link className="button secondary" href="/onboarding?new=1">
              Add subscription
            </Link>
          )}
          {adminAccess && (
            <Link className="button secondary" href="/admin">
              Talix admin
            </Link>
          )}
        </nav>
        <div className="workspace-context">
          {" "}
          <label>
            Subscription
            <select
              aria-label="Subscription"
              value={sid}
              disabled={busy || !subs.length}
              onChange={(e) => {
                setSid(e.target.value);
                setLid("");
                setLocations([]);
                setProducts([]);
                setOrders([]);
                setEvents([]);
                setTab("orders");
                setSettingsArea("");
                setSettingsSearch("");
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
              aria-label="Location"
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
        </div>
        <div className="workspace-account">
          <span>{email}</span>{" "}
          <button
            className="secondary"
            onClick={() =>
              void browserClient()
                .auth.signOut()
                .then(({ error }) => {
                  if (error) {
                    setMessage("We couldn’t sign you out. Please try again.");
                    return;
                  }
                  window.location.replace("/login");
                })
            }
          >
            Sign out
          </button>
        </div>
      </header>
      <div className="workspace-heading">
        <p className="eyebrow">BUSINESS WORKSPACE</p>
        <h1>{sub?.name || "Your businesses"}</h1>
      </div>
      {message && !selected && <p role="alert">{message}</p>}
      {imageCleanup.length > 0 && (
        <section className="notice" aria-label="Image deletion needs attention">
          <p>
            Your changes were saved, but {imageCleanup.length} previous image(s)
            could not be deleted. Images still used elsewhere are kept.
          </p>
          <button
            className="secondary"
            disabled={cleanupBusy}
            onClick={async () => {
              setCleanupBusy(true);
              const remaining = [];
              for (const item of imageCleanup) {
                try {
                  await deleteStoredImage(item.url, item.bucket, item.sid);
                } catch {
                  remaining.push(item);
                }
              }
              setImageCleanup(remaining);
              setCleanupBusy(false);
            }}
          >
            Retry image deletion
          </button>
        </section>
      )}
      {!subs.length ? (
        createForm
      ) : (
        <>
          <ResponsiveNavigation label="Workspace menu">
            {" "}
            <nav className="tabs" aria-label="Workspace sections">
              <div className="sidebar-brand">
                {sub?.logo_url ? (
                  <Image
                    width={150}
                    height={84}
                    unoptimized
                    src={sub.logo_url}
                    alt={`${sub.name} logo`}
                    className="business-logo"
                  />
                ) : (
                  <span className="business-initial" aria-hidden="true">
                    {sub?.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <strong>{sub?.name}</strong>
                <small>BUSINESS WORKSPACE</small>
              </div>
              <p className="sidebar-group">MANAGE YOUR BUSINESS</p>
              {sections.map((t) => (
                <button
                  key={t}
                  className={tab === t ? "active" : "secondary"}
                  aria-current={tab === t ? "page" : undefined}
                  onClick={() => {
                    setTab(t);
                    setSelected("");
                    setSettingsArea("");
                  }}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
              <div className="sidebar-future">
                <p className="sidebar-group">GROW & CONNECT</p>
                {plannedFeatures.map((feature) => (
                  <button
                    key={feature.id}
                    type="button"
                    className={tab === feature.id ? "active" : "secondary"}
                    onClick={() => {
                      setTab(feature.id);
                      setSelected("");
                    }}
                  >
                    <span>{feature.label}</span>
                    <small>Feature coming soon</small>
                  </button>
                ))}
              </div>
            </nav>
          </ResponsiveNavigation>
          {tab === "orders" && can("orders.view") && (
            <div className="orders-ledger">
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
                  <div className="table-scroll">
                    <table className="order-ledger-table">
                      <caption>Orders at this location</caption>
                      <thead>
                        <tr>
                          <th>Order number</th>
                          <th>Date / time</th>
                          <th>Customer</th>
                          <th>Fulfillment</th>
                          <th>Payment</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.id} onClick={() => setSelected(o.id)}>
                            <td>
                              <button
                                className="secondary ledger-open"
                                onClick={() => setSelected(o.id)}
                                aria-label={`Open order ${orderReference(o)} for ${o.customer_name}`}
                              >
                                {orderReference(o)}
                              </button>
                            </td>
                            <td>{new Date(o.created_at).toLocaleString()}</td>
                            <td>{o.customer_name}</td>
                            <td>{o.status.replaceAll("_", " ")}</td>
                            <td>{o.payment_status.replaceAll("_", " ")}</td>
                            <td>{money(o.total_cents)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              {order && (
                <OrderDialog close={() => setSelected("")}>
                  <p role="status">{message}</p>
                  <>
                    <h2>{order.customer_name}</h2>
                    <p>
                      {order.email}
                      <br />
                      {order.phone}
                    </p>
                    <p className="muted">Order {orderReference(order)}</p>
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
                    {can("orders.fulfill") &&
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
                    {can("orders.fulfill") &&
                      ["paid", "partially_refunded"].includes(
                        order.payment_status,
                      ) &&
                      ["received", "in_progress", "ready"].includes(
                        order.status,
                      ) && (
                        <details className="cancel-order">
                          <summary>Cancel order</summary>
                          <p>
                            Stop fulfillment of this order? This cannot be
                            undone. Payment is unchanged; record a separate
                            refund if needed.
                          </p>
                          {order.order_number ? (
                            <button
                              className="danger"
                              disabled={busy}
                              onClick={() =>
                                void run(async () => {
                                  await rpc("advance_order", {
                                    p_order: order.id,
                                    p_status: "cancelled",
                                  });
                                  await loadOrders();
                                })
                              }
                            >
                              Confirm cancellation
                            </button>
                          ) : (
                            <p>Order cancellation will be available shortly.</p>
                          )}
                        </details>
                      )}
                    {order.status === "cancelled" && (
                      <p role="status">
                        Order cancelled. Payment is unchanged; any refund is
                        recorded separately.
                      </p>
                    )}
                    {can("orders.refund") &&
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
                </OrderDialog>
              )}
            </div>
          )}
          {tab === "products" && can("products.view") && (
            <section>
              <div className="row">
                <h2>Products</h2>
                {can("products.manage") && (
                  <button
                    data-primary-list-action
                    onClick={() => setProductEditor("new")}
                  >
                    Add product
                  </button>
                )}
              </div>
              <div className="workspace-products">
                {products
                  .filter((p) => !p.location_id || p.location_id === lid)
                  .map((p) => (
                    <article className="panel product-tile" key={p.id}>
                      <h3>{p.name}</h3>
                      <p className="product-description">{p.description}</p>
                      <p>
                        {money(p.price_cents)} ·{" "}
                        {p.location_id ? "Location specific" : "General"} ·{" "}
                        {p.available ? "Available" : "Hidden"}
                      </p>
                      {can("products.manage") &&
                        (p.location_id !== null ||
                          shared("products.manage")) && (
                          <div className="product-tile-actions">
                            <button
                              className="secondary"
                              disabled={busy}
                              onClick={() =>
                                void run(async () => {
                                  const { error } = await browserClient()
                                    .from("products")
                                    .update({ available: !p.available })
                                    .eq("id", p.id);
                                  if (error) throw error;
                                  setProducts((previous) =>
                                    previous.map((x) =>
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
                            <button
                              className="secondary"
                              onClick={() => setProductEditor(p)}
                              aria-label={`Edit ${p.name}`}
                            >
                              Edit product
                            </button>
                          </div>
                        )}
                    </article>
                  ))}
              </div>
              {productEditor && can("products.manage") && (
                <ProductEditor
                  key={productEditor === "new" ? "new" : productEditor.id}
                  sid={sid}
                  categoriesEnabled={!!sub && "default_location_id" in sub}
                  product={productEditor === "new" ? undefined : productEditor}
                  locations={
                    owner ? locations : locations.filter((l) => l.id === lid)
                  }
                  allowGeneral={shared("products.manage")}
                  close={() => setProductEditor(null)}
                  cleanup={(url) => cleanupImage(url, "product-images", sid)}
                  save={async (value) => {
                    const db = browserClient();
                    if (productEditor === "new") {
                      const { data, error } = await db
                        .from("products")
                        .insert(value)
                        .select("*")
                        .single();
                      if (error) throw error;
                      setProducts((previous) =>
                        [...previous, data].sort((a, b) =>
                          a.name.localeCompare(b.name),
                        ),
                      );
                    } else {
                      const { subscription_id: ignored, ...updates } = value;
                      void ignored;
                      const { data, error } = await db
                        .from("products")
                        .update(updates)
                        .eq("id", productEditor.id)
                        .select("*")
                        .single();
                      if (error) throw error;
                      setProducts((previous) =>
                        previous.map((x) => (x.id === data.id ? data : x)),
                      );
                    }
                  }}
                  remove={
                    productEditor === "new"
                      ? undefined
                      : async () => {
                          const { error } = await browserClient()
                            .from("products")
                            .delete()
                            .eq("id", productEditor.id)
                            .select("id")
                            .single();
                          if (error) throw error;
                          setProducts((previous) =>
                            previous.filter((p) => p.id !== productEditor.id),
                          );
                        }
                  }
                />
              )}
            </section>
          )}
          {tab === "settings" &&
            (shared("settings.view") || can("settings.view")) &&
            sub && (
              <div>
                <section
                  className="settings-directory panel"
                  hidden={!!settingsArea}
                >
                  <div className="section-heading">
                    <p className="eyebrow">YOUR BUSINESS, YOUR WAY</p>
                    <h2>Settings</h2>
                    <p className="muted">Choose an area to manage.</p>
                  </div>
                  <label>
                    Search settings
                    <input
                      type="search"
                      placeholder="Find a setting…"
                      value={settingsSearch}
                      onChange={(e) => {
                        setSettingsSearch(e.target.value);
                        setSettingsArea("");
                      }}
                    />
                  </label>
                  <p role="status">{settingTiles.length} settings found</p>
                  <div className="settings-cards">
                    {settingTiles.map((tile) => (
                      <button
                        key={tile.id}
                        type="button"
                        className="setting-tile secondary"
                        onClick={() => {
                          if (!tile.available) {
                            setSettingsArea(tile.id);
                          } else if (tile.id === "users") {
                            setTab("users");
                          } else setSettingsArea(tile.id);
                        }}
                      >
                        <span aria-hidden="true">{tile.icon}</span>
                        <strong>{tile.title}</strong>
                        <small>{tile.description}</small>
                        {!tile.available && (
                          <span className="coming-soon">
                            Feature coming soon
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {!settingTiles.length && (
                    <p>No settings match your search. Try another word.</p>
                  )}
                </section>
                {settingsArea && (
                  <button
                    type="button"
                    className="secondary settings-back"
                    onClick={() => {
                      setSettingsArea("");
                      setSettingsSearch("");
                    }}
                  >
                    ← All settings
                  </button>
                )}
                {settingsArea &&
                  !["appearance", "location", "subscription"].includes(
                    settingsArea,
                  ) && (
                    <section className="panel">
                      <h2>
                        {settingTiles.find((t) => t.id === settingsArea)?.title}
                      </h2>
                      <p>Feature coming soon.</p>
                    </section>
                  )}
                <div hidden={settingsArea !== "subscription"}>
                  {owner && <SubscriptionSummary key={sid} id={sid} />}
                </div>
                <div className="settings-tools">
                  <div
                    hidden={
                      settingsArea !== "appearance" || !shared("settings.view")
                    }
                  >
                    <AppearanceEditor
                      key={sub.id}
                      subscription={sub}
                      locations={locations}
                      allowed={shared("settings.manage")}
                      cancel={() => setSettingsArea("")}
                      cleanup={(url) =>
                        cleanupImage(url, "business-logos", sid)
                      }
                      save={async (v) => {
                        const payload =
                          "default_location_id" in sub
                            ? { ...v }
                            : {
                                name: v.name,
                                description: v.description,
                                accent: v.accent,
                                ...("logo_url" in sub
                                  ? { logo_url: v.logo_url }
                                  : {}),
                              };
                        if (!("header_layout" in sub))
                          delete (payload as Partial<typeof v>).header_layout;
                        const { error } = await browserClient()
                          .from("subscriptions")
                          .update(payload)
                          .eq("id", sid);
                        if (error) throw error;
                        setSubs((previous) =>
                          previous.map((s) =>
                            s.id === sid
                              ? {
                                  ...s,
                                  ...payload,
                                }
                              : s,
                          ),
                        );
                      }}
                    />
                  </div>
                  <section
                    id="location-settings"
                    className="panel"
                    hidden={
                      settingsArea !== "location" || !can("settings.view")
                    }
                  >
                    <fieldset disabled={!can("settings.manage")}>
                      <h2>
                        {location ? "Location settings" : "Create location"}
                      </h2>
                      {location && (
                        <LocationForm
                          key={location.id}
                          location={location}
                          busy={busy}
                          cancel={() => setSettingsArea("")}
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
                    </fieldset>
                    <fieldset disabled={!shared("settings.manage")}>
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
                        <div className="actions">
                          <button disabled={busy}>Add location</button>
                          <button
                            type="button"
                            className="secondary"
                            disabled={busy}
                            onClick={(e) => {
                              e.currentTarget.form?.reset();
                              setSettingsArea("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </fieldset>
                  </section>
                </div>
              </div>
            )}
          {plannedFeatures.some((f) => f.id === tab) && (
            <section className="panel">
              <p className="eyebrow">GROW & CONNECT</p>
              <h2>{plannedFeatures.find((f) => f.id === tab)?.label}</h2>
              <p>{plannedFeatures.find((f) => f.id === tab)?.description}</p>
              <p className="coming-soon">Feature coming soon</p>
            </section>
          )}
          {tab === "users" && shared("users.view") && (
            <Users
              key={sid}
              subscriptionId={sid}
              userId={userId}
              locations={locations}
              manage={shared("users.manage")}
            />
          )}
        </>
      )}
    </main>
  );
}
