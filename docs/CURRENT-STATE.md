# Talix current state

## Approved Figma implementation — October 17, 2026

Owner rejected the earlier storefront preview, collaboratively refined Figma, and accepted its v2 direction with “Lets proceed.” PRODUCT-DESIGN records the exact frames and approved behavior. Implementation remains on feature/core-storefront-visual-shopping / PR #33. Remote starting head verified fa29fd8cd8915c901e0d950ad2952d006183afe3; local starting tree at 860e7e3 is identical, with different commit object metadata after connector publication. Publish subsequent changes as a fast-forward from the verified remote head, not a force-push.

Prepared: single business header, centered name/photo, business account/cart icons, collapsing pinned header, left collection menu, responsive 3/2/2/1 grid, direct add/details, default location, appearance preview/save/cancel, staged header photo and product collection entry. Existing cart/checkout simulation/permissions remain. Migration 20261017172134_storefront_design_settings.sql is PREPARED ONLY: subscription presentation/default-location fields, product category, public catalog whitelist and header-photo reference protection. Existing roles, buckets and authorization are reused. New controls detect unavailable columns and await activation; old-database preview remains usable. No live database changes or merge are authorized.

Local lint, TypeScript, 53 unit/SQL tests, production build and all 12 desktop/mobile browser scenarios pass. New browser coverage checks collection filtering, default/fallback location, saved header photo/theme rendering, no duplicate application header, 48px icon targets, narrow-phone column collapse, and owner appearance preview/save/cancel plus header-photo upload/save/delete. Screenshots were reviewed against the approved Figma layout. A final menu/search styling correction also passed both focused desktop/mobile browser rechecks. Tests use isolated Auth/Storage fixtures and actual migration SQL/RLS, not live Supabase or real customer acceptance. Apply only after reviewing the final tested migration and obtaining explicit development-execution approval. Figma design acceptance is implementation authorization, not live database execution or merge acceptance.


## Storefront owner review corrections — October 17, 2026

Owner authorized compact image-led quick-add tiles, tile-click product dialogs and a collapsing sticky business header with the cart at top right. Presentation changes are prepared on the existing storefront branch. Local lint, TypeScript, 48 unit/SQL tests, production build and all 10 desktop/mobile browser scenarios pass. Screenshot review covers both widths; browser assertions cover two-column mobile tiles, first-row visibility, direct base-product addition, modal options/focus and the persistent collapsing cart header. Browser verification uses isolated fixtures, not live customer data. The configurable initial location is pending the explicit schema/catalog boundary decision described in PRODUCT-DESIGN; no default-location schema or live database change has been made.

Publication of review commit 0bd391a and PR #33 was explicitly approved, including existing automatic feature previews. Owner then authorized copying the existing development preview settings to this branch and rebuilding; deployment dpl_71wgSMCpgdG68VzCUutkgSKnhXMa reached READY at that commit. Owner confirmed sign-in works. The automated deployed-page fetch was blocked by Vercel Authentication, so no automated deployed sign-in claim is made. No merge is authorized.


## Active storefront development — Issue #32, October 17, 2026

Owner authorized the bounded visual storefront scope and continuation on `feature/core-storefront-visual-shopping`. Started with a clean feature branch at `39af71d5a4e7d7c9bf63ab68e56ea3027967a806`; remote main and feature branch were also verified at that baseline during this session. Earlier “no new feature scope” restart wording below is superseded by #32.

Prepared for review: image-forward uniform product cards, full product details/options in the existing keyboard-accessible native dialog, location-scoped product search, welcome/product/cart navigation, explicit location/contact/hours and missing-image/loading/empty/error states. Existing cart payloads, guest checkout, simulated payments, private tracking, subscription branding and database permissions remain. PRODUCT-DESIGN owns the detailed design; STOREFRONT-ROADMAP assesses both website adoption paths and the separately bounded primary-website proposal. No industry workflows or new entitlement structures were introduced.

Local verification: dependency installation, lint, TypeScript, 48 unit/SQL tests, production build and all 10 desktop/mobile browser scenarios pass. Four new browser cases cover product details/keyboard/options/cart variants/location reset/search/images and loading/empty/error states. Screenshots are generated for visual review. Browser validation uses isolated fixtures and real migration SQL/RLS, not live Supabase or a deployed customer journey. The standard browser download was unavailable locally; a temporary Chromium 153 runtime outside the repository completed the suite. An older fallback runtime failed two desktop onboarding checks and was replaced; no Auth/permission application change was required. Repository dependencies/tooling are unchanged.

Publication boundary: #32 explicitly excludes automatic deployment, while the accepted `vercel.json` disables only main deployment and the existing feature-preview automation remains enabled. No branch ref has been moved remotely, PR opened, deployment requested or service setting changed for this slice. Prepare the tested commit for review without advancing the remote branch; obtain narrow owner approval for the existing preview automation before publishing this branch/opening the PR. Do not silently change Vercel configuration to bypass the boundary. Main remains unchanged, no migrations or live data were touched, and no merge is authorized.

Resume: inspect this commit and the current remote branch, obtain that publication decision, then fast-forward the existing feature branch and open the prepared review PR against main. Read its actual CI results before claiming CI success; obtain separate owner visual/merge acceptance. Do not treat the storefront foundation as a complete primary-business-website service.


## Repository history cleanup — October 16, 2026 Pacific / October 17 UTC

Owner explicitly authorized rewriting the repository history and force-pushing without further interaction. Nineteen affected commits were replaced with cleaned versions; all five branch histories were audited and no tags exist. Only historical documentation text changed; application files, migrations, dependencies and merge topology were preserved. The cleaned branch tip before this handoff is d8e860a922b95ca6b2ed7039184130188727a884. The accepted application tree is unchanged. Use the latest main branch for all future work; do not merge old design history back into it. Commit timestamps for reconstructed commits reflect the cleanup operation. Historical checkpoint IDs below refer to equivalent cleaned commits; linked CI runs originally validated the corresponding pre-rewrite source trees.

GitHub retains a read-only head reference for merged PR #14, which still points to the original history. Branch cleanup does not purge that managed PR reference or cached commit views. Full server-side removal is outside the connected repository tools; see GitHub's history-removal documentation. No claim of total GitHub-side erasure is made. The three older branches were already clean and were retained. The design branch follows the cleaned baseline while its testing preview remains in use. Automatic main deployments remain disabled; no database changes or production release occurred.


## Accepted baseline — October 16, 2026 Pacific / October 17 UTC

Owner reviewed the final preview and said “Looks good. lets proceed.” PR #14 was merged with a merge commit 6e92e456f30c355129162f7ace1a0ae0e0613ed6, preserving reviewed head 62d17846d6d298d1a1844c03e63b2e6aa3966771 and its equivalent cleaned tree 93cc977d90c2a4713287f019050cdb569320bbd7. Issues #11–13 and #15–30 are accepted/completed. This section supersedes historical pending-review/unapplied statements below.

Final GitHub workflow 39006918021 completed successfully: lint, TypeScript, 48 unit/SQL tests, production build and six desktop/mobile browser scenarios. Local browser suite also passed all six. Browser automation uses isolated Auth/PostgREST/Storage fixtures with actual SQL/RLS. Owner reported actual image deletion works and accepted the final filename correction.

Development has thirteen applied migrations, including approved business logos, numbering/cancellation and product/image deletion. No migration was replayed during merge. Numbers start at 100001 per location, Date/time is adjacent, cancellation is separate from refunds, order snapshots survive product deletion, image changes are staged until Save, and empty/selected/saved image filenames are accurate. Legacy uploads retain only their stored filename.

Continue testing the accepted READY preview https://talix-74bcwbdmh-bravokelo.vercel.app/ . Preserve feature/talix-design-refresh while that review URL remains in use; remove it once replaced, per the owner's cleanup preference. main remains the development baseline. Automatic main deployment is disabled by vercel.json; no production release, payment processing or email-delivery activation is part of this acceptance. Next work requires a new owner request; do not reopen completed review gates.


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


### Latest owner corrections — Issues #23–24 and #26–29

Owner approved this batch after rejecting the date/time order-reference fallback. It supersedes the previous 1001 proposal: permanent numbers start at 100001 per location; Date / time is immediately beside Order number, then Customer. Until activation the Order number cell explicitly says Pending number, never a timestamp or fabricated sequence.

Product add/edit now share a modal with Cancel/Escape and focus return; resting tiles remain equal in width and height with aligned actions and bounded descriptions. Full text is editable in the modal. Uniform grid rows also apply to Settings, storefront products, plan cards and homepage tile groups. Product deletion has its own confirmation and Cancel deletion; historical order snapshots remain intact. Applicable Users, Settings, admin, signup/add-subscription and checkout workflows have explicit cancellation. Cancellation discards unsaved input and returns to its originating view; it does not undo completed operations.

Product images and business logos offer Delete image, staged until Save so Cancel retains saved content. File selection stays local until Save; failed saves retain the editor and the pending upload for retry/discard. Replaced/deleted saved images are removed through the Storage API after their references are saved. Referenced files (including saved uses hidden by caller RLS) are protected. Failed image cleanup has a visible retry action rather than being reported as successful deletion. External image sources can only be detached, not deleted from their external service. No sweep of historical orphan uploads is included.

Prepared migrations remain UNAPPLIED: revised 20261017035355_readable_order_numbers_and_cancellation.sql, and 20261017042159_product_and_image_deletion.sql. The latter grants product deletion under existing products.manage scope, plus Storage API deletion for unreferenced business images under existing settings/products authority. A private, explicitly authorized reference-check helper inspects saved uses without tenant RLS hiding them; it is not a public RPC. No role, payment, deployment or service configuration change. Specific development execution approval and final merge acceptance remain separate. Local unit/SQL suite now has 46 passing tests; full browser and exact-head CI evidence belongs in PR #14. Nothing merged or applied in this correction batch.


### Approved development activation — October 16, 2026 Pacific / October 17 UTC

Owner explicitly approved both prepared migrations. Applied unchanged SQL to Talix development lzepujggusieapablzhn as 20261017050812_readable_order_numbers_and_cancellation and 20261017050814_product_and_image_deletion. Repository filenames and the backfill-test reference are aligned with recorded service versions. Thirteen migrations are now recorded; the previous unapplied status is superseded. Existing two orders have permanent numbers, no missing values, and numbering starts at 100001 per location. UUIDs, private links and existing snapshots remain intact.

Live transaction checks passed 100001/100002 allocation, checkout retry safety, idempotent cancellation with unchanged paid/refund state, product/image authorization and outsider denial, referenced-versus-unreferenced image checks, authorized product deletion and preserved order tracking snapshots. All temporary Auth/workspace/product/order records were rolled back. No stored image files were uploaded/deleted during live verification, and no existing product/order state was changed except the approved numeric backfill. Real-service file-byte deletion remains for owner testing; do not report SQL policy checks as end-to-end Storage API verification. Security advisor categories/counts remain unchanged; the new helper stays private and anonymous execution is denied.

Implementation head 9cfd223f2427c16e1e540c76acc82cd6e1b382bf passed GitHub workflow 39003044749, including all 46 unit/SQL tests and six browser scenarios. Existing READY preview https://talix-ccie2zt3q-bravokelo.vercel.app/ now uses the activated database behavior after reload. This checkpoint changes filenames/test reference/documentation only. Main and production deployment hold remain unchanged. Final owner review/merge acceptance is still pending; keep PR #14 and review issues open.


### Final image picker correction — Issue #30

Owner reports image deletion works and authorized the final filename correction across product images and business logos. Both now share an accessible Choose image control with a filename derived from the active draft/saved URL. No file chosen appears only for an empty draft. New uploads retain original filenames in URL-safe object keys beneath the same business folder, without schema/security changes; older uploads show their stored filename because their original local name was never retained. Save, Cancel, validation and staged deletion remain unchanged. PR #14 stays open for final owner review; no merge is authorized.
