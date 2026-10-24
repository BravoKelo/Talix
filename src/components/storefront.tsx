"use client";
import Image from "next/image";
import { ProductImage } from "./product-image";
import Link from "next/link";
import { StorefrontHeader } from "./storefront-header";
import { headerLayout, storefrontStyle } from "@/lib/storefront-design";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";
import { TaskDialog } from "@/components/order-dialog";
import {
  WebsiteTemplateFooter,
  WebsiteTemplateHero,
} from "@/components/website-template-hero";
import { money, type Catalog, type CartLine, type Product } from "@/lib/types";
import { websiteProductsForLocation } from "@/lib/website";
import {
  checkoutDraftRejection,
  checkoutResultToken,
  type CheckoutAttempt,
} from "@/lib/checkout-attempt";
type Line = CartLine & { name: string; unit: number; optionNames: string[] };
function defaultCatalogLocation(catalog: Catalog) {
  const published = [...catalog.locations].sort(
    (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  );
  return (
    published.find(
      (location) => location.id === catalog.subscription.default_location_id,
    )?.id ??
    published[0]?.id ??
    ""
  );
}
function ProductCard({
  product,
  open,
  onAdd,
  eager = false,
}: {
  product: Product;
  open: () => void;
  onAdd: () => void;
  eager?: boolean;
}) {
  return (
    <article className="shop-product-card" id={`product-${product.id}`}>
      <button
        className="shop-tile-open secondary"
        onClick={(event) => {
          // WebKit does not focus a button on pointer activation by default.
          event.currentTarget.focus();
          open();
        }}
        aria-label={`View ${product.name}`}
      >
        <ProductImage key={product.image_url} product={product} eager={eager} />
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
export function Storefront({
  slug,
  signedIn = false,
  initialCatalog = null,
}: {
  slug: string;
  signedIn?: boolean;
  initialCatalog?: Catalog | null;
}) {
  const router = useRouter();
  const [businessSignedIn, setBusinessSignedIn] = useState(signedIn);
  useEffect(() => {
    let alive = true;
    const client = browserClient();
    void client.auth.getUser().then(({ data }) => {
      if (alive) setBusinessSignedIn(!!data.user);
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (alive) setBusinessSignedIn(!!session?.user);
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);
  const [compactHeader, setCompactHeader] = useState(false);
  const [catalog, setCatalog] = useState<Catalog | null>(initialCatalog);
  const header = useRef<HTMLElement>(null);
  const [websiteView, setWebsiteView] = useState<"home" | "shop">("home");
  const [navigationHash, setNavigationHash] = useState<string | null>(null);
  useLayoutEffect(() => {
    const element = header.current;
    if (!element || !catalog) return;
    let measuredWidth = -1;
    const measure = () => {
      const width = element.getBoundingClientRect().width;
      if (width === measuredWidth) return;
      measuredWidth = width;
      // Measure natural expanded layout outside document flow, even when the
      // real header is compact. Reset the old measurement so narrower/wider
      // layouts can shrink as well as grow. Never measure on scroll frames.
      const expanded = element.cloneNode(true) as HTMLElement;
      expanded.classList.remove("is-compact");
      expanded.style.removeProperty("--shop-expanded-nav-height");
      Object.assign(expanded.style, {
        position: "absolute",
        visibility: "hidden",
        pointerEvents: "none",
        width: `${width}px`,
        top: "0",
        left: "0",
        margin: "0",
      });
      expanded.inert = true;
      expanded.setAttribute("aria-hidden", "true");
      expanded
        .querySelectorAll("[id]")
        .forEach((node) => node.removeAttribute("id"));
      expanded.querySelectorAll("dialog").forEach((node) => node.remove());
      element.after(expanded);
      try {
        const nav = expanded.querySelector<HTMLElement>(".shop-nav");
        const actualNav = element.querySelector<HTMLElement>(".shop-nav");
        if (nav && actualNav) {
          // Install the measured starting height immediately. Animating the
          // measurement itself leaves WebKit midway to that height when an
          // early scroll starts, so its margin and height curves disagree.
          const transitions = [element, actualNav].map((node) => ({
            node,
            value: node.style.getPropertyValue("transition"),
            priority: node.style.getPropertyPriority("transition"),
          }));
          transitions.forEach(({ node }) =>
            node.style.setProperty("transition", "none"),
          );
          element.style.setProperty(
            "--shop-expanded-nav-height",
            `${nav.getBoundingClientRect().height}px`,
          );
          actualNav.getBoundingClientRect();
          transitions.forEach(({ node, value, priority }) => {
            if (value) node.style.setProperty("transition", value, priority);
            else node.style.removeProperty("transition");
          });
        }
      } finally {
        expanded.remove();
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [catalog, websiteView]);
  useEffect(() => {
    function syncView(event?: HashChangeEvent) {
      const hash = window.location.hash;
      setNavigationHash(hash || (event ? "#shop-welcome" : null));
      setWebsiteView(
        hash === "#shop-products" ||
          hash === "#shop-location" ||
          hash.startsWith("#product-")
          ? "shop"
          : "home",
      );
    }
    syncView();
    window.addEventListener("hashchange", syncView);
    return () => window.removeEventListener("hashchange", syncView);
  }, []);
  useEffect(() => {
    if (!catalog) return;
    const update = () => {
      // Do not hide/reparent a navigation or search control being used by
      // keyboard. Re-evaluate after focus leaves the header.
      if (
        header.current?.querySelector(
          ".shop-navigation:focus-within, .shop-header-search:focus-within",
        )
      )
        return;
      setCompactHeader((compact) =>
        compact ? window.scrollY > 24 : window.scrollY > 48,
      );
    };
    let frame = 0;
    const afterFocus = () => {
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    const element = header.current;
    element?.addEventListener("focusout", afterFocus);
    return () => {
      window.removeEventListener("scroll", update);
      element?.removeEventListener("focusout", afterFocus);
      cancelAnimationFrame(frame);
    };
  }, [catalog]);
  const [category, setCategory] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState("");
  useEffect(() => {
    // Restore the anchor after revealing its view, including direct links and
    // browser Back/Forward. Focus follows the intentionally changed context.
    if (!catalog || !navigationHash) return;
    const target = document.getElementById(navigationHash.slice(1));
    if (!target) return;
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
  }, [navigationHash, catalog]);
  const [location, setLocation] = useState(() =>
    initialCatalog ? defaultCatalogLocation(initialCatalog) : "",
  );
  const [cart, setCart] = useState<Line[]>([]);
  const [message, setMessage] = useState("");
  const [checkoutPhase, setCheckoutPhase] = useState<
    "draft" | "submitting" | "unknown" | "confirmed"
  >("draft");
  const attempt = useRef<CheckoutAttempt | null>(null);
  const submitting = useRef(false);
  const busy = checkoutPhase === "submitting";
  const checkoutLocked = checkoutPhase !== "draft";
  useEffect(() => {
    if (initialCatalog) return;
    let alive = true;
    async function load() {
      try {
        const { data, error } = await browserClient().rpc("public_catalog", {
          p_slug: slug,
        });
        if (error) throw error;
        if (!data) throw new Error("This business is not available.");
        if (alive) {
          const next = data as Catalog;
          setCatalog(next);
          setCartOpen(false);
          setCheckoutOpen(false);
          setCart([]);
          setCategory("");
          setQuery("");
          setActiveProduct(null);
          attempt.current = null;
          setCheckoutPhase("draft");
          setLocation(defaultCatalogLocation(next));
        }
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
  }, [initialCatalog, slug]);
  function add(p: Product, ids: string[]) {
    if (attempt.current) return;
    setMessage("");
    setCartNotice(`${p.name} added to your cart.`);
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
    if (submitting.current || checkoutPhase === "confirmed") return;
    if (!attempt.current) {
      if (!cart.length || !location) return;
      const form = new FormData(e.currentTarget);
      attempt.current = {
        p_request: crypto.randomUUID(),
        p_location: location,
        p_customer: {
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""),
        },
        p_lines: cart.map(({ product_id, option_ids, quantity }) => ({
          product_id,
          option_ids: [...option_ids],
          quantity,
        })),
        p_outcome: String(form.get("outcome") ?? ""),
      };
    }
    // The ref guard takes effect before React renders disabled controls. Every
    // retry sends the captured record, never a newly edited form/cart payload.
    submitting.current = true;
    setCheckoutPhase("submitting");
    setMessage("");
    try {
      const { data, error, status } = await browserClient().rpc(
        "checkout_simulated",
        attempt.current,
      );
      if (error) {
        const rejection = checkoutDraftRejection(error, status);
        if (rejection) {
          attempt.current = null;
          setCheckoutPhase("draft");
          setMessage(
            `${rejection}. No order was placed. Review your details or cart before trying again.`,
          );
          return;
        }
        throw error;
      }
      const token = checkoutResultToken(data);
      if (!token) throw new Error("Missing order confirmation");
      setCheckoutPhase("confirmed");
      setMessage("Your order is confirmed. Opening your order…");
      router.push(`/orders/${token}`);
    } catch {
      setCheckoutPhase("unknown");
      setMessage(
        "We couldn’t confirm whether your order was placed. Retry this order using the same details. Keep this tab open; reloading or closing it loses this recovery step.",
      );
    } finally {
      submitting.current = false;
    }
  }
  if (!catalog)
    return (
      <main
        className="store visual-store figma-store"
        style={storefrontStyle({})}
      >
        <h1>{message ? "Store unavailable" : "Loading store…"}</h1>
        <p role="status">{message}</p>
      </main>
    );
  const products = websiteProductsForLocation(catalog.products, location);
  const categories = [
    ...new Set(
      products.map((p) => p.category?.trim()).filter((c): c is string => !!c),
    ),
  ].sort();
  const visibleProducts = products.filter(
    (p) =>
      (!category || p.category === category) &&
      `${p.name} ${p.description}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  const selectedLocation = catalog.locations.find((l) => l.id === location);
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const orderingReady = products.length > 0;
  const liveTemplate = catalog.subscription.website_live_template;
  const showShop =
    !liveTemplate || liveTemplate === "order_first" || websiteView === "shop";
  return (
    <main
      className={`store visual-store figma-store header-${headerLayout(catalog.subscription)}${catalog.subscription.website_live_template ? ` website-template template-${catalog.subscription.website_live_template}` : ""}`}
      id="shop-welcome"
      style={storefrontStyle(catalog.subscription)}
    >
      <a className="shop-skip" href="#shop-location">
        Skip to location selection
      </a>
      <header
        ref={header}
        className={`shop-header${compactHeader ? " is-compact" : ""}`}
      >
        <StorefrontHeader
          subscription={catalog.subscription}
          location={selectedLocation}
          search={
            headerLayout(catalog.subscription) === "search" &&
            showShop &&
            (!catalog.subscription.website_live_template || orderingReady) ? (
              <label className="shop-header-search">
                <span className="sr-only">Search products</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products"
                />
              </label>
            ) : undefined
          }
        >
          <div className="shop-header-actions">
            <button
              className="shop-icon secondary"
              aria-label="Your account"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen(!accountOpen)}
            >
              <Image width={24} height={24} src="/storefront/user.svg" alt="" />
            </button>
            {(!catalog.subscription.website_live_template || orderingReady) && (
              <button
                className="shop-icon shop-cart-link secondary"
                aria-haspopup="dialog"
                onClick={(event) => {
                  event.currentTarget.focus();
                  setAccountOpen(false);
                  setCheckoutOpen(false);
                  setCartOpen(true);
                }}
                aria-label={`Your cart (${itemCount})`}
              >
                <Image
                  width={24}
                  height={24}
                  src="/storefront/cart.svg"
                  alt=""
                />
                <span className="shop-cart-count" aria-hidden="true">
                  {itemCount}
                </span>
              </button>
            )}
            {accountOpen && (
              <div className="shop-account-panel">
                <p>Business account</p>
                <Link href={businessSignedIn ? "/workspace" : "/login"}>
                  {businessSignedIn
                    ? "Open business workspace"
                    : "Business sign in"}
                </Link>
                <p className="muted">You can shop and check out as a guest.</p>
              </div>
            )}
          </div>
        </StorefrontHeader>
      </header>
      {liveTemplate && websiteView === "home" && (
        <WebsiteTemplateHero
          subscription={catalog.subscription}
          location={selectedLocation}
          products={products}
        />
      )}
      {liveTemplate && websiteView === "shop" && (
        <div className="website-template-actions website-home-navigation">
          <a className="button secondary" href="#shop-welcome">
            Back to homepage
          </a>
        </div>
      )}
      <div className="shop-content" hidden={!showShop}>
        <section className="shop-toolbar" aria-label="Shopping location">
          <label id="shop-location" className="shop-location-control">
            <span className="sr-only">Choose a location</span>
            <select
              aria-label="Choose a location"
              disabled={checkoutLocked}
              value={location}
              onChange={(e) => {
                if (attempt.current) return;
                setLocation(e.target.value);
                setCart([]);
                setCategory("");
                setQuery("");
                setActiveProduct(null);
                setCartNotice("");
                setMessage("");
              }}
            >
              {!catalog.locations.length && (
                <option value="">No published locations</option>
              )}
              {catalog.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  Shopping at {l.name}
                </option>
              ))}
            </select>
          </label>
          {(!catalog.subscription.website_live_template || orderingReady) && (
            <>
              <button
                className="shop-menu-toggle"
                aria-expanded={menuOpen}
                aria-controls="shop-menu"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                Menu
              </button>
              <label className="shop-search">
                <span className="sr-only">Search products</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products"
                />
              </label>
            </>
          )}
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
              <div className="shop-browse-layout">
                <aside
                  id="shop-menu"
                  className={`shop-browse-menu${menuOpen ? " is-open" : ""}`}
                >
                  <p>
                    <strong>Browse products</strong>
                  </p>
                  <nav aria-label="Product collections">
                    <button
                      className="secondary"
                      aria-pressed={!category}
                      onClick={() => setCategory("")}
                    >
                      All products
                    </button>
                    {categories.map((c) => (
                      <button
                        className="secondary"
                        key={c}
                        aria-pressed={category === c}
                        onClick={() => setCategory(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </nav>
                  <details className="shop-business-info">
                    <summary>Location information</summary>
                    <p>{selectedLocation?.address}</p>
                    <p>{selectedLocation?.phone}</p>
                    <p>{selectedLocation?.hours}</p>
                    <p>Changing location clears your cart.</p>
                    {catalog.subscription.description && (
                      <p>{catalog.subscription.description}</p>
                    )}
                  </details>
                </aside>
                <div className="shop-results">
                  <h2 className="sr-only">{category || "Products"}</h2>
                  <p className="sr-only" role="status">
                    {visibleProducts.length}{" "}
                    {visibleProducts.length === 1 ? "product" : "products"}
                  </p>
                  <div className="catalog">
                    {visibleProducts.map((p, index) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        eager={index === 0}
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
                        <button
                          className="secondary"
                          onClick={() => {
                            setQuery("");
                            setCategory("");
                          }}
                        >
                          Clear search
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
      {catalog.subscription.website_live_template && (
        <WebsiteTemplateFooter
          subscription={catalog.subscription}
          location={selectedLocation}
        />
      )}
      <p role="status" className="sr-only">
        {cartNotice}
      </p>
      {cartOpen && (
        <TaskDialog
          title={checkoutOpen ? "Checkout" : `Your cart (${itemCount})`}
          close={() => {
            if (attempt.current) return;
            setCartOpen(false);
            setCheckoutOpen(false);
          }}
          busy={checkoutLocked}
          className="shop-cart-dialog"
          backdropClose
        >
          <p className="shop-cart-location">
            Shopping at {selectedLocation?.name || "No available location"}
          </p>
          {checkoutOpen ? (
            <div className="shop-checkout-step">
              <button
                type="button"
                className="secondary"
                disabled={checkoutLocked}
                onClick={() => {
                  if (!attempt.current) setCheckoutOpen(false);
                }}
              >
                Back to cart
              </button>
              <div className="row">
                <strong>Subtotal</strong>
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
                aria-describedby="checkout-status"
              >
                <label>
                  Your name
                  <input
                    name="name"
                    disabled={checkoutLocked}
                    required
                    maxLength={100}
                    autoComplete="name"
                  />
                </label>
                <label>
                  Email
                  <input
                    name="email"
                    disabled={checkoutLocked}
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
                    disabled={checkoutLocked}
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
                    <select name="outcome" disabled={checkoutLocked}>
                      <option value="approved">Approve payment</option>
                      <option value="declined">Decline payment</option>
                    </select>
                  </label>
                </div>
                <button
                  disabled={
                    busy || checkoutPhase === "confirmed" || !cart.length
                  }
                >
                  {busy
                    ? "Placing order…"
                    : checkoutPhase === "unknown"
                      ? "Retry this order"
                      : checkoutPhase === "confirmed"
                        ? "Opening your order…"
                        : "Place order with simulated payment"}
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={checkoutLocked}
                  onClick={(e) => {
                    if (attempt.current) return;
                    e.currentTarget.form?.reset();
                    setMessage("");
                    setCheckoutOpen(false);
                  }}
                >
                  Cancel checkout
                </button>
                <p id="checkout-status" role="status" aria-atomic="true">
                  {busy
                    ? "Checking your order. Please keep this tab open."
                    : message}
                </p>
              </form>
            </div>
          ) : (
            <>
              <div
                className={`shop-cart-items${!cart.length ? " is-empty" : ""}`}
              >
                {!cart.length ? (
                  <div>
                    <h2>Your cart is empty</h2>
                    <p className="muted">
                      Add something you like to get started.
                    </p>
                  </div>
                ) : (
                  cart.map((l, i) => {
                    const product = catalog.products.find(
                      (p) => p.id === l.product_id,
                    );
                    const change = (quantity: number) => {
                      if (attempt.current) return;
                      setCart((old) =>
                        old.map((line, j) =>
                          j === i ? { ...line, quantity } : line,
                        ),
                      );
                      setMessage("");
                    };
                    return (
                      <article
                        className="shop-cart-item"
                        key={l.product_id + "-" + l.option_ids.join(",")}
                      >
                        <div className="shop-cart-thumb">
                          {product && (
                            <ProductImage
                              key={product.image_url}
                              product={product}
                            />
                          )}
                        </div>
                        <div className="shop-cart-copy">
                          <strong>{l.name}</strong>
                          <small className="muted">
                            {l.optionNames.join(", ") || "Standard"}
                          </small>
                          <div className="row">
                            <strong>{money(l.unit)} each</strong>
                            <strong>{money(l.unit * l.quantity)}</strong>
                          </div>
                          <div className="shop-cart-controls">
                            <div className="shop-quantity">
                              <button
                                className="secondary"
                                aria-label={`Decrease ${l.name} quantity`}
                                disabled={l.quantity <= 1}
                                onClick={() => change(l.quantity - 1)}
                              >
                                −
                              </button>
                              <span aria-label={`Quantity for ${l.name}`}>
                                {l.quantity}
                              </span>
                              <button
                                className="secondary"
                                aria-label={`Increase ${l.name} quantity`}
                                disabled={l.quantity >= 99}
                                onClick={() => change(l.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                            <button
                              className="secondary"
                              aria-label={`Remove ${l.name}`}
                              onClick={() => {
                                if (attempt.current) return;
                                setCart((old) => old.filter((_, j) => j !== i));
                                setMessage("");
                                setCartNotice(
                                  `${l.name} removed from your cart.`,
                                );
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
              <footer className="shop-cart-footer">
                {!!cart.length && (
                  <>
                    <div className="row">
                      <strong>Subtotal</strong>
                      <strong>
                        {money(
                          cart.reduce((a, l) => a + l.unit * l.quantity, 0),
                        )}
                      </strong>
                    </div>
                    <small className="muted">
                      Final pricing is confirmed at checkout.
                    </small>
                    <button onClick={() => setCheckoutOpen(true)}>
                      Go to checkout
                    </button>
                  </>
                )}
                <button
                  className={cart.length ? "secondary" : ""}
                  onClick={() => setCartOpen(false)}
                >
                  Continue shopping
                </button>
              </footer>
            </>
          )}
        </TaskDialog>
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
