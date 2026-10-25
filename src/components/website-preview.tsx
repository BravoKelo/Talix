"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { headerLayout, storefrontStyle } from "@/lib/storefront-design";
import type { Location, Product, Subscription } from "@/lib/types";
import { StorefrontHeader } from "./storefront-header";
import { WebsiteTemplateHero } from "./website-template-hero";

const widths = { mobile: 390, tablet: 768, desktop: 1120 };
const previewDocument =
  '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>';

// A separate viewport keeps media queries and vw units faithful to the selected
// device. The frame contains only these private React components, never a public
// storefront URL or a second catalog/checkout client.
export function WebsitePreview({
  subscription,
  location,
  products,
  device,
}: {
  subscription: Subscription;
  location?: Location;
  products: Product[];
  device: keyof typeof widths;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [frameDocument, setFrameDocument] = useState<Document | null>(null);
  const [view, setView] = useState<"home" | "shop">("home");
  const width = widths[device];
  const scale = Math.min(1, availableWidth / width) || 1;

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setAvailableWidth(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function prepareDocument(frame: HTMLIFrameElement) {
    const target = frame.contentDocument;
    if (!target) return;
    // Reuse the application's styles, including development-injected styles.
    target.head
      .querySelectorAll("link[rel=stylesheet], style")
      .forEach((node) => node.remove());
    document
      .querySelectorAll("link[rel=stylesheet], style")
      .forEach((node) => target.head.appendChild(node.cloneNode(true)));
    setFrameDocument(target);
  }

  return (
    <div
      ref={container}
      className="website-preview-viewport"
      style={{ maxWidth: width }}
    >
      <iframe
        title="Private website preview"
        className="website-preview-frame"
        srcDoc={previewDocument}
        sandbox="allow-same-origin"
        onLoad={(event) => prepareDocument(event.currentTarget)}
        style={{ width, height: 678 / scale, transform: `scale(${scale})` }}
      />
      {frameDocument &&
        createPortal(
          <div
            className={`store visual-store figma-store website-preview-document header-${headerLayout(subscription)}`}
            style={storefrontStyle(subscription)}
            role="region"
            aria-label="Scrollable website preview"
            tabIndex={0}
          >
            <header className="shop-header">
              <StorefrontHeader
                subscription={subscription}
                location={location}
                preview
                onPreviewNavigate={setView}
              />
            </header>
            <WebsiteTemplateHero
              subscription={subscription}
              location={location}
              products={products}
              preview
              previewView={view}
              onPreviewNavigate={setView}
            />
          </div>,
          frameDocument.body,
        )}
    </div>
  );
}
