import { test, expect } from "@playwright/test";
import { PGlite } from "@electric-sql/pglite";
import { initializeDatabase } from "../helpers/database";
// This adapter exercises real SQL but does not replace live Supabase/PostgREST/Auth verification.
test("location → catalog → decline → retry → fulfillment → refund", async ({
  page,
}) => {
  const db = new PGlite();
  await initializeDatabase(db);
  const owner = crypto.randomUUID();
  await db.query("insert into auth.users(id,email) values($1,$2)", [
    owner,
    "owner@example.com",
  ]);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    owner,
  ]);
  const s = (
    await db.query<{ id: string }>(
      "select public.create_workspace('Acme','acme-shop','Downtown') as id",
    )
  ).rows[0].id;
  const lid = (
    await db.query<{ id: string }>("select id from public.locations")
  ).rows[0].id;
  await db.query("update public.locations set published=true");
  await db.query(
    "insert into public.products(subscription_id,name,description,price_cents,options) values($1,'Notebook','A useful everyday product',1000,$2)",
    [s, JSON.stringify([{ id: "wrap", name: "Gift wrap", price_cents: 200 }])],
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("http://127.0.0.1:3290/rest/v1/rpc/**", async (route) => {
    const name = route.request().url().split("/").pop()!;
    const body = route.request().postDataJSON();
    const keys: Record<string, string[]> = {
      public_catalog: ["p_slug"],
      checkout_simulated: [
        "p_location",
        "p_request",
        "p_customer",
        "p_lines",
        "p_outcome",
      ],
      track_order: ["p_token"],
      retry_simulated_payment: ["p_token", "p_request", "p_outcome"],
    };
    try {
      if (!keys[name]) throw new Error("Unexpected RPC");
      const args = keys[name].map((k) => body[k]);
      const value = await db.transaction(async (tx) => {
        await tx.exec("set local role anon");
        const result = await tx.query<{ value: unknown }>(
          `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(",")}) as value`,
          args,
        );
        return result.rows[0].value;
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(value),
      });
    } catch (e) {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          message: e instanceof Error ? e.message : "Database error",
        }),
      });
    }
  });
  try {
    await page.goto("/shop/acme-shop");
    await expect(page.getByRole("heading", { name: "Acme" })).toBeVisible();
    await expect(
      page.getByText("Choose a location to view its products."),
    ).toBeVisible();
    await page.getByLabel("Choose a location").selectOption(lid);
    await page.getByLabel("Gift wrap").check();
    await page.getByRole("button", { name: "Add to cart" }).click();
    await page.getByLabel("Your name").fill("Alex");
    await page.getByLabel("Email", { exact: true }).fill("alex@example.com");
    await page.getByLabel("Phone", { exact: true }).fill("5551234567");
    await page.getByLabel("Test outcome").selectOption("declined");
    await page
      .getByRole("button", { name: "Place order with simulated payment" })
      .click();
    await expect(page).toHaveURL(/\/orders\/[a-f0-9-]+/);
    await expect(
      page.getByRole("heading", { name: "Payment declined" }),
    ).toBeVisible();
    await expect(
      page.getByText("$12.00", { exact: true }).first(),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Simulate successful retry" })
      .click();
    await expect(
      page.getByText("Simulated payment · paid", { exact: true }),
    ).toBeVisible();
    const order = (
      await db.query<{ id: string }>("select id from public.orders")
    ).rows[0].id;
    await db.query("select public.advance_order($1,'in_progress')", [order]);
    await db.query("select public.advance_order($1,'ready')", [order]);
    await page.reload();
    await expect(page.locator(".current")).toHaveText("ready");
    await db.query("select public.refund_simulated($1,$2,1200,'Full return')", [
      order,
      crypto.randomUUID(),
    ]);
    expect(
      (
        await db.query(
          "select id from public.order_events where order_id=$1 and status='cancelled'",
          [order],
        )
      ).rows,
    ).toHaveLength(1);
    await page.reload();
    await expect(
      page.getByText("This order has been cancelled."),
    ).toBeVisible();
    await expect(page.getByText("Simulated refund: $12.00")).toBeVisible();
    await expect(page.getByText("alex@example.com")).toHaveCount(0);
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `test-results/customer-${test.info().project.name}.png`,
      fullPage: true,
    });
  } finally {
    await db.close();
  }
});
