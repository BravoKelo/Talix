"use client";

import Image from "next/image";
import { displayImageUrl } from "@/lib/demo-image";
import {
  money,
  type Location,
  type Product,
  type Subscription,
} from "@/lib/types";
import { websiteTemplates } from "@/lib/website";
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

function PreviewProducts({ products }: { products: Product[] }) {
  return (
    <section
      className="website-template-products"
      aria-labelledby="template-products-title"
    >
      <div className="website-template-section-heading">
        <p className="eyebrow">SHOP THE COLLECTION</p>
        <h3 id="template-products-title">Featured products</h3>
        <p>Explore popular choices available from this business.</p>
      </div>
      {products.length ? (
        <div className="website-template-product-grid">
          {products.slice(0, 3).map((product) => (
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

function TrustStrip() {
  return (
    <section
      className="website-template-trust"
      aria-label="Business commitments"
    >
      <strong>Clear information</strong>
      <strong>Local service</strong>
      <strong>Simple online ordering</strong>
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
      <TrustStrip />
      <section className="website-template-about">
        <div>
          <p className="eyebrow">ABOUT {subscription.name.toUpperCase()}</p>
          <h2>A business customers can know and trust.</h2>
          <p>
            {subscription.description ||
              "Share what makes your business useful, distinct, and ready to help."}
          </p>
        </div>
        <dl>
          <div>
            <dt>Visit</dt>
            <dd>{location?.address || "Add a published location address"}</dd>
          </div>
          <div>
            <dt>Hours</dt>
            <dd>{location?.hours || "Add your current hours"}</dd>
          </div>
          <div>
            <dt>Call</dt>
            <dd>{location?.phone || "Add a customer phone number"}</dd>
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
}: {
  subscription: Subscription;
  location?: Location;
  products: Product[];
  preview?: boolean;
}) {
  const template =
    subscription.website_template ?? subscription.website_live_template;
  if (!template) return null;
  const templateName =
    websiteTemplates.find((item) => item.id === template)?.title ?? "Website";
  const description =
    subscription.description ||
    "Discover useful products and personal service from a local business.";
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
                <span>POPULAR NOW</span>
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
            <p className="eyebrow">EXPLORE {subscription.name.toUpperCase()}</p>
            <h2>Find something made for your day.</h2>
            <p>{introduction}</p>
            <TemplateAction preview={preview}>
              Browse the collection
            </TemplateAction>
          </div>
          <div
            className="website-browse-categories"
            aria-label="Popular categories"
          >
            <span>New arrivals</span>
            <span>Customer favorites</span>
            <span>Everyday essentials</span>
          </div>
        </section>
      )}

      {template === "visit_order" && (
        <section className="website-template-hero website-visit-hero">
          <div className="website-template-location-card">
            <p className="eyebrow">VISIT OR ORDER ONLINE</p>
            <h2>{subscription.name}</h2>
            <dl>
              <div>
                <dt>Find us</dt>
                <dd>{location?.address || "Location details coming soon"}</dd>
              </div>
              <div>
                <dt>Today&apos;s hours</dt>
                <dd>{location?.hours || "Hours coming soon"}</dd>
              </div>
              <div>
                <dt>Questions?</dt>
                <dd>{location?.phone || "Contact details coming soon"}</dd>
              </div>
            </dl>
            <TemplateAction preview={preview}>
              Order for this location
            </TemplateAction>
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
            <h2>Made personal. Chosen with care.</h2>
            <p>{introduction}</p>
            <blockquote>
              “The details matter—from what we offer to how we welcome every
              customer.”
            </blockquote>
            <TemplateAction preview={preview}>
              Discover our products
            </TemplateAction>
          </div>
          <div className="website-template-media">
            <HeroImage subscription={subscription} products={products} />
          </div>
        </section>
      )}

      {!products.length && (
        <div className="website-template-ordering-status">
          <strong>Online ordering is not ready</strong>
          <span>
            Published products will appear here when they are available.
          </span>
        </div>
      )}

      {preview && (
        <>
          <PreviewProducts products={products} />
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
