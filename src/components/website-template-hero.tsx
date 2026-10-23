"use client";

import Image from "next/image";
import { displayImageUrl } from "@/lib/demo-image";
import {
  money,
  type Location,
  type Product,
  type Subscription,
} from "@/lib/types";
import { websiteHomepageProducts, websiteTemplates } from "@/lib/website";
import { ProductImage } from "./product-image";

function TemplateAction({
  preview,
  children,
  secondary = false,
}: {
  preview: boolean;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  const className = secondary
    ? "secondary website-template-action"
    : "button website-template-action";
  return preview ? (
    <span className={className}>{children}</span>
  ) : (
    <a className={className} href="#shop-products">
      {children}
    </a>
  );
}

function HeroImage({
  subscription,
  products,
}: {
  subscription: Subscription;
  products: Product[];
}) {
  const source = subscription.website_hero_url ?? products[0]?.image_url;
  return source ? (
    <Image
      width={960}
      height={760}
      unoptimized
      loading="eager"
      fetchPriority="high"
      src={displayImageUrl(source)}
      alt={
        subscription.website_hero_url
          ? subscription.name + " featured image"
          : products[0].name
      }
    />
  ) : (
    <div
      className="website-template-image-placeholder"
      role="img"
      aria-label="Featured business image not added"
    >
      <span aria-hidden="true">◇</span>
      <span>Add a hero image in Website Appearance</span>
    </div>
  );
}

function PreviewProducts({
  products,
  full = false,
}: {
  products: Product[];
  full?: boolean;
}) {
  return (
    <section
      className="website-template-products"
      aria-labelledby="template-products-title"
    >
      <div className="website-template-section-heading">
        <p className="eyebrow">SHOP THE COLLECTION</p>
        <h3 id="template-products-title">
          {full ? "Products" : "Featured products"}
        </h3>
        <p>
          {full
            ? "Available from the selected location."
            : "Explore a selection from this business. Open Shop to see all available products."}
        </p>
      </div>
      {products.length ? (
        <div className="website-template-product-grid">
          {products.map((product) => (
            <article key={product.id}>
              <ProductImage product={product} />
              <div>
                <h4>{product.name}</h4>
                <p>{product.description || "View this product for details."}</p>
                <strong>{money(product.price_cents)}</strong>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="website-template-empty">
          <strong>Online ordering is not ready</strong>
          <p>Products will appear here after they are published.</p>
        </div>
      )}
    </section>
  );
}

function introductionFrom(description: string) {
  const firstSentence = description.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  return firstSentence || description;
}

export function WebsiteTemplateFooter({
  subscription,
  location,
  preview = false,
}: {
  subscription: Subscription;
  location?: Location;
  preview?: boolean;
}) {
  return (
    <>
      <section className="website-template-about">
        <div>
          <p className="eyebrow">ABOUT {subscription.name.toUpperCase()}</p>
          <h2>About {subscription.name}</h2>
          <p>
            {subscription.description ||
              "Business information is not yet available."}
          </p>
        </div>
        <dl>
          <div>
            <dt>Visit</dt>
            <dd>{location?.address || "Address not provided"}</dd>
          </div>
          <div>
            <dt>Hours</dt>
            <dd>{location?.hours || "Hours not provided"}</dd>
          </div>
          <div>
            <dt>Call</dt>
            <dd>{location?.phone || "Phone not provided"}</dd>
          </div>
        </dl>
      </section>
      <footer className="website-template-footer">
        <div>
          <strong>{subscription.name}</strong>
          <span>{location?.address}</span>
        </div>
        {location?.phone &&
          (preview ? (
            <span className="secondary website-template-action">
              Call our team
            </span>
          ) : (
            <a
              className="secondary website-template-action"
              href={"tel:" + location.phone}
            >
              Call our team
            </a>
          ))}
      </footer>
    </>
  );
}

export function WebsiteTemplateHero({
  subscription,
  location,
  products,
  preview = false,
  previewView = "home",
  onPreviewNavigate,
}: {
  subscription: Subscription;
  location?: Location;
  products: Product[];
  preview?: boolean;
  previewView?: "home" | "shop";
  onPreviewNavigate?: (view: "home" | "shop") => void;
}) {
  const template =
    subscription.website_template ?? subscription.website_live_template;
  if (!template) return null;
  const templateName =
    websiteTemplates.find((item) => item.id === template)?.title ?? "Website";
  const description =
    subscription.description || "Business information is not yet available.";
  const introduction = introductionFrom(description);
  const locationLine = [location?.name, location?.address]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={"website-template-page template-" + template}
      data-template={template}
    >
      {preview && <p className="preview-banner">Preview — not live</p>}

      {preview && onPreviewNavigate && (
        <div
          className="website-template-actions"
          role="group"
          aria-label="Preview page"
        >
          <button
            type="button"
            className="secondary"
            aria-pressed={previewView === "home"}
            onClick={() => onPreviewNavigate("home")}
          >
            Home
          </button>
          <button
            type="button"
            className="secondary"
            aria-pressed={previewView === "shop"}
            onClick={() => onPreviewNavigate("shop")}
          >
            Shop
          </button>
        </div>
      )}

      {(!preview || previewView === "home") && (
        <div>
          {template === "order_first" && (
            <section className="website-template-hero website-order-hero">
              <div className="website-template-copy">
                <p className="eyebrow">{locationLine || templateName}</p>
                <h2>{subscription.name}</h2>
                <p>{introduction}</p>
                <div className="website-template-actions">
                  <TemplateAction preview={preview}>
                    Shop available products
                  </TemplateAction>
                  <TemplateAction preview={preview} secondary>
                    Location &amp; hours
                  </TemplateAction>
                </div>
              </div>
              <div className="website-template-media">
                <HeroImage subscription={subscription} products={products} />
                {products[0] && (
                  <div className="website-template-feature-card">
                    <span>FEATURED PRODUCT</span>
                    <strong>{products[0].name}</strong>
                    <small>{money(products[0].price_cents)}</small>
                  </div>
                )}
              </div>
            </section>
          )}

          {template === "browse_shop" && (
            <section className="website-template-hero website-browse-hero">
              <div className="website-template-media">
                <HeroImage subscription={subscription} products={products} />
              </div>
              <div className="website-template-copy">
                <p className="eyebrow">
                  EXPLORE {subscription.name.toUpperCase()}
                </p>
                <h2>Find something made for your day.</h2>
                <p>{introduction}</p>
                <TemplateAction preview={preview}>
                  Browse the collection
                </TemplateAction>
              </div>
              <div
                className="website-browse-categories"
                aria-label="Product categories"
              >
                {[
                  ...new Set(
                    products
                      .map((product) => product.category?.trim())
                      .filter(Boolean),
                  ),
                ]
                  .slice(0, 3)
                  .map((category) => (
                    <span key={category}>{category}</span>
                  ))}
              </div>
            </section>
          )}

          {template === "visit_order" && (
            <section className="website-template-hero website-visit-hero">
              <div className="website-template-location-card">
                <p className="eyebrow">PLAN YOUR VISIT</p>
                <h2>{subscription.name}</h2>
                <dl>
                  <div>
                    <dt>Find us</dt>
                    <dd>
                      {location?.address || "Location details coming soon"}
                    </dd>
                  </div>
                  <div>
                    <dt>Hours</dt>
                    <dd>{location?.hours || "Hours coming soon"}</dd>
                  </div>
                  <div>
                    <dt>Questions?</dt>
                    <dd>{location?.phone || "Contact details coming soon"}</dd>
                  </div>
                </dl>
                <TemplateAction preview={preview}>Shop online</TemplateAction>
              </div>
              <div className="website-template-media">
                <HeroImage subscription={subscription} products={products} />
              </div>
            </section>
          )}

          {template === "story_shop" && (
            <section className="website-template-hero website-story-hero">
              <div className="website-template-copy">
                <p className="eyebrow">
                  OUR STORY · {location?.name || "LOCAL BUSINESS"}
                </p>
                <h2>The story of {subscription.name}</h2>
                <p>{description}</p>
                <TemplateAction preview={preview}>
                  Discover our products
                </TemplateAction>
              </div>
              <div className="website-template-media">
                <HeroImage subscription={subscription} products={products} />
              </div>
            </section>
          )}

          {template === "browse_shop" && (
            <PreviewProducts
              products={websiteHomepageProducts(products, template)}
            />
          )}
          {!preview && (
            <div className="website-template-actions website-home-navigation">
              <a
                className="button website-template-action"
                href="#shop-products"
              >
                Shop
              </a>
            </div>
          )}
        </div>
      )}

      {!products.length && !preview && template !== "browse_shop" && (
        <div className="website-template-ordering-status">
          <strong>Online ordering is not ready</strong>
          <span>
            Published products will appear here when they are available.
          </span>
        </div>
      )}

      {preview && (
        <>
          {(template === "order_first" || previewView === "shop") && (
            <PreviewProducts products={products} full />
          )}
          <WebsiteTemplateFooter
            subscription={subscription}
            location={location}
            preview
          />
        </>
      )}
    </div>
  );
}
