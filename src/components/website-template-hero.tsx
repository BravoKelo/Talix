import type { Location, Product, Subscription } from "@/lib/types";
import { websiteTemplates } from "@/lib/website";

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
  const name = websiteTemplates.find((item) => item.id === template)?.title;
  return (
    <section className={`website-template-hero template-${template}`}>
      {preview && <p className="preview-banner">Preview — not live</p>}
      <div>
        <p className="eyebrow">{name}</p>
        <h2>{subscription.name}</h2>
        <p>
          {subscription.description ||
            "Tell customers what makes your business special."}
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
          <dt>Shop</dt>
          <dd>
            {products.length
              ? `${products.length} available ${products.length === 1 ? "product" : "products"}`
              : "Online ordering is not ready"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
