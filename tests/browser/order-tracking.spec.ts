import { test, expect } from "@playwright/test";
test("private tracking uses business branding and returns without private headers", async ({
  page,
}) => {
  const token = crypto.randomUUID();
  const order = {
    id: crypto.randomUUID(),
    order_number: 100001,
    total_cents: 1000,
    refunded_cents: 0,
    status: "ready",
    payment_status: "paid",
    items: [],
    created_at: new Date().toISOString(),
    business_name: "Example business",
    location_name: "Main",
    storefront: {
      name: "Example business",
      slug: "example-business",
      logo_url: "https://images.example.invalid/fail.png",
      header_background: "#def0e4",
      storefront_font: "serif",
      storefront_text_size: "large",
    },
  };
  let response: unknown = order;
  await page.route("http://127.0.0.1:3290/rest/v1/rpc/track_order", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(response),
    }),
  );
  await page.route("https://images.example.invalid/fail.png", (route) =>
    route.abort(),
  );
  await page.route(
    "http://127.0.0.1:3290/rest/v1/rpc/public_catalog",
    (route) => route.fulfill({ contentType: "application/json", body: "null" }),
  );
  await page.goto(`/orders/${token}`);
  await expect(page.locator(".tracking-initial")).toHaveText("E");
  await expect(page.locator(".tracking-header")).toHaveCSS(
    "background-color",
    "rgb(222, 240, 228)",
  );
  await expect(page.locator(".business-tracking")).toHaveCSS(
    "font-family",
    "Georgia, serif",
  );
  await expect(page.locator(".business-tracking")).toHaveCSS(
    "font-size",
    "19px",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute(
    "content",
    "no-referrer",
  );
  const returnedHeaders: Record<string, string>[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/shop/example-business")
      returnedHeaders.push(request.headers());
  });
  await page.getByRole("link", { name: "Return to storefront" }).click();
  await expect(page).toHaveURL(/\/shop\/example-business$/);
  expect(returnedHeaders.length).toBeGreaterThan(0);
  for (const headers of returnedHeaders) {
    expect(headers.referer).toBeUndefined();
    expect(JSON.stringify(headers)).not.toContain(token);
  }
  response = { ...order, storefront: undefined };
  await page.goto(`/orders/${crypto.randomUUID()}`);
  await expect(page.locator("body > .topbar")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Return to storefront" }),
  ).toHaveCount(0);
  response = null;
  await page.goto(`/orders/${crypto.randomUUID()}`);
  await expect(page.getByRole("status")).toContainText("Order not found");
  await expect(page.locator(".tracking-header")).toHaveCount(0);
  await expect(page.locator("body > .topbar")).toBeHidden();
});
