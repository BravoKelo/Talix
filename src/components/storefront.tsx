"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";
import { money, type Catalog, type CartLine, type Product } from "@/lib/types";
type Line = CartLine & { name: string; unit: number; optionNames: string[] };
function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (p: Product, ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <article className="panel">
      {product.image_url ? (
        <Image
          width={600}
          height={400}
          unoptimized
          className="product-image"
          src={product.image_url}
          alt={product.name}
        />
      ) : (
        <div className="product-image" aria-hidden="true" />
      )}
      <h2>{product.name}</h2>
      <p className="muted">{product.description}</p>
      <p>
        <strong>{money(product.price_cents)}</strong>
      </p>
      {product.options.map((o) => (
        <label key={o.id}>
          <input
            type="checkbox"
            checked={selected.includes(o.id)}
            onChange={(e) =>
              setSelected(
                e.target.checked
                  ? [...selected, o.id]
                  : selected.filter((id) => id !== o.id),
              )
            }
          />
          {o.name} {o.price_cents > 0 && `(+${money(o.price_cents)})`}
        </label>
      ))}
      <button
        className="small"
        style={{ marginTop: 16 }}
        onClick={() => onAdd(product, selected)}
      >
        Add to cart
      </button>
    </article>
  );
}
export function Storefront({ slug }: { slug: string }) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [location, setLocation] = useState("");
  const [cart, setCart] = useState<Line[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const { data, error } = await browserClient().rpc("public_catalog", {
          p_slug: slug,
        });
        if (error) throw error;
        if (!data) throw new Error("This business is not available.");
        if (alive) setCatalog(data as Catalog);
      } catch (e) {
        if (alive)
          setMessage(
            e instanceof Error ? e.message : "Unable to load products.",
          );
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [slug]);
  function add(p: Product, ids: string[]) {
    setMessage("");
    setRequestId(null);
    const key = [...ids].sort().join(",");
    setCart((old) => {
      const index = old.findIndex(
        (l) =>
          l.product_id === p.id && [...l.option_ids].sort().join(",") === key,
      );
      if (index >= 0)
        return old.map((l, i) =>
          i === index ? { ...l, quantity: Math.min(99, l.quantity + 1) } : l,
        );
      const options = p.options.filter((o) => ids.includes(o.id));
      return [
        ...old,
        {
          product_id: p.id,
          option_ids: ids,
          quantity: 1,
          name: p.name,
          unit: p.price_cents + options.reduce((a, o) => a + o.price_cents, 0),
          optionNames: options.map((o) => o.name),
        },
      ];
    });
  }
  async function checkout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cart.length || !location) return;
    setBusy(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const key = requestId ?? crypto.randomUUID();
    setRequestId(key);
    try {
      const { data, error } = await browserClient().rpc("checkout_simulated", {
        p_location: location,
        p_request: key,
        p_customer: {
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
        },
        p_lines: cart.map(({ product_id, option_ids, quantity }) => ({
          product_id,
          option_ids,
          quantity,
        })),
        p_outcome: form.get("outcome"),
      });
      if (error) throw error;
      router.push(`/orders/${data.token}`);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Unable to place order. Retry with the same details.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!catalog)
    return (
      <main className="store">
        <h1>{message ? "Store unavailable" : "Loading store…"}</h1>
        <p role="status">{message}</p>
      </main>
    );
  const products = catalog.products.filter(
    (p) => p.location_id === null || p.location_id === location,
  );
  return (
    <main
      className="store"
      style={{ "--accent": catalog.subscription.accent } as React.CSSProperties}
    >
      <section className="store-hero">
        <p className="eyebrow">WELCOME</p>
        <h1>{catalog.subscription.name}</h1>
        <p className="lead">
          {catalog.subscription.description ||
            "Explore our products and place your order online."}
        </p>
        <label style={{ maxWidth: 450 }}>
          Choose a location
          <select
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setCart([]);
              setRequestId(null);
              setMessage("");
            }}
          >
            <option value="">Select a location</option>
            {catalog.locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} — {l.address}
              </option>
            ))}
          </select>
        </label>
        {location && (
          <p className="muted">
            {catalog.locations.find((l) => l.id === location)?.hours}
          </p>
        )}
      </section>
      {!location ? (
        <div className="empty">Choose a location to view its products.</div>
      ) : (
        <div className="store-layout">
          <section className="catalog" aria-label="Products">
            {products.length ? (
              products.map((p) => (
                <ProductCard key={p.id} product={p} onAdd={add} />
              ))
            ) : (
              <div className="empty">
                No products are available at this location.
              </div>
            )}
          </section>
          <aside className="panel cart">
            <h2>Your cart</h2>
            {!cart.length ? (
              <p className="muted">Add a product to get started.</p>
            ) : (
              cart.map((l, i) => (
                <div className="cart-line" key={`${l.product_id}-${i}`}>
                  <div className="row">
                    <strong>
                      {l.name} × {l.quantity}
                    </strong>
                    <span>{money(l.unit * l.quantity)}</span>
                  </div>
                  <small>{l.optionNames.join(", ")}</small>
                  <button
                    className="small secondary"
                    onClick={() => {
                      setCart(cart.filter((_, j) => j !== i));
                      setRequestId(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
            <div className="row" style={{ margin: "20px 0" }}>
              <strong>Total</strong>
              <strong>
                {money(cart.reduce((a, l) => a + l.unit * l.quantity, 0))}
              </strong>
            </div>
            <p className="muted">
              Final pricing is checked when you place your order. USD; tax
              calculation is not configured in this development release.
            </p>
            <form
              className="stack"
              onSubmit={checkout}
              onChange={() => setRequestId(null)}
            >
              <label>
                Your name
                <input
                  name="name"
                  required
                  maxLength={100}
                  autoComplete="name"
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                />
              </label>
              <label>
                Phone
                <input
                  name="phone"
                  type="tel"
                  required
                  minLength={7}
                  maxLength={30}
                  autoComplete="tel"
                />
              </label>
              <div className="notice">
                <strong>Simulated card payment</strong>
                <p>No card information is collected and no money moves.</p>
                <label>
                  Test outcome
                  <select name="outcome">
                    <option value="approved">Approve payment</option>
                    <option value="declined">Decline payment</option>
                  </select>
                </label>
              </div>
              <button disabled={busy || !cart.length}>
                {busy ? "Placing order…" : "Place order with simulated payment"}
              </button>
              <p role="status">{message}</p>
            </form>
          </aside>
        </div>
      )}
    </main>
  );
}
