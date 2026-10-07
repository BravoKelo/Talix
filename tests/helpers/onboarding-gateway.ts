import { createServer } from "node:http";
import { PGlite } from "@electric-sql/pglite";
import { initializeDatabase } from "./database";
// Test-only Auth/PostgREST transport. Every data operation executes actual migration SQL/RLS.
export async function onboardingGateway() {
  const db = new PGlite();
  await initializeDatabase(db);
  type User = {
    id: string;
    email: string;
    email_confirmed_at: string | null;
    user_metadata: Record<string, unknown>;
    aud: string;
    role: string;
    created_at: string;
    app_metadata: Record<string, unknown>;
  };
  const users = new Map<string, User>();
  let confirmedUser: User | undefined;
  let signupBody: Record<string, unknown> | undefined;
  async function user(email: string, confirmed = true, admin = false) {
    const value: User = {
      id: crypto.randomUUID(),
      email,
      email_confirmed_at: confirmed ? new Date().toISOString() : null,
      user_metadata: {},
      aud: "authenticated",
      role: "authenticated",
      created_at: new Date().toISOString(),
      app_metadata: { provider: "email", providers: ["email"] },
    };
    users.set(value.id, value);
    await db.query(
      "insert into auth.users(id,email,email_confirmed_at) values($1,$2,$3)",
      [value.id, email, value.email_confirmed_at],
    );
    if (admin)
      await db.query("insert into private.talix_admins values($1)", [value.id]);
    return value;
  }
  const admin = await user("staff@example.invalid", true, true);
  function token(u: User) {
    const encode = (value: unknown) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");
    return (
      encode({ alg: "HS256", typ: "JWT" }) +
      "." +
      encode({
        sub: u.id,
        email: u.email,
        aud: "authenticated",
        role: "authenticated",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      }) +
      ".test-signature"
    );
  }
  const server = createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "authorization,apikey,content-type,x-client-info,prefer,accept",
    );
    if (req.method === "OPTIONS") {
      res.end();
      return;
    }
    const url = new URL(req.url!, "http://127.0.0.1:3290");
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const input = chunks.length
      ? JSON.parse(Buffer.concat(chunks).toString())
      : {};
    let current: User | undefined;
    try {
      const jwt = req.headers.authorization?.split(" ")[1];
      if (jwt?.split(".").length === 3) {
        const id = JSON.parse(
          Buffer.from(jwt.split(".")[1], "base64url").toString(),
        ).sub;
        current = users.get(id);
      }
      if (url.pathname.includes("/auth/v1/")) {
        if (url.pathname.endsWith("/signup")) {
          signupBody = input;
          const u = await user(input.email, false);
          u.user_metadata = input.data ?? {};
          res.end(JSON.stringify(u));
          return;
        }
        if (
          url.pathname.endsWith("/verify") &&
          input.token_hash === "verification-token" &&
          confirmedUser &&
          input.type === "email"
        ) {
          res.end(
            JSON.stringify({
              access_token: token(confirmedUser),
              refresh_token: "test-refresh",
              expires_in: 3600,
              token_type: "bearer",
              user: confirmedUser,
            }),
          );
          return;
        }
        if (url.pathname.endsWith("/token")) {
          const u = [...users.values()].find((u) => u.email === input.email);
          if (!u?.email_confirmed_at) {
            res.statusCode = 400;
            res.end(
              JSON.stringify({
                code: "email_not_confirmed",
                msg: "Email not confirmed",
              }),
            );
            return;
          }
          res.end(
            JSON.stringify({
              access_token: token(u),
              refresh_token: "test-refresh",
              expires_in: 3600,
              token_type: "bearer",
              user: u,
            }),
          );
          return;
        }
        if (url.pathname.endsWith("/user")) {
          if (!current) {
            res.statusCode = 401;
            res.end(JSON.stringify({ msg: "No session" }));
            return;
          }
          if (req.method === "PUT")
            current.user_metadata = { ...current.user_metadata, ...input.data };
          res.end(JSON.stringify(current));
          return;
        }
        if (url.pathname.includes("jwks")) {
          res.end('{"keys":[]}');
          return;
        }
        res.end("{}");
        return;
      }
      const resource = url.pathname.split("/").pop()!;
      const allowedTables = [
        "business_types",
        "talix_offerings",
        "clients",
        "subscription_purchases",
        "subscriptions",
        "memberships",
        "locations",
        "location_access",
        "products",
        "orders",
        "payment_events",
      ];
      const functions: Record<string, string[]> = {
        subscription_quote: ["p_type", "p_plan", "p_addons"],
        start_subscription: [
          "p_request",
          "p_business",
          "p_type",
          "p_plan",
          "p_addons",
          "p_quote",
        ],
        talix_admin_access: [],
      };
      const output = await db.transaction(async (tx) => {
        await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [
          current?.id ?? "",
        ]);
        await tx.exec("set local role " + (current ? "authenticated" : "anon"));
        if (url.pathname.includes("/rpc/")) {
          if (!functions[resource]) throw new Error("Unknown test RPC");
          const args = functions[resource].map((k) => input[k]);
          return (
            await tx.query<{ value: unknown }>(
              `select public.${resource}(${args.map((_, i) => "$" + (i + 1)).join(",")}) as value`,
              args,
            )
          ).rows[0].value;
        }
        if (!allowedTables.includes(resource))
          throw new Error("Unknown test table");
        const select = url.searchParams.get("select") ?? "*";
        if (!/^(\*|[a-z_,]+)$/.test(select))
          throw new Error("Invalid test select");
        const args: unknown[] = [];
        const where: string[] = [];
        for (const [key, value] of url.searchParams) {
          if (["select", "order", "limit"].includes(key)) continue;
          if (!/^[a-z_]+$/.test(key) || !value.startsWith("eq."))
            throw new Error("Unsupported test filter");
          args.push(
            ["active", "published"].includes(key)
              ? value.slice(3) === "true"
              : value.slice(3),
          );
          where.push(`${key}=$${args.length}`);
        }
        const suffix = where.length ? " where " + where.join(" and ") : "";
        let sql: string;
        if (req.method === "POST" || req.method === "PATCH") {
          const fields = Object.keys(input);
          if (fields.some((f) => !/^[a-z_]+$/.test(f)))
            throw new Error("Invalid test fields");
          const initial = args.length;
          args.push(...fields.map((f) => input[f]));
          sql =
            req.method === "POST"
              ? `insert into public.${resource}(${fields.join(",")}) values(${fields.map((_, i) => "$" + (i + initial + 1)).join(",")}) returning ${select}`
              : `update public.${resource} set ${fields.map((f, i) => f + "=$" + (i + initial + 1)).join(",")}${suffix} returning ${select}`;
        } else {
          let order = "";
          if (url.searchParams.has("order")) {
            const [field, direction] = url.searchParams
              .get("order")!
              .split(".");
            if (!/^[a-z_]+$/.test(field)) throw new Error("Invalid test order");
            order =
              " order by " + field + (direction === "desc" ? " desc" : " asc");
          }
          sql = `select ${select} from public.${resource}${suffix}${order}`;
        }
        const rows = (await tx.query(sql, args)).rows;
        if (req.headers.accept?.includes("vnd.pgrst.object")) {
          if (rows.length !== 1)
            throw Object.assign(new Error("Object requested"), {
              code: "PGRST116",
            });
          return rows[0];
        }
        return rows;
      });
      res.end(JSON.stringify(output));
    } catch (e) {
      const error = e as { message: string; code?: string };
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          message: error.message,
          code: error.code ?? "P0001",
          details: null,
        }),
      );
    }
  });
  await new Promise<void>((resolve) =>
    server.listen(3290, "127.0.0.1", resolve),
  );
  return {
    db,
    admin,
    users,
    get signupBody() {
      return signupBody;
    },
    async confirm(email: string) {
      const u = [...users.values()].find((u) => u.email === email)!;
      u.email_confirmed_at = new Date().toISOString();
      confirmedUser = u;
      await db.query(
        "update auth.users set email_confirmed_at=$1 where id=$2",
        [u.email_confirmed_at, u.id],
      );
    },
    async close() {
      await new Promise<void>((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      );
      await db.close();
    },
  };
}
