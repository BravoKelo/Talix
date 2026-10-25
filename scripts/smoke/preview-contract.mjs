export const projectId = "prj_Xmg24E6djhGtCFIJsmP9EblkLDym";
export const teamId = "team_eTPaf9j2OvuQWUZGssM8wVjv";
export const developmentHost = "lzepujggusieapablzhn.supabase.co";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class SmokeFailure extends Error {
  constructor(category, code) {
    super(code);
    this.category = category;
    this.code = code;
  }
}
export function requireCheck(ok, category, code) {
  if (!ok) throw new SmokeFailure(category, code);
}
export function validateTarget(record, sha, now = Date.now()) {
  const d = record?.deployment;
  requireCheck(
    /^[0-9a-f]{40}$/.test(sha ?? ""),
    "deployment-build",
    "invalid-expected-sha",
  );
  requireCheck(
    record?.teamId === teamId && d?.project?.id === projectId,
    "deployment-build",
    "wrong-project-or-team",
  );
  requireCheck(
    d?.readyState === "READY" && d?.target === null,
    "deployment-build",
    "not-ready-preview",
  );
  requireCheck(
    /^dpl_[A-Za-z0-9]+$/.test(d?.id ?? ""),
    "deployment-build",
    "invalid-deployment-id",
  );
  requireCheck(
    d?.meta?.githubCommitSha === sha &&
      record?.pr?.head_sha === sha &&
      record?.pr?.head === d?.meta?.githubCommitRef &&
      record?.pr?.head_repo_full_name === "BravoKelo/Talix" &&
      Number.isInteger(record?.pr?.number) &&
      d?.meta?.githubOrg === "BravoKelo" &&
      d?.meta?.githubRepo === "Talix",
    "deployment-build",
    "pr-deployment-revision-mismatch",
  );
  const age = now - Date.parse(record?.checkedAt);
  requireCheck(
    Number.isFinite(age) && age >= 0 && age <= 15 * 60_000,
    "deployment-build",
    "stale-target-record",
  );
  // Accept the exact generated deployment hostname, never an alias, token URL or production domain.
  requireCheck(
    /^talix-[a-z0-9]+-bravokelo\.vercel\.app$/.test(d?.url ?? ""),
    "deployment-build",
    "invalid-preview-host",
  );
  return {
    origin: `https://${d.url}`,
    deploymentId: d.id,
    sha,
    pr: record.pr.number,
    branch: record.pr.head,
  };
}
export function validateCdp(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new SmokeFailure(
      "vercel-protection",
      "invalid-operator-browser-endpoint",
    );
  }
  requireCheck(
    url.protocol === "http:" &&
      ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) &&
      !!url.port &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password,
    "vercel-protection",
    "operator-browser-must-be-existing-loopback-endpoint",
  );
  return url.origin;
}
export function navigationFailure(
  origin,
  finalUrl,
  status,
  application = false,
) {
  let url;
  try {
    url = new URL(finalUrl);
  } catch {
    return "invalid-navigation";
  }
  if (url.origin !== origin || status === 401 || status === 403)
    return "vercel-protection";
  if (!status || status >= 400) return "app-runtime";
  if (application && /^\/(login|signup|onboarding)(\/|$)/.test(url.pathname))
    return "application-auth";
  return null;
}
export function validateFixture(f) {
  requireCheck(
    f?.disposable === true &&
      f?.createdForIssue === 105 &&
      uuid.test(f?.runId ?? ""),
    "fixture-cleanup",
    "unapproved-fixture-manifest",
  );
  for (const field of ["ownerId", "subscriptionId", "locationId", "productId"])
    requireCheck(
      uuid.test(f[field] ?? ""),
      "fixture-cleanup",
      "invalid-fixture-id",
    );
  requireCheck(
    f.name === `Smoke 105 ${f.runId}` &&
      f.slug?.startsWith("smoke-105-") &&
      /^[a-z0-9-]+$/.test(f.slug) &&
      f.productName === `Smoke product ${f.runId}`,
    "fixture-cleanup",
    "fixture-name-scope-mismatch",
  );
  return f;
}
export function verifyMembership(f, requestUrl, memberships) {
  const url = new URL(requestUrl);
  requireCheck(
    url.hostname === developmentHost &&
      url.searchParams.get("user_id") === `eq.${f.ownerId}` &&
      Array.isArray(memberships) &&
      memberships.length === 1 &&
      memberships[0].subscription_id === f.subscriptionId &&
      memberships[0].role === "owner",
    "application-auth",
    "session-is-not-disposable-fixture-owner",
  );
}
export function unchangedSave(f, snapshot, requestUrl, payload) {
  const url = new URL(requestUrl);
  return (
    url.hostname === developmentHost &&
    url.pathname === "/rest/v1/subscriptions" &&
    url.searchParams.get("id") === `eq.${f.subscriptionId}` &&
    payload &&
    Object.keys(payload).length > 0 &&
    Object.entries(payload).every(
      ([key, value]) =>
        Object.hasOwn(snapshot, key) &&
        JSON.stringify(snapshot[key]) === JSON.stringify(value),
    )
  );
}
export function verifyCatalog(f, catalog) {
  requireCheck(
    catalog?.subscription?.id === f.subscriptionId &&
      catalog?.subscription?.name === f.name &&
      catalog.locations?.some((l) => l.id === f.locationId) &&
      catalog.products?.some(
        (p) => p.id === f.productId && p.name === f.productName,
      ),
    "fixture-cleanup",
    "published-fixture-scope-mismatch",
  );
}
