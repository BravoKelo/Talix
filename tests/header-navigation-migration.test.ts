import { expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { initializeDatabase } from "./helpers/database";
it("upgrades existing header choices without resetting custom layouts", async () => {
  const db = new PGlite();
  const migration = "20261018174618_storefront_header_navigation.sql";
  try {
    await initializeDatabase(db, [
      migration,
      "20261019183000_website_owner_onboarding.sql",
      "20261020224059_separate_website_hero_image.sql",
      "20261021011154_editable_standard_navigation.sql",
    ]);
    const owner = crypto.randomUUID();
    await db.query(
      "insert into auth.users(id,email) values($1,'migration@example.invalid')",
      [owner],
    );
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      owner,
    ]);
    await db.query(
      "select public.create_workspace('Before','before-nav','Main')",
    );
    await db.query("update public.subscriptions set header_layout='left'");
    await db.exec(readFileSync("supabase/migrations/" + migration, "utf8"));
    expect(
      (
        await db.query(
          "select header_mode,header_layout,header_links from public.subscriptions",
        )
      ).rows,
    ).toEqual([
      { header_mode: "custom", header_layout: "left", header_links: [] },
    ]);
    await db.query(
      "select public.create_workspace('After','after-nav','Main')",
    );
    expect(
      (
        await db.query(
          "select header_mode,header_layout,header_links from public.subscriptions where slug='after-nav'",
        )
      ).rows,
    ).toEqual([
      { header_mode: "standard", header_layout: "centered", header_links: [] },
    ]);
  } finally {
    await db.close();
  }
});
