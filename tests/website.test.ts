import { describe, expect, it } from "vitest";
import {
  validExistingWebsite,
  websiteProductsForLocation,
  websiteReadiness,
} from "../src/lib/website";
import type { Location, Product, Subscription } from "../src/lib/types";

describe("website setup helpers", () => {
  it("accepts only safe HTTPS website addresses", () => {
    expect(validExistingWebsite("https://example.com/about?source=talix")).toBe(
      true,
    );
    for (const value of [
      "http://example.com",
      "https://user:secret@example.com",
      "https://example.com\\bad",
      "https://example.com/a b",
      "javascript:alert(1)",
    ]) {
      expect(validExistingWebsite(value)).toBe(false);
    }
  });

  it("derives plain-language readiness from authoritative business data", () => {
    const subscription = {
      id: "s",
      client_id: "c",
      name: "Example",
      slug: "example",
      accent: "#123456",
      description:
        "A sufficiently clear description of this useful local business.",
      logo_url: "https://example.com/logo.png",
    } satisfies Subscription;
    const locations = [
      {
        id: "l",
        subscription_id: "s",
        name: "Main",
        address: "1 Main Street",
        phone: "555-0100",
        hours: "Mon–Fri 9–5",
        published: true,
      },
    ] satisfies Location[];
    const products = [
      {
        id: "p",
        subscription_id: "s",
        location_id: null,
        name: "Item",
        description: "Useful details",
        price_cents: 100,
        image_url: "https://example.com/item.png",
        available: true,
        options: [],
      },
    ] satisfies Product[];
    expect(
      websiteReadiness(subscription, locations, products).every(
        (item) => item.ready,
      ),
    ).toBe(true);
  });

  it("limits website products to general and selected-location inventory", () => {
    const product = {
      subscription_id: "s",
      description: "Useful details",
      price_cents: 100,
      image_url: "https://example.com/item.png",
      available: true,
      options: [],
    } satisfies Omit<Product, "id" | "location_id" | "name">;
    const products = [
      { ...product, id: "general", location_id: null, name: "General" },
      { ...product, id: "main", location_id: "main", name: "Main" },
      { ...product, id: "other", location_id: "other", name: "Other" },
      {
        ...product,
        id: "unavailable",
        location_id: "main",
        name: "Unavailable",
        available: false,
      },
    ] satisfies Product[];

    expect(
      websiteProductsForLocation(products, "main").map((item) => item.id),
    ).toEqual(["general", "main"]);
    expect(websiteProductsForLocation(products, null)).toEqual([]);
  });
});
