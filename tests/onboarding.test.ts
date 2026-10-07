import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { initializeDatabase } from "./helpers/database";
const db = new PGlite();
const owner = crypto.randomUUID(),
  other = crypto.randomUUID(),
  admin = crypto.randomUUID(),
  unconfirmed = crypto.randomUUID();
let type: string, plan: string, addon: string, sid: string;
let quote: Record<string, unknown>;
const business = {
  business_name: "Independent shop",
  contact_name: "Alex Owner",
  phone: "+15551234567",
  billing_address: "100 Billing Road, Seattle, WA, 98101, United States",
  location_name: "Main shop",
  location_address: "200 Main Road, Seattle, WA, 98101, United States",
  slug: "independent-shop",
};
async function as(id: string | null, role = "authenticated") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    id ?? "",
  ]);
  await db.exec("set role " + role);
}
async function rpc<T = Record<string, unknown>>(name: string, args: unknown[]) {
  return (
    await db.query<{ value: T }>(
      `select public.${name}(${args.map((_, i) => "$" + (i + 1)).join(",")}) as value`,
      args,
    )
  ).rows[0].value;
}
beforeAll(async () => {
  await initializeDatabase(db);
  await db.query(
    "insert into auth.users(id,email) values($1,$2),($3,$4),($5,$6)",
    [
      owner,
      "owner@example.invalid",
      other,
      "other@example.invalid",
      admin,
      "admin@example.invalid",
    ],
  );
  await db.query(
    "insert into auth.users(id,email,email_confirmed_at) values($1,$2,null)",
    [unconfirmed, "unconfirmed@example.invalid"],
  );
  await db.query("insert into private.talix_admins values($1)", [admin]);
  type = (
    await db.query<{ id: string }>(
      "select id from public.business_types where name='Retail'",
    )
  ).rows[0].id;
  plan = (
    await db.query<{ id: string }>(
      "select id from public.talix_offerings where name='Starter' and business_type_id=$1",
      [type],
    )
  ).rows[0].id;
  addon = (
    await db.query<{ id: string }>(
      "select id from public.talix_offerings where name='Extra insights'",
    )
  ).rows[0].id;
});
afterAll(async () => db.close());
describe.sequential("customer signup and Talix offerings", () => {
  it("public can read active offerings and authoritative quotes, but not edit", async () => {
    await as(null, "anon");
    expect(
      (await db.query("select * from public.business_types")).rows,
    ).toHaveLength(3);
    quote = await rpc("subscription_quote", [type, plan, [addon]]);
    expect(quote.total_cents).toBe(3900);
    await expect(
      db.query("update public.talix_offerings set price_cents=1"),
    ).rejects.toThrow("permission denied");
    await expect(
      rpc("start_subscription", [
        crypto.randomUUID(),
        business,
        type,
        plan,
        [addon],
        quote,
      ]),
    ).rejects.toThrow("permission denied");
  });
  it("ordinary owners cannot edit offerings or grant themselves Talix admin", async () => {
    await as(owner);
    expect(await rpc<boolean>("talix_admin_access", [])).toBe(false);
    expect(
      (
        await db.query(
          "update public.talix_offerings set price_cents=1 returning id",
        )
      ).rows,
    ).toEqual([]);
    await expect(
      db.query("insert into public.business_types(name) values('Intrusion')"),
    ).rejects.toThrow("row-level security");
    await expect(
      db.query("insert into private.talix_admins values($1)", [owner]),
    ).rejects.toThrow("permission denied");
    await expect(
      rpc("create_workspace", ["Bypass", "bypass-shop", "Main"]),
    ).rejects.toThrow("permission denied");
  });
  it("rejects noncanonical contact and address formats before creating a subscription", async () => {
    await as(owner);
    for (const invalid of [
      { phone: "555" },
      { contact_name: "Alex123" },
      { billing_address: "100 Main" },
      { location_address: "200 Main" },
    ]) {
      await expect(
        rpc("start_subscription", [
          crypto.randomUUID(),
          { ...business, ...invalid },
          type,
          plan,
          [addon],
          quote,
        ]),
      ).rejects.toThrow(
        /phone number|contact name|billing address|location address/,
      );
    }
  });
  it("requires confirmation and complete business details", async () => {
    await as(unconfirmed);
    await expect(
      rpc("start_subscription", [
        crypto.randomUUID(),
        business,
        type,
        plan,
        [addon],
        quote,
      ]),
    ).rejects.toThrow("confirm your email");
    await as(owner);
    await expect(
      rpc("start_subscription", [
        crypto.randomUUID(),
        { ...business, contact_name: " " },
        type,
        plan,
        [addon],
        quote,
      ]),
    ).rejects.toThrow("complete your business");
  });
  it("rejects incompatible, duplicate, absent extras and tampered quotes", async () => {
    await as(owner);
    const different = (
      await db.query<{ id: string }>(
        "select id from public.business_types where name='Restaurant'",
      )
    ).rows[0].id;
    await expect(
      rpc("subscription_quote", [different, plan, []]),
    ).rejects.toThrow("plan is no longer");
    await expect(
      rpc("subscription_quote", [type, plan, [addon, addon]]),
    ).rejects.toThrow("only once");
    await expect(
      rpc("subscription_quote", [type, plan, [crypto.randomUUID()]]),
    ).rejects.toThrow("no longer available");
    await expect(
      rpc("start_subscription", [
        crypto.randomUUID(),
        business,
        type,
        plan,
        [addon],
        { ...quote, total_cents: 1 },
      ]),
    ).rejects.toThrow("latest price");
  });
  it("creates client, subscription, unpublished location and immutable terms atomically; repeat is safe", async () => {
    await as(owner);
    const id = crypto.randomUUID();
    const args = [id, business, type, plan, [addon], quote];
    sid = await rpc<string>("start_subscription", args);
    expect(await rpc("start_subscription", args)).toBe(sid);
    expect((await db.query("select * from public.clients")).rows).toHaveLength(
      1,
    );
    expect(
      (await db.query("select published,address from public.locations")).rows,
    ).toEqual([{ published: false, address: business.location_address }]);
    const purchases = (
      await db.query<{ total_cents: number }>(
        "select selection,total_cents from public.subscription_purchases",
      )
    ).rows;
    expect(purchases).toHaveLength(1);
    expect(purchases[0].total_cents).toBe(3900);
    await expect(
      rpc("start_subscription", [
        id,
        { ...business, phone: "+15551111111" },
        type,
        plan,
        [addon],
        quote,
      ]),
    ).rejects.toThrow("different selection");
    await expect(
      db.query("select request_payload from public.subscription_purchases"),
    ).rejects.toThrow("permission denied");
    await expect(
      db.query("update public.subscription_purchases set total_cents=1"),
    ).rejects.toThrow("permission denied");
    await expect(
      db.query("update public.subscriptions set business_type_id=null"),
    ).rejects.toThrow("permission denied");
  });
  it("admin edits affect new quotes but never rewrite existing subscription terms", async () => {
    await as(admin);
    expect(await rpc("talix_admin_access", [])).toBe(true);
    await db.query(
      "update public.talix_offerings set name='Starter revised',price_cents=4900 where id=$1",
      [plan],
    );
    expect(
      (await db.query("select contact_email from public.clients")).rows,
    ).toEqual([{ contact_email: "owner@example.invalid" }]);
    expect(
      (
        await db.query<{ total_cents: number }>(
          "select total_cents from public.subscription_purchases",
        )
      ).rows[0].total_cents,
    ).toBe(3900);
    await as(owner);
    await expect(
      rpc("start_subscription", [
        crypto.randomUUID(),
        { ...business, slug: "second-shop" },
        type,
        plan,
        [addon],
        quote,
      ]),
    ).rejects.toThrow("latest price");
    const current = await rpc("subscription_quote", [type, plan, [addon]]);
    expect(current.total_cents).toBe(5900);
    await rpc("start_subscription", [
      crypto.randomUUID(),
      { ...business, slug: "second-shop" },
      type,
      plan,
      [addon],
      current,
    ]);
    expect(
      (await db.query("select slug from public.subscriptions order by slug"))
        .rows,
    ).toEqual([{ slug: "independent-shop" }, { slug: "independent-shop-2" }]);
    expect((await db.query("select * from public.clients")).rows).toHaveLength(
      1,
    );
    expect(
      (await db.query("select id from public.subscriptions")).rows,
    ).toHaveLength(2);
  });
  it("cross-client reads cannot see business details or purchased terms", async () => {
    await as(other);
    expect((await db.query("select * from public.clients")).rows).toEqual([]);
    expect(
      (
        await db.query(
          "select selection,business_details from public.subscription_purchases",
        )
      ).rows,
    ).toEqual([]);
    await expect(
      db.query("insert into public.clients(owner_id) values($1)", [other]),
    ).rejects.toThrow("permission denied");
  });
  it("withdrawing a type or offering prevents new sales; admin retains editing and history", async () => {
    await as(admin);
    await db.query(
      "update public.business_types set active=false where id=$1",
      [type],
    );
    expect(
      (
        await db.query("select id from public.business_types where id=$1", [
          type,
        ])
      ).rows,
    ).toHaveLength(1);
    await as(owner);
    expect(
      (
        await db.query("select id from public.talix_offerings where id=$1", [
          plan,
        ])
      ).rows,
    ).toEqual([]);
    await expect(rpc("subscription_quote", [type, plan, []])).rejects.toThrow(
      "business type is no longer",
    );
    expect(
      (
        await db.query(
          "select subscription_id from public.subscription_purchases",
        )
      ).rows,
    ).toHaveLength(2);
    await as(admin);
    await db.query("update public.business_types set active=true where id=$1", [
      type,
    ]);
    await db.query(
      "update public.talix_offerings set active=false where id=$1",
      [addon],
    );
    await as(owner);
    await expect(
      rpc("subscription_quote", [type, plan, [addon]]),
    ).rejects.toThrow("no longer available");
  });
  it("withdrawn purchases can be safely retried without repricing or duplicate creation", async () => {
    await db.exec("reset role");
    const row = (
      await db.query<{
        request_id: string;
        request_payload: {
          business: typeof business;
          type: string;
          plan: string;
          addons: string[];
          quote: typeof quote;
        };
      }>(
        "select request_id,request_payload from public.subscription_purchases where subscription_id=$1",
        [sid],
      )
    ).rows[0];
    await as(owner);
    const p = row.request_payload;
    expect(
      await rpc("start_subscription", [
        row.request_id,
        p.business,
        p.type,
        p.plan,
        p.addons,
        p.quote,
      ]),
    ).toBe(sid);
  });
});
