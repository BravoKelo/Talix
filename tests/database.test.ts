import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { initializeDatabase } from "./helpers/database";
const db = new PGlite();
const owner = "11111111-1111-4111-8111-111111111111",
  employee = "22222222-2222-4222-8222-222222222222",
  outsider = "33333333-3333-4333-8333-333333333333";
let sid: string,
  lid: string,
  otherLocation: string,
  pid: string,
  token: string,
  oid: string;
async function asUser(id: string | null, role = "authenticated") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    id || "",
  ]);
  await db.exec(`set role ${role}`);
}
async function rpc<T = unknown>(name: string, args: unknown[]) {
  if (name === "create_workspace" && args[0] !== "Bad") {
    const type = (
      await db.query<{ id: string }>(
        "select id from public.business_types where name='Retail'",
      )
    ).rows[0].id;
    const plan = (
      await db.query<{ id: string }>(
        "select id from public.talix_offerings where kind='plan' and name='Starter' and business_type_id=$1",
        [type],
      )
    ).rows[0].id;
    const quote = await rpc("subscription_quote", [type, plan, []]);
    return await rpc("start_subscription", [
      crypto.randomUUID(),
      {
        business_name: args[0],
        slug: args[1],
        location_name: args[2],
        contact_name: "Owner",
        phone: "+15551234567",
        billing_address: "123 Main, Seattle, WA, 98101, United States",
        location_address: "123 Main, Seattle, WA, 98101, United States",
      },
      type,
      plan,
      [],
      quote,
    ]);
  }
  const result = await db.query<{ value: T }>(
    `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(",")}) as value`,
    args,
  );
  return result.rows[0].value;
}
const customer = {
  name: "Alex",
  email: "alex@example.com",
  phone: "5551234567",
};
const req = () => crypto.randomUUID();
beforeAll(async () => {
  await initializeDatabase(db);
  await db.query(
    "insert into auth.users(id,email) values ($1,$2),($3,$4),($5,$6)",
    [
      owner,
      "owner@example.com",
      employee,
      "worker@example.com",
      outsider,
      "other@example.com",
    ],
  );
  await asUser(owner);
  sid = await rpc<string>("create_workspace", [
    "Acme",
    "acme-shop",
    "Downtown",
  ]);
  lid = (await db.query<{ id: string }>("select id from public.locations"))
    .rows[0].id;
  otherLocation = (
    await db.query<{ id: string }>(
      "insert into public.locations(subscription_id,name,published) values($1,'Uptown',true) returning id",
      [sid],
    )
  ).rows[0].id;
  await db.query("update public.locations set published=true where id=$1", [
    lid,
  ]);
  pid = (
    await db.query<{ id: string }>(
      "insert into public.products(subscription_id,name,price_cents,options) values($1,'Notebook',1000,$2) returning id",
      [
        sid,
        JSON.stringify([{ id: "wrap", name: "Gift wrap", price_cents: 200 }]),
      ],
    )
  ).rows[0].id;
  await rpc("grant_location_access", [lid, "worker@example.com", "viewer"]);
});
afterAll(async () => db.close());
describe.sequential("core commerce database", () => {
  it("enforces tenant and employee location visibility", async () => {
    await asUser(employee);
    expect(
      (await db.query("select * from public.locations")).rows,
    ).toHaveLength(1);
    expect((await db.query("select * from public.products")).rows).toHaveLength(
      1,
    );
    expect(
      (await db.query("update public.products set price_cents=1 returning id"))
        .rows,
    ).toHaveLength(0);
    await expect(
      rpc("grant_location_access", [
        otherLocation,
        "worker@example.com",
        "fulfillment",
      ]),
    ).rejects.toThrow("Owner");
    await asUser(outsider);
    expect(
      (await db.query("select * from public.subscriptions")).rows,
    ).toHaveLength(0);
    expect((await db.query("select * from public.products")).rows).toHaveLength(
      0,
    );
  });
  it("prices from database, snapshots items and returns duplicate checkout once", async () => {
    await asUser(null, "anon");
    const request = req(),
      lines = [
        { product_id: pid, quantity: 2, option_ids: ["wrap"], price_cents: 1 },
      ];
    const a = await rpc<{ token: string }>("checkout_simulated", [
      lid,
      request,
      customer,
      lines,
      "approved",
    ]);
    token = a.token;
    expect(
      await rpc("checkout_simulated", [
        lid,
        request,
        customer,
        lines,
        "approved",
      ]),
    ).toEqual(a);
    await expect(
      rpc("checkout_simulated", [lid, request, customer, lines, "declined"]),
    ).rejects.toThrow("different details");
    const result = await rpc<{
      id: string;
      total_cents: number;
      items: unknown[];
    }>("track_order", [token]);
    oid = result.id;
    expect(result.total_cents).toBe(2400);
    expect(result).not.toHaveProperty("email");
    await expect(
      db.query(
        "select id,payment_status,status,refunded_cents from public.orders",
      ),
    ).rejects.toThrow("permission denied");
    await asUser(owner);
    expect(
      (
        await db.query(
          "select id,payment_status,status,refunded_cents from public.orders",
        )
      ).rows,
    ).toHaveLength(1);
    await db.query(
      "update public.products set name='Changed',price_cents=2000 where id=$1",
      [pid],
    );
    await asUser(null, "anon");
    expect(
      (await rpc<{ items: { name: string }[] }>("track_order", [token]))
        .items[0].name,
    ).toBe("Notebook");
  });
  it("rejects invalid carts, missing contact, wrong locations and forged options", async () => {
    await asUser(null, "anon");
    for (const lines of [
      [{ product_id: pid, quantity: 0, option_ids: [] }],
      [{ product_id: pid, quantity: 1, option_ids: ["fake"] }],
      [{ product_id: pid, quantity: 1, option_ids: ["wrap", "wrap"] }],
      [],
    ])
      await expect(
        rpc("checkout_simulated", [lid, req(), customer, lines, "approved"]),
      ).rejects.toThrow();
    await expect(
      rpc("checkout_simulated", [
        lid,
        req(),
        { ...customer, email: "" },
        [{ product_id: pid, quantity: 1, option_ids: [] }],
        "approved",
      ]),
    ).rejects.toThrow("required");
    await asUser(owner);
    const local = (
      await db.query<{ id: string }>(
        "insert into public.products(subscription_id,location_id,name,price_cents) values($1,$2,'Local',100) returning id",
        [sid, otherLocation],
      )
    ).rows[0].id;
    await asUser(null, "anon");
    await expect(
      rpc("checkout_simulated", [
        lid,
        req(),
        customer,
        [{ product_id: local, quantity: 1, option_ids: [] }],
        "approved",
      ]),
    ).rejects.toThrow("unavailable");
  });
  it("allows a declined payment to retry once without another order", async () => {
    await asUser(null, "anon");
    const { token: t } = await rpc<{ token: string }>("checkout_simulated", [
      lid,
      req(),
      customer,
      [{ product_id: pid, quantity: 1, option_ids: [] }],
      "declined",
    ]);
    expect(
      (await rpc<{ payment_status: string }>("track_order", [t]))
        .payment_status,
    ).toBe("declined");
    const key = req();
    await rpc("retry_simulated_payment", [t, key, "approved"]);
    await rpc("retry_simulated_payment", [t, key, "approved"]);
    expect(
      (await rpc<{ payment_status: string }>("track_order", [t]))
        .payment_status,
    ).toBe("paid");
    await expect(
      rpc("retry_simulated_payment", [t, req(), "approved"]),
    ).rejects.toThrow("already paid");
  });
  it("requires fulfillment role and valid status progression", async () => {
    await asUser(employee);
    await expect(rpc("advance_order", [oid, "in_progress"])).rejects.toThrow(
      "Fulfillment",
    );
    await asUser(owner);
    await rpc("grant_location_access", [
      lid,
      "worker@example.com",
      "fulfillment",
    ]);
    await asUser(employee);
    await expect(rpc("advance_order", [oid, "completed"])).rejects.toThrow(
      "transition",
    );
    await rpc("advance_order", [oid, "in_progress"]);
    await rpc("advance_order", [oid, "ready"]);
    await rpc("advance_order", [oid, "completed"]);
    await expect(
      rpc("refund_simulated", [oid, req(), 100, "Return"]),
    ).rejects.toThrow("Refund permission");
  });
  it("records partial/full refunds once and rejects over-refunds", async () => {
    await asUser(owner);
    const key = req();
    await rpc("refund_simulated", [oid, key, 400, "Partial return"]);
    await rpc("refund_simulated", [oid, key, 400, "Partial return"]);
    await expect(
      rpc("refund_simulated", [oid, req(), 2001, "Too much"]),
    ).rejects.toThrow("exceeds");
    await rpc("refund_simulated", [oid, req(), 2000, "Final return"]);
    const o = (
      await db.query<{
        payment_status: string;
        status: string;
        refunded_cents: number;
      }>(
        "select id,payment_status,status,refunded_cents from public.orders where id=$1",
        [oid],
      )
    ).rows[0];
    expect(o).toMatchObject({
      payment_status: "refunded",
      status: "completed",
      refunded_cents: 2400,
    });
    expect(
      (
        await db.query(
          "select * from public.payment_events where order_id=$1 and kind='refund'",
          [oid],
        )
      ).rows,
    ).toHaveLength(2);
  });
  it("removal of location access revokes data and actions", async () => {
    await asUser(owner);
    await rpc("grant_location_access", [lid, "worker@example.com", "none"]);
    await asUser(employee);
    expect(
      (
        await db.query(
          "select id,payment_status,status,refunded_cents from public.orders",
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (await db.query("select * from public.locations")).rows,
    ).toHaveLength(0);
    await expect(rpc("advance_order", [oid, "ready"])).rejects.toThrow(
      "Fulfillment",
    );
  });
  it("rejects null carts and prevents anonymous workspace creation", async () => {
    await asUser(null, "anon");
    await expect(
      rpc("create_workspace", ["Bad", "bad-shop", "Bad"]),
    ).rejects.toThrow("permission denied");
    await expect(
      rpc("checkout_simulated", [lid, req(), customer, null, "approved"]),
    ).rejects.toThrow();
  });
});
describe.sequential("schema and business boundaries", () => {
  it("enables RLS on every application table and hides bearer tokens", async () => {
    await asUser(owner);
    await expect(
      db.query("select private_token from public.orders"),
    ).rejects.toThrow("permission denied");
    await db.exec("reset role");
    const tables = await db.query<{ relrowsecurity: boolean }>(
      "select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'",
    );
    expect(tables.rows).toHaveLength(13);
    expect(tables.rows.every((t) => t.relrowsecurity)).toBe(true);
  });
  it("supports multiple subscriptions for a single client without tenant leakage", async () => {
    await asUser(owner);
    const second = await rpc<string>("create_workspace", [
      "Another business",
      "another-shop",
      "Main",
    ]);
    const rows = (
      await db.query<{ client_id: string }>(
        "select client_id from public.subscriptions",
      )
    ).rows;
    expect(rows).toHaveLength(2);
    expect(rows[0].client_id).toBe(rows[1].client_id);
    const target = (
      await db.query<{ id: string }>(
        "select id from public.locations where subscription_id=$1",
        [second],
      )
    ).rows[0].id;
    await expect(
      db.query("update public.products set location_id=$1 where id=$2", [
        target,
        pid,
      ]),
    ).rejects.toThrow("foreign key");
    await asUser(outsider);
    const theirs = await rpc<string>("create_workspace", [
      "Other owner",
      "other-shop",
      "Other",
    ]);
    expect(
      (await db.query("select id from public.subscriptions")).rows,
    ).toEqual([{ id: theirs }]);
    await expect(
      db.query(
        "insert into public.products(subscription_id,name,price_cents) values($1,'Intrusion',1)",
        [sid],
      ),
    ).rejects.toThrow("row-level security");
  });
  it("restricts image upload to owner subscription folders", async () => {
    await asUser(owner);
    await db.query(
      "insert into storage.objects(bucket_id,name) values('product-images',$1)",
      [`${sid}/image`],
    );
    await asUser(employee);
    await expect(
      db.query(
        "insert into storage.objects(bucket_id,name) values('product-images',$1)",
        [`${sid}/forbidden`],
      ),
    ).rejects.toThrow("row-level security");
    await asUser(owner);
    await expect(
      db.query(
        "insert into storage.objects(bucket_id,name) values('product-images','malformed/image')",
      ),
    ).rejects.toThrow("row-level security");
    await asUser(null, "anon");
    expect((await db.query("select * from storage.objects")).rows).toHaveLength(
      1,
    );
  });
});
