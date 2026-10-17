import { beforeAll, afterAll, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { initializeDatabase } from "./helpers/database";
const db = new PGlite();
const migration = "20261017035355_readable_order_numbers_and_cancellation.sql";
const owner = crypto.randomUUID(),
  viewer = crypto.randomUUID(),
  outsider = crypto.randomUUID();
let sid: string, lid: string, secondLocation: string, product: string;
let oldId: string, oldToken: string;
async function as(id: string | null, role = "authenticated") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    id ?? "",
  ]);
  await db.exec(`set role ${role}`);
}
async function checkout(location = lid, key = crypto.randomUUID()) {
  const args = [
    location,
    key,
    JSON.stringify({
      name: "Order customer",
      email: "test@example.invalid",
      phone: "5551234567",
    }),
    JSON.stringify([{ product_id: product, quantity: 1, option_ids: [] }]),
  ];
  return (
    await db.query<{ value: { token: string } }>(
      "select public.checkout_simulated($1,$2,$3,$4,'approved') as value",
      args,
    )
  ).rows[0].value.token;
}
async function track(token: string) {
  return (
    await db.query<{ value: Record<string, unknown> }>(
      "select public.track_order($1) as value",
      [token],
    )
  ).rows[0].value;
}
beforeAll(async () => {
  await initializeDatabase(db, [migration]);
  for (const id of [owner, viewer, outsider])
    await db.query("insert into auth.users(id,email) values($1,$2)", [
      id,
      `${id}@example.invalid`,
    ]);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    owner,
  ]);
  sid = (
    await db.query<{ id: string }>(
      "select public.create_workspace('Order shop','order-shop','Main') as id",
    )
  ).rows[0].id;
  lid = (
    await db.query<{ id: string }>(
      "update public.locations set published=true where subscription_id=$1 returning id",
      [sid],
    )
  ).rows[0].id;
  secondLocation = (
    await db.query<{ id: string }>(
      "insert into public.locations(subscription_id,name,published) values($1,'Second',true) returning id",
      [sid],
    )
  ).rows[0].id;
  product = (
    await db.query<{ id: string }>(
      "insert into public.products(subscription_id,name,price_cents) values($1,'Item',1000) returning id",
      [sid],
    )
  ).rows[0].id;
  oldToken = await checkout();
  oldId = (await track(oldToken)).id as string;
  await db.exec(readFileSync(`supabase/migrations/${migration}`, "utf8"));
  await as(owner);
  await db.query("select public.grant_location_access($1,$2,'viewer')", [
    lid,
    `${viewer}@example.invalid`,
  ]);
});
afterAll(() => db.close());
it("backfills permanent numbers without changing old IDs or tracking tokens", async () => {
  await as(null, "anon");
  const order = await track(oldToken);
  expect(order.id).toBe(oldId);
  expect(order.order_number).toBe(100001);
  expect(order).not.toHaveProperty("email");
  expect(order).not.toHaveProperty("private_token");
});
it("allocates location numbers once across checkout retries and leaves other locations independent", async () => {
  await as(null, "anon");
  const request = crypto.randomUUID();
  const token = await checkout(lid, request);
  expect(await checkout(lid, request)).toBe(token);
  expect((await track(token)).order_number).toBe(100002);
  expect((await track(await checkout())).order_number).toBe(100003);
  expect((await track(await checkout(secondLocation))).order_number).toBe(100001);
});
it("denies cancellation to viewers and outsiders and hides another business's numbers", async () => {
  for (const id of [viewer, outsider]) {
    await as(id);
    await expect(
      db.query("select public.advance_order($1,'cancelled')", [oldId]),
    ).rejects.toThrow("Fulfillment");
  }
  expect(
    (await db.query("select order_number from public.orders")).rows,
  ).toHaveLength(0);
});
it("cancels active orders once without refunding and disallows reopening", async () => {
  for (const status of ["received", "in_progress", "ready"]) {
    await as(null, "anon");
    const token = await checkout();
    const id = (await track(token)).id;
    await as(owner);
    if (status !== "received")
      await db.query("select public.advance_order($1,'in_progress')", [id]);
    if (status === "ready")
      await db.query("select public.advance_order($1,'ready')", [id]);
    await db.query("select public.advance_order($1,'cancelled')", [id]);
    await db.query("select public.advance_order($1,'cancelled')", [id]);
    expect(await track(token)).toMatchObject({
      status: "cancelled",
      payment_status: "paid",
      refunded_cents: 0,
    });
    expect(
      (
        await db.query(
          "select * from public.order_events where order_id=$1 and status='cancelled'",
          [id],
        )
      ).rows,
    ).toHaveLength(1);
    await expect(
      db.query("select public.advance_order($1,'in_progress')", [id]),
    ).rejects.toThrow("Invalid status");
    await db.query(
      "select public.refund_simulated($1,$2,1000,'Cancelled order')",
      [id, crypto.randomUUID()],
    );
    expect(await track(token)).toMatchObject({
      status: "cancelled",
      payment_status: "refunded",
    });
  }
});
it("rejects cancellation of a completed order and direct edits of its number", async () => {
  await as(owner);
  for (const status of ["in_progress", "ready", "completed"])
    await db.query("select public.advance_order($1,$2)", [oldId, status]);
  await expect(
    db.query("select public.advance_order($1,'cancelled')", [oldId]),
  ).rejects.toThrow("Invalid status");
  await expect(
    db.query("update public.orders set order_number=2000 where id=$1", [oldId]),
  ).rejects.toThrow("permission denied");
});
