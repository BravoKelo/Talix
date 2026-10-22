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
  visit_order: "PLAN YOUR VISIT",
  story_shop: "The story of Useful Goods",
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
      expect(html).toContain("About Useful Goods");
      expect(html).toContain("100 Market Street");
      expect(html.includes('id="template-products-title"')).toBe(
        template === "order_first" || template === "browse_shop",
      );
      expect(html).not.toContain("popular choices");
      expect(html).not.toContain("Customer favorites");
      expect(html).not.toContain("blockquote");
    });
  }

  it("limits featured products and shows the complete preview catalog only in Shop", () => {
    const subscription: Subscription = {
      id: "business",
      client_id: "client",
      name: "Useful Goods",
      slug: "goods",
      accent: "#172a4d",
      description: "Saved business story.",
      website_template: "browse_shop",
    };
    const many = Array.from({ length: 5 }, (_, i) => ({
      ...products[0],
      id: `item-${i}`,
      name: `Item ${i}`,
    }));
    const home = renderToStaticMarkup(
      createElement(WebsiteTemplateHero, {
        subscription,
        location,
        products: many,
        preview: true,
      }),
    );
    expect(home).toContain("Item 2");
    expect(home).not.toContain("Item 3");
    const shop = renderToStaticMarkup(
      createElement(WebsiteTemplateHero, {
        subscription,
        location,
        products: many,
        preview: true,
        previewView: "shop",
      }),
    );
    expect(shop).toContain("Item 4");
  });
});
