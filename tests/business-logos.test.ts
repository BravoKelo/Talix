import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { initializeDatabase } from "./helpers/database";
const db = new PGlite();
const owner = crypto.randomUUID(),
  stranger = crypto.randomUUID(),
  editor = crypto.randomUUID(),
  viewer = crypto.randomUUID();
let sid: string;
async function as(id: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role authenticated");
}
beforeAll(async () => {
  await initializeDatabase(db);
  for (const id of [owner, stranger, editor, viewer])
    await db.query("insert into auth.users(id,email) values($1,$2)", [
      id,
      `${id}@example.invalid`,
    ]);
  await as(owner);
  await db.exec("reset role");
  sid = (
    await db.query<{ id: string }>(
      "select public.create_workspace('Logo shop','logo-shop','Main') as id",
    )
  ).rows[0].id;
  await db.exec("reset role");
  const role = (
    await db.query<{ id: string }>(
      "insert into public.business_roles(subscription_id,name,permissions) values($1,'Brand editor',jsonb_build_array('settings.view','settings.manage')) returning id",
      [sid],
    )
  ).rows[0].id;
  const viewRole = (
    await db.query<{ id: string }>(
      "select id from public.business_roles where subscription_id=$1 and name='Viewer'",
      [sid],
    )
  ).rows[0].id;
  await db.query(
    "insert into public.memberships(subscription_id,user_id,role,role_id) values($1,$2,'employee',$3),($1,$4,'employee',$5)",
    [sid, editor, role, viewer, viewRole],
  );
});
afterAll(() => db.close());
it("allows shared settings managers to upload and save logos without product authority", async () => {
  await as(editor);
  await db.query(
    "insert into storage.objects(bucket_id,name) values('business-logos',$1)",
    [`${sid}/logo-a`],
  );
  expect(
    (
      await db.query(
        "update public.subscriptions set logo_url='https://example.invalid/logo.png' where id=$1 returning id",
        [sid],
      )
    ).rows,
  ).toHaveLength(1);
});
it("rejects uploads into another business and denies logo writes to viewers", async () => {
  await as(stranger);
  await expect(
    db.query(
      "insert into storage.objects(bucket_id,name) values('business-logos',$1)",
      [`${sid}/other`],
    ),
  ).rejects.toThrow();
  expect(
    (
      await db.query(
        "update public.subscriptions set logo_url=null where id=$1 returning id",
        [sid],
      )
    ).rows,
  ).toHaveLength(0);
  await as(viewer);
  await expect(
    db.query(
      "insert into storage.objects(bucket_id,name) values('business-logos',$1)",
      [`${sid}/viewer`],
    ),
  ).rejects.toThrow();
  expect(
    (
      await db.query(
        "update public.subscriptions set logo_url=null where id=$1 returning id",
        [sid],
      )
    ).rows,
  ).toHaveLength(0);
});
it("validates logo URLs and returns only the public logo in the catalog", async () => {
  await as(owner);
  await expect(
    db.query(
      "update public.subscriptions set logo_url='javascript:alert(1)' where id=$1",
      [sid],
    ),
  ).rejects.toThrow();
  await db.query(
    "update public.locations set published=true where subscription_id=$1",
    [sid],
  );
  await db.exec("reset role;set role anon");
  const catalog = (
    await db.query<{
      value: { subscription: { logo_url: string; client_id?: string } };
    }>("select public.public_catalog('logo-shop') as value")
  ).rows[0].value;
  expect(catalog.subscription.logo_url).toBe(
    "https://example.invalid/logo.png",
  );
  expect(catalog.subscription.client_id).toBeUndefined();
});
