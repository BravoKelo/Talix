import { describe, expect, it } from "vitest";
import type { Catalog } from "../src/lib/types";
import {
  websiteDescription,
  websiteStructuredData,
} from "../src/lib/website-seo";

const catalog: Catalog = {
  subscription: {
    id: "business",
    client_id: "client",
    name: "Useful Goods",
    slug: "useful-goods",
    accent: "#172a4d",
    description: "Locally selected products for useful everyday work.",
    default_location_id: "main",
    website_live_template: "browse_shop",
  },
  locations: [
    {
      id: "main",
      subscription_id: "business",
      name: "Main",
      address: "100 Market Street",
      phone: "555-0100",
      hours: "Monday–Friday, 9–5",
      published: true,
    },
    {
      id: "other",
      subscription_id: "business",
      name: "Other",
      address: "200 Market Street",
      phone: "555-0200",
      hours: "Monday–Friday, 10–6",
      published: true,
    },
  ],
  products: [
    {
      id: "product",
      subscription_id: "business",
      location_id: null,
      name: "Everyday notebook",
      description: "A durable notebook for everyday plans.",
      price_cents: 1200,
      image_url: "https://images.example/notebook.jpg",
      available: true,
      options: [],
    },
    {
      id: "main-product",
      subscription_id: "business",
      location_id: "main",
      name: "Main location item",
      description: "Available from the selected default location.",
      price_cents: 1800,
      image_url: "https://images.example/main.jpg",
      available: true,
      options: [],
    },
    {
      id: "other-product",
      subscription_id: "business",
      location_id: "other",
      name: "Other location item",
      description: "Available from another location.",
      price_cents: 2000,
      image_url: "https://images.example/other.jpg",
      available: true,
      options: [],
    },
  ],
};

describe("website search foundation", () => {
  it("uses the visible business description for search summaries", () => {
    expect(websiteDescription(catalog)).toBe(catalog.subscription.description);
  });

  it("emits matching LocalBusiness, Product, location, and offer data", () => {
    const data = websiteStructuredData(
      catalog,
      "https://talix.app/shop/useful-goods",
    );
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@graph"][0]).toMatchObject({
      "@type": "LocalBusiness",
      name: "Useful Goods",
      telephone: "555-0100",
      address: {
        "@type": "PostalAddress",
        streetAddress: "100 Market Street",
      },
    });
    expect(data["@graph"][1]).toMatchObject({
      "@type": "Product",
      name: "Everyday notebook",
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: "12.00",
        availability: "https://schema.org/InStock",
      },
    });
    expect(data["@graph"].map((item) => item.name).filter(Boolean)).toEqual([
      "Useful Goods",
      "Everyday notebook",
      "Main location item",
    ]);
  });

  it("includes only the selected template's visible homepage products", () => {
    const many = {
      ...catalog,
      products: Array.from({ length: 5 }, (_, i) => ({
        ...catalog.products[0],
        id: `p-${i}`,
        name: `Item ${i}`,
      })),
    };
    for (const [template, count] of [
      ["order_first", 5],
      ["browse_shop", 3],
      ["visit_order", 0],
      ["story_shop", 0],
    ] as const) {
      const data = websiteStructuredData(
        {
          ...many,
          subscription: {
            ...many.subscription,
            website_live_template: template,
          },
        },
        "https://talix.app/shop/goods",
      );
      expect(
        data["@graph"].filter((item) => item["@type"] === "Product"),
      ).toHaveLength(count);
    }
  });
});
