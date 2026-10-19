# Talix comprehensive engineering audit — 2026-10-19

## A. Executive summary

Talix has a coherent, appropriately small architecture: Next.js/React delivery, Supabase Auth/Storage/PostgreSQL, tenant RLS and checked transactional RPCs. No architectural replacement, microservices, industry registry or entitlement framework is justified by this audit. Existing server-side price calculation, ownership constraints, history snapshots and explicit permission checks are important strengths.

There are **11 actionable findings: 0 P0, 0 P1, 9 P2 and 2 P3**. Classification breakdown: 3 Confirmed Defects, 5 Architectural Risks, 1 Technical Debt, 1 Testing Gap and 1 Documentation Discrepancy. Risks are deliberately distinguished from reproduced failures. The most immediate correctness work is affected-row save acknowledgement, stable product option identity, session refresh coverage, checkout uncertain-response recovery and shared catalog permission consistency. No cross-tenant access bypass was demonstrated. This is not a security certification or production release approval.

The next website/owner-journey **design scope can proceed**. Resolve or explicitly verify the relevant save/session/delegated-permission findings before accepting the expanded owner journey. Real payments, production operations and private schema expansion have additional gates described below. No remediation has been performed.

## B. Repository baseline and scope

- Repository: `BravoKelo/Talix`; approved `main` baseline: **`a0dc2b2015a715bb2a8798bcd92b6d06d9538e97`**.
- Standards PR #47 is merged; its tested head was `38f50e104768c256eb3e349e95a71874a2bcdde2`. The baseline adds documentation acceptance after that merge; application, migration and test code are unchanged from that validated lineage.
- Assessment performed 2026-10-18/19 UTC; report date is 2026-10-19 UTC. Documentation branch: `docs/engineering-audit`.
- Governing sources: root [AGENTS.md](../../AGENTS.md), [standards](../standards/README.md), [architecture](../ARCHITECTURE.md), `docs/adr/`, product/design/current-state/history and setup documents. No nested AGENTS file was found in the inspected tracked repository.
- The supplied audit attachment restricts issue creation; the user's accompanying instruction explicitly authorizes new GitHub issues. That direct instruction governs this deliverable. Findings are issues for review, not implementation authority. Only this audit documentation is proposed in the PR.
- Application source, lockfiles, migration history, deployment settings and live business records were not modified. No dependency installation, upgrade, branch deletion, production deployment, payment, schema change or real customer transaction occurred.

### Validation deviation

One test selection was mistaken: `tests/onboarding.test.ts` imported the PGlite initialization helper and executed the 18 migration files in a **disposable in-memory database**. That exceeded the attachment's prohibition on migration execution even though no shared database or tracked repository file changed. The command completed; the result and deviation were disclosed to the owner. No further database-initializing tests were executed. This audit therefore cannot claim perfect procedural compliance with the attachment. Read-only live metadata queries used read-only transactions and did not execute migration SQL.

### Inventory and coverage

The tracked baseline contains **225 files**. Inventory categories: `src` 50, `public` 94, `docs` 21, `tests` 21, `supabase` 20, `scripts` 5 and root/other 14. There are 49 TS/TSX runtime-source modules, one stylesheet, 18 migrations and 92 SVG assets. Coverage means inspection at the level stated, not exhaustive formal verification of every branch or pixel.

| Area | Responsibility / dependencies | Inspection and verification boundary |
| --- | --- | --- |
| `src/app`, `src/proxy.ts`, Supabase helpers | Routing, SSR identity, callbacks and session persistence; Next/Supabase | Routes, layout, auth entry points, callback and proxy read; real token rotation not run (AUD-003). |
| `src/components/workspace.tsx`, admin/users/subscription settings | Owner/staff operations, permissions, lists, subscription changes; checked database contracts | Main component paths and effects inspected; not every role combination exercised live. AUD-001/007/009. |
| Onboarding, `src/lib/onboarding.ts`, business details | Resumable signup, quote selection and client/subscription acquisition | Types/parser, quote/completion flow and SQL inspected; malformed draft algorithm reproduced. AUD-008. |
| Storefront, header/navigation, dialogs, product editor | Public catalog, cart, checkout, presets, branding/navigation; catalog/checkout RPCs | Main source and contracts inspected; option algorithm reproduced; responsive CSS and focus/body-lock mechanisms reviewed. No new rendered/physical-device acceptance. AUD-002/004/006. |
| Image/upload/address/tracking helpers | Storage lifecycle, URL/input handling, tokenized tracking | Upload/delete ownership, cleanup and tracking privacy reviewed; no live Storage upload/deletion or mailed tracking link test. |
| `supabase/migrations` | Tenant schema, RLS/grants, transactional business rules | All 18 files inspected, latest composed definitions compared with live read-only metadata; no live negative-write tests. |
| `tests` and helpers | Vitest/PGlite contracts and Playwright local gateway | All test files inventoried; security/transaction tests and adapter implementation inspected, lengthy browser scenarios sampled. Historical CI checked; no complete fresh suite under migration restriction. AUD-010. |
| Configuration and CI | npm lock, TypeScript/ESLint/Next/Vitest/Playwright, Vercel, Supabase and workflow | Versions, permissions, scripts and root lock agreement checked; repository protection settings unavailable. AUD-005. |
| `docs`, root instructions and design scripts | Decisions, product limits, operational/handoff ownership, prototypes | Current governing documents and ADRs inspected; selected long historical sections sampled. Stale statements recorded as AUD-011. |
| `public`, demo/design scripts | Demo catalog images and static design prototypes | All 92 SVGs scanned for active-content indicators (0 matches), catalog paths and prototype rendering/storage helpers inspected. Not a full SVG sanitizer/security certification; scripts not executed against services. |

A regex-based static runtime import scan found **no cycles** among the 49 modules, excluding 11 type-only edges. This is a useful bounded check, not a compiler-backed architectural proof. A limited source pattern scan found no privileged Supabase service key reference, `eval(` or `dangerouslySetInnerHTML`; it is not a complete secret scan.

## C. Architecture assessment

The dependency direction is delivery/UI → shared types/helpers/provider clients → PostgreSQL authoritative contracts. Public catalog/checkout and token tracking are deliberately narrower than authenticated workspace access. Staff administration uses separate authority. Server and browser Supabase clients have distinct cookie responsibilities. Pure helpers are appropriately shared without introducing a DI framework.

Business rules remain concentrated in SQL for ownership, quotes, transitions, totals and retry safety. React components orchestrate forms and rendering. Large workspace, onboarding, appearance and admin components combine several state transitions, but size alone is not a defect. Split only when an approved change exposes independently testable responsibilities; avoid a speculative layered rewrite. Repeated form/error handling can be consolidated incrementally after preserving differing authorization and recovery rules.

The real boundaries needing attention are UI-to-write acknowledgement (AUD-001), stable option identity (AUD-002), session persistence (AUD-003), uncertain transaction state (AUD-004), shared versus local permission scope (AUD-009), and public response evolution (AUD-006). Provider coupling is reasonable for the current approved architecture. No industry implementation is imported into a shared core; industry labels and demo inventory are not specialized modules.

## D. Engineering standards compliance matrix

Statuses apply to the inspected baseline, not a claim that all future changes satisfy a standard. L1 findings require resolving the applicable violation before acceptance of affected work; this audit does not retroactively authorize a fix. “Compliant” is scoped to stated evidence. Runtime/deployed proof remains limited as listed. Finding numbers refer to TALIX-AUD identifiers in section E.

| Standard | Requirement | Components | Status | Evidence / relevant findings | Verification limit |
| --- | --- | --- | --- | --- | --- |
| A01 | Separate responsibilities | UI/helpers/SQL | Partially Compliant | SQL authority and helper boundaries coherent; orchestration/persistence acknowledgement AUD-001. | No mandatory wholesale layering; source review. |
| A02 | Coherent responsibilities | Workspace/onboarding/admin | Partially Compliant | Large components mix list/form/selection effects; targeted boundaries described in C. | Maintainability judgment, no length threshold violation. |
| A03 | Reuse genuinely shared behavior | Dialogs/images/navigation | Compliant | Shared dialog, image, business-detail and header helpers have concrete consumers. | Inspected reuse; not proof of zero duplication. |
| A04 | Simple demonstrated design | Application/SQL | Compliant | No speculative module registry or service layer present. | Future changes must justify abstractions. |
| A05 | Narrow real provider boundaries | Supabase helpers/RPCs | Partially Compliant | Central clients exist; response and retry semantics need work AUD-001/004/006. | No provider replacement tested. |
| A06 | Controlled dependencies/no cycles | 49 runtime modules | Partially Compliant | Static import scan found no runtime cycles; authoritative contracts documented. | Regex scan only; no automated architecture gate. |
| A07 | Meaningful domain boundaries | Client/subscription/location/order | Compliant | Schema and shared/location-role ADR distinguish actual domains. | Specialized industries absent. |
| Q01 | Readable conventional layout | src/tests/migrations | Compliant | Strict TS and established route/component/lib layout; lint completes. | One existing design-script warning. |
| Q02 | Strict typing/runtime narrowing | TS/draft parser | Partially Compliant | Typecheck passes, but parser asserts incomplete Quote AUD-008. | Static typing cannot validate JSON. |
| Q03 | Validate at authority | Quotes/checkout/editor | Partially Compliant | SQL validates prices/tenant selections; option identity and draft contract AUD-002/008. | No live malformed-write attempts. |
| Q04 | Explicit actionable errors | Workspace/checkout | Noncompliant | False-success update paths AUD-001 and uncertain attempt state AUD-004. | Source-level path; no live interrupted checkout. |
| Q05 | Explain invariants/tradeoffs | ADRs/setup/contracts | Partially Compliant | Contracts exist; stale operational statements AUD-011. | Historical text not all semantically revalidated. |
| Q06 | Incremental bounded refactoring | Recent PRs/audit diff | Compliant | Reviewed changes and this docs-only audit preserve bounded scope. | Not a review of every historical commit. |
| Q07 | Accessible shared UI/responsiveness | Dialogs/tabs/header/CSS | Partially Compliant | Focus/modal patterns, responsive rules and touch controls exist; no physical-device audit. | Cannot certify WCAG or device behavior. |
| S01 | Explicit tenant ownership | RLS/FKs/RPC/Storage | Partially Compliant | Ownership checks and cross-tenant isolated tests inspected; 14 public tables RLS enabled. | No fresh deployed negative-write suite; AUD-010. |
| S02 | Authoritative identity/permissions | RLS/roles/admin | Partially Compliant | Database denial exists; shared/local permission consistency AUD-009. | No cross-tenant bypass found; role matrix not run live. |
| S03 | Least privilege/public whitelist | Grants/definers/catalog | Partially Compliant | Constrained definers/grants; whole-row public serialization AUD-006. | Current fields inspected; future leak is conditional. |
| S04 | Keep secrets private | Source/config/tooling | Partially Compliant | No privileged key pattern found; conditional tooling advisories AUD-005. | Limited pattern scan; no forensic artifact scan. |
| S05 | Validate inputs/restrict output | URLs/SQL/catalog/tracking | Partially Compliant | Parameterized RPC/URL handling and private tracking headers; AUD-006. | No current private column disclosure found. |
| S06 | Atomic integrity/snapshots/cents | Transactions/product options | Partially Compliant | SQL constraints, cents and snapshots strong; option identity AUD-002. | Real concurrent sessions not tested. |
| S07 | Immutable approved migrations | 18 migration files | Compliant | Tracked history unchanged; names and 26 function bodies compared with live metadata. | Audit test replay deviation in B; no live execution. |
| S08 | Idempotency/locking/stale state | Checkout/refunds/subscription changes | Partially Compliant | Checked keys/locks/version rules; client recovery AUD-004, test fidelity AUD-010. | No true concurrent-session execution. |
| S09 | Stable explicit contracts | RPC/UI/schema consumers | Partially Compliant | AUD-002/003/006/007/009 identify contract evolution/fidelity gaps. | Not every response field formally schema-validated. |
| S10 | Durable authority in storage | Orders/payments/cart | Compliant | Order/payment authority in SQL; UI cart memory is intentional. | Multi-instance restart behavior not load-tested. |
| S11 | Safe approved async processing | No approved queue/worker | Not Applicable | No queue/webhook processor introduced; payments simulated. | Must assess when such a mechanism is approved. |
| S12 | Privacy-safe diagnostics/recovery | UI/RPC error handling | Partially Compliant | User feedback exists; save/session/unknown outcome AUD-001/003/004. | Central observability remains a documented limitation. |
| S13 | Operational recovery evidence | Service configuration/backups | Not Verified | Deployment restrictions and additive migration records exist. | Backup/PITR configuration and restore drill evidence unavailable. |
| S14 | Bound/measure performance | Lists/catalog/admin | Partially Compliant | Relevant indexes inspected; unbounded lists/N+1 AUD-007. | No profiling/load testing; no invented SLA. |
| T01 | Outcome/risk-based verification | Tests/CI | Partially Compliant | 65 historical unit/SQL tests plus 32 browser tests; AUD-010. | No new full suite under migration restriction. |
| T02 | Exact honest evidence | Audit/CI results | Compliant | Commands, historical versus new results and deviation explicitly recorded. | Compliance means disclosure, not procedural perfection. |
| T03 | Existing lint/type conventions | ESLint/TS | Compliant | Lint completes with one existing warning; strict typecheck passes. | No automatic Prettier CI gate. |
| T04 | Relevant validation before acceptance | CI/checks | Partially Compliant | Accepted application lineage CI passes; targeted current checks pass. | No audit-head application build/browser rerun; AUD-005/010. |
| W01 | Bounded review/main protection | Branches/PRs | Partially Compliant | Dedicated audit docs branch and reviewed main lineage. | Technical branch-protection/ruleset settings not accessible. |
| W02 | Separate deployment/migration/merge authority | Vercel/workflow | Compliant | main automatic deployment disabled; no deployment or merge by audit. | Runtime release availability not inferred from CI. |
| W03 | Versioned safe configuration | Repo/Supabase metadata | Partially Compliant | Config and migrations versioned; function metadata match checked. | Full hosting/Auth/Storage configuration drift not verified. |
| W04 | Approved material architecture changes | ADRs/audit recommendations | Compliant | Existing ADR boundaries preserved; recommendations do not authorize changes. | Approval needed for future boundary changes. |
| W05 | Reconcile owning documents | Setup/roadmap/design notes | Partially Compliant | Acceptance records exist, but stale text AUD-011. | No remediation of owning docs in audit. |
| W06 | Least-privilege automation/dependencies | CI/npm | Partially Compliant | Read-only workflow permissions retained; dependency advisory scope AUD-005. | No repository administration settings proof. |
| P01 | Core independent of industries | Generic commerce core | Compliant | No specialized industry module imports found. | Does not prove future module design. |
| P02 | Industry-owned specialized rules | No industry modules | Not Applicable | Industry labels/demo catalogs are not specialized workflows. | Assess interfaces when actual modules are proposed. |
| P03 | Server-enforced entitlements when introduced | No restricted-feature engine | Not Applicable | No entitlement engine or restricted feature introduced. | Plans are not proof of feature enforcement. |
| P04 | Explicit capabilities/tier evolution | Offering catalog/industry change | Partially Compliant | Named tiers and checked industry changes exist; capability mapping is future work. | No implemented capability contract claimed. |
| P05 | Client/subscription/location boundaries | Purchases/roles/industry history | Partially Compliant | Immutable purchase preservation and checked owner changes; AUD-009. | Live cross-tenant mutation tests not run. |
| P06 | Existing-site and primary-site paths | Storefront/settings/future scope | Partially Compliant | Linkable storefront/settings implemented; full primary website not built. | No embedded integration/custom domain claim. |
| P07 | Preserve owner website commercial direction | Product/current-state/onboarding | Compliant | Included adjustable-template direction recorded; no new charge or real billing activated. | Future limits/fee basis still require approval. |
| P08 | Stable justified extension interfaces | Core/future modules | Compliant | No speculative plugin/event/entitlement framework added. | Future interfaces require consumer evidence. |
| P09 | Preserve approved behavior | Regression suites/future scope | Partially Compliant | Historical CI and inspected compatibility paths; AUD-002/004/010. | Industry-specific workflows not implemented or certified. |

## E. Prioritized findings register

The full 15-field evidence records appear below and in the linked issues. Severity reflects Talix exposure, not raw upstream advisory labels. No P0/P1 finding is established by current evidence. An issue is a proposal for review; it does not authorize remediation or change an accepted ADR.

| ID | Priority | Classification | Finding / issue | Confidence |
| --- | --- | --- | --- | --- |
| TALIX-AUD-001 | P2 | Confirmed Defect | [Confirm affected rows before reporting workspace saves as successful](https://github.com/BravoKelo/Talix/issues/48) | High |
| TALIX-AUD-002 | P2 | Confirmed Defect | [Preserve product option identities across edits and reordering](https://github.com/BravoKelo/Talix/issues/49) | High |
| TALIX-AUD-003 | P2 | Architectural Risk | [Cover session-reading public routes with a cookie refresh strategy](https://github.com/BravoKelo/Talix/issues/50) | Medium |
| TALIX-AUD-004 | P2 | Architectural Risk | [Retain checkout attempt identity through uncertain responses](https://github.com/BravoKelo/Talix/issues/51) | Medium |
| TALIX-AUD-005 | P2 | Architectural Risk | [Review and remediate dependency advisories in development tooling](https://github.com/BravoKelo/Talix/issues/52) | High |
| TALIX-AUD-006 | P2 | Architectural Risk | [Whitelist public catalog product and location fields](https://github.com/BravoKelo/Talix/issues/53) | High |
| TALIX-AUD-007 | P2 | Architectural Risk | [Bound workspace and admin lists and remove per-row history loading](https://github.com/BravoKelo/Talix/issues/54) | High |
| TALIX-AUD-009 | P2 | Confirmed Defect | [Align shared product permissions with workspace visibility and read scope](https://github.com/BravoKelo/Talix/issues/56) | High |
| TALIX-AUD-010 | P2 | Testing Gap | [Add service-level evidence for transaction races and Auth/PostgREST contracts](https://github.com/BravoKelo/Talix/issues/57) | High |
| TALIX-AUD-008 | P3 | Technical Debt | [Validate the complete resumable onboarding draft shape](https://github.com/BravoKelo/Talix/issues/55) | High |
| TALIX-AUD-011 | P3 | Documentation Discrepancy | [Reconcile stale operational documentation with accepted storefront behavior](https://github.com/BravoKelo/Talix/issues/58) | High |

### TALIX-AUD-001 — Confirm affected rows before reporting workspace saves as successful

Issue: [48](https://github.com/BravoKelo/Talix/issues/48).

Audit baseline: `a0dc2b2015a715bb2a8798bcd92b6d06d9538e97`. Assessment only; this issue does not authorize implementation.

**Finding ID**

TALIX-AUD-001

**Classification**

Confirmed Defect

**Severity**

P2

**Affected component**

Workspace persistence

**Files / evidence locations**

src/components/workspace.tsx:919–927,1121–1135,1158–1167; src/components/appearance-editor.tsx:141–148; tests/users.test.ts:136–151

**Applicable standards**

Q04, S02, S12, T01

**Problem**

Several UPDATE calls check only error, then update local state or resolve a save as successful. They do not verify that the target row changed.

**Supporting evidence**

RLS-denied UPDATE can legitimately return success with zero rows; existing denial tests explicitly exercise zero-row results. The hide-product, appearance and location save paths do not distinguish that result. This is a source-proven false-success path, not an executed live permission-revocation test.

**Impact**

After permission revocation or concurrent deletion, a user can see a successful save or optimistic change that was never persisted. Database authorization still denies the write.

**Recommended remediation**

Require an affected-row acknowledgement using the existing data-access pattern, and preserve drafts with actionable feedback on denied/missing rows. Review any needed SELECT permissions; do not weaken RLS.

**Estimated complexity**

Low–medium

**Dependencies / approval**

Approve a bounded persistence fix; a new RPC or permission change would require separate review.

**Regression tests / acceptance criteria**

Simulate successful HTTP responses affecting zero rows, revoked access, missing rows and normal saves; assert no false success and preserved drafts.

**Confidence**

High

**Next-scope gate**

Resolve before accepting expanded owner setup/save journeys.

### TALIX-AUD-002 — Preserve product option identities across edits and reordering

Issue: [49](https://github.com/BravoKelo/Talix/issues/49).

Audit baseline: `a0dc2b2015a715bb2a8798bcd92b6d06d9538e97`. Assessment only; this issue does not authorize implementation.

**Finding ID**

TALIX-AUD-002

**Classification**

Confirmed Defect

**Severity**

P2

**Affected component**

Product editor and cart contract

**Files / evidence locations**

src/components/product-editor.tsx:166–181,273–276; src/components/storefront.tsx:181–202; supabase/migrations/20261007005603_core_commerce.sql (checkout option lookup)

**Applicable standards**

Q03, S06, S09, T01

**Problem**

Saving option text regenerates IDs from array positions instead of preserving the existing identifiers.

**Supporting evidence**

The save mapper assigns option-${i}; the text representation omits IDs. An isolated reproduction of this algorithm changes an existing gift_wrap ID to option-0 on an unchanged edit. Cart lines retain option_ids and checkout resolves them against the current product. No live product was edited.

**Impact**

An open cart can reject an unchanged option after an edit. Reordering position-based IDs can associate an old selection with a different current option; that latter outcome is inferred from data flow, not an executed end-to-end case.

**Recommended remediation**

Keep stable IDs for existing options, generate IDs only for new options, and explicitly handle deleted/stale selections. Preserve historical order snapshots.

**Estimated complexity**

Medium

**Dependencies / approval**

Approve product/cart compatibility behavior; assess stored option formats before implementation.

**Regression tests / acceptance criteria**

Unchanged edits preserve IDs; reorder preserves meanings; deleted options cause clear cart repair; open-cart checkout and historical orders remain correct.

**Confidence**

High

**Next-scope gate**

Resolve before expanding catalog editing; no architectural rewrite required.

### TALIX-AUD-003 — Cover session-reading public routes with a cookie refresh strategy

Issue: [50](https://github.com/BravoKelo/Talix/issues/50).

Audit baseline: `a0dc2b2015a715bb2a8798bcd92b6d06d9538e97`. Assessment only; this issue does not authorize implementation.

**Finding ID**

TALIX-AUD-003

**Classification**

Architectural Risk

**Severity**

P2

**Affected component**

Supabase SSR session handling

**Files / evidence locations**

src/proxy.ts:33–42; src/lib/supabase/server.ts:12–19; src/app/layout.tsx:18–20; src/app/page.tsx:31–33; src/app/shop/[slug]/page.tsx

**Applicable standards**

S09, S12, T01

**Problem**

The refresh proxy excludes the home, storefront and tracking routes even though the root layout and some public pages read the authenticated user.

**Supporting evidence**

Server Component cookie writes are caught because those components cannot persist cookies. The helper assumes the proxy performs persistence, but its matcher excludes these routes. Supabase SSR guidance requires a writable refresh boundary. Real expired-token rotation was not exercised.

**Impact**

Returning sessions can fail to persist refreshed cookies on public entry routes, causing repeated refreshes or apparent sign-out depending on timing and token state. No demonstrated tenant bypass.

**Recommended remediation**

Review all session-reading routes and provide a consistent writable refresh boundary, or avoid unnecessary session refresh there. Preserve private/no-store behavior for personalized responses.

**Estimated complexity**

Medium

**Dependencies / approval**

Authentication boundary review and explicit approval before changing proxy/session behavior.

**Regression tests / acceptance criteria**

Real service tests for expired access token, refresh rotation, new-tab home/storefront entry, persisted cookies, authenticated navigation and cache headers.

**Confidence**

Medium

**Next-scope gate**

Resolve or verify before owner onboarding acceptance. Reference: https://supabase.com/docs/guides/auth/server-side/creating-a-client

### TALIX-AUD-004 — Retain checkout attempt identity through uncertain responses

Issue: [51](https://github.com/BravoKelo/Talix/issues/51).

Audit baseline: `a0dc2b2015a715bb2a8798bcd92b6d06d9538e97`. Assessment only; this issue does not authorize implementation.

**Finding ID**

TALIX-AUD-004

**Classification**

Architectural Risk

**Severity**

P2

**Affected component**

Shopper checkout retry state

**Files / evidence locations**

src/components/storefront.tsx:206–240,506–510,563,596,648

**Applicable standards**

S08, Q04, T01

**Problem**

Editable checkout/cart state can clear requestId while an attempt is pending or its outcome remains unknown.

**Supporting evidence**

checkout captures a request key and payload. The form onChange clears requestId; input fields are not all disabled while busy. After a committed request whose response is lost, changed details can start a fresh key. SQL protects same-key retries but cannot identify unrelated new keys. This network-failure scenario was not executed.

**Impact**

A shopper may create a duplicate simulated order after an uncertain response. No real payment processor is active.

**Recommended remediation**

Retain an immutable unresolved attempt key/payload, prevent conflicting edits while pending and provide an explicit recovery/retry path before a fresh attempt. Keep intentional new orders possible.

**Estimated complexity**

Medium

**Dependencies / approval**

Approve recovery UX; retain the current server-side idempotency contract and simulated payments.

**Regression tests / acceptance criteria**

Delay a committed response, abort delivery, attempt edits and retry; assert one order and stable request identity. Test genuine new orders separately.

**Confidence**

Medium

**Next-scope gate**

Resolve before real payment work or claiming checkout failure recovery is fully proven; does not block website design.

### TALIX-AUD-005 — Review and remediate dependency advisories in development tooling

Issue: [52](https://github.com/BravoKelo/Talix/issues/52).

Audit baseline: `a0dc2b2015a715bb2a8798bcd92b6d06d9538e97`. Assessment only; this issue does not authorize implementation.

**Finding ID**

TALIX-AUD-005

**Classification**

Architectural Risk

**Severity**

P2

**Affected component**

Development dependencies

**Files / evidence locations**

package.json; package-lock.json; vitest.config.ts; .github/workflows/ci.yml

**Applicable standards**

S04, W06, T04

**Problem**

The lockfile contains development-tool dependency versions with published security advisories.

**Supporting evidence**

npm audit --package-lock-only --ignore-scripts --json reports 7 affected package nodes: 1 critical, 5 high, 1 moderate, representing 3 advisory families. The production-only scan reports 0. Installed Vitest 4.0.18 is affected. Critical Vitest conditions concern exposed UI/API or Windows UI/browser modes; reviewed CI uses Linux non-UI test runs.

**Impact**

Tooling exposure is conditional; the upstream critical rating is not evidence of a critical production Talix vulnerability. Developer or future preview tooling could increase exposure.

**Recommended remediation**

Choose compatible patched tooling versions and validate the whole approved upgrade. Do not apply npm audit fix blindly: its eslint-config-next recommendation crosses framework major versions. Avoid exposing affected test API/UI services.

**Estimated complexity**

Medium

**Dependencies / approval**

Separate dependency-change approval; verify supported versions at implementation time.

**Regression tests / acceptance criteria**

Clean install from reviewed lockfile, lint, types, unit/integration, build and browser CI; repeat production/dev advisory checks.

**Confidence**

High

**Next-scope gate**

Before exposing affected tooling; schedule a focused upgrade. Advisories: https://github.com/advisories/GHSA-5xrq-8626-4rwp ; https://github.com/advisories/GHSA-82fw-gwwq-j7x9 ; https://github.com/advisories/GHSA-vfj7-8cjw-p6xm

### TALIX-AUD-006 — Whitelist public catalog product and location fields

Issue: [53](https://github.com/BravoKelo/Talix/issues/53).

Audit baseline: `a0dc2b2015a715bb2a8798bcd92b6d06d9538e97`. Assessment only; this issue does not authorize implementation.

**Finding ID**

TALIX-AUD-006

**Classification**

Architectural Risk

**Severity**

P2

**Affected component**

Anonymous catalog response

**Files / evidence locations**

supabase/migrations/20261018174618_storefront_header_navigation.sql:48–49

**Applicable standards**

S03, S05, S09

**Problem**

The public catalog serializes whole product and location rows with to_jsonb instead of an explicit public field contract.

**Supporting evidence**

The latest catalog function uses jsonb_agg(to_jsonb(l)) and jsonb_agg(to_jsonb(p)); subscription output is explicitly selected. No currently private product/location field leak was identified.

**Impact**

A future private column could become anonymously visible automatically without a deliberate response-contract change. This is a future schema-evolution risk, not a confirmed present disclosure.

**Recommended remediation**

Define approved public product/location keys explicitly in an additive migration, preserve current consumers and document the response contract. Never edit applied migration history.

**Estimated complexity**

Low–medium

**Dependencies / approval**

Separate schema/security approval before migration preparation or execution.

**Regression tests / acceptance criteria**

Assert exact public key sets and existing storefront consumers; verify a private sentinel field cannot appear in isolated future-schema tests.

**Confidence**

High

**Next-scope gate**

Gate any addition of private columns to these tables; does not block design-only work.

### TALIX-AUD-007 — Bound workspace and admin lists and remove per-row history loading

Issue: [54](https://github.com/BravoKelo/Talix/issues/54).

Audit baseline: `a0dc2b2015a715bb2a8798bcd92b6d06d9538e97`. Assessment only; this issue does not authorize implementation.

**Finding ID**

TALIX-AUD-007

**Classification**

Architectural Risk

**Severity**

P2

**Affected component**

List queries and administration

**Files / evidence locations**

src/components/workspace.tsx:221–251; src/components/talix-admin.tsx:183–197,448 onward; supabase/config.toml:18

**Applicable standards**

S09, S14, Q04

**Problem**

Several owner/admin lists request all rows without pagination, while each rendered subscription summary can request separate history.

**Supporting evidence**

Static query review finds unbounded subscriptions, products, locations, clients and purchases, plus per-subscription history RPCs. Local API config has max_rows=1000; the deployed cap was not verified. The catalog JSON aggregate is also unbounded. The intentional latest-100 order view is not classified as a defect.

**Impact**

Potential incomplete lists at API caps and increasing payload/request counts for larger tenants. No measured latency regression, load result or demonstrated live truncation.

**Recommended remediation**

Use bounded pagination and explicit has-more/loading/error states; fetch history on demand or in an appropriate bounded query. Profile representative journeys before further optimization.

**Estimated complexity**

Medium

**Dependencies / approval**

Approve list behavior and performance targets; no new search service or scaling infrastructure justified.

**Regression tests / acceptance criteria**

Synthetic above-cap lists in an approved isolated environment, complete traversal, stable ordering, history request counts and measured representative timings.

**Confidence**

High

**Next-scope gate**

Before large catalogs/admin rollout; not a blocker for the next design proposal.

### TALIX-AUD-008 — Validate the complete resumable onboarding draft shape

Issue: [55](https://github.com/BravoKelo/Talix/issues/55).

Audit baseline: `a0dc2b2015a715bb2a8798bcd92b6d06d9538e97`. Assessment only; this issue does not authorize implementation.

**Finding ID**

TALIX-AUD-008

**Classification**

Technical Debt

**Severity**

P3

**Affected component**

Runtime input narrowing

**Files / evidence locations**

src/lib/onboarding.ts:55–74; src/components/complete-signup.tsx:16–32

**Applicable standards**

Q02, Q03, T01

**Problem**

readDraft returns the full Draft/Quote type after only partial nested runtime validation.

**Supporting evidence**

An isolated call accepts quote:{items:[]} even though business_type, total_cents, billing_interval, currency and sample are required by Quote. Item elements are not validated. The SQL completion boundary revalidates authoritative selections/quote; no price or access bypass was found.

**Impact**

The parser promises a stronger shape than it establishes, creating brittle future consumers and avoidable invalid resume attempts. A present UI crash was not demonstrated.

**Recommended remediation**

Narrow the complete supported resumable shape or model the weaker stored input explicitly, without treating user metadata as trusted pricing or authority.

**Estimated complexity**

Low

**Dependencies / approval**

Approve a focused parser/contract change; preserve SQL revalidation and recovery behavior.

**Regression tests / acceptance criteria**

Malformed nested quote/items, missing fields, invalid values, legacy drafts and valid current drafts; assert a safe rejection or explicit repair state.

**Confidence**

High

**Next-scope gate**

Address before extending resumed onboarding data; not a standalone launch blocker.

### TALIX-AUD-009 — Align shared product permissions with workspace visibility and read scope

Issue: [56](https://github.com/BravoKelo/Talix/issues/56).

Audit baseline: `a0dc2b2015a715bb2a8798bcd92b6d06d9538e97`. Assessment only; this issue does not authorize implementation.

**Finding ID**

TALIX-AUD-009

**Classification**

Confirmed Defect

**Severity**

P2

**Affected component**

Shared catalog role semantics

**Files / evidence locations**

src/components/workspace.tsx:351,882–946; supabase/migrations/20261008021501_configurable_user_roles.sql:41–44,113–116; docs/adr/ (shared/location role ADR)

**Applicable standards**

S02, S09, P05, T01

**Problem**

General product management uses shared permission authority in SQL, but product section visibility/actions use the current location permission. General-product reads also depend on a location grant rather than the shared grant.

**Supporting evidence**

private.allowed(s,NULL,p) reads the membership shared role; general-product write policy uses that scope. readable_product uses any permitted location for general rows, while the UI calls can(products.view/manage). A shared product manager with no local product grant cannot use the catalog action that the write boundary permits. This is a source-level denial/usability inconsistency, not an executed live role change.

**Impact**

Delegated shared catalog managers can be blocked or see inconsistent controls. No unauthorized write or cross-tenant escalation demonstrated.

**Recommended remediation**

Confirm the intended shared/general versus location catalog semantics, then align UI and authoritative read/write scopes. Preserve independent location permissions; do not broaden roles as an incidental fix.

**Estimated complexity**

Medium

**Dependencies / approval**

Product/security boundary decision required before any RLS changes; use an additive migration if approved.

**Regression tests / acceptance criteria**

Shared manager with no local assignment; shared manager plus local viewer; location-only manager; owner; revoked membership; cross-subscription denial.

**Confidence**

High

**Next-scope gate**

Resolve before accepting delegated team/catalog owner journeys.

### TALIX-AUD-010 — Add service-level evidence for transaction races and Auth/PostgREST contracts

Issue: [57](https://github.com/BravoKelo/Talix/issues/57).

Audit baseline: `a0dc2b2015a715bb2a8798bcd92b6d06d9538e97`. Assessment only; this issue does not authorize implementation.

**Finding ID**

TALIX-AUD-010

**Classification**

Testing Gap

**Severity**

P2

**Affected component**

Integration test fidelity

**Files / evidence locations**

tests/helpers/database.ts; tests/helpers/onboarding-gateway.ts; tests/database.test.ts; tests/subscription-changes.test.ts; tests/browser/onboarding.spec.ts:1325–1350

**Applicable standards**

T01, T02, S08

**Problem**

Current isolated adapters do not establish real concurrent-session locking, Auth token rotation or deployed PostgREST response behavior.

**Supporting evidence**

PGlite tests use a single connection and mock auth; the browser gateway serializes transactions and approximates REST responses. Sequential retry tests are valuable but are not evidence of independent concurrent transactions. Landing expired-session tests do not model actual refresh rotation.

**Impact**

Races or service-contract regressions can pass the isolated suite. This is an evidence gap, not proof of a broken lock or tenant boundary.

**Recommended remediation**

Add a bounded separately approved service-level suite for the critical invariants, retaining fast isolated tests. Use disposable infrastructure and explicit migration/test-data authorization; do not execute against shared production.

**Estimated complexity**

Medium

**Dependencies / approval**

Approve an isolated service test environment and any migration execution separately.

**Regression tests / acceptance criteria**

Independent concurrent same-key checkout, order numbering, refunds and subscription version races; real zero-row updates, revoked permissions and token refresh; verify no partial writes or duplicate effects.

**Confidence**

High

**Next-scope gate**

Before production release or changing concurrency-sensitive behavior; no requirement to rewrite all tests.

### TALIX-AUD-011 — Reconcile stale operational documentation with accepted storefront behavior

Issue: [58](https://github.com/BravoKelo/Talix/issues/58).

Audit baseline: `a0dc2b2015a715bb2a8798bcd92b6d06d9538e97`. Assessment only; this issue does not authorize implementation.

**Finding ID**

TALIX-AUD-011

**Classification**

Documentation Discrepancy

**Severity**

P3

**Affected component**

Setup, architecture status and historical design notes

**Files / evidence locations**

docs/SETUP.md (image lifecycle); docs/STOREFRONT-ROADMAP.md (foundation/status); docs/adr/ (initial ADR status); scripts/design/README.md

**Applicable standards**

W05, Q05

**Problem**

Some operational or proposal statements are stale or insufficiently marked historical compared with accepted source and PR evidence.

**Supporting evidence**

Setup text defers replaced-image cleanup while the current image hook has cleanup handling. Roadmap foundation text retains old global-header/navigation limitations. Initial ADR acceptance and design-proposal status wording need reconciliation against merged acceptance records. Existing issue #39 also has older body text corrected by a later comment; it is not a new functional pricing defect.

**Impact**

A maintainer can follow obsolete operational assumptions or mistake accepted work for a pending proposal.

**Recommended remediation**

Reconcile owning current documents, retain clearly dated historical context and link acceptance evidence. Do not rewrite historical records to manufacture approval.

**Estimated complexity**

Low

**Dependencies / approval**

Documentation-only review; no application or migration changes.

**Regression tests / acceptance criteria**

Check current behavior claims against source/accepted PRs, relative links, status dates and handoff consistency.

**Confidence**

High

**Next-scope gate**

Before the next implementation handoff; can run alongside design review.

## F. Security and multi-tenancy assessment

Tenant authority is rooted in authenticated identity, memberships and subscription/location relationships. Ownership foreign keys/validation triggers prevent cross-resource associations; RLS and narrow checked RPCs provide the write boundary. Owner and Talix administration are distinct; user metadata is resumable input, not an authorization source. Shared-role versus location-role permissions are intentional, but the general-product UI/read inconsistency needs a targeted decision (AUD-009). No frontend visibility rule was credited as sufficient authorization.

Read-only development metadata confirms **RLS enabled on all 14 public application tables**: memberships, location_access, orders, locations, payment_events, order_events, products, business_types, talix_offerings, subscriptions, clients, subscription_purchases, subscription_changes and business_roles. Migration names match all 18 local migrations. **26 compared application function bodies** match the latest source definitions by MD5; this covers the selected 9 private and 17 public functions, not all schema objects, policies, grants or service settings. Metadata checks also confirm anonymous execution denied for `confirm_subscription_change` and authenticated selection denied for `subscription_changes.request_payload`. Critical checked RPCs inspected have fixed empty search paths.

Read-only advisor results included intentional RLS-without-policy on the private administrator table, 5 anonymous and 16 authenticated definer-function notices, and disabled leaked-password protection in the development environment. These are not automatically vulnerabilities: public catalog/checkout/tracking and checked authenticated RPCs intentionally use constrained definer execution. The platform-managed `rls_auto_enable` event-trigger function was excluded from application-definer findings; anonymous/authenticated execution is denied. No policies or advisors were changed or suppressed.

Storefront data is intentionally public only for published/available content; token tracking has no-index/no-referrer protections. Whole-row output is a conditional future disclosure risk (AUD-006), not a current proven private-data leak. Storage paths and role checks were inspected, but real Storage API behavior was not exercised. Source rendering uses React escaping and reviewed URL validation; no intrusive XSS/SQLi exploitation was performed. A limited source/SVG scan cannot replace comprehensive security testing.

Before production launch, obtain explicit evidence for production Auth configuration, email/rate-limit/abuse protections, password protection decisions, backups/restores and operational incident recovery. Existing development email-confirmation exceptions and simulated payments are intentional boundaries, not newly discovered P0 defects. There are no implemented real payment webhooks to audit for signatures/replay; require those controls when a processor is actually introduced. No claim is made that all deployed Auth/Storage policies or branch protections were fully verified.

## G. Subscription and entitlement assessment

Implemented: client-owned additional subscriptions; immutable purchase snapshots; database-authoritative offering quotes; separately recorded checked Owner industry changes with stale-version/idempotency behavior; generic offering catalog supporting Starter, Plus, Pro and Ultimate. The current catalog pricing direction is $19.99/$29.99/$59.99/$99.99 monthly. Existing open issue #39 owns remaining plan-lineup reconciliation; the audit does not duplicate it as an unimplemented pricing defect.

The implementation is partially verified through source, metadata and accepted isolated CI, not a new full live subscription lifecycle exercise. Plan names are catalog data, not centrally enforced feature capabilities. There is no complete entitlement engine, real recurring billing cancellation/expiry engine, or specialized industry workflow activation. Those absent mechanisms are future scope, not evidence of an authorization bypass in an existing restricted feature. A future restricted feature must check centrally defined authority at every real server/database entry point, including eventual background operations. Avoid scattering plan-name checks through UI/SQL.

Additional industries and tiers can evolve through approved core contracts without replacing the stack. Actual specialized rules should live at justified boundaries. Preserve shared client details, subscription isolation and purchase/history snapshots. “Basic,” restaurant and restaurant-pro examples in the attachment are conceptual, not implemented SKU promises; current named tiers remain the four owner-selected names.

## H. Storefront and website readiness

Implemented but not fully reverified live: public storefront, configured default-location fallback, compact responsive products, product dialogs, cart popup, header presets/collapse, logo/branding, standard versus custom navigation, appearance tabs and private order tracking. Accepted CI has browser coverage. Static CSS inspection finds responsive rules and reduced-motion handling; no fresh visual comparison, screen-reader audit or physical tablet/touch verification was performed during this audit. Do not describe these as full accessibility certification.

Existing websites can link to the storefront now; custom navigation supports linking out. Embedded integrations, automatic website-header synchronization, a full website builder, hosting/domain onboarding and adjustable website templates are not implemented merely because navigation and presets exist. The approved next proposal should distinguish existing website / Talix template / decide later, with concrete setup, preview and launch states. Reuse current branding/navigation primitives but do not automatically reuse their public database serialization for private website configuration.

Adjustable default templates should avoid an immediate extra recurring website charge. Optional custom website work may have a custom design fee. Template limits, fee basis, domain/hosting/support terms and precise decision placement remain for owner approval. No template engine, new schema, entitlement model or billing change is approved by this audit.

Architectural readiness is sufficient for a bounded design proposal. Save acknowledgement and session-entry recovery matter before accepting a completed owner setup flow. Public-field whitelisting becomes a gate if private configuration columns are added. Cart/option fixes should precede expansion of the affected shopping/catalog behaviors. Full site implementation requires its own approved design/contract scope, not an architectural rewrite.

## I. Testing and validation results

Audit environment: Node **v24.19.0**, existing installed dependency tree temporarily linked from the established local checkout; no install or upgrade. Root manifest and lockfile dependency declarations match. The temporary link was removed before delivery. These checks are not proof of a clean reinstall.

| Command / check | Actual result | Scope / limitation |
| --- | --- | --- |
| `./node_modules/.bin/eslint .` | Exit 0; one pre-existing unused `brand` warning at `scripts/design/header-navigation-proposal.js:22:59` | No new lint error; not warning-free. |
| `./node_modules/.bin/tsc --noEmit --incremental false` | Exit 0 | No emitted or incremental files. |
| `./node_modules/.bin/vitest run tests/business-details.test.ts tests/image-name.test.ts tests/onboarding.test.ts --reporter=dot` | 16 tests, 3 files passed; 2.17 seconds | **Procedural deviation:** onboarding initialized migrations in disposable PGlite. No shared data changed. |
| `./node_modules/.bin/vitest run tests/business-details.test.ts tests/image-name.test.ts tests/header-navigation.test.ts --reporter=dot` | 7 tests, 3 files passed; 311 ms | Pure tests only; overlaps prior run, do not sum as unique coverage. |
| `npm audit --package-lock-only --ignore-scripts --json` | 7 affected dev package nodes; 1 critical/5 high/1 moderate | Query completed; vulnerability exit status is not a passing security gate. 3 advisory families, AUD-005. |
| `npm audit --package-lock-only --ignore-scripts --omit=dev --json` | 0 reported production dependency vulnerabilities | Time-specific registry result, not proof of no vulnerabilities. |
| Static import/source/SVG scans | No runtime cycles found; no selected unsafe source patterns; no selected active SVG indicators | Regex/pattern scope only; see B. |
| Isolated source-algorithm checks | Unchanged option ID regeneration and incomplete draft acceptance demonstrated | No live product, order or signup was written. |
| Development Supabase read-only metadata | 14 public tables RLS-enabled; 18 migration names aligned; 26 compared application function bodies match | Metadata SELECTs/read-only transactions, not behavioral security certification or full schema-drift diff. |
| Repository diff inspection | No tracked application/lock/config changes from audit execution | Only audit documentation proposed. |

Historical exact-head evidence: GitHub Actions run **39199903149**, job **117890510403**, for PR #47 head `38f50e104768c256eb3e349e95a71874a2bcdde2`: lint/typecheck/build completed, **65 tests across 13 files passed**, **32 browser tests passed in 7.0 minutes**. Actual logs were inspected. These results apply to the unchanged application lineage; they are not claimed as a fresh run at the audit documentation head.

Skipped intentionally: full Vitest/PGlite suite and browser gateway suite after the migration-initialization discovery; production build rerun that could rewrite generated artifacts; dependency installation; new Auth/Storage/mutation integration tests; real multi-session concurrency; load testing; production penetration testing; physical-device and complete accessibility review. No backup restore drill or repository protection inspection was available. The adapter-fidelity gap is actionable AUD-010, while unavailable operational proof is explicitly Not Verified rather than an invented defect.

## J. Technical debt register / implementation groupings

| Group | Findings | Bounded future work |
| --- | --- | --- |
| Persistence and identity contracts | AUD-001/002/009 | Acknowledged saves, stable options, explicit shared/location catalog scope. Keep distinct tests and approvals. |
| Session and transaction recovery | AUD-003/004/010 | Verify service boundaries, then targeted refresh/retry changes and real concurrency evidence. |
| Exposure and schema evolution | AUD-005/006 | Separate approved tooling upgrade from additive public-field whitelist migration. |
| Scaling and maintainability | AUD-007/008 | Bounded lists/history and runtime draft shape; no speculative framework. |
| Documentation | AUD-011 | Reconcile current instructions while preserving dated history. |

No standalone file-size refactor, new infrastructure, coverage-percentage target, queue, event bus or full module-system issue was created. Large component decomposition is guidance when touching an affected responsibility, not an independently demonstrated need for a rewrite.

## K. Remediation roadmap

1. **Critical/high triage:** none established. If new evidence reveals a tenant bypass or financial-integrity failure, stop affected work and reprioritize; do not treat the absence of a demonstrated bypass as certification.
2. **Correctness and owner journey:** approve AUD-001/002; verify and scope AUD-003; confirm AUD-009 permission intent before changing it. These are targeted fixes, with any schema/auth/security boundary changes separately approved.
3. **Essential failure/regression protection:** scope AUD-004 recovery UX and AUD-010 isolated service tests. Preserve current simulated payments and SQL transactions. No live-service write testing without separately approved environment/data/migration scope.
4. **Medium reliability and evolution:** approve a compatible AUD-005 tooling upgrade; schedule AUD-006 before private schema additions; bound AUD-007 before larger catalogs/admin adoption. Use measurements rather than speculative infrastructure.
5. **Low-priority debt/handoff:** AUD-008 parser contract and AUD-011 documentation reconciliation. Documentation reconciliation can accompany next-scope planning without altering application behavior.

Issue priorities are not implementation authority. A reviewed remediation plan should state exact files/contracts, protected approvals, test environment and recovery limits before any code, auth, dependency or migration work. No issue is automatically closed by merging the audit report.

## L. Future development readiness

| Future capability | Current state | Readiness / gate |
| --- | --- | --- |
| Business-owner onboarding | Existing signup/additional-subscription path implemented, isolated CI verified; next website decision path only documented | Design can proceed. Address/verify AUD-001/003/009 for acceptance of affected setup/team flows; AUD-008 before expanded resume data. |
| Existing-website storefront traffic | Linkable storefront and configured navigation implemented, not newly live-tested | No structural blocker; retain clear public contract and privacy boundaries. |
| Talix primary website | Direction approved, full product not implemented | Needs approved templates, editing limits, preview/launch and commercial/hosting decisions. |
| Configurable templates | Branding/header primitives implemented; full website templates absent | Bounded design/contract scope first; AUD-006 if adding private columns. |
| Additional industry modules | Generic industries/catalog exist; specialized workflows absent | Define one actual module's ownership/capabilities/consumers before architecture expansion. |
| Additional subscription tiers | Data-driven offerings exist; full feature entitlement/lifecycle engine absent | Future restricted features need authoritative capability checks and lifecycle rules; preserve purchase snapshots. |
| Production expansion | Build/isolated test foundation exists; payments simulated | AUD-004/010 plus production Auth, backup/recovery, abuse controls and operational/release evidence; separate production authorization required. |

There is no demonstrated architecture blocker to beginning the next design phase. This conclusion does not waive applicable L1 requirements in an implementation PR or authorize accepting unresolved affected behavior.

## M. GitHub issues and review disposition

The owner explicitly requested creation of new audit findings as issues; **issues #48–#58 were created**. Section E links each issue, includes the complete evidence/priority/complexity/prerequisites and specifies recommended regression acceptance criteria. Groupings and ordering are in J/K. Existing issue #39 remains separate; no existing issue, milestone, project board, PR or branch was modified by remediation.

This report is delivered as a documentation-only PR for review. No application fix, dependency update, migration execution against a service, deployment or merge is authorized. Decisions needed next: select the bounded remediation batch; confirm shared catalog permission intent and uncertain-checkout recovery UX; approve any auth/schema/dependency/service-test scope; review concrete website onboarding/template choices separately. The mistaken disposable migration test remains explicitly recorded in B/I.
