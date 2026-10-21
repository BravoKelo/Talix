import { expect, it } from "vitest";
import {
  standardHeaderLinks,
  validHeaderLinks,
  validWebsiteUrl,
} from "../src/lib/header-navigation";
import { headerLayout } from "../src/lib/storefront-design";
it("accepts storefront/HTTPS destinations and rejects unsafe URL forms", () => {
  for (const url of [
    "https://example.com",
    "https://example.com/a?b=c#d",
    "https://example.com:8443/a",
  ])
    expect(validWebsiteUrl(url)).toBe(true);
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "http://example.com",
    "//example.com",
    "https://user:pass@example.com",
    "https://example.com\\path",
    "https://example.com/with space",
    "https://",
    "https://example.com:99999",
  ])
    expect(validWebsiteUrl(url)).toBe(false);
  expect(
    validHeaderLinks([{ label: "Shop", destination: "storefront", url: "" }]),
  ).toBe(true);
  expect(validHeaderLinks(standardHeaderLinks)).toBe(true);
  expect(standardHeaderLinks.map((link) => link.label)).toEqual([
    "Home",
    "Shop",
    "About",
    "Contact",
  ]);
  expect(
    validHeaderLinks([{ label: "About us", destination: "about", url: "" }]),
  ).toBe(true);
  expect(
    validHeaderLinks([
      { label: "About us", destination: "about", url: "https://example.com" },
    ]),
  ).toBe(false);
  expect(
    validHeaderLinks([{ label: " ", destination: "storefront", url: "" }]),
  ).toBe(false);
  expect(
    validHeaderLinks(
      Array.from({ length: 9 }, () => ({
        label: "Shop",
        destination: "storefront" as const,
        url: "",
      })),
    ),
  ).toBe(false);
});
it("uses centered for standard and preserves custom and legacy layout choices", () => {
  expect(headerLayout({ header_mode: "standard", header_layout: "left" })).toBe(
    "centered",
  );
  expect(headerLayout({ header_mode: "custom", header_layout: "left" })).toBe(
    "left",
  );
  expect(headerLayout({ header_layout: "search" })).toBe("search");
});
