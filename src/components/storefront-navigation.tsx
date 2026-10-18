"use client";
import { useEffect, useRef, useState } from "react";
import { TaskDialog } from "./order-dialog";
import { validWebsiteUrl } from "@/lib/header-navigation";
import type { Location, Subscription } from "@/lib/types";

type NavigationItem = {
  label: string;
  href?: string;
  action?: "about" | "contact";
};
export function StorefrontNavigation({
  subscription,
  location,
  preview = false,
}: {
  subscription: Partial<Subscription>;
  location?: Location;
  preview?: boolean;
}) {
  const items: NavigationItem[] =
    subscription.header_mode === "custom"
      ? (subscription.header_links ?? [])
          .filter(
            (l) =>
              l.label.trim() &&
              (l.destination === "storefront" || validWebsiteUrl(l.url)),
          )
          .map((l) => ({
            label: l.label,
            href: l.destination === "website" ? l.url : "#shop-welcome",
          }))
      : [
          { label: "Home", href: "#shop-welcome" },
          { label: "Shop", href: "#shop-products" },
          { label: "About", action: "about" },
          { label: "Contact", action: "contact" },
        ];
  const container = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(0);
  const [dialog, setDialog] = useState<"menu" | "about" | "contact" | null>(
    null,
  );
  const labels = items.map((i) => i.label).join("\n");
  useEffect(() => {
    const element = container.current;
    const measurement = measure.current;
    if (!element || !measurement) return;
    function resize() {
      const available = element!.clientWidth;
      const widths = Array.from(measurement!.children).map(
        (c) => c.getBoundingClientRect().width,
      );
      const total = widths.reduce((a, b) => a + b, 0);
      let count = widths.length,
        used = 0;
      if (total > available) {
        count = 0;
        for (const width of widths) {
          if (used + width + 80 > available) break;
          used += width;
          count++;
        }
      }
      setVisible(count);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    observer.observe(measurement);
    resize();
    return () => observer.disconnect();
  }, [labels]);
  function control(item: NavigationItem, index: number, measuring = false) {
    const common = { className: "shop-navigation-link" };
    if (measuring)
      return (
        <span key={index} {...common}>
          {item.label}
        </span>
      );
    if (item.href)
      return (
        <a
          key={index}
          {...common}
          href={preview ? "#" : item.href}
          onClick={(e) => {
            if (preview) e.preventDefault();
            setDialog(null);
          }}
        >
          {item.label}
        </a>
      );
    return (
      <button
        key={index}
        {...common}
        type="button"
        onClick={() => setDialog(item.action!)}
      >
        {item.label}
      </button>
    );
  }
  return (
    <div className="shop-navigation" ref={container}>
      <div className="shop-navigation-measure" ref={measure} aria-hidden="true">
        {items.map((item, i) => control(item, i, true))}
      </div>
      <nav
        aria-label={preview ? "Navigation preview" : "Business navigation"}
        className="shop-navigation-links"
      >
        {items.slice(0, visible).map((item, i) => control(item, i))}
        {visible < items.length && (
          <button
            type="button"
            className="shop-navigation-link shop-navigation-toggle"
            aria-haspopup="dialog"
            aria-expanded={dialog === "menu"}
            onClick={() => setDialog("menu")}
          >
            {visible ? "More" : "☰"}
            <span className="sr-only">
              {visible ? " navigation links" : "Open navigation menu"}
            </span>
          </button>
        )}
      </nav>
      {dialog && (
        <TaskDialog
          title={
            dialog === "menu"
              ? "Menu"
              : dialog === "about"
                ? "About"
                : "Contact"
          }
          close={() => setDialog(null)}
          className="shop-information-dialog"
          backdropClose
        >
          {dialog === "menu" ? (
            <nav aria-label="Menu links" className="shop-menu-links">
              {items.slice(visible).map((item, i) => control(item, i))}
            </nav>
          ) : dialog === "about" ? (
            <div className="stack">
              <h2>{subscription.name || "Your business"}</h2>
              <p>
                {subscription.description?.trim() ||
                  "Business information will be available here soon."}
              </p>
            </div>
          ) : location ? (
            <div className="stack">
              <h2>{location.name}</h2>
              <p>{location.address || "Address not provided."}</p>
              <p>{location.phone || "Phone not provided."}</p>
              <p className="shop-contact-hours">
                {location.hours || "Hours not provided."}
              </p>
            </div>
          ) : (
            <p>
              {preview
                ? "Contact shows the selected published location’s address, phone and hours."
                : "No published location information is available."}
            </p>
          )}
        </TaskDialog>
      )}
    </div>
  );
}
