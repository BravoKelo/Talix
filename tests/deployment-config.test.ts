import { describe, expect, it } from "vitest";
import { missingDeploymentAuthConfig } from "../src/lib/deployment-config";

describe("deployed authentication configuration", () => {
  it("allows local and CI builds without deployment credentials", () => {
    expect(missingDeploymentAuthConfig({ NODE_ENV: "test" })).toEqual([]);
  });

  it("rejects preview and production builds with incomplete public auth configuration", () => {
    expect(
      missingDeploymentAuthConfig({
        VERCEL_ENV: "preview",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toEqual(["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]);
    expect(missingDeploymentAuthConfig({ VERCEL_ENV: "production" })).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ]);
  });

  it("accepts complete preview authentication configuration", () => {
    expect(
      missingDeploymentAuthConfig({
        VERCEL_ENV: "preview",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      }),
    ).toEqual([]);
  });
});
