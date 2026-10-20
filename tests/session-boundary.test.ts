import { describe, expect, it } from "vitest";
import {
  hasSupabaseSessionCookie,
  isPrivateApplicationRoute,
  needsPrivateNoStore,
} from "../src/lib/session-boundary";

describe("session refresh boundary", () => {
  it("recognizes Supabase auth-token cookies, including chunked values", () => {
    expect(
      hasSupabaseSessionCookie([{ name: "sb-project-auth-token.0" }]),
    ).toBe(true);
    expect(hasSupabaseSessionCookie([{ name: "theme" }])).toBe(false);
  });

  it("keeps authenticated public responses and sensitive routes private", () => {
    expect(isPrivateApplicationRoute("/workspace/settings")).toBe(true);
    expect(isPrivateApplicationRoute("/orders/private-token")).toBe(true);
    expect(isPrivateApplicationRoute("/shop/example")).toBe(false);
    expect(needsPrivateNoStore("/shop/example", [])).toBe(false);
    expect(
      needsPrivateNoStore("/shop/example", [
        { name: "sb-project-auth-token" },
      ]),
    ).toBe(true);
  });
});
