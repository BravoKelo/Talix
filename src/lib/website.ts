import type {
  Location,
  Product,
  Subscription,
  WebsitePath,
  WebsiteTemplate,
} from "./types";

export const websitePaths: {
  id: WebsitePath;
  title: string;
  description: string;
}[] = [
  {
    id: "existing",
    title: "Use my existing website",
    description:
      "Keep your current website and link customers to your Talix ordering page.",
  },
  {
    id: "talix_template",
    title: "Use a Talix template",
    description:
      "Create an included, mobile-friendly website connected to your catalog.",
  },
  {
    id: "deferred",
    title: "Decide later",
    description:
      "Continue to your workspace now. You can return here at any time.",
  },
];

export const websiteTemplates: {
  id: WebsiteTemplate;
  title: string;
  description: string;
  bestFor: string;
}[] = [
  {
    id: "order_first",
    title: "Order First",
    description: "Puts products and the next ordering action first.",
    bestFor: "Businesses whose customers usually arrive ready to buy",
  },
  {
    id: "browse_shop",
    title: "Browse & Shop",
    description: "Helps customers explore collections before choosing.",
    bestFor: "Businesses with a broad or frequently changing catalog",
  },
  {
    id: "visit_order",
    title: "Visit & Order",
    description: "Leads with location, hours, contact details, and ordering.",
    bestFor: "Local businesses where an in-person visit matters",
  },
  {
    id: "story_shop",
    title: "Story & Shop",
    description: "Introduces the business story before the catalog.",
    bestFor: "Brands whose background and craft help customers decide",
  },
];

export function validExistingWebsite(value: string) {
  if (!value || value.length > 2048 || /[\s\u0000-\u001f\u007f\\]/.test(value))
    return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !!url.hostname &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function websiteProductsForLocation(
  products: Product[],
  locationId: string | null | undefined,
) {
  if (!locationId) return [];
  return products.filter(
    (product) =>
      product.available &&
      (product.location_id === null || product.location_id === locationId),
  );
}

// Share homepage selection with metadata and private previews. Popularity is
// not measured; Browse & Shop features the first three eligible catalog items.
export function websiteHomepageProducts(
  products: Product[],
  template: WebsiteTemplate | null | undefined,
) {
  if (template === "order_first") return products;
  if (template === "browse_shop") return products.slice(0, 3);
  return [];
}

export function websiteReadiness(
  subscription: Subscription,
  locations: Location[],
  products: Product[],
) {
  const publishedLocations = locations.filter((location) => location.published);
  const eligibleProducts = products.filter(
    (product) =>
      product.available &&
      (product.location_id === null ||
        publishedLocations.some(
          (location) => location.id === product.location_id,
        )),
  );
  return [
    {
      label: "Clear business description",
      ready: subscription.description.trim().length >= 40,
      action: "Tell customers what makes your business useful and distinct.",
    },
    {
      label: "Contact details and hours",
      ready:
        publishedLocations.length > 0 &&
        publishedLocations.every(
          (location) =>
            !!location.address.trim() &&
            !!location.phone.trim() &&
            !!location.hours.trim(),
        ),
      action: "Publish a location with a current address, phone, and hours.",
    },
    {
      label: "Useful business photo",
      ready: !!(subscription.logo_url || subscription.header_photo_url),
      action: "Add a logo or header photo customers will recognize.",
    },
    {
      label: "Helpful product content",
      ready:
        eligibleProducts.length > 0 &&
        eligibleProducts.every(
          (product) => !!product.description.trim() && !!product.image_url,
        ),
      action: "Give available products clear descriptions and images.",
    },
  ];
}
