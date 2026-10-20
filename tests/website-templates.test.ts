import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WebsiteTemplateHero } from "../src/components/website-template-hero";
import type {
  Location,
  Product,
  Subscription,
  WebsiteTemplate,
} from "../src/lib/types";

const location: Location = {
  id: "main",
  subscription_id: "business",
  name: "Main",
  address: "100 Market Street",
  phone: "555-0100",
  hours: "Monday–Friday, 9–5",
  published: true,
};
const products: Product[] = [
  {
    id: "product",
    subscription_id: "business",
    location_id: null,
    name: "Everyday notebook",
    description: "A durable notebook for everyday plans.",
    price_cents: 1200,
    image_url: null,
    available: true,
    options: [],
  },
];
const expected: Record<WebsiteTemplate, string> = {
  order_first: "Shop available products",
  browse_shop: "Find something made for your day.",
  visit_order: "Order for this location",
  story_shop: "Made personal. Chosen with care.",
};

describe("approved website templates", () => {
  for (const [template, copy] of Object.entries(expected) as [
    WebsiteTemplate,
    string,
  ][]) {
    it("renders the complete " + template + " preview", () => {
      const subscription: Subscription = {
        id: "business",
        client_id: "client",
        name: "Useful Goods",
        slug: "useful-goods",
        accent: "#172a4d",
        description: "Locally selected products for useful everyday work.",
        website_template: template,
      };
      const html = renderToStaticMarkup(
        createElement(WebsiteTemplateHero, {
          subscription,
          location,
          products,
          preview: true,
        }),
      );
      expect(html).toContain(copy);
      expect(html).toContain("Featured products");
      expect(html).toContain("Clear information");
      expect(html).toContain("A business customers can know and trust.");
      expect(html).toContain("100 Market Street");
    });
  }
});
