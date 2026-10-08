# Talix current state

## Recovery checkpoint — 2026-10-08 UTC / 2026-10-07 Pacific

Repository: BravoKelo/Talix. Active review branch: `feature/customer-onboarding`, draft PR #4 stacked on unmerged core PR #2. Issue #10 authorizes reconciliation/stabilization; final merge and database execution acceptance remain separate. Recover exact branch heads, CI and preview again before continuing; this document cannot contain its own commit SHA.

Last verified pre-reconciliation heads:

| Branch | Commit | State |
|---|---|---|
| main | 133cb2450a422ed550a8d646d3a7626d36c68519 | Initial README only |
| foundation/project-governance | 4d547496998c50a30ee20afec5ef423b7145381d | Original foundation |
| feature/core-commerce | e6fc00a56bf3aca5e0955f74a1c18a5131d9ed43 | Foundation plus core, PR #2 |
| feature/customer-onboarding | 7d7b5584c6c4e76ffed20a2322fe80094caa2c9e | Core plus onboarding/Users before Issue #10 corrections |

Ancestry is linear, with 8 foundation, 4 core and 8 onboarding commits before reconciliation. Both PRs are draft and mergeable at assessment. No human GitHub review or merge acceptance exists. Issues #1/#3 remain open; owner closed #5–9. Keep those defect issues closed; their closure does not approve a merge. The accessible local tree is an API-recovered mirror without `.git`; no substantive unpublished source was found at assessment. Publish only intended files, not generated output or environment files.

## Implemented capabilities

Business-neutral Next.js/Supabase/Vercel ordering/fulfillment, multiple subscriptions per client, one selected business type per subscription, multiple locations, subscription branding, general/local products with generic extras/images, guest ordering, private order tracking, generic fulfillment and simulated payments/refunds. Restaurant-specific behavior and module frameworks are absent.

Landing signup, structured business/contact/address validation, single selection review, automatic ordering addresses, saved onboarding drafts, changed-price re-review, editable sample Talix offerings and a staff customer summary exist. No card collection or money movement. Purchased terms are immutable; future addon benefits are not implemented by selecting sample offerings.

Current-user server verification and full-navigation signout protect workspace entry. Users begins with configured accounts; Owner is protected. Predefined/custom subscription roles and separate location roles expose allowed/denied permissions. Managers cannot modify Owner, themselves or grant authority/location access they lack. Existing Auth accounts are required; invitations are deferred. ADR 0003 exposes the exact implementation mapping and its separate protected-decision acceptance boundary.

## Issue #10 prepared corrections

Browser regression tests reproduced repeat custom-role Save creating a duplicate and denied removal clearing the editor. Corrected UI retains the newly created role ID and resets the user editor only after success. Tests cover repeated Save, failure retention, successful removal and desktop/mobile flows.

A database regression reproduced additional subscriptions overwriting shared client details. Prepared migration `20261008030839_preserve_client_profile.sql` replaces only `start_subscription` client upsert with insert-if-absent and existing-client lookup. It preserves transaction locking, quote checks, generated addresses, membership/role seeding, immutable per-subscription details and request replay. No tables, policies, signatures or grants change; original nine migrations are unmodified. **This migration is not applied to development.** Until explicit approval, live additional purchases retain the prior overwrite behavior. The correction does not repair historical data or create a client-profile editor.

## Development services

Supabase project `lzepujggusieapablzhn` (Talix), us-east-1, healthy PostgreSQL 17. All 13 public application tables have RLS. Fresh assessment compared all nine remote migration versions and 18 checked authorization/transaction function bodies to the repository; no mismatch. Remote history was checked again during preparation and still contains exactly nine versions:

1. 20261007005603 core_commerce
2. 20261007005736 restrict_platform_trigger_access
3. 20261007005951 tune_core_access_queries
4. 20261007015259 customer_onboarding
5. 20261007015458 streamline_catalog_policies
6. 20261007041833 validate_signup_details
7. 20261007043143 generate_ordering_address
8. 20261008021501 configurable_user_roles
9. 20261008021928 index_membership_business_roles

Owner-approved no-mail development confirmation uses Auth automatic confirmation and `TALIX_EMAIL_CONFIRMATION_PENDING=true` on the protected onboarding preview. The confirmation page displays the authenticated email and '(Feature coming soon)'; Continue completes the saved purchase. Automatically confirmed development accounts do not prove mailbox ownership. Before live launch restore mandatory service email verification, disable the application flag and configure delivery/redirects.

Stable review URL: https://talix-git-feature-customer-onboarding-bravokelo.vercel.app/ . Assessment verified deployment `dpl_HJWg2oi5ozYV1WZpkgvKKgEkaVR7` READY for 7d7b5584. Publishing corrections triggers a new matching preview; verify its actual SHA/status instead of treating this prior deployment as current.

Vercel project `prj_Xmg24E6djhGtCFIJsmP9EblkLDym`, team `team_eTPaf9j2OvuQWUZGssM8wVjv`, Node 24, deployment protection retained. Development and the two feature branches have public Supabase environment values; only onboarding preview has the pending-confirmation flag. No production or generic-preview Supabase environment values are configured. An initial production-labelled deployment from older core commit 9b0e35ea exists from project linking; it is disconnected from Supabase. No production promotion has occurred. Normalized project/Git-context tools do not expose the production branch or merge-trigger policy: **verify before merging**. Do not assume main inherits feature environment settings or activate intermediate core against the newer live database.

Two synthetic 1×1 image fixtures from historical core tests remain in Storage. They were confirmed present at assessment and are not deleted by Issue #10 preparation. Product-image replacement also retains previous objects. Cleanup requires separately authorized scope. Existing advisor notices include intentional checked RPC/private allowlist warnings, informational unused indexes, and disabled leaked-password protection as a launch-hardening item. No security setting was changed.

## Validation and limits

Fresh local checks for the prepared corrections passed: lint, TypeScript, 34 unit/SQL tests, production build and six desktop/mobile browser scenarios. Browser tests use a test-only Auth/PostgREST gateway backed by real migration SQL/RLS, not the live Supabase service. Regression tests failed against the old behavior before correction. The profile migration is included in isolated test databases only.

Latest pre-correction GitHub push run 37717557199 and PR run 37717558885 passed complete checks for 7d7b5584. Core run 37556360833 passed for e6fc00a5. Exact new-commit CI/deployment results must be inspected after publishing; success is not inferred from this local result.

Actual service evidence: assessment verified Auth automatic confirmation, active public offerings, denied anonymous restricted RPC, migration/function consistency and protected signed-out landing/workspace rendering. Preparation rechecked protected workspace → login with private/no-store response. Historical core tests used browser requests forwarded to the real service through Node; prior onboarding/Users checks used disposable actual accounts and removed associated rows. Those are historical service evidence, not a fresh full Vercel → live Supabase journey for this correction. Full deployed signup/additional subscription/owner/staff/employee isolation/ordering/refunds remains unverified pending database approval and controlled live testing. No real owner data, account, infrastructure or security policy was changed in this reconciliation.

## Exact restart and controlled integration

1. Inspect Issue #10, PR #4 head, the complete correction diff, exact CI and matching preview. Read AGENTS and ADRs 0001–0003.
2. Present the pending client-profile migration for explicit development application approval. After approval, apply only that migration and verify actual transaction behavior, migration history and advisors; preserve real data.
3. Complete controlled actual deployed acceptance checks. Report browser/service limits honestly; new material boundaries require approval.
4. Obtain explicit baseline acceptance of the implemented role mapping/protected delegation boundaries and separate merge acceptance for exact PR heads. Plan approval and closed bugs do not substitute.
5. Verify Vercel Git deployment triggers before either merge. Retarget PR #2 to main, review its expanded foundation/core diff, then merge by merge commit without activating incompatible intermediate core. Verify commit/CI and remaining mergeability; retarget/merge accepted PR #4 only after dependency checks. Preserve all branches/commits and do not replay migrations.
6. Verify final main tree/SHA/checks; record confirmed integration in this file/HISTORY and reconcile #1/#3 completion. No integration milestone is claimed yet.

Deferred: invitations, shared ownership/owner transfer, real billing/payment providers, taxes/shipping/stock deductions, scheduled ordering/hour enforcement, commercial entitlements, industry modules, inventory/BOM/COGS, full CRM/support/reporting, consumer accounts, integrations and transactional/marketing delivery. USD only; hours descriptive; queue limited to latest 100 location orders; detailed visual design remains provisional. Continue owner testing of existing core after stabilization, not new feature expansion.
