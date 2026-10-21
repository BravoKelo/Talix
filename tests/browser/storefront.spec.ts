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

test("launched template without products presents the business without empty commerce controls", async ({
  page,
}) => {
  await mockCatalog(page, {
    ...catalog,
    subscription: {
      ...catalog.subscription,
      website_live_template: "order_first",
    },
    products: [],
  });

  await page.goto("/shop/example");
  await expect(
    page
      .locator(".website-template-hero")
      .getByRole("heading", { name: "Example store", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Online ordering is not ready")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Business commitments" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "A business customers can know and trust.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Your cart/ })).toHaveCount(0);
  await expect(page.getByPlaceholder("Search products")).toHaveCount(0);
  await expect(page.locator(".shop-menu-toggle")).toHaveCount(0);
});

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
    page.getByRole("status").filter({ hasText: /^1 product$/ }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "View Everyday notebook" }),
  ).toHaveCount(0);
  await page.getByLabel("Search products").fill("unmatched");
  await expect(page.getByText("No products match your search.")).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: /^0 products$/ }),
  ).toHaveCount(1);
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
    page.getByRole("button", { name: "Your cart (0)", exact: true }),
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
  await page
    .getByRole("button", { name: "Your cart (3)", exact: true })
    .click();
  const cart = page.locator(".shop-cart-dialog");
  await expect(cart).toBeVisible();
  await expect(
    cart.getByLabel("Quantity for Everyday notebook").first(),
  ).toHaveText("2");
  await expect(cart.getByText("$34.00", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Your name", { exact: true })).toHaveCount(0);
  await cart
    .getByRole("button", { name: "Remove Everyday notebook", exact: true })
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
  await cart
    .getByRole("button", { name: "Continue shopping", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Your cart (2)", exact: true }),
  ).toBeFocused();
  await page.getByLabel("Choose a location").selectOption("South");
  await page
    .getByRole("button", { name: "Your cart (0)", exact: true })
    .click();
  await expect(
    cart.getByText("Your cart is empty", { exact: true }),
  ).toBeVisible();
  await cart
    .getByRole("button", { name: "Continue shopping", exact: true })
    .click();
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
  await page
    .getByRole("button", { name: "Your cart (0)", exact: true })
    .click();
  await expect(
    page.getByText("Your cart is empty", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Go to checkout", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
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
      logo_url: "http://127.0.0.1:3100/test-product.svg?identity=logo",
      header_photo_url:
        "http://127.0.0.1:3100/test-product.svg?identity=header",
      website_hero_url: "http://127.0.0.1:3100/test-product.svg?identity=hero",
      website_live_template: "order_first",
      header_background: "#000000",
      storefront_button: "#ffffff",
      storefront_font: "serif",
      tile_corners: "round",
    },
  });
  await page.goto("/shop/example");
  await expect(page.getByLabel("Choose a location")).toHaveValue("Empty");
  await expect(page.locator(".shop-logo img")).toHaveAttribute(
    "src",
    /identity=logo/,
  );
  await expect(page.locator(".shop-centered-identity img")).toHaveAttribute(
    "src",
    /identity=header/,
  );
  await expect(page.locator(".website-template-media img")).toHaveAttribute(
    "src",
    /identity=hero/,
  );
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

test("cart popup quantities, close/focus, empty state and checkout payload", async ({
  page,
}) => {
  await mockCatalog(page, catalog);
  let submitted: Record<string, unknown> | undefined;
  await page.route("**/rest/v1/rpc/checkout_simulated", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      status: 400,
      json: { message: "Verification decline" },
    });
  });
  await page.goto("/shop/example");
  await expect(page.locator("#shop-cart")).toHaveCount(0);
  await expect(page.getByLabel("Your name", { exact: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Add Everyday notebook to cart", exact: true })
    .click();
  const opener = page.getByRole("button", { name: /^Your cart/ });
  await opener.click();
  const cart = page.locator(".shop-cart-dialog");
  await expect(cart).toBeVisible();
  const bounds = await cart.boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(440);
  expect(bounds!.height).toBe(await page.evaluate(() => innerHeight));
  await cart
    .getByRole("button", { name: "Increase Everyday notebook quantity" })
    .click();
  await expect(cart.getByLabel("Quantity for Everyday notebook")).toHaveText(
    "2",
  );
  await expect(cart.getByText("$20.00", { exact: true }).first()).toBeVisible();
  await cart
    .getByRole("button", { name: "Decrease Everyday notebook quantity" })
    .click();
  await expect(
    cart.getByRole("button", { name: "Decrease Everyday notebook quantity" }),
  ).toBeDisabled();
  await page.screenshot({
    path: `test-results/cart-popup-${test.info().project.name}.png`,
  });
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await opener.click();
  await cart
    .getByRole("button", { name: "Go to checkout", exact: true })
    .click();
  await cart.getByLabel("Your name", { exact: true }).fill("Example Shopper");
  await cart
    .getByLabel("Email", { exact: true })
    .fill("shopper@example.invalid");
  await cart.getByLabel("Phone", { exact: true }).fill("5551234567");
  await cart
    .getByRole("button", { name: "Place order with simulated payment" })
    .click();
  await expect(cart.getByRole("status")).toContainText("Unable to place order");
  expect(submitted?.p_lines).toEqual([
    { product_id: "shared", option_ids: [], quantity: 1 },
  ]);
  expect(submitted?.p_location).toBe("North");
  await cart.getByRole("button", { name: "Back to cart", exact: true }).click();
  await cart
    .getByRole("button", { name: "Remove Everyday notebook", exact: true })
    .click();
  await expect(
    cart.getByText("Your cart is empty", { exact: true }),
  ).toBeVisible();
  await cart
    .getByRole("button", { name: "Continue shopping", exact: true })
    .click();
  await expect(opener).toBeFocused();
});

test("five header presets preserve shopping, responsive layout and collapsing actions", async ({
  page,
}) => {
  for (const layout of ["centered", "left", "two_row", "search", "minimal"]) {
    await mockCatalog(page, {
      ...catalog,
      subscription: { ...catalog.subscription, header_layout: layout },
      products: [
        ...catalog.products,
        ...Array.from({ length: 12 }, (_, i) =>
          product("item" + i, "Item " + i),
        ),
      ],
    });
    await page.goto("/shop/example");
    await expect(page.locator(".figma-store")).toHaveClass(
      new RegExp("header-" + layout),
    );
    await expect(
      page.getByRole("heading", { name: "Example store", exact: true }),
    ).toBeVisible();
    const search = page.locator('input[type="search"]:visible');
    await expect(search).toHaveCount(1);
    await search.fill("notebook");
    await expect(
      page.getByRole("button", { name: "View Canvas bag", exact: true }),
    ).toHaveCount(0);
    await search.fill("");
    await page.screenshot({
      path: `test-results/header-${layout}-${test.info().project.name}.png`,
    });
    await page.evaluate(() => window.scrollTo(0, 600));
    await expect(page.locator(".shop-header")).toHaveClass(/is-compact/);
    await expect(
      page.getByRole("button", { name: "Your cart (0)", exact: true }),
    ).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("bundled demo images load from the current preview origin", async ({
  page,
}) => {
  const origin =
    "https://talix-git-feature-core-storefront-visual-shopping-bravokelo.vercel.app";
  await page.route(`${origin}/**`, (route) =>
    route.fulfill({ status: 401, body: "Protected preview" }),
  );
  await mockCatalog(page, {
    ...catalog,
    subscription: {
      ...catalog.subscription,
      logo_url: `${origin}/demo-retail/logo.svg`,
    },
    products: [
      {
        ...product("demo", "Demo notebook"),
        image_url: `${origin}/demo-retail/everyday-notebook.svg`,
      },
    ],
  });
  await page.goto("/shop/example");
  for (const name of ["Demo notebook", "Example store logo"]) {
    const img = page.getByRole("img", { name, exact: true });
    await expect(img).toBeVisible();
    await expect
      .poll(() =>
        img.evaluate(
          (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
        ),
      )
      .toBe(true);
    expect(
      await img.evaluate((el: HTMLImageElement) => new URL(el.src).origin),
    ).toBe(new URL(page.url()).origin);
  }
});

test("standard navigation uses saved content, follows the selected location and preserves the cart", async ({
  page,
}) => {
  await mockCatalog(page, {
    ...catalog,
    subscription: {
      ...catalog.subscription,
      header_mode: "standard",
      header_layout: "search",
    },
    products: [
      ...catalog.products,
      ...Array.from({ length: 12 }, (_, i) => product("item" + i, "Item " + i)),
    ],
  });
  await page.goto("/shop/example");
  await expect(page.locator(".figma-store")).toHaveClass(/header-centered/);
  async function navigate(name: string) {
    const link = page
      .getByRole("navigation", { name: "Business navigation", exact: true })
      .getByRole("button", { name, exact: true });
    if (!(await link.count()))
      await page
        .getByRole("button", {
          name: /Open navigation menu|More navigation links/,
        })
        .click();
    await page.getByRole("button", { name, exact: true }).click();
  }
  for (const button of await page
    .getByRole("navigation", { name: "Business navigation", exact: true })
    .getByRole("button")
    .all()) {
    await expect(button).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  }
  await navigate("About");
  await expect(
    page.getByRole("dialog", { name: "About", exact: true }),
  ).toContainText(catalog.subscription.description);
  await page.keyboard.press("Escape");
  await navigate("Contact");
  await expect(
    page.getByRole("dialog", { name: "Contact", exact: true }),
  ).toContainText("North Street");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Choose a location" })
    .selectOption("South");
  await navigate("Contact");
  await expect(
    page.getByRole("dialog", { name: "Contact", exact: true }),
  ).toContainText("South Street");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Add Everyday notebook to cart", exact: true })
    .click();
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect(page.locator(".shop-header")).toHaveClass(/is-compact/);
  const menu = page.getByRole("button", {
    name: "Open navigation menu",
    exact: false,
  });
  await expect(menu).toBeInViewport();
  expect(
    await menu.evaluate((el) => el.getBoundingClientRect().height),
  ).toBeGreaterThanOrEqual(48);
  await menu.click();
  await page
    .getByRole("navigation", { name: "Menu links" })
    .getByRole("link", { name: "Home", exact: true })
    .click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(10);
  await page
    .getByRole("button", { name: "Your cart (1)", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Everyday notebook");
  await page.keyboard.press("Escape");
  await page.screenshot({
    path: `test-results/navigation-standard-${test.info().project.name}.png`,
  });
});

test("custom navigation handles long links and overflow for every preset", async ({
  page,
}) => {
  for (const layout of [
    "centered",
    "left",
    "two_row",
    "search",
    "minimal",
  ] as const) {
    await mockCatalog(page, {
      ...catalog,
      subscription: {
        ...catalog.subscription,
        header_mode: "custom",
        header_layout: layout,
        header_links: Array.from({ length: 8 }, (_, i) => ({
          label: i === 7 ? "Order online" : "Long website navigation link " + i,
          destination: i === 7 ? "storefront" : "website",
          url: i === 7 ? "" : "https://example.com/page/" + i,
        })),
      },
    });
    await page.goto("/shop/example");
    const more = page.getByRole("button", {
      name: /More navigation links|Open navigation menu/,
    });
    await expect(more).toBeVisible();
    await more.click();
    await expect(
      page
        .getByRole("navigation", { name: "Menu links" })
        .getByRole("link", { name: "Order online" }),
    ).toHaveAttribute("href", "#shop-welcome");
    await expect(
      page
        .getByRole("navigation", { name: "Menu links" })
        .getByRole("link", { name: "Long website navigation link 6" }),
    ).toHaveAttribute("href", "https://example.com/page/6");
    await page.keyboard.press("Escape");
    await expect(more).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/navigation-${layout}-${test.info().project.name}.png`,
    });
  }
});

test("tablet headers remain compact, touch friendly and use business colors", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  for (const layout of [
    "centered",
    "left",
    "two_row",
    "search",
    "minimal",
  ] as const) {
    await mockCatalog(page, {
      ...catalog,
      subscription: {
        ...catalog.subscription,
        header_mode: "custom",
        header_layout: layout,
        header_background: "#174b91",
        header_links: [
          {
            label: "Our business",
            destination: "website",
            url: "https://example.com",
          },
          { label: "Order online", destination: "storefront", url: "" },
        ],
      },
      products: [
        ...catalog.products,
        ...Array.from({ length: 12 }, (_, i) =>
          product("tablet" + i, "Tablet item " + i),
        ),
      ],
    });
    await page.goto("/shop/example");
    const nav = page.getByRole("navigation", {
      name: "Business navigation",
      exact: true,
    });
    const first = nav.locator("a,button").first();
    await expect(first).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(first).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    for (const control of await nav.locator("a,button").all()) {
      await expect(control).toHaveCSS("color", "rgb(255, 255, 255)");
      await expect(control).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    }
    expect(
      await first.evaluate((el) => el.getBoundingClientRect().height),
    ).toBeGreaterThanOrEqual(48);
    await page.evaluate(() => window.scrollTo(0, 600));
    await expect(page.locator(".shop-header")).toHaveClass(/is-compact/);
    await expect
      .poll(() =>
        page
          .locator(".shop-header")
          .evaluate((el) => el.getBoundingClientRect().height),
      )
      .toBeLessThanOrEqual(64);
    await expect(
      page.getByRole("button", { name: "Your cart (0)", exact: true }),
    ).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/navigation-tablet-${layout}-${test.info().project.name}.png`,
    });
    await page.setViewportSize({ width: 320, height: 780 });

    await expect(
      page.getByRole("button", { name: "Your cart (0)", exact: true }),
    ).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect
      .poll(() =>
        page
          .locator(".shop-header")
          .evaluate((el) => el.getBoundingClientRect().height),
      )
      .toBeLessThanOrEqual(64);
    await page.screenshot({
      path: `test-results/navigation-narrow-${layout}-${test.info().project.name}.png`,
    });
    await page.setViewportSize({ width: 768, height: 1024 });
  }
});
