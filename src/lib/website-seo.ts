import type { Catalog } from "./types";
import { websiteProductsForLocation } from "./website";

const fallbackOrigin = "https://talix.app";

export function publicSiteOrigin() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL
      : fallbackOrigin);
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.hostname !== "localhost")
      return fallbackOrigin;
    return url.origin;
  } catch {
    return fallbackOrigin;
  }
}

export function websiteDescription(catalog: Catalog) {
  const description = catalog.subscription.description.trim();
  if (description) return description.slice(0, 300);
  return (
    "View products, location information, and online ordering from " +
    catalog.subscription.name +
    "."
  );
}

export function websiteStructuredData(catalog: Catalog, canonical: string) {
  const location =
    catalog.locations.find(
      (item) => item.id === catalog.subscription.default_location_id,
    ) ?? catalog.locations[0];
  const products = websiteProductsForLocation(
    catalog.products,
    location?.id,
  ).map((product) => ({
    "@type": "Product",
    "@id": canonical + "#product-" + product.id,
    name: product.name,
    description: product.description || undefined,
    image: product.image_url || undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (product.price_cents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      url: canonical + "#product-" + product.id,
    },
  }));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": canonical + "#business",
        name: catalog.subscription.name,
        url: canonical,
        description: websiteDescription(catalog),
        image:
          catalog.subscription.website_hero_url ||
          catalog.subscription.header_photo_url ||
          catalog.subscription.logo_url ||
          undefined,
        logo: catalog.subscription.logo_url || undefined,
        telephone: location?.phone || undefined,
        address: location?.address
          ? {
              "@type": "PostalAddress",
              streetAddress: location.address,
            }
          : undefined,
        hasOfferCatalog: products.length
          ? {
              "@type": "OfferCatalog",
              name: catalog.subscription.name + " products",
              itemListElement: products,
            }
          : undefined,
      },
      ...products,
    ],
  };
}
