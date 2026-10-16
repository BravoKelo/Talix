import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { initializeDatabase } from "./helpers/database";
const db = new PGlite();
const owner = crypto.randomUUID(),
  manager = crypto.randomUUID(),
  employee = crypto.randomUUID(),
  outsider = crypto.randomUUID();
let sid: string,
  other: string,
  lid: string,
  second: string,
  managerRole: string,
  lead: string,
  viewer: string,
  custom: string;
async function as(id: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role authenticated");
}
async function rpc<T = unknown>(name: string, args: unknown[]) {
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
    "insert into auth.users(id,email) values($1,$2),($3,$4),($5,$6),($7,$8)",
    [
      owner,
      "owner@test.invalid",
      manager,
      "manager@test.invalid",
      employee,
      "employee@test.invalid",
      outsider,
      "other@test.invalid",
    ],
  );
  const c = (
    await db.query<{ id: string }>(
      "insert into public.clients(owner_id) values($1) returning id",
      [owner],
    )
  ).rows[0].id;
  sid = (
    await db.query<{ id: string }>(
      "insert into public.subscriptions(client_id,name,slug) values($1,$2,$3) returning id",
      [c, "Primary", "primary"],
    )
  ).rows[0].id;
  other = (
    await db.query<{ id: string }>(
      "insert into public.subscriptions(client_id,name,slug) values($1,$2,$3) returning id",
      [c, "Other", "other"],
    )
  ).rows[0].id;
  await db.query(
    "insert into public.memberships(subscription_id,user_id,role) values($1,$2,'owner'),($3,$2,'owner')",
    [sid, owner, other],
  );
  lid = (
    await db.query<{ id: string }>(
      "insert into public.locations(subscription_id,name) values($1,$2) returning id",
      [sid, "First"],
    )
  ).rows[0].id;
  second = (
    await db.query<{ id: string }>(
      "insert into public.locations(subscription_id,name) values($1,$2) returning id",
      [sid, "Second"],
    )
  ).rows[0].id;
  const roles = (
    await db.query<{ id: string; name: string }>(
      "select id,name from public.business_roles where subscription_id=$1",
      [sid],
    )
  ).rows;
  managerRole = roles.find((r) => r.name === "Manager")!.id;
  lead = roles.find((r) => r.name === "Lead")!.id;
  viewer = roles.find((r) => r.name === "Viewer")!.id;
});
afterAll(() => db.close());
describe.sequential("Users and custom role authorization", () => {
  it("seeds predefined roles and lists the protected owner first", async () => {
    await as(owner);
    expect(
      (await rpc<{ owner: boolean }[]>("list_business_users", [sid]))[0].owner,
    ).toBe(true);
    expect(
      (
        await db.query(
          "select name from public.business_roles where subscription_id=$1",
          [sid],
        )
      ).rows,
    ).toHaveLength(5);
  });
  it("creates a custom role and assigns different location roles atomically", async () => {
    await as(owner);
    custom = await rpc<string>("save_business_role", [
      sid,
      null,
      "Order observer",
      ["orders.view"],
    ]);
    await rpc("save_business_user", [
      sid,
      "employee@test.invalid",
      viewer,
      [
        { id: lid, role_id: custom },
        { id: second, role_id: lead },
      ],
    ]);
    await as(employee);
    expect(await rpc("workspace_permissions", [sid, lid])).toEqual([
      "orders.view",
    ]);
    expect(await rpc("workspace_permissions", [sid, second])).toEqual([
      "orders.view",
      "orders.fulfill",
      "products.view",
    ]);
    expect(await rpc("workspace_permissions", [other, null])).toEqual([]);
    await expect(rpc("list_business_users", [sid])).rejects.toThrow(
      "permission",
    );
  });
  it("enforces denied product permissions in the database", async () => {
    await as(owner);
    await db.query(
      "insert into public.products(subscription_id,location_id,name,price_cents) values($1,$2,'First product',100),($1,$3,'Second product',100)",
      [sid, lid, second],
    );
    await as(employee);
    expect((await db.query("select name from public.products")).rows).toEqual([
      { name: "Second product" },
    ]);
    expect(
      (
        await db.query(
          "update public.products set name='Unauthorized' returning id",
        )
      ).rows,
    ).toEqual([]);
  });
  it("rejects cross-subscription assignments and preserves prior access", async () => {
    await as(owner);
    const otherRole = (
      await db.query<{ id: string }>(
        "select id from public.business_roles where subscription_id=$1 and name='Manager'",
        [other],
      )
    ).rows[0].id;
    await expect(
      rpc("save_business_user", [sid, "employee@test.invalid", otherRole, []]),
    ).rejects.toThrow("subscription");
    await as(employee);
    expect(await rpc("workspace_permissions", [sid, second])).toContain(
      "orders.fulfill",
    );
  });
  it("protects owner and requires permission to manage users", async () => {
    await as(employee);
    await expect(
      rpc("save_business_role", [
        sid,
        null,
        "Elevated",
        ["users.view", "users.manage"],
      ]),
    ).rejects.toThrow("permission");
    await as(owner);
    await expect(
      rpc("save_business_user", [sid, "owner@test.invalid", managerRole, []]),
    ).rejects.toThrow("owner account");
    await rpc("save_business_user", [
      sid,
      "manager@test.invalid",
      managerRole,
      [{ id: lid, role_id: managerRole }],
    ]);
    await as(manager);
    await expect(
      rpc("save_business_user", [sid, "manager@test.invalid", viewer, []]),
    ).rejects.toThrow("own access");
  });
  it("lets a manager edit users only within their own location permissions", async () => {
    await as(manager);
    await expect(
      rpc("save_business_user", [
        sid,
        "employee@test.invalid",
        viewer,
        [{ id: second, role_id: viewer }],
      ]),
    ).rejects.toThrow("permission");
    await expect(
      rpc("save_business_user", [
        sid,
        "employee@test.invalid",
        viewer,
        [],
        true,
      ]),
    ).rejects.toThrow("Owner permission");
    await rpc("save_business_user", [
      sid,
      "other@test.invalid",
      viewer,
      [{ id: lid, role_id: viewer }],
    ]);
    expect(
      (await rpc<{ email: string }[]>("list_business_users", [sid])).some(
        (u) => u.email === "other@test.invalid",
      ),
    ).toBe(true);
  });
  it("denies anonymous role management and direct table writes", async () => {
    await db.exec("reset role;set role anon");
    await expect(
      rpc("save_business_role", [sid, null, "Escalated", ["users.manage"]]),
    ).rejects.toThrow("permission denied");
    await as(employee);
    await expect(
      db.query(
        "update public.business_roles set permissions='[\"users.manage\"]'",
      ),
    ).rejects.toThrow("permission denied");
  });
  it("updates role permissions and immediately revokes location access", async () => {
    await as(owner);
    await rpc("save_business_role", [sid, custom, "Order observer", []]);
    await as(employee);
    expect(await rpc("workspace_permissions", [sid, lid])).toEqual([]);
    await as(owner);
    await rpc("save_business_user", [
      sid,
      "employee@test.invalid",
      viewer,
      [],
      true,
    ]);
    await as(employee);
    expect((await db.query("select * from public.subscriptions")).rows).toEqual(
      [],
    );
  });
});
