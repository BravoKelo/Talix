import { test, expect } from "@playwright/test";
import type { Catalog, Product } from "../../src/lib/types";

const product = (
  id: string,
  name: string,
  location: string | null = null,
): Product => ({
  id,
  name,
  subscription_id: "business",
  location_id: location,
  description: "Thoughtful details for everyday use. ".repeat(20),
  price_cents: 1000,
  image_url: null,
  available: true,
  options: [{ id: "wrap", name: "Gift wrap", price_cents: 200 }],
});
const catalog: Catalog = {
  subscription: {
    id: "business",
    client_id: "private",
    slug: "example",
    name: "Example store",
    description: "Everyday essentials, thoughtfully chosen.",
    accent: "#ffffff",
    default_location_id: "North",
  },
  locations: ["North", "South", "Empty"].map((name) => ({
    id: name,
    subscription_id: "business",
    name,
    address: `${name} Street`,
    phone: "5551234567",
    hours: "Monday–Friday, 9–5",
    published: true,
  })),
  products: [
    {
      ...product("shared", "Everyday notebook"),
      image_url: "http://127.0.0.1:3100/test-product.svg",
    },
    product("north", "Canvas bag", "North"),
    {
      ...product("south", "Desk organizer", "South"),
      image_url: "http://127.0.0.1:3100/missing-product.png",
    },
  ],
};
async function mockCatalog(
  page: import("@playwright/test").Page,
  data: unknown,
) {
  await page.route("**/rest/v1/rpc/public_catalog", (route) =>
    route.fulfill({ json: data }),
  );
  await page.route("**/test-product.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="540"><rect width="720" height="540" fill="#d9e5e5"/><rect x="230" y="90" width="260" height="360" rx="12" fill="#315566"/><path d="M260 90v360" stroke="#e5b86d" stroke-width="8"/></svg>',
    }),
  );
  await page.route("**/missing-product.png", (route) =>
    route.fulfill({ status: 404, body: "Missing" }),
  );
}

test("visual shopping: keyboard details, scoped search, cart variants and location reset", async ({
  page,
}) => {
  await mockCatalog(page, {
    ...catalog,
    products: [
      ...catalog.products,
      { ...product("extra", "Travel pouch", "North"), category: "Travel" },
    ],
  });
  await page.goto("/shop/example");
  await expect(
    page.getByRole("heading", { name: "Example store" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Products", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Choose a location")).toHaveValue("North");
  await page.getByLabel("Choose a location").selectOption("North");
  await expect(
    page.getByRole("button", { name: "View Desk organizer" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("img", { name: "No image available for Canvas bag" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Everyday notebook", exact: true }),
  ).toBeVisible();
  const firstTile = page.locator(".shop-product-card").first();
  const secondTile = page.locator(".shop-product-card").nth(1);
  const firstBounds = await firstTile.boundingBox();
  const secondBounds = await secondTile.boundingBox();
  expect(firstBounds).not.toBeNull();
  expect(secondBounds).not.toBeNull();
  expect(firstBounds!.y).toBeLessThan(240);
  const columns = await page
    .locator(".catalog")
    .evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
    );
  expect(columns).toBe(test.info().project.name === "mobile" ? 2 : 3);
  await expect(page.locator("body > .topbar")).toBeHidden();
  await page.getByRole("button", { name: "Your account", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Business sign in", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Your account", exact: true }).click();
  expect(Math.abs(firstBounds!.y - secondBounds!.y)).toBeLessThan(2);
  await page.screenshot({
    path: `test-results/storefront-grid-${test.info().project.name}.png`,
    fullPage: true,
  });
  if (test.info().project.name === "mobile")
    await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "Travel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "View Travel pouch", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "View Everyday notebook", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "All products", exact: true }).click();
  if (test.info().project.name === "mobile")
    await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByLabel("Search products").fill("CANVAS");
  await expect(
    page.getByRole("button", { name: "View Everyday notebook" }),
  ).toHaveCount(0);
  await page.getByLabel("Search products").fill("unmatched");
  await expect(page.getByText("No products match your search.")).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  const opener = page.getByRole("button", {
    name: "View Everyday notebook",
    exact: true,
  });
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", {
    name: "Everyday notebook",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".shop-full-description")).toHaveText(
    catalog.products[0].description.trim(),
  );
  // Native modal focus stays inside, including when tabbing backwards from Close.
  await expect(
    dialog.getByRole("button", { name: "Close product" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect
    .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await expect(
    page.getByRole("link", { name: "Your cart (0)", exact: true }),
  ).toBeVisible();
  for (let i = 0; i < 2; i++) {
    await opener.click();
    const option = dialog.getByLabel("Gift wrap");
    await option.focus();
    await page.keyboard.press("Space");
    await expect(option).toBeChecked();
    await dialog
      .getByRole("button", { name: "Add to cart · $12.00", exact: true })
      .click();
    await expect(opener).toBeFocused();
  }
  await page
    .getByRole("button", { name: "Add Everyday notebook to cart", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  const cart = page.getByRole("complementary", { name: "Your cart" });
  await expect(
    cart.getByText("Everyday notebook × 2", { exact: true }),
  ).toBeVisible();
  await expect(cart.getByText("$34.00", { exact: true })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Storefront" })
    .getByRole("link", { name: "Your cart (3)" })
    .click();
  await expect(cart).toBeInViewport();
  await expect(page.locator(".shop-header")).toHaveClass(/is-compact/);
  await expect(
    page.getByRole("link", { name: "Your cart (3)" }),
  ).toBeInViewport();
  await cart
    .getByRole("button", { name: "Remove", exact: true })
    .last()
    .click();
  await expect(cart.getByText("$24.00", { exact: true }).last()).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `test-results/storefront-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel("Choose a location").selectOption("South");
  await expect(cart.getByText("Add a product to get started.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "View Canvas bag" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("img", { name: "No image available for Desk organizer" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Choose a location")).toHaveValue("North");
});

test("empty catalog, unpublished locations, loading and unavailable states", async ({
  page,
}) => {
  await mockCatalog(page, { ...catalog, products: [] });
  await page.goto("/shop/example");
  await page.getByLabel("Choose a location").selectOption("Empty");
  await expect(
    page.getByText("No products are available at this location."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Place order with simulated payment" }),
  ).toBeDisabled();
  await mockCatalog(page, { ...catalog, locations: [], products: [] });
  await page.reload();
  await expect(
    page.getByText("No locations are currently available for online ordering."),
  ).toBeVisible();
  await page.route("**/rest/v1/rpc/public_catalog", (route) =>
    route.fulfill({ json: null }),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Store unavailable" }),
  ).toBeVisible();
  await page.route("**/rest/v1/rpc/public_catalog", (route) => route.abort());
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Store unavailable" }),
  ).toBeVisible();
  await page.route("**/rest/v1/rpc/public_catalog", () => {});
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Loading store…" }),
  ).toBeVisible();
});

test("published-location fallback and saved photo/appearance render without an application header", async ({
  page,
}) => {
  await mockCatalog(page, {
    ...catalog,
    subscription: {
      ...catalog.subscription,
      default_location_id: "missing",
      header_identity: "photo",
      header_photo_url: "http://127.0.0.1:3100/test-product.svg",
      header_background: "#000000",
      storefront_button: "#ffffff",
      storefront_font: "serif",
      tile_corners: "round",
    },
  });
  await page.goto("/shop/example");
  await expect(page.getByLabel("Choose a location")).toHaveValue("Empty");
  await expect(page.locator(".shop-centered-identity img")).toBeVisible();
  await expect(page.locator(".figma-store")).toHaveCSS(
    "font-family",
    "Georgia, serif",
  );
  await expect(page.locator(".shop-header")).toHaveCSS(
    "background-color",
    "rgb(0, 0, 0)",
  );
  await expect(page.locator("body > .topbar")).toBeHidden();
  const icons = page.locator(".shop-icon");
  for (const icon of await icons.all()) {
    const bounds = await icon.boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(48);
    expect(bounds!.height).toBeGreaterThanOrEqual(48);
  }
  if (test.info().project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 740 });
    expect(
      await page
        .locator(".catalog")
        .evaluate(
          (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
        ),
    ).toBe(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
