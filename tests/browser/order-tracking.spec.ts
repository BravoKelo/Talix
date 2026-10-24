import { test, expect } from "@playwright/test";
for (const width of [1280, 768, 390]) {
  test(`fulfillment status is visible, current and announced only on changes at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.clock.install();
    const token = crypto.randomUUID();
    let order = {
      id: crypto.randomUUID(),
      order_number: 100001,
      total_cents: 1000,
      refunded_cents: 0,
      status: "received",
      payment_status: "paid",
      items: [],
      created_at: new Date().toISOString(),
      business_name: "Tracking fixture",
      location_name: "Main",
    };
    let reads = 0;
    await page.route("**/rest/v1/rpc/track_order", async (route) => {
      reads++;
      await route.fulfill({ json: order });
    });
    await page.goto(`/orders/${token}`);
    const status = page.getByRole("status");
    const progress = page.getByRole("list", { name: "Fulfillment progress" });
    await expect(status).toHaveText("Current status: received.");
    await expect(status).toHaveAttribute("aria-live", "polite");
    await expect(status).toHaveAttribute("aria-atomic", "true");
    await expect(progress.getByRole("listitem")).toHaveCount(4);
    await expect(progress.locator('[aria-current="step"]')).toContainText(
      "received",
    );
    await expect(progress.locator('[aria-current="step"]')).toContainText(
      "Current",
    );
    await status.evaluate((element) => {
      const changes: string[] = [];
      Object.assign(window, { trackingStatusChanges: changes });
      new MutationObserver(() =>
        changes.push(element.textContent ?? ""),
      ).observe(element, {
        subtree: true,
        childList: true,
        characterData: true,
      });
    });
    const changes = () =>
      page.evaluate(
        () =>
          (window as unknown as { trackingStatusChanges: string[] })
            .trackingStatusChanges,
      );
    for (let poll = 0; poll < 3; poll++) {
      const previousReads = reads;
      await page.clock.fastForward(10_000);
      await expect.poll(() => reads).toBeGreaterThan(previousReads);
      await page.clock.runFor(50);
    }
    expect(await changes()).toEqual([]);
    const expected: string[] = [];
    for (const step of ["in_progress", "ready", "completed"]) {
      order = { ...order, status: step };
      await page.clock.fastForward(10_000);
      const label = `Current status: ${step.replaceAll("_", " ")}.`;
      await expect(status).toHaveText(label);
      await expect(progress.locator('[aria-current="step"]')).toHaveCount(1);
      await expect(progress.locator('[aria-current="step"]')).toContainText(
        step.replaceAll("_", " "),
      );
      expected.push(label);
      await expect.poll(changes).toEqual(expected);
      await page.clock.fastForward(10_000);
      await page.clock.runFor(50);
      expect(await changes()).toEqual(expected);
    }
    // Controlled snapshots verify terminal/declined display, not server transitions.
    order = { ...order, status: "cancelled" };
    await page.clock.fastForward(10_000);
    await expect(status).toHaveText("Order cancelled.");
    await expect(progress.locator("[aria-current]")).toHaveCount(0);
    await expect(
      page.getByText("This order has been cancelled."),
    ).toBeVisible();
    order = { ...order, status: "received", payment_status: "declined" };
    await page.clock.fastForward(10_000);
    await expect(status).toHaveText(
      "Payment declined — fulfillment has not started.",
    );
    await expect(progress.locator("[aria-current]")).toHaveCount(0);
    await page.route(
      "**/rest/v1/rpc/retry_simulated_payment",
      async (route) => {
        order = { ...order, payment_status: "paid" };
        await route.fulfill({ json: null });
      },
    );
    const retry = page.getByRole("button", {
      name: "Simulate successful retry",
      exact: true,
    });
    await retry.focus();
    await page.keyboard.press("Enter");
    await expect(status).toHaveText("Current status: received.");
    await expect(progress.locator('[aria-current="step"]')).toContainText(
      "received",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await test
      .info()
      .attach("fulfillment-accessibility", {
        body: await progress.ariaSnapshot(),
        contentType: "text/plain",
      });
    await page.screenshot({
      path: `test-results/fulfillment-${test.info().project.name}-${width}.png`,
      fullPage: true,
    });
  });
}

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
