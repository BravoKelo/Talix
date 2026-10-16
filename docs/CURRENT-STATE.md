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

The owner requested a Talix homepage inspired by resnexus.com after seeing the unchanged old landing page. Issue #11/PR #14 now include an original responsive marketing homepage using established capabilities and the Talix palette, with explicit sample-content illustration, future-feature labels and simulated-payment disclosure. No backend or schema changes. Review the preview root URL, not only /login. Existing browser scenarios now also check the homepage heading, payment FAQ, signup entry and horizontal fit on desktop/mobile. Exact-head CI and deployment evidence belong in PR #14; owner acceptance/merge remain outstanding.


### Mobile/touch design correction

Owner approved replacing wrapped mobile navigation with compact disclosure menus and increasing touch targets. Same feature/talix-design-refresh branch/PR #14 now includes responsive public/workspace menus, deliberate single-column mobile controls and 48px touch targets. Tests exercise mobile menu opening before navigation. Review the latest matching preview/head in PR #14; no merge is implied. Cloud-browser preview access was previously declined and has not been retried; local browser screenshots and automated checks remain the visual/functional evidence.
