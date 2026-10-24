import { test, expect, type Page } from "@playwright/test";
import { PGlite } from "@electric-sql/pglite";
import { initializeDatabase } from "../helpers/database";
import type { CheckoutAttempt } from "../../src/lib/checkout-attempt";

// Real migration SQL behind the browser adapter, not live Supabase/PostgREST.
async function checkoutDatabase() {
  const db = new PGlite();
  await initializeDatabase(db);
  const owner = crypto.randomUUID();
  await db.query("insert into auth.users(id,email) values($1,$2)", [
    owner,
    "owner@example.invalid",
  ]);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    owner,
  ]);
  const sid = (
    await db.query<{ id: string }>(
      "select public.create_workspace('Recovery shop','recovery-shop','North') as id",
    )
  ).rows[0].id;
  await db.exec("update public.locations set published=true");
  await db.query(
    "insert into public.products(subscription_id,name,price_cents,options) values($1,'Notebook',1000,$2)",
    [
      sid,
      JSON.stringify([{ id: "wrap", name: "Gift wrap", price_cents: 200 }]),
    ],
  );
  return db;
}

async function openCheckout(page: Page, name = "Alex") {
  await page.goto("/shop/recovery-shop");
  await page
    .getByRole("button", { name: "View Notebook", exact: true })
    .click();
  await page.getByLabel("Gift wrap").check();
  await page.getByRole("button", { name: /^Add to cart/ }).click();
  await page
    .getByRole("button", { name: "Your cart (1)", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Go to checkout", exact: true })
    .click();
  await page.getByLabel("Your name", { exact: true }).fill(name);
  await page.getByLabel("Email", { exact: true }).fill("alex@example.invalid");
  await page.getByLabel("Phone", { exact: true }).fill("5551234567");
}

async function sqlRpc(db: PGlite, name: string, body: Record<string, unknown>) {
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
  };
  if (!keys[name]) throw new Error("Unexpected RPC");
  const args = keys[name].map((key) => body[key]);
  return db.transaction(async (tx) => {
    await tx.exec("set local role anon");
    return (
      await tx.query<{ value: unknown }>(
        `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(",")}) as value`,
        args,
      )
    ).rows[0].value;
  });
}

test("committed but lost checkout keeps one locked attempt through retries", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const db = await checkoutDatabase();
  const requests: CheckoutAttempt[] = [];
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/rest/v1/rpc/**", async (route) => {
    const name = route.request().url().split("/").pop()!;
    const body = route.request().postDataJSON();
    if (name === "checkout_simulated") requests.push(body);
    const value = await sqlRpc(db, name, body);
    if (name === "checkout_simulated") {
      if (requests.length === 1) {
        await gate;
        await route.abort("failed");
        return;
      }
      if (requests.length === 2) {
        await route.fulfill({ status: 503, json: { message: "Unavailable" } });
        return;
      }
      if (requests.length === 3) {
        await route.fulfill({ json: { token: "invalid" } });
        return;
      }
      if (requests.length === 4) {
        await route.fulfill({
          status: 400,
          json: {
            code: "P0001",
            message: "Request already used with different details",
          },
        });
        return;
      }
    }
    await route.fulfill({ json: value });
  });
  try {
    await openCheckout(page);
    await page
      .getByRole("button", { name: "Place order with simulated payment" })
      .click();
    await expect.poll(() => requests.length).toBe(1);
    for (const name of ["Your name", "Email", "Phone"])
      await expect(page.getByLabel(name, { exact: true })).toBeDisabled();
    await expect(page.getByLabel("Test outcome")).toBeDisabled();
    await expect(page.getByLabel("Choose a location")).toBeDisabled();
    const dialog = page.getByRole("dialog", { name: "Checkout", exact: true });
    for (const name of ["Close", "Back to cart", "Cancel checkout"])
      await expect(
        dialog.getByRole("button", { name, exact: true }),
      ).toBeDisabled();
    // Two submit events in the same task must not bypass disabled buttons.
    await page.locator(".shop-checkout-step form").evaluate((form) => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    for (let n = 0; n < 6; n++) await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(100);
    expect(requests).toHaveLength(1);
    release();
    const retry = page.getByRole("button", {
      name: "Retry this order",
      exact: true,
    });
    await expect(retry).toBeEnabled();
    await expect(page.locator("#checkout-status")).toContainText(
      "couldn’t confirm",
    );
    // Even DOM-level value changes cannot alter the retained request snapshot.
    await page.getByLabel("Phone", { exact: true }).evaluate((el) => {
      (el as HTMLInputElement).value = "5559999999";
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    for (let n = 2; n <= 4; n++) {
      await retry.focus();
      await page.keyboard.press("Enter");
      await expect.poll(() => requests.length).toBe(n);
      await expect(retry).toBeEnabled();
      await expect(page.getByLabel("Phone", { exact: true })).toBeDisabled();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeVisible();
    }
    expect(
      requests.every(
        (request) => JSON.stringify(request) === JSON.stringify(requests[0]),
      ),
    ).toBe(true);
    expect((await db.query("select id from public.orders")).rows).toHaveLength(
      1,
    );
    await page.screenshot({
      path: `test-results/checkout-unknown-${test.info().project.name}.png`,
    });
    await retry.click();
    await expect(page).toHaveURL(/\/orders\/[a-f0-9-]+/);
    await expect(
      page.getByText("Simulated payment · paid", { exact: true }),
    ).toBeVisible();
    expect(requests).toHaveLength(5);
    expect(
      requests.every(
        (request) => JSON.stringify(request) === JSON.stringify(requests[0]),
      ),
    ).toBe(true);
    expect((await db.query("select id from public.orders")).rows).toHaveLength(
      1,
    );
    expect(
      (await db.query("select id from public.payment_events")).rows,
    ).toHaveLength(1);
    expect(
      (
        await db.query<{ items: { options: { name: string }[] }[] }>(
          "select items from public.orders",
        )
      ).rows[0].items[0].options[0].name,
    ).toBe("Gift wrap");
    expect(errors).toEqual([]);
  } finally {
    release();
    await db.close();
  }
});

test("definitive SQL rejection permits correction and confirmed return permits a new order", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const db = await checkoutDatabase();
  const requests: CheckoutAttempt[] = [];
  await page.route("**/rest/v1/rpc/**", async (route) => {
    const name = route.request().url().split("/").pop()!;
    const body = route.request().postDataJSON();
    if (name === "checkout_simulated") requests.push(body);
    try {
      await route.fulfill({ json: await sqlRpc(db, name, body) });
    } catch (error) {
      // Preserve the actual PostgreSQL error code as PostgREST does.
      const failure = error as { code: string; message: string };
      await route.fulfill({
        status: 400,
        json: { code: failure.code, message: failure.message },
      });
    }
  });
  try {
    await openCheckout(page, " ");
    await page
      .getByRole("button", { name: "Place order with simulated payment" })
      .click();
    await expect(page.locator("#checkout-status")).toContainText(
      "No order was placed",
    );
    expect((await db.query("select id from public.orders")).rows).toHaveLength(
      0,
    );
    await expect(
      page.getByRole("button", { name: "Back to cart", exact: true }),
    ).toBeEnabled();
    await page.getByLabel("Your name", { exact: true }).fill("Alex");
    await page
      .getByRole("button", { name: "Place order with simulated payment" })
      .click();
    await expect(page).toHaveURL(/\/orders\/[a-f0-9-]+/);
    await page.getByRole("link", { name: "Return to storefront" }).click();
    await openCheckout(page);
    await page
      .getByRole("button", { name: "Place order with simulated payment" })
      .click();
    await expect(page).toHaveURL(/\/orders\/[a-f0-9-]+/);
    expect(new Set(requests.map((request) => request.p_request)).size).toBe(3);
    expect((await db.query("select id from public.orders")).rows).toHaveLength(
      2,
    );
  } finally {
    await db.close();
  }
});
