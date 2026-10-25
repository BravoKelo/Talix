import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import {
  developmentHost,
  navigationFailure,
  projectId,
  teamId,
  validateCdp,
  validateFixture,
  validateTarget,
  verifyCatalog,
  verifyMembership,
  unchangedSave,
} from "../scripts/smoke/preview-contract.mjs";

const sha = "a".repeat(40);
const now = Date.now();
const record = () => ({
  checkedAt: new Date(now).toISOString(),
  teamId,
  pr: {
    number: 98,
    head: "fix/96",
    head_sha: sha,
    head_repo_full_name: "BravoKelo/Talix",
  },
  deployment: {
    id: "dpl_test",
    url: "talix-test-bravokelo.vercel.app",
    target: null,
    readyState: "READY",
    project: { id: projectId },
    meta: {
      githubCommitRef: "fix/96",
      githubCommitSha: sha,
      githubOrg: "BravoKelo",
      githubRepo: "Talix",
    },
  },
});
const fixture = () => ({
  disposable: true,
  createdForIssue: 105,
  runId: "12345678-1234-4234-8234-123456789000",
  ownerId: "12345678-1234-4234-8234-123456789001",
  subscriptionId: "12345678-1234-4234-8234-123456789002",
  locationId: "12345678-1234-4234-8234-123456789003",
  productId: "12345678-1234-4234-8234-123456789004",
  name: "Smoke 105 12345678-1234-4234-8234-123456789000",
  productName: "Smoke product 12345678-1234-4234-8234-123456789000",
  slug: "smoke-105-12345678",
});
describe("hosted smoke trust boundaries", () => {
  it("emits a sanitized nonzero CLI result before browser work when the target record is missing", () => {
    const result = spawnSync(
      process.execPath,
      [
        "scripts/smoke/hosted-preview.mjs",
        "--target",
        "missing-private-operator-input.json",
        "--sha",
        sha,
      ],
      { encoding: "utf8", timeout: 10000 },
    );
    expect(result.status).toBe(2);
    const summary = JSON.parse(result.stdout);
    expect(summary.completed).toBe(false);
    expect(summary.fixture).toBe("not-opened-or-created");
    expect(summary.steps[0].category).toBe("deployment-build");
    expect(result.stdout).not.toContain("missing-private-operator-input");
    expect(result.stderr).toBe("");
  });
  it("requires a fresh READY Preview matching both the reviewed PR and deployment", () => {
    expect(validateTarget(record(), sha, now).origin).toBe(
      "https://talix-test-bravokelo.vercel.app",
    );
    const wrongSha = record();
    wrongSha.pr.head_sha = "b".repeat(40);
    expect(() => validateTarget(wrongSha, sha, now)).toThrow(
      "revision-mismatch",
    );
    const production = record();
    production.deployment.target = "production" as unknown as null;
    expect(() => validateTarget(production, sha, now)).toThrow(
      "not-ready-preview",
    );
    const building = record();
    building.deployment.readyState = "BUILDING";
    expect(() => validateTarget(building, sha, now)).toThrow(
      "not-ready-preview",
    );
    expect(() => validateTarget(record(), sha, now + 16 * 60_000)).toThrow(
      "stale-target-record",
    );
    expect(() => validateTarget(record(), sha, now - 1)).toThrow(
      "stale-target-record",
    );
  });
  it("rejects foreign projects, production/custom hosts, token URLs and injected input", () => {
    const wrong = record();
    wrong.deployment.project.id = "other";
    expect(() => validateTarget(wrong, sha, now)).toThrow("wrong-project");
    for (const host of [
      "talix.vercel.app",
      "example.com",
      "talix-test-bravokelo.vercel.app/?_vercel_share=secret",
      "https://talix-test-bravokelo.vercel.app",
      "talix-test-bravokelo.vercel.app@evil.com",
    ]) {
      const r = record();
      r.deployment.url = host;
      expect(() => validateTarget(r, sha, now)).toThrow("invalid-preview-host");
    }
    expect(() => validateTarget(null, sha, now)).toThrow();
    expect(() => validateTarget(record(), "main", now)).toThrow(
      "invalid-expected-sha",
    );
  });
  it("allows only an explicitly supplied existing loopback browser endpoint", () => {
    expect(validateCdp("http://127.0.0.1:9222")).toBe("http://127.0.0.1:9222");
    for (const value of [
      "https://external.test",
      "http://user:password@localhost:9222",
      "http://localhost:9222/?token=secret",
      "http://localhost:9222/json/version",
      "not a URL",
    ])
      expect(() => validateCdp(value)).toThrow();
  });
  it("distinguishes Vercel redirects, app sign-in and runtime errors", () => {
    const origin = "https://talix-test-bravokelo.vercel.app";
    expect(
      navigationFailure(
        origin,
        "https://vercel.com/login?secret=hidden",
        200,
        true,
      ),
    ).toBe("vercel-protection");
    expect(navigationFailure(origin, origin + "/workspace", 401)).toBe(
      "vercel-protection",
    );
    expect(navigationFailure(origin, origin + "/login", 200, true)).toBe(
      "application-auth",
    );
    expect(navigationFailure(origin, origin + "/onboarding", 200, true)).toBe(
      "application-auth",
    );
    expect(navigationFailure(origin, origin + "/workspace", 500)).toBe(
      "app-runtime",
    );
    expect(
      navigationFailure(origin, origin + "/workspace", 200, true),
    ).toBeNull();
  });
  it("rejects ordinary customer manifests and mismatched authenticated owners", () => {
    const f = fixture();
    expect(validateFixture(f)).toBe(f);
    expect(() => validateFixture({ ...f, disposable: false })).toThrow(
      "unapproved-fixture",
    );
    expect(() => validateFixture({ ...f, name: "Real customer" })).toThrow(
      "scope-mismatch",
    );
    const memberships = [{ subscription_id: f.subscriptionId, role: "owner" }];
    expect(() =>
      verifyMembership(
        f,
        `https://${developmentHost}/rest/v1/memberships?user_id=eq.${f.ownerId}`,
        memberships,
      ),
    ).not.toThrow();
    expect(() =>
      verifyMembership(
        f,
        `https://${developmentHost}/rest/v1/memberships?user_id=eq.other`,
        memberships,
      ),
    ).toThrow("session-is-not");
    expect(() =>
      verifyMembership(
        f,
        `https://${developmentHost}/rest/v1/memberships?user_id=eq.${f.ownerId}`,
        [...memberships, { subscription_id: f.productId, role: "owner" }],
      ),
    ).toThrow("session-is-not");
    expect(() =>
      verifyMembership(
        f,
        `https://${developmentHost}/rest/v1/memberships?user_id=eq.${f.ownerId}`,
        [{ ...memberships[0], role: "manager" }],
      ),
    ).toThrow("session-is-not");
  });
  it("requires real public catalog IDs and names to match the disposable tenant", () => {
    const f = fixture();
    const catalog = {
      subscription: { id: f.subscriptionId, name: f.name },
      locations: [{ id: f.locationId }],
      products: [{ id: f.productId, name: f.productName }],
    };
    expect(() => verifyCatalog(f, catalog)).not.toThrow();
    expect(() =>
      verifyCatalog(f, {
        ...catalog,
        subscription: { id: "other", name: f.name },
      }),
    ).toThrow("scope-mismatch");
    expect(() => verifyCatalog(f, { ...catalog, products: [] })).toThrow(
      "scope-mismatch",
    );
  });
  it("blocks altered or foreign-tenant appearance writes before the request is sent", () => {
    const f = fixture();
    const url = `https://${developmentHost}/rest/v1/subscriptions?id=eq.${f.subscriptionId}`;
    const snapshot = {
      storefront_text: "#315566",
      name: f.name,
      logo_url: null,
    };
    expect(
      unchangedSave(f, snapshot, url, {
        storefront_text: "#315566",
        name: f.name,
      }),
    ).toBe(true);
    expect(
      unchangedSave(f, snapshot, url, { storefront_text: "#ffffff" }),
    ).toBe(false);
    expect(
      unchangedSave(f, snapshot, url.replace(f.subscriptionId, f.ownerId), {
        storefront_text: "#315566",
      }),
    ).toBe(false);
    expect(unchangedSave(f, snapshot, url, { unexpected: "value" })).toBe(
      false,
    );
  });
});
