import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { initializeDatabase } from "./helpers/database";

const db = new PGlite();
const owner = crypto.randomUUID();
const editor = crypto.randomUUID();
const outsider = crypto.randomUUID();
let sid = "";
let location = "";

async function as(id: string | null, role = "authenticated") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    id ?? "",
  ]);
  await db.exec(`set role ${role}`);
}

async function rpc<T>(name: string, args: unknown[]) {
  return (
    await db.query<{ value: T }>(
      `select public.${name}(${args.map((_, index) => `$${index + 1}`).join(",")}) as value`,
      args,
    )
  ).rows[0].value;
}

beforeAll(async () => {
  await initializeDatabase(db);
  for (const id of [owner, editor, outsider]) {
    await db.query("insert into auth.users(id,email) values($1,$2)", [
      id,
      `${id}@example.invalid`,
    ]);
  }
  await as(owner);
  await db.exec("reset role");
  sid = await rpc<string>("create_workspace", [
    "Website study",
    "website-study",
    "Main",
  ]);
  location = (
    await db.query<{ id: string }>(
      "select id from public.locations where subscription_id=$1",
      [sid],
    )
  ).rows[0].id;
  const role = (
    await db.query<{ id: string }>(
      "insert into public.business_roles(subscription_id,name,permissions) values($1,'Settings editor','[\"settings.view\",\"settings.manage\"]') returning id",
      [sid],
    )
  ).rows[0].id;
  await db.query(
    "insert into public.memberships(subscription_id,user_id,role,role_id) values($1,$2,'employee',$3)",
    [sid, editor, role],
  );
});

afterAll(() => db.close());

describe.sequential("owner website setup authority", () => {
  it("starts deferred and lets only the owner save private setup state", async () => {
    await as(owner);
    expect(
      (
        await db.query<{ website_path: string }>(
          "select website_path from public.subscriptions where id=$1",
          [sid],
        )
      ).rows[0].website_path,
    ).toBe("deferred");

    const saved = await rpc<Record<string, unknown>>("save_website_setup", [
      sid,
      "existing",
      null,
      "https://example.com/business",
      true,
    ]);
    expect(saved.website_path).toBe("existing");
    expect(saved.existing_website_url).toBe("https://example.com/business");

    await as(editor);
    await expect(
      rpc("save_website_setup", [sid, "deferred", null, null, true]),
    ).rejects.toThrow("Owner access required");
    await expect(
      db.query(
        "update public.subscriptions set website_path='deferred' where id=$1",
        [sid],
      ),
    ).rejects.toThrow("permission denied");

    await as(outsider);
    await expect(
      rpc("save_website_setup", [sid, "deferred", null, null, true]),
    ).rejects.toThrow("Owner access required");
  });

  it("rejects unsafe existing-site addresses", async () => {
    await as(owner);
    for (const value of [
      "http://example.com",
      "https://user:secret@example.com",
      "https://example.com\\redirect",
      "https://example.com/a b",
    ]) {
      await expect(
        rpc("save_website_setup", [sid, "existing", null, value, true]),
      ).rejects.toThrow();
    }
  });

  it("keeps drafts private and launches atomically behind location and catalog acknowledgement", async () => {
    await as(owner);
    await rpc("save_website_setup", [
      sid,
      "talix_template",
      "order_first",
      null,
      true,
    ]);

    await expect(rpc("launch_website_template", [sid, false])).rejects.toThrow(
      "Publish at least one location",
    );
    await db.exec("reset role");
    await db.query("update public.locations set published=true where id=$1", [
      location,
    ]);
    await as(owner);
    await expect(rpc("launch_website_template", [sid, false])).rejects.toThrow(
      "Confirm that you want to launch",
    );
    await expect(rpc("launch_website_template", [sid, null])).rejects.toThrow(
      "Confirm that you want to launch",
    );

    const launched = await rpc<Record<string, unknown>>(
      "launch_website_template",
      [sid, true],
    );
    expect(launched).toMatchObject({
      website_path: "talix_template",
      website_live_template: "order_first",
      ordering_ready: false,
    });
    const launchedAt = launched.website_template_launched_at;
    const repeated = await rpc<Record<string, unknown>>(
      "launch_website_template",
      [sid, true],
    );
    expect(repeated.website_template_launched_at).toBe(launchedAt);

    await db.exec("reset role;set role anon");
    const publicSubscription = (
      await db.query<{ catalog: { subscription: Record<string, unknown> } }>(
        "select public.public_catalog('website-study') as catalog",
      )
    ).rows[0].catalog.subscription;
    expect(publicSubscription.website_live_template).toBe("order_first");
    expect(publicSubscription).not.toHaveProperty("website_template");
    expect(publicSubscription).not.toHaveProperty("website_path");
    expect(publicSubscription).not.toHaveProperty("existing_website_url");
    expect(publicSubscription).not.toHaveProperty("website_setup_completed_at");
  });

  it("reports ordering ready after an eligible product is available", async () => {
    await as(owner);
    await db.query(
      "insert into public.products(subscription_id,name,description,price_cents,available) values($1,'Useful item','A clear product description',1200,true)",
      [sid],
    );
    const result = await rpc<Record<string, unknown>>(
      "launch_website_template",
      [sid, false],
    );
    expect(result.ordering_ready).toBe(true);
  });
});
