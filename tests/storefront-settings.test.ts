import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { initializeDatabase } from "./helpers/database";
const db = new PGlite();
const owner = crypto.randomUUID(),
  other = crypto.randomUUID(),
  editor = crypto.randomUUID();
let sid: string, location: string, foreign: string;
async function as(id: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role authenticated");
}
beforeAll(async () => {
  await initializeDatabase(db);
  for (const id of [owner, other, editor])
    await db.query("insert into auth.users(id,email) values($1,$2)", [
      id,
      id + "@example.invalid",
    ]);
  await as(owner);
  await db.exec("reset role");
  sid = (
    await db.query<{ id: string }>(
      "select public.create_workspace('Example','example-study','Main') as id",
    )
  ).rows[0].id;
  location = (
    await db.query<{ id: string }>(
      "select id from public.locations where subscription_id=$1",
      [sid],
    )
  ).rows[0].id;
  await db.query("update public.locations set published=true where id=$1", [
    location,
  ]);
  await as(other);
  await db.exec("reset role");
  await db.query(
    "select public.create_workspace('Other','other-study','Other')",
  );
  foreign = (
    await db.query<{ id: string }>(
      "select id from public.locations where subscription_id<>$1",
      [sid],
    )
  ).rows[0].id;
  const role = (
    await db.query<{ id: string }>(
      "insert into public.business_roles(subscription_id,name,permissions) values($1,'Appearance editor','[\"settings.view\",\"settings.manage\"]') returning id",
      [sid],
    )
  ).rows[0].id;
  await db.query(
    "insert into public.memberships(subscription_id,user_id,role,role_id) values($1,$2,'employee',$3)",
    [sid, editor, role],
  );
});
afterAll(() => db.close());
it("reuses settings authority and rejects cross-business defaults and unsafe values", async () => {
  await as(editor);
  expect(
    (
      await db.query(
        "update public.subscriptions set default_location_id=$2,header_background='#ffffff',storefront_font='serif',tile_corners='round' where id=$1 returning id",
        [sid, location],
      )
    ).rows,
  ).toHaveLength(1);
  await expect(
    db.query(
      "update public.subscriptions set default_location_id=$2 where id=$1",
      [sid, foreign],
    ),
  ).rejects.toThrow();
  await expect(
    db.query(
      "update public.subscriptions set header_background='url(javascript:bad)' where id=$1",
      [sid],
    ),
  ).rejects.toThrow();
  await expect(
    db.query(
      "update public.subscriptions set storefront_font='arbitrary' where id=$1",
      [sid],
    ),
  ).rejects.toThrow();
  await expect(
    db.query(
      "update public.subscriptions set header_photo_url='javascript:bad' where id=$1",
      [sid],
    ),
  ).rejects.toThrow();
});
it("does not grant appearance writes to outsiders or anonymous callers", async () => {
  await as(other);
  expect(
    (
      await db.query(
        "update public.subscriptions set tile_spacing='compact' where id=$1 returning id",
        [sid],
      )
    ).rows,
  ).toHaveLength(0);
  await db.exec("reset role;set role anon");
  await expect(
    db.query(
      "update public.subscriptions set tile_spacing='compact' where id=$1",
      [sid],
    ),
  ).rejects.toThrow();
});
it("omits unpublished default ids from the public catalog and preserves published scoping", async () => {
  await as(owner);
  await db.query("update public.locations set published=false where id=$1", [
    location,
  ]);
  await db.query(
    "insert into public.locations(subscription_id,name,published) values($1,'Second',true)",
    [sid],
  );
  await db.exec("reset role;set role anon");
  const cat = (
    await db.query<{
      v: {
        subscription: {
          default_location_id: string | null;
          client_id?: string;
        };
        locations: { id: string }[];
      };
    }>("select public.public_catalog('example-study') as v")
  ).rows[0].v;
  expect(cat.subscription.default_location_id).toBeNull();
  expect(cat.subscription.client_id).toBeUndefined();
  expect(cat.locations.some((l) => l.id === location)).toBe(false);
});
it("protects saved header photos through existing cleanup authorization", async () => {
  await as(editor);
  const url = `https://example.invalid/storage/v1/object/public/business-logos/${sid}/header.webp`;
  await db.query(
    "update public.subscriptions set header_photo_url=$2 where id=$1",
    [sid, url],
  );
  expect(
    (
      await db.query<{ ok: boolean }>(
        "select private.can_delete_business_image('business-logos',$1) as ok",
        [sid + "/header.webp"],
      )
    ).rows[0].ok,
  ).toBe(false);
  await db.query(
    "update public.subscriptions set header_photo_url=null where id=$1",
    [sid],
  );
  expect(
    (
      await db.query<{ ok: boolean }>(
        "select private.can_delete_business_image('business-logos',$1) as ok",
        [sid + "/header.webp"],
      )
    ).rows[0].ok,
  ).toBe(true);
  await as(other);
  expect(
    (
      await db.query<{ ok: boolean }>(
        "select private.can_delete_business_image('business-logos',$1) as ok",
        [sid + "/header.webp"],
      )
    ).rows[0].ok,
  ).toBe(false);
});
it("keeps collection labels under existing product-management authority", async () => {
  await as(editor);
  await expect(
    db.query(
      "insert into public.products(subscription_id,name,price_cents,category) values($1,'Item',100,'Everyday')",
      [sid],
    ),
  ).rejects.toThrow();
  await as(owner);
  await db.query(
    "insert into public.products(subscription_id,name,price_cents,category) values($1,'Item',100,'Everyday')",
    [sid],
  );
  await expect(
    db.query(
      "update public.products set category=repeat('x',81) where subscription_id=$1",
      [sid],
    ),
  ).rejects.toThrow();
});

it("defaults to centered and persists header presets under settings authority", async () => {
  await as(editor);
  expect(
    (
      await db.query<{ header_layout: string }>(
        "select header_layout from public.subscriptions where id=$1",
        [sid],
      )
    ).rows[0].header_layout,
  ).toBe("centered");
  await db.query(
    "update public.subscriptions set header_layout='search' where id=$1",
    [sid],
  );
  await expect(
    db.query(
      "update public.subscriptions set header_layout='arbitrary' where id=$1",
      [sid],
    ),
  ).rejects.toThrow();
  await db.exec("reset role;set role anon");
  expect(
    (
      await db.query<{ v: { subscription: { header_layout: string } } }>(
        "select public.public_catalog('example-study') as v",
      )
    ).rows[0].v.subscription.header_layout,
  ).toBe("search");
  await as(other);
  expect(
    (
      await db.query(
        "update public.subscriptions set header_layout='minimal' where id=$1 returning id",
        [sid],
      )
    ).rows,
  ).toHaveLength(0);
});

it("persists standard/custom mode, preserves ordered custom links, and redacts inactive links", async () => {
  await as(editor);
  expect(
    (
      await db.query<{ header_mode: string; header_links: unknown[] }>(
        "select header_mode,header_links from public.subscriptions where id=$1",
        [sid],
      )
    ).rows[0],
  ).toEqual({ header_mode: "standard", header_links: [] });
  const links = [
    {
      label: "Our website",
      destination: "website",
      url: "https://business.example/about?from=shop#story",
    },
    { label: "Order online", destination: "storefront", url: "" },
  ];
  await db.query(
    "update public.subscriptions set header_mode='custom',header_links=$2::jsonb where id=$1",
    [sid, JSON.stringify(links)],
  );
  await db.exec("reset role;set role anon");
  const publicSub = async () =>
    (
      await db.query<{ v: { subscription: Record<string, unknown> } }>(
        "select public.public_catalog('example-study') as v",
      )
    ).rows[0].v.subscription;
  expect((await publicSub()).header_links).toEqual(links);
  expect(await publicSub()).not.toHaveProperty("client_id");
  await expect(
    db.query(
      "update public.subscriptions set header_mode='custom' where id=$1",
      [sid],
    ),
  ).rejects.toThrow();
  await as(editor);
  await db.query(
    "update public.subscriptions set header_mode='standard' where id=$1",
    [sid],
  );
  expect(
    (
      await db.query<{ header_links: unknown[] }>(
        "select header_links from public.subscriptions where id=$1",
        [sid],
      )
    ).rows[0].header_links,
  ).toEqual(links);
  await db.exec("reset role;set role anon");
  expect((await publicSub()).header_links).toEqual([]);
  await as(other);
  expect(
    (
      await db.query(
        "update public.subscriptions set header_links='[]',header_mode='custom' where id=$1 returning id",
        [sid],
      )
    ).rows,
  ).toHaveLength(0);
});
it("rejects malformed navigation and unsafe destinations at the database boundary", async () => {
  await as(editor);
  for (const links of [
    null,
    {},
    [null],
    [{}],
    [{ label: "", destination: "storefront", url: "" }],
    [{ label: "x".repeat(33), destination: "storefront", url: "" }],
    Array.from({ length: 9 }, () => ({
      label: "Shop",
      destination: "storefront",
      url: "",
    })),
    ...[
      "javascript:alert(1)",
      "http://example.com",
      "//example.com",
      "https://user:pass@example.com",
      "https://example.com\\evil",
      "https://example.com/a b",
      "https://",
    ].map((url) => [{ label: "Unsafe", destination: "website", url }]),
    [{ label: "Shop", destination: "storefront", url: "https://example.com" }],
    [{ label: "Shop", destination: "storefront", url: "", extra: true }],
  ]) {
    await expect(
      db.query(
        "update public.subscriptions set header_links=$2::jsonb where id=$1",
        [sid, JSON.stringify(links)],
      ),
    ).rejects.toThrow();
  }
  await expect(
    db.query(
      "update public.subscriptions set header_mode='unknown' where id=$1",
      [sid],
    ),
  ).rejects.toThrow();
});
