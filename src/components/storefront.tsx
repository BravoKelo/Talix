"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";
import { TaskDialog } from "@/components/order-dialog";
import { money, type Catalog, type CartLine, type Product } from "@/lib/types";
type Line = CartLine & { name: string; unit: number; optionNames: string[] };
function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  return product.image_url && !failed ? (
    <Image
      width={720}
      height={540}
      unoptimized
      className="shop-product-image"
      src={product.image_url}
      alt={product.name}
      onError={() => setFailed(true)}
    />
  ) : (
    <div
      className="shop-product-image shop-image-placeholder"
      role="img"
      aria-label={`No image available for ${product.name}`}
    >
      <span aria-hidden="true">◇</span>
      <span>No image available</span>
    </div>
  );
}
function ProductCard({
  product,
  open,
  onAdd,
}: {
  product: Product;
  open: () => void;
  onAdd: () => void;
}) {
  return (
    <article className="shop-product-card">
      <button
        className="shop-tile-open secondary"
        onClick={open}
        aria-label={`View ${product.name}`}
      >
        <ProductImage key={product.image_url} product={product} />
        <span className="shop-card-copy">
          <span className="shop-product-name">{product.name}</span>
          <span className="muted shop-product-summary">
            {product.description || "View this product for details."}
          </span>
        </span>
      </button>
      <div className="shop-card-actions">
        <strong>{money(product.price_cents)}</strong>
        <button onClick={onAdd} aria-label={`Add ${product.name} to cart`}>
          Add to cart
        </button>
      </div>
    </article>
  );
}
function ProductDetails({
  product,
  close,
  onAdd,
}: {
  product: Product;
  close: () => void;
  onAdd: (p: Product, ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const total =
    product.price_cents +
    product.options
      .filter((o) => selected.includes(o.id))
      .reduce((sum, o) => sum + o.price_cents, 0);
  return (
    <TaskDialog title={product.name} close={close} closeLabel="Close product">
      <div className="shop-product-details">
        <ProductImage key={product.image_url} product={product} />
        <h2>{product.name}</h2>
        <p className="shop-full-description">
          {product.description || "No additional description is available."}
        </p>
        <p>
          <strong>{money(product.price_cents)}</strong>
        </p>
        {product.options.length > 0 && (
          <fieldset>
            <legend>Optional extras</legend>
            {product.options.map((o) => (
              <label className="shop-option" key={o.id}>
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
                <span>
                  {o.name} {o.price_cents > 0 && `(+${money(o.price_cents)})`}
                </span>
              </label>
            ))}
          </fieldset>
        )}
        <button
          onClick={() => {
            onAdd(product, selected);
            close();
          }}
        >
          Add to cart · {money(total)}
        </button>
      </div>
    </TaskDialog>
  );
}
export function Storefront({ slug }: { slug: string }) {
  const router = useRouter();
  const [compactHeader, setCompactHeader] = useState(false);
  useEffect(() => {
    const update = () => setCompactHeader(window.scrollY > 48);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  const [query, setQuery] = useState("");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [cartNotice, setCartNotice] = useState("");
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
    setCartNotice(`${p.name} added to your cart.`);
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
  const visibleProducts = products.filter((p) =>
    `${p.name} ${p.description}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  const selectedLocation = catalog.locations.find((l) => l.id === location);
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <main
      className="store visual-store"
      style={{ "--accent": catalog.subscription.accent } as React.CSSProperties}
    >
      <a className="shop-skip" href="#shop-location">
        Skip to location selection
      </a>
      <header
        className={`shop-header${compactHeader ? " is-compact" : ""}`}
        id="shop-welcome"
      >
        <nav className="shop-nav" aria-label="Storefront">
          <a className="shop-brand" href="#shop-products">
            {catalog.subscription.logo_url && (
              <Image
                width={72}
                height={48}
                unoptimized
                className="business-logo"
                src={catalog.subscription.logo_url}
                alt={`${catalog.subscription.name} logo`}
              />
            )}
            <h1>{catalog.subscription.name}</h1>
          </a>
          <a
            className="shop-cart-link"
            href={location ? "#shop-cart" : "#shop-location"}
            aria-label={`Your cart (${itemCount})`}
          >
            <svg
              aria-hidden="true"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M2 3h3l2 12h12l3-9H6" />
              <circle cx="9" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
            <span>Cart ({itemCount})</span>
            <strong>
              {money(
                cart.reduce((sum, line) => sum + line.unit * line.quantity, 0),
              )}
            </strong>
          </a>
        </nav>
        {catalog.subscription.description && (
          <p className="shop-header-description">
            {catalog.subscription.description}
          </p>
        )}
      </header>
      <section className="shop-location-bar" aria-label="Shopping location">
        <div className="shop-location-panel" id="shop-location">
          <p className="shop-location-hint">
            Changing location clears your cart.
          </p>
          <label>
            Choose a location
            <select
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setCart([]);
                setQuery("");
                setActiveProduct(null);
                setCartNotice("");
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
          {selectedLocation && (
            <div className="shop-location-details">
              <p>{selectedLocation.address}</p>
              {selectedLocation.phone && <p>Phone: {selectedLocation.phone}</p>}
              {selectedLocation.hours && <p>Hours: {selectedLocation.hours}</p>}
            </div>
          )}
        </div>
      </section>
      {!location ? (
        <div className="empty">
          {catalog.locations.length
            ? "Choose a location to view its products."
            : "No locations are currently available for online ordering."}
        </div>
      ) : (
        <div className="store-layout">
          <section
            id="shop-products"
            className="shop-discovery"
            aria-label="Products"
          >
            <div className="shop-catalog-heading">
              <h2>Products</h2>
            </div>
            <label className="shop-search">
              Search products
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or description"
              />
            </label>
            <p className="muted" role="status">
              {visibleProducts.length}{" "}
              {visibleProducts.length === 1 ? "product" : "products"}
            </p>
            <div className="catalog">
              {visibleProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  open={() => setActiveProduct(p)}
                  onAdd={() => add(p, [])}
                />
              ))}
            </div>
            {!products.length ? (
              <div className="empty">
                No products are available at this location.
              </div>
            ) : (
              !visibleProducts.length && (
                <div className="empty">
                  <p>No products match your search.</p>
                  <button className="secondary" onClick={() => setQuery("")}>
                    Clear search
                  </button>
                </div>
              )
            )}
          </section>
          <aside className="panel cart" id="shop-cart" aria-label="Your cart">
            <h2>Your cart</h2>
            <p className="muted">
              {selectedLocation?.name} · {itemCount}{" "}
              {itemCount === 1 ? "item" : "items"}
            </p>
            <p role="status" className="shop-cart-notice">
              {cartNotice}
            </p>
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
                      setCartNotice(`${l.name} removed from your cart.`);
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
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={(e) => {
                  e.currentTarget.form?.reset();
                  setRequestId(null);
                  setMessage("");
                  document
                    .querySelector(".catalog")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Cancel checkout
              </button>
              <p role="status">{message}</p>
            </form>
          </aside>
        </div>
      )}
      {activeProduct && (
        <ProductDetails
          key={activeProduct.id}
          product={activeProduct}
          close={() => setActiveProduct(null)}
          onAdd={add}
        />
      )}
    </main>
  );
}
