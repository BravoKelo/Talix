import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { initializeDatabase } from "./helpers/database";
const db = new PGlite();
const owner = crypto.randomUUID(),
  outsider = crypto.randomUUID(),
  employee = crypto.randomUUID(),
  admin = crypto.randomUUID();
let retail: string, restaurant: string, retailPlan: string, targetPlan: string;
async function as(id: string | null, role = "authenticated") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    id ?? "",
  ]);
  await db.exec("set role " + role);
}
async function rpc<T = Record<string, unknown>>(
  name: string,
  args: unknown[],
): Promise<T> {
  return (
    await db.query<{ value: T }>(
      `select public.${name}(${args.map((_, i) => "$" + (i + 1)).join(",")}) value`,
      args,
    )
  ).rows[0].value;
}
async function fixture() {
  await as(owner);
  const quote = await rpc("subscription_quote", [retail, retailPlan, []]);
  const sid = await rpc<string>("start_subscription", [
    crypto.randomUUID(),
    {
      business_name: "Example business",
      contact_name: "Owner",
      phone: "+15551234567",
      billing_address: "123 Main, Seattle, WA, 98101, United States",
      location_name: "Main",
      location_address: "123 Main, Seattle, WA, 98101, United States",
      slug: "unused",
    },
    retail,
    retailPlan,
    [],
    quote,
  ]);
  return sid;
}
beforeAll(async () => {
  await initializeDatabase(db);
  for (const id of [owner, outsider, employee, admin])
    await db.query("insert into auth.users(id,email) values($1,$2)", [
      id,
      `${id}@example.invalid`,
    ]);
  await db.query("insert into private.talix_admins values($1)", [admin]);
  const types = (
    await db.query<{ id: string; name: string }>(
      "select id,name from public.business_types",
    )
  ).rows;
  retail = types.find((t) => t.name === "Retail")!.id;
  restaurant = types.find((t) => t.name === "Restaurant")!.id;
  retailPlan = (
    await db.query<{ id: string }>(
      "select id from public.talix_offerings where business_type_id=$1 and name='Starter'",
      [retail],
    )
  ).rows[0].id;
  targetPlan = (
    await db.query<{ id: string }>(
      "select id from public.talix_offerings where business_type_id=$1 and name='Plus'",
      [restaurant],
    )
  ).rows[0].id;
});
afterAll(async () => db.close());
describe.sequential("owner industry changes and private tracking", () => {
  it("enforces owner-only quote/confirmation, owner/admin-only history, and denies direct writes", async () => {
    const sid = await fixture();
    await db.exec("reset role");
    await db.query(
      "insert into public.memberships(subscription_id,user_id,role) values($1,$2,'employee')",
      [sid, employee],
    );
    for (const id of [outsider, employee, admin]) {
      await as(id);
      await expect(
        rpc("subscription_change_quote", [sid, restaurant, targetPlan, [], 0]),
      ).rejects.toThrow("Owner access");
      await expect(
        rpc("confirm_subscription_change", [
          sid,
          crypto.randomUUID(),
          restaurant,
          targetPlan,
          [],
          {},
          0,
        ]),
      ).rejects.toThrow("owner access");
      if (id !== admin)
        await expect(rpc("subscription_change_state", [sid])).rejects.toThrow(
          "Owner access",
        );
    }
    await as(admin);
    expect((await rpc("subscription_change_state", [sid])).version).toBe(0);
    await as(owner);
    await expect(
      db.query(
        "update public.subscriptions set business_type_id=$1 where id=$2",
        [restaurant, sid],
      ),
    ).rejects.toThrow("permission denied");
    await expect(
      db.exec("delete from public.subscription_changes"),
    ).rejects.toThrow("permission denied");
    await expect(
      db.exec("insert into public.subscription_changes default values"),
    ).rejects.toThrow("permission denied");
    await expect(
      db.exec("update public.subscription_changes set version=99"),
    ).rejects.toThrow("permission denied");
    await expect(
      db.exec("select request_payload from public.subscription_changes"),
    ).rejects.toThrow("permission denied");
    await as(null, "anon");
    await expect(rpc("subscription_change_state", [sid])).rejects.toThrow(
      "permission denied",
    );
  });
  it("retains purchases and business data, records reviewed terms, and safely retries once", async () => {
    const sid = await fixture();
    await db.exec("reset role");
    const original = (
      await db.query(
        "select * from public.subscription_purchases where subscription_id=$1",
        [sid],
      )
    ).rows;
    const locations = (
      await db.query(
        "select * from public.locations where subscription_id=$1",
        [sid],
      )
    ).rows;
    await db.query(
      "insert into public.products(subscription_id,name,price_cents) values($1,'Example item',1500)",
      [sid],
    );
    const products = (
      await db.query("select * from public.products where subscription_id=$1", [
        sid,
      ])
    ).rows;
    const identity = (
      await db.query(
        "select id,slug,client_id,name from public.subscriptions where id=$1",
        [sid],
      )
    ).rows;
    await as(owner);
    const review = await rpc("subscription_change_quote", [
      sid,
      restaurant,
      targetPlan,
      [],
      0,
    ]);
    const request = crypto.randomUUID(),
      args = [sid, request, restaurant, targetPlan, [], review.selection, 0];
    const state = await rpc("confirm_subscription_change", args);
    expect(state.version).toBe(1);
    expect(state.selection).toEqual(review.selection);
    expect(state.history).toHaveLength(1);
    expect(await rpc("confirm_subscription_change", args)).toEqual(state);
    await expect(
      rpc("confirm_subscription_change", [
        sid,
        request,
        restaurant,
        targetPlan,
        [],
        {},
        0,
      ]),
    ).rejects.toThrow("different selection");
    await db.exec("reset role");
    expect(
      (
        await db.query(
          "select * from public.subscription_purchases where subscription_id=$1",
          [sid],
        )
      ).rows,
    ).toEqual(original);
    expect(
      (
        await db.query(
          "select * from public.locations where subscription_id=$1",
          [sid],
        )
      ).rows,
    ).toEqual(locations);
    expect(
      (
        await db.query(
          "select * from public.products where subscription_id=$1",
          [sid],
        )
      ).rows,
    ).toEqual(products);
    expect(
      (
        await db.query(
          "select id,slug,client_id,name from public.subscriptions where id=$1",
          [sid],
        )
      ).rows,
    ).toEqual(identity);
    expect(
      (
        await db.query<{ business_type_id: string }>(
          "select business_type_id from public.subscriptions where id=$1",
          [sid],
        )
      ).rows[0].business_type_id,
    ).toBe(restaurant);
    await as(owner);
    const next = await rpc("subscription_change_quote", [
      sid,
      retail,
      retailPlan,
      [],
      1,
    ]);
    await rpc("confirm_subscription_change", [
      sid,
      crypto.randomUUID(),
      retail,
      retailPlan,
      [],
      next.selection,
      1,
    ]);
    const replay = await rpc("confirm_subscription_change", args);
    expect(replay.version).toBe(2);
    expect(replay.history).toHaveLength(2);
    expect(replay.selection).toEqual(next.selection);
  });
  it("requires re-review for price changes, stale versions and withdrawn plans", async () => {
    const sid = await fixture();
    const reviewed = await rpc("subscription_change_quote", [
      sid,
      restaurant,
      targetPlan,
      [],
      0,
    ]);
    await db.exec("reset role");
    await db.query(
      "update public.talix_offerings set price_cents=price_cents+1 where id=$1",
      [targetPlan],
    );
    await as(owner);
    await expect(
      rpc("confirm_subscription_change", [
        sid,
        crypto.randomUUID(),
        restaurant,
        targetPlan,
        [],
        reviewed.selection,
        0,
      ]),
    ).rejects.toThrow("latest price");
    const latest = await rpc("subscription_change_quote", [
      sid,
      restaurant,
      targetPlan,
      [],
      0,
    ]);
    await rpc("confirm_subscription_change", [
      sid,
      crypto.randomUUID(),
      restaurant,
      targetPlan,
      [],
      latest.selection,
      0,
    ]);
    await expect(
      rpc("subscription_change_quote", [sid, retail, retailPlan, [], 0]),
    ).rejects.toThrow("subscription changed");
    await db.exec("reset role");
    await db.query(
      "update public.talix_offerings set active=false where id=$1",
      [retailPlan],
    );
    await as(owner);
    await expect(
      rpc("subscription_change_quote", [sid, retail, retailPlan, [], 1]),
    ).rejects.toThrow("no longer available");
    await db.exec("reset role");
    await db.query(
      "update public.talix_offerings set active=true where id=$1",
      [retailPlan],
    );
  });
  it("rejects incompatible extras, no-op industry selection and unconfirmed owners", async () => {
    const sid = await fixture();
    await expect(
      rpc("subscription_change_quote", [sid, retail, retailPlan, [], 0]),
    ).rejects.toThrow("different industry");
    await expect(
      rpc("subscription_change_quote", [sid, restaurant, retailPlan, [], 0]),
    ).rejects.toThrow("no longer available");
    await expect(
      rpc("subscription_change_quote", [
        sid,
        restaurant,
        targetPlan,
        [retailPlan],
        0,
      ]),
    ).rejects.toThrow("extra");
    const review = await rpc("subscription_change_quote", [
      sid,
      restaurant,
      targetPlan,
      [],
      0,
    ]);
    await db.exec("reset role");
    await db.query(
      "update auth.users set email_confirmed_at=null where id=$1",
      [owner],
    );
    await as(owner);
    await expect(
      rpc("confirm_subscription_change", [
        sid,
        crypto.randomUUID(),
        restaurant,
        targetPlan,
        [],
        review.selection,
        0,
      ]),
    ).rejects.toThrow("Confirmed owner");
    await db.exec("reset role");
    await db.query(
      "update auth.users set email_confirmed_at=now() where id=$1",
      [owner],
    );
  });
  it("rechecks ownership at confirmation after a review", async () => {
    const sid = await fixture();
    const review = await rpc("subscription_change_quote", [
      sid,
      restaurant,
      targetPlan,
      [],
      0,
    ]);
    await db.exec("reset role");
    await db.query(
      "update public.memberships set role='employee' where user_id=$1 and subscription_id=$2",
      [owner, sid],
    );
    try {
      await as(owner);
      await expect(
        rpc("confirm_subscription_change", [
          sid,
          crypto.randomUUID(),
          restaurant,
          targetPlan,
          [],
          review.selection,
          0,
        ]),
      ).rejects.toThrow("owner access");
    } finally {
      await db.exec("reset role");
      await db.query(
        "update public.memberships set role='owner' where user_id=$1 and subscription_id=$2",
        [owner, sid],
      );
    }
  });
  it("returns only whitelisted branding with a valid private token", async () => {
    const sid = await fixture();
    await db.exec("reset role");
    const lid = (
      await db.query<{ id: string }>(
        "update public.locations set published=true where subscription_id=$1 returning id",
        [sid],
      )
    ).rows[0].id;
    const pid = (
      await db.query<{ id: string }>(
        "insert into public.products(subscription_id,name,price_cents) values($1,'Example item',1500) returning id",
        [sid],
      )
    ).rows[0].id;
    const checkout = await rpc("checkout_simulated", [
      lid,
      crypto.randomUUID(),
      {
        name: "Shopper",
        email: "private@example.invalid",
        phone: "+15551234567",
      },
      [{ product_id: pid, quantity: 1, option_ids: [] }],
      "approved",
    ]);
    await as(null, "anon");
    const tracked = await rpc("track_order", [checkout.token]);
    expect(Object.keys(tracked.storefront as object).sort()).toEqual(
      [
        "name",
        "slug",
        "logo_url",
        "header_background",
        "storefront_text",
        "storefront_button",
        "storefront_font",
        "storefront_text_size",
      ].sort(),
    );
    expect(JSON.stringify(tracked)).not.toContain("private@example.invalid");
    expect((tracked.storefront as Record<string, unknown>).slug).toBeTruthy();
    expect(await rpc("track_order", [crypto.randomUUID()])).toBeNull();
    await expect(
      db.query("select private_token from public.orders"),
    ).rejects.toThrow("permission denied");
  });
});
