# Trusted-operator hosted Preview smoke tests — #105

This is the versioned procedure for a real deployed build. It is separate from the unchanged localhost Core workflow. Run only against a reviewed trusted Talix feature revision and the documented development Supabase project. No access links, protection bypass, credential copying/injection, CI secrets, staging service, schema changes or production operations are part of this procedure.

## Commands and access boundary

Use Node 24 and `npm ci`. `npm run smoke:preview -- --help` lists the command. It uses the existing Playwright dependency, not the Playwright test reporter. It writes a sanitized JSON summary to stdout only: no screenshots, traces, video, storage-state file or persisted Playwright report. Do not add CI upload/storage or retention work. The owner explicitly excluded those changes and a separate artifact-storage issue.

First collect a **fresh trusted-operator record** from the connected GitHub and Vercel read tools. The record is an operator-supplied snapshot, not cryptographic attestation: refresh it before each run, do not fabricate it from expected values. Use Vercel get-deployment with the exact deployment ID and documented team, and GitHub get-pr-info. Save only the following non-credential metadata in a temporary local JSON file (for example `.vercel/smoke-target.json`):

```json
{
  "checkedAt": "<current UTC ISO timestamp>",
  "teamId": "team_eTPaf9j2OvuQWUZGssM8wVjv",
  "pr": {
    "number": 98,
    "head": "<actual PR branch>",
    "head_sha": "<actual 40-character head SHA>",
    "head_repo_full_name": "BravoKelo/Talix"
  },
  "deployment": {
    "id": "<actual dpl_ ID>",
    "url": "<exact generated deployment hostname, no scheme/path/query>",
    "readyState": "READY",
    "target": null,
    "project": { "id": "prj_Xmg24E6djhGtCFIJsmP9EblkLDym" },
    "meta": {
      "githubCommitSha": "<actual deployment SHA>",
      "githubCommitRef": "<actual deployment branch>",
      "githubOrg": "BravoKelo",
      "githubRepo": "Talix"
    }
  }
}
```

The runner requires matching project/team/repository/branch/PR head and a READY non-production deployment. Records expire after 15 minutes. Production/custom domains, aliases, token/query URLs, stale records and mismatched SHAs are rejected before browser launch.

```text
npm run smoke:preview -- --target .vercel/smoke-target.json --sha <reviewed-head-SHA> --preflight
```

Without an operator browser endpoint, this starts a fresh credential-free Chromium browser. A protected deployment is expected to stop with `vercel-protection`; that result is useful preflight evidence, not a failed customer journey. It neither asks for owner sign-in nor attempts to obtain access by itself.

If the trusted operator **already has an authorized browser session exposed through an approved loopback CDP endpoint**, the same procedure can use it:

```text
npm run smoke:preview -- --target .vercel/smoke-target.json --sha <reviewed-head-SHA> --preflight --cdp http://127.0.0.1:9222
```

This connects to one existing browser context, creates and closes only its own pages, and leaves the browser and its credentials in place. It does not launch a profile, read cookie/storage values, export/import credentials, add headers, mint tokens, open access links or alter Vercel protection. Use a dedicated already-approved operator test browser. Do **not** enable a remote-debugging port on a normal browser, expose it off-loopback, attach to someone else's session or provision another credential/access mechanism merely to run the command. Establishing such access or credential transport, if none already exists, requires its own explicit owner security decision under #105. There is no implicit fallback.

Preflights are separate and stop at the first broken boundary:

1. Exact READY deployment/revision record.
2. Real browser navigation to the deployment. Cross-origin sign-in/redirect or 401/403 is `vercel-protection`; same-origin protection headings are also recognized. The report records sanitized status/classification without redirect query strings or cookie values.
3. Served scripts must contain only the documented development Supabase hostname and a modern publishable key, with no actual secret-key literal. The public Auth settings endpoint must accept that key. Values are not printed. This is a service-identity check, not proof of RLS, full Auth or mail behavior.
4. `/workspace` must pass real server-side application authentication. A redirect to login/signup/onboarding is `application-auth`. The preflight does not type passwords or create accounts. A session-only preflight does not establish that the account is an approved fixture owner.

No unchanged redeployment or automatic retry occurs. Connection/navigation/HTTP calls have finite timeouts; keep the first useful error and diagnose it. Do not run this against all four branches again when the same common access boundary has already failed.

## Disposable fixture lifecycle

Only proceed beyond preflights after an authorized fixture operator can both create the disposable tenant and perform or explicitly disposition its exact cleanup. This runner adds no cleanup privileges and uses no service-role credentials. Do not create fixtures first and discover cleanup authority later.

Create one short-lived fixture through the existing approved development application journey: generate a run UUID, use business name `Smoke 105 <run UUID>` and product name `Smoke product <run UUID>`, use fictional contact/address values and an `example.invalid` email, select a sample plan, and sign in as that account in the approved operator browser. Confirm the existing development no-mail behavior before signup; stop if it would send mail or needs an Auth/configuration change. Do not change email flags or Supabase settings. Record the exact Auth owner UUID, subscription UUID, published location UUID, product UUID and generated slug. Select the location as default and prepare an explicitly published Order First fixture website with a readable baseline product-text color. Publication must be an explicit owner action, never implied by selecting a preview mode. Do not create a persistent shared test account or use any real business.

The temporary manifest is data, not a private workstation script or authentication file. It contains IDs and explicit test-write selections, never passwords, cookies, keys, private tracking links or tokens:

```json
{
  "createdForIssue": 105,
  "disposable": true,
  "runId": "<run UUID>",
  "ownerId": "<fixture Auth UUID>",
  "subscriptionId": "<fixture subscription UUID>",
  "locationId": "<fixture published location UUID>",
  "productId": "<fixture product UUID>",
  "name": "Smoke 105 <run UUID>",
  "productName": "Smoke product <run UUID>",
  "slug": "smoke-105-<actual-generated-suffix>",
  "allowUnchangedSave": false,
  "allowSimulatedOrder": false
}
```

The runner confirms the real workspace membership request identifies that owner and exactly that subscription with Owner role; an account with unrelated tenant memberships is rejected. It matches the private subscription name and public catalog subscription/location/product IDs and names before any write flow. The manifest is not a substitute for server authorization. Creation, operator sign-in and initial publication remain explicit procedure steps, not claimed automated passes.

```text
npm run smoke:preview -- --target .vercel/smoke-target.json --sha <head-SHA> --cdp http://127.0.0.1:9222 --fixture .vercel/smoke-fixture.json --flow preview
```

Use the appropriate exact feature deployment for each flow; refresh metadata each time:

| Flow | Executed checks and side effects |
| --- | --- |
| `preview` (#96) | Real owner session/reload and public fixture catalog/customer view; 1280/768/390/320px hosts, 1120/768/390px private viewports, proportionate scale, native wheel/footer, no preview ordering, comparison with the already-published real website. No publication/save is performed by this flow |
| `contrast` (#62) | Requires `allowUnchangedSave: true`. White draft and accessible guidance, rejected Save focus, keyboard readable-default recovery, then explicit save of the **unchanged baseline** and authoritative returned row. A request guard prevents a changed/foreign-subscription PATCH from being sent; an unexpected attempt fails the check. Unsaved draft is cancelled on failure. Baseline must already be readable |
| `navigation` (#64) | Public fixture About/Contact, keyboard focus, Tab/Shift+Tab containment and Escape/opener return at desktop/tablet/phone widths. No persisted edit |
| `tracking` (#66) | Requires `allowSimulatedOrder: true` and authorized disposition of retained append-only test history. Actual product/cart/checkout with fictional contact data and approved simulated outcome, received status, then fixture-owner UI transitions to in progress/ready/completed and actual tracking reloads. Private tracking URL remains only in memory; report includes order/request UUIDs, never the bearer link |

Each non-preflight flow includes actual owner session and customer-facing page checks; owner and customer pages use the same existing context. This does **not** certify an anonymous customer session or isolated-account behavior. Core's existing isolated coverage is separate. Actual new sign-in, expired-session handling, implicit publication denial, unchanged-poll announcement behavior, cancelled/declined tracking, removed-opener recovery and broader cases retain their existing CI coverage or need additional explicitly recorded operator checks. Do not claim the minimal smoke covers the entire sprint matrix.

## Cleanup, output and result interpretation

The runner creates no Auth account, subscription, location or product. Those are declared pre-existing disposable fixtures for the one verification batch, not approved permanent accounts. Read-only flows leave them as declared; contrast can submit only their unchanged saved values. A tracking submission records its request ID as soon as the request is sent, so a lost response is reported as **commit-unconfirmed**, not “nothing created.” Confirmed test orders are listed by exact order ID. Retained order history causes a nonzero cleanup result even if the UI assertions pass.

After the batch, the pre-authorized fixture operator reconciles the manifest and any created order/request IDs, uses the existing approved administrative cleanup path for those exact disposable records, and verifies the exact Auth user/tenant/orders/products/location no longer remain. Do not execute guessed cascade SQL, broad name/prefix deletion, a migration, RLS bypass or install a service key. If the current operator lacks cleanup authority, stop before creation, or explicitly report already-retained IDs and obtain a separately reviewed cleanup decision. This repository has no client account/subscription/order purge API; a runner cannot safely invent one. Do not call cleanup complete on a sign-out alone. Remove the temporary metadata/fixture manifests after reconciliation; they are not Playwright reports.

The stdout summary includes deployment/PR/SHA, browser/viewport, individual checks, first failing classification, safe error codes, provider/application error counts and fixture retention. It never prints an external exception stack/message, redirect query, contact fields, public key, cookie, password or private token. Keep the ID-level operator summary private; copy only the necessary sanitized findings into the issue/PR. No files are written by the runner. Nonzero is failure/blocked; cleanup retention is separately marked. `completed: false`, READY, HTTP 200, zero observed errors before app access, or a passing preflight is never an end-to-end pass.

## Current executed evidence and remaining boundary

October 24, 2026 Pacific: the runner's first real read-only preflight used fresh metadata for PR #98 at `43a96395bdf338df7f87406d23deab23b1c355d8`, deployment `dpl_J21FYzVy9YQoFJR2e1A3A4nVdPbj`, on the exact generated Preview URL. Target/revision/READY checks passed. Fresh browser navigation stopped in `vercel-protection`; no fixture was opened/created, and application authentication plus owner/customer journeys were **not run**. This is an evidence-backed access blocker, not a completed hosted smoke test.

The approved executor currently has no supplied already-authorized loopback operator browser session. The previous connector HTTP 200 and direct-browser SSO discrepancy does not establish application Auth failure. The owner has prohibited access links. This procedure honors that prohibition and does not work around the earlier automatic-review rejection of link opening. Any new browser credential/access transport or protection/CI/service change remains separately approvable; no such remedy was applied.

Issue #105 and its PR own the exact runner revision and unit/code-quality evidence; [Sprint #91 / #97](https://github.com/BravoKelo/Talix/issues/97) owns remaining deployed acceptance. All feature PRs remain unmerged. Physical-device/real-assistive-technology limits retain [SUPPORTED-ENVIRONMENTS.md](SUPPORTED-ENVIRONMENTS.md). Application CI and its configuration are unchanged.
