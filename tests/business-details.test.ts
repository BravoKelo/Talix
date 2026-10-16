import { describe, expect, it } from "vitest";
import {
  businessErrors,
  formatAddress,
  formatPhone,
  normalizeBusiness,
  sameQuote,
  subscriptionProblem,
} from "../src/lib/business-details";
const address = formatAddress({
  street: "100 Main Road",
  unit: "Suite 2",
  city: "Seattle",
  region: "WA",
  postal: "98101",
  country: "United States",
});
const business = {
  business_name: "Independent shop",
  contact_name: "José O’Neil",
  phone: "(206) 555-0123",
  billing_address: address,
  location_name: "Main",
  location_address: address,
  slug: "Independent-Shop",
};
describe("signup details", () => {
  it("normalizes contact information without forcing English names", () => {
    expect(businessErrors(normalizeBusiness(business))).toEqual({});
    expect(formatPhone(business.phone)).toBe("+12065550123");
    expect(formatPhone("+44 (20) 7946 0123")).toBe("+442079460123");
    expect(businessErrors({ ...business, contact_name: "山田太郎" })).toEqual(
      {},
    );
  });
  it("identifies invalid fields and incomplete addresses", () => {
    expect(
      businessErrors({
        ...business,
        contact_name: "Alex123",
        phone: "call me",
        slug: "https://shop.com",
        billing_address: "100 Main",
      }),
    ).toMatchObject({
      contact_name: expect.any(String),
      phone: expect.any(String),
      "billing_address.city": expect.any(String),
      "billing_address.postal": expect.any(String),
    });
  });
  it("routes business errors to business details and preserves retryable selections", () => {
    expect(
      subscriptionProblem("That store address is already taken.").area,
    ).toBe("business");
    expect(subscriptionProblem("Please review the latest price.").area).toBe(
      "plan",
    );
    expect(subscriptionProblem().area).toBe("retry");
    expect(
      sameQuote(
        { total: 39, items: [{ id: 1, name: "Plan" }] },
        { items: [{ name: "Plan", id: 1 }], total: 39 },
      ),
    ).toBe(true);
    expect(sameQuote({ total: 39 }, { total: 59 })).toBe(false);
  });
});
