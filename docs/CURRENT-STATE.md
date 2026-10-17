# Talix current state

## Integrated development baseline — October 16, 2026 (Pacific / UTC)

Repository: BravoKelo/Talix. Default/development baseline branch: main.

The owner explicitly instructed merging the existing work and continuing manual testing afterward, superseding the requirement to finish additional live acceptance before this early-development integration. Do not reimpose that checkpoint. Future material product/architecture/schema/security/infrastructure decisions still follow AGENTS.md; this approval does not authorize payment processing or broader features.

## Confirmed integration
- PR #2: foundation and business-neutral commerce core; retargeted to main and merged by merge commit 05e6db3040c4fb3b255ff38cf2f2fe87add03c8a.
- PR #4: customer signup, offerings, subscriptions, Users and reconciliation; retargeted to main and merged by merge commit fce04b7ddc35f0505868c616dd0d3fb257571df8.
- The final application merge tree is 0ebe54e04d408786bd929b8d73305aa3ad3f5c66, exactly identical to accepted onboarding head 432e7dd59abca5d3db8b847f061dead8c6d3f0f0.
- Original foundation and feature branches/commits are preserved. No squash, rebase or branch deletion.
- A documentation-only follow-up records this baseline. Recover the latest main SHA from GitHub; this document cannot contain its own commit SHA.

## Implemented
Next.js/Supabase/Vercel business-neutral ordering/fulfillment; multiple subscriptions per client and locations per subscription; general/location products, generic options, images, published catalogs, guest checkout, private order tracking, fulfillment histories and simulated payments/refunds.

Landing signup collects structured business/contact/first-location details, offers sample business types/plans/extras, reviews once and uses the owner-approved no-mail confirmation page before workspace entry. Additional subscriptions preserve the shared client profile and keep separate immutable purchase details. Offerings are editable by allowlisted Talix staff.

Users lists editable existing accounts, protects Owner, supports predefined/custom permission roles and independent subscription/location assignments. Managers cannot alter themselves/Owner or grant authority/location access they lack. ADR 0003 records the implemented mapping and approval history. Invitations are not implemented; employee Auth accounts must already exist.

## Services and deployment
Existing Talix development Supabase project: lzepujggusieapablzhn, us-east-1, PostgreSQL 17. Ten recorded migrations through 20261008033814_preserve_client_profile; no replay/rollback or new migration during integration. Application tables have RLS. The profile function body was compared byte-for-byte to its reviewed migration; body/prosrc MD5 84fab1fca6bb9a2e4a51c945a1a2caef and complete-definition MD5 912ec850712b76b19d8a4d641a2dc990. Fixed search path and execution grants remain unchanged.

Vercel project prj_Xmg24E6djhGtCFIJsmP9EblkLDym, team team_eTPaf9j2OvuQWUZGssM8wVjv, Node 24. Production tracks main, but the approved root vercel.json now sets git.deploymentEnabled.main=false on main. Feature previews remain enabled; manual releases are not disabled. Post-merge inspection found only the historical production deployment from 9b0e35ea; no new production deployment. No production database configuration or release was made. The owner's screenshots showed an empty Project production-variable tab; Shared variables were not inspected.

Continue testing the protected onboarding preview: https://talix-git-feature-customer-onboarding-bravokelo.vercel.app/ . It uses the existing development service and TALIX_EMAIL_CONFIRMATION_PENDING=true. Production is not configured for this development journey. Main deployment/release configuration can be decided when actually needed.

## Validation and honest limits
- Core head 5c481daa3f03027a06afb4cd481b304cff8b0707 passed push/PR checks 38972419707 and 38972426161.
- Onboarding implementation/configuration head e75be28b2611a27c88ea404e5bf6003b82d37ae5 passed push/PR checks 38972427075 and 38972431963; matching feature previews are READY.
- Accepted documentation head 432e7dd59abca5d3db8b847f061dead8c6d3f0f0 passed push/PR checks 38973288019 and 38973293326. Main's merged tree is identical.
- Automated validation includes lint, TypeScript, 34 unit/SQL tests, production build and six desktop/mobile browser scenarios. Browser suites use an isolated real-SQL/RLS adapter, not the actual Supabase service.
- Live rolled-back SQL checks confirmed additional-subscription profile preservation, separate snapshots, retry safety, role seeding and cross-user isolation; no fixtures remained.
- Actual cloud-browser checks reached business form → real Retail plans/extras → canonical review and a $39/month sample total. No account/subscription was created during this latest attempt. A full fresh deployed authenticated signup/Users/order/refund journey remains unverified; the owner chose to continue manual testing after merge. Do not report this as passed or make it a repeated integration gate.
- Main-trigger CI runs, when present, must be read before reporting their result. Documentation-only follow-up status is recorded in Issue #10.

## Next work
The owner resumes testing and reports issues. Record and correct the next authorized batch, using main as the baseline and focused feature branches. Do not restart theoretical POC/discovery or repeat completed reconciliation. No new feature scope is approved.

Known limits: simulated billing/payments only; no card collection or money movement; real email verification/delivery deferred until launch; predefined role mappings remain the current implemented defaults; USD only; hours descriptive, no stock/tax/shipping/scheduled-order enforcement; latest 100 location orders; no invitations/shared ownership/full CRM/BOM/inventory/industry modules/integrations. Existing advisor notices and two historical synthetic Storage images are unchanged. No owner data was modified or deleted during integration.


## Active design review — Issues #11–13

Branch feature/talix-design-refresh starts from main 0616ae15. The owner supplied all three requests and screenshots, authorizing this batch: original blue/white/gold sign-in/signup and workspace redesign, plus a preview-based editor for existing subscription appearance fields and coming-soon placeholders for unsupported controls. No database/security/provider changes. Local lint/typecheck, 34 unit/SQL tests, build and six desktop/mobile browser scenarios passed, including preview/cancel/persisted-save checks. A final CSS correction keeps signup account fields before its confirmation action; exact CI validates the published head. Browser tests use the isolated SQL/Auth adapter, not fresh real-service signup. A stale local generated cache was moved outside the repository; it is not published. New preview uses the same branch-scoped development public configuration/no-mail flag as the existing review environment. Production and automatic-main-deployment hold are unchanged.

No merge is authorized by this design request. Review exact PR/head and preview before acceptance. After an accepted merge, remove this new feature branch once its preview is replaced, per the owner's tidy-branch preference. Do not delete older branches while an active testing URL depends on them.


### Public landing page added to the same design review

The owner requested a redesigned Talix homepage after seeing the unchanged old landing page. Issue #11/PR #14 now include an original responsive marketing homepage using established capabilities and the Talix palette, with explicit sample-content illustration, future-feature labels and simulated-payment disclosure. No backend or schema changes. Review the preview root URL, not only /login. Existing browser scenarios now also check the homepage heading, payment FAQ, signup entry and horizontal fit on desktop/mobile. Exact-head CI and deployment evidence belong in PR #14; owner acceptance/merge remain outstanding.


### Mobile/touch design correction

Owner approved replacing wrapped mobile navigation with compact disclosure menus and increasing touch targets. Same feature/talix-design-refresh branch/PR #14 now includes responsive public/workspace menus, deliberate single-column mobile controls and 48px touch targets. Tests exercise mobile menu opening before navigation. Review the latest matching preview/head in PR #14; no merge is implied. Cloud-browser preview access was previously declined and has not been retried; local browser screenshots and automated checks remain the visual/functional evidence.


## Latest authorized review batch — Issues #15–21

The owner finished intake and authorized these corrections, requesting a final review before merge. Work stays on feature/talix-design-refresh / PR #14. Implemented: back-to-top, visible mobile horizontal navigation (supersedes dropdown menus), consistent workspace header and top-right subscription/location context, business identity fallback, planned-feature navigation, ledger orders with an interactive modal, searchable settings tiles and internal Users tabs preserving drafts. Existing permissions and payment simulation are retained.

Business-logo configuration adds a prepared migration 20261017010613_business_logos.sql (nullable logo_url, constrained public bucket, existing settings permission checks and a catalog logo field). It is locally tested but NOT applied to development. AGENTS.md requires protected schema/security approval before development execution; obtain that specific approval after presenting the prepared result. The preview remains compatible with the current ten-migration database: logo uploads stay disabled until activation, while existing branding fields can save. No owner data, policies or storage have been modified on the actual service in this batch. Main deployment hold and no-mail development mode remain unchanged.

Local logo SQL tests verify shared settings managers can save/upload without product permissions, outsiders/viewers cannot, unsafe logo addresses are rejected, and public catalog adds no client identity. Browser suites use isolated SQL/Auth fixtures, not actual service account creation. Exact published head/checks/deployment and final test outcomes are recorded in PR #14. Review before merge; issues remain open until owner acceptance. No additional branches were created; retain existing previews until replaced.


### Logo activation — October 17, 2026 UTC

Supersedes the pending-execution boundary above: the owner explicitly approved applying the prepared logo-storage migration to Talix development. Applied successfully to project lzepujggusieapablzhn as 20261017032355_business_logos; repository filename aligned with the recorded service version, with unchanged SQL. Eleven migrations are now recorded. Verified nullable logo_url, public JPEG/PNG/WebP bucket with 5 MB limit, existing settings-based insert/select policies and public catalog logo field. Live transaction checks passed authorized owner upload metadata/save, unsafe URL rejection, foreign-folder rejection, and outsider upload/save denial. All synthetic Auth/workspace/storage metadata was rolled back. No existing business records or image files were changed. This is database/RLS verification, not a real browser binary-upload acceptance claim. Existing preview detects logo_url automatically and enables uploads after reloading the workspace. Security advisors still report established public/authenticated RPC notices, private admin deny-all RLS, and disabled leaked-password protection; no new functions or broader permissions were added. Final owner UI review and merge acceptance remain pending; no merge or production deployment authorized.


### Owner testing corrections #22–25 — October 16, 2026 Pacific

Owner authorized this batch on the existing feature/talix-design-refresh / PR #14; final review still precedes merge. Prepared: remove generic Saved text and the workspace footer, retain action errors, compact Products into readable touch-friendly tiles, replace code-like order references with permanent numeric numbers, and provide confirmed order cancellation separate from refunds.

The proposed migration 20261017035355_readable_order_numbers_and_cancellation.sql is NOT APPLIED to development. It backfills location-specific order numbers chronologically starting at 1001, enforces location/number uniqueness, allocates new numbers under a location row lock, and exposes only the number through existing order visibility/private-token tracking. UUIDs, tracking links, checkout idempotency and histories remain intact. It extends the existing checked advance_order RPC to cancel paid/partially-refunded received/in-progress/ready orders under existing orders.fulfill permission, records the event once, and leaves payment/refund amounts unchanged. Completed/cancelled orders cannot be reopened. No new public RPC or permission role is added.

Until separately approved development execution, the preview uses a readable received-date reference for existing orders and shows cancellation as awaiting availability. This is a compatibility fallback, not a permanent unique order number; final numeric numbering/cancellation activation requires the prepared migration. No database changes in this batch are authorized by implementation approval alone under AGENTS.md. Exact validation and preview evidence belong in PR #14. Keep issues open for owner review.

