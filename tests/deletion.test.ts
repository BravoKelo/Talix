import { beforeAll, afterAll, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { initializeDatabase } from "./helpers/database";
const db = new PGlite();
const owner = crypto.randomUUID(),
  viewer = crypto.randomUUID(),
  outsider = crypto.randomUUID();
let sid: string, lid: string, pid: string, otherSid: string, orderToken: string;
const url = (s: string, name: string, bucket = "product-images") =>
  `https://test.invalid/storage/v1/object/public/${bucket}/${s}/${name}`;
async function as(id: string | null, role = "authenticated") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    id ?? "",
  ]);
  await db.exec(`set role ${role}`);
}
async function remove(bucket: string, name: string) {
  return (
    await db.query(
      "delete from storage.objects where bucket_id=$1 and name=$2 returning name",
      [bucket, name],
    )
  ).rows;
}
beforeAll(async () => {
  await initializeDatabase(db);
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
      "select public.create_workspace('Images','image-shop','Main') as id",
    )
  ).rows[0].id;
  lid = (
    await db.query<{ id: string }>(
      "update public.locations set published=true where subscription_id=$1 returning id",
      [sid],
    )
  ).rows[0].id;
  pid = (
    await db.query<{ id: string }>(
      "insert into public.products(subscription_id,name,price_cents,image_url) values($1,'Historical item',1000,$2) returning id",
      [sid, url(sid, "saved")],
    )
  ).rows[0].id;
  await db.query(
    "insert into storage.objects(bucket_id,name) values('product-images',$1),('product-images',$2),('business-logos',$3)",
    [`${sid}/saved`, `${sid}/unused`, `${sid}/logo`],
  );
  await db.query("update public.subscriptions set logo_url=$1 where id=$2", [
    url(sid, "logo", "business-logos"),
    sid,
  ]);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    outsider,
  ]);
  otherSid = (
    await db.query<{ id: string }>(
      "select public.create_workspace('Other','other-image-shop','Other') as id",
    )
  ).rows[0].id;
  await db.query(
    "insert into public.products(subscription_id,name,price_cents,image_url) values($1,'Shared image',100,$2)",
    [otherSid, url(sid, "saved")],
  );
  await as(owner);
  await db.query("select public.grant_location_access($1,$2,'viewer')", [
    lid,
    `${viewer}@example.invalid`,
  ]);
  await as(null, "anon");
  orderToken = (
    await db.query<{ value: { token: string } }>(
      "select public.checkout_simulated($1,$2,$3,$4,'approved') as value",
      [
        lid,
        crypto.randomUUID(),
        JSON.stringify({
          name: "Customer",
          email: "c@example.invalid",
          phone: "5551234567",
        }),
        JSON.stringify([{ product_id: pid, quantity: 1, option_ids: [] }]),
      ],
    )
  ).rows[0].value.token;
});
afterAll(() => db.close());
it("denies product deletion and image deletion to viewers and other businesses", async () => {
  for (const id of [viewer, outsider]) {
    await as(id);
    expect(
      (
        await db.query("delete from public.products where id=$1 returning id", [
          pid,
        ])
      ).rows,
    ).toHaveLength(0);
    expect(await remove("product-images", `${sid}/unused`)).toHaveLength(0);
  }
});
it("keeps referenced image files, including references hidden by caller RLS", async () => {
  await as(owner);
  expect(await remove("product-images", `${sid}/saved`)).toHaveLength(0);
  await db.query("update public.products set image_url=null where id=$1", [
    pid,
  ]);
  // Owner cannot see the other subscription, but its saved image still prevents removal.
  expect(await remove("product-images", `${sid}/saved`)).toHaveLength(0);
  expect(
    (
      await db.query("select id from public.subscriptions where id=$1", [
        otherSid,
      ])
    ).rows,
  ).toHaveLength(0);
});
it("allows deletion of unreferenced images and blocks referenced logos", async () => {
  await as(owner);
  expect(await remove("product-images", `${sid}/unused`)).toHaveLength(1);
  expect(await remove("business-logos", `${sid}/logo`)).toHaveLength(0);
  await db.query("update public.subscriptions set logo_url=null where id=$1", [
    sid,
  ]);
  expect(await remove("business-logos", `${sid}/logo`)).toHaveLength(1);
});
it("deletes the product while preserving historical order items and private tracking", async () => {
  await as(owner);
  expect(
    (
      await db.query("delete from public.products where id=$1 returning id", [
        pid,
      ])
    ).rows,
  ).toHaveLength(1);
  await as(null, "anon");
  const order = (
    await db.query<{
      value: {
        items: { name: string; quantity: number }[];
        total_cents: number;
      };
    }>("select public.track_order($1) as value", [orderToken])
  ).rows[0].value;
  expect(order.items[0]).toMatchObject({
    name: "Historical item",
    quantity: 1,
  });
  expect(order.total_cents).toBe(1000);
});
