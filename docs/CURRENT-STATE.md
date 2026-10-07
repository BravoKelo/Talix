# Talix Current State

## Verified checkpoint — October 6, 2026 (Pacific)

Repository: `BravoKelo/Talix`. Current implementation branch: `feature/customer-onboarding`, based on the unmerged core at `e6fc00a56bf3aca5e0955f74a1c18a5131d9ed43`. Core [PR #2](https://github.com/BravoKelo/Talix/pull/2) still targets `foundation/project-governance` (`4d547496998c50a30ee20afec5ef423b7145381d`). `main` remains unchanged. Governance is preserved in `AGENTS.md`. [Issue #3](https://github.com/BravoKelo/Talix/issues/3) owns the new signup/admin scope; Issue #1 remains the underlying commerce scope. No merge before product-owner acceptance.

## Approved and implemented for review

The owner approved the real prospective-Talix-customer experience instead of manual business creation: Sign up from the landing page, business/contact and first-location details, one business type, tier and optional Talix products, sample price/frequency review, email/password account creation, confirmation, resumed review and workspace entry. Customer copy uses plain business language. Subscription billing remains simulated; there are no cards, processors or charges.

Business types, plans and extras are persisted and addable/editable/withdrawable in Talix admin. Samples are Restaurant, Retail and Other business; Starter $29/month, Plus $59/month, Extra insights $10/month and Website assistance $20/month. These are configurable demonstration offerings, not implemented industry modules or extra benefits. Offerings support monthly/yearly billing with compatible extras. Existing subscriptions retain their purchased terms. Owners see the saved selection in Settings and add further subscriptions through the same review flow.

Talix admin uses an explicit private staff allowlist, separate from business ownership. Signup cannot grant staff access, including through user metadata. Its customer view displays business contact details and subscription snapshots; full CRM support/tickets/reports remain deferred. Initial real staff assignment awaits identification of the owner's verified account.

The existing shared commerce core remains: authorized subscription/location switching, predefined employee roles, branding/location settings, general/local products and images/options, guest location-first checkout, database-priced order snapshots, simulated declines/retries/refunds, private tracking and received → in progress → ready → completed fulfillment. Locations start unpublished. The old unpriced workspace-creation API is retired for application users; existing draft data is preserved.

## Validation and limits

Local lint, TypeScript, 20 embedded PostgreSQL tests and production build pass. Desktop/mobile commerce and signup/resume/admin-edit journeys pass. Tests cover authoritative quotes, changed prices, compatible extras, repeat confirmations, snapshot retention, withdrawal, confirmed identity, admin/owner separation and tenant isolation. The browser gateway mocks Auth and confirmation delivery while data operations run actual SQL/RLS. Tests exercise the token-hash confirmation callback and internal-only redirects, failed-confirmation recovery/resend, and actual admin add/edit controls. A same-host callback redirect defect was observed and corrected; authentication cookie checks then passed. This is not evidence of live mailbox delivery. Previous core live checks verified Auth/SSR, image storage, ordering/fulfillment and refunds; see PR #2.

The customer-onboarding migration and policy performance correction are applied to the existing Talix development project `lzepujggusieapablzhn` (organization `geynfrdnzxyklsuuwcte`). The checked-in migration versions match remote history: `20261007015259_customer_onboarding` and `20261007015458_streamline_catalog_policies`, after the three core migrations. Twelve public tables have RLS. Public live catalog access and its $39 sample quote were verified. Live Supabase password Auth, explicit staff access, owner/staff isolation (including ignored user-metadata claims), catalog add/edit, changed-price rejection/review, atomic repeat-safe purchase, preserved terms, withdrawal and cross-client isolation passed. Disposable Auth users, temporary staff access, customer/subscription rows and verification catalog entries were removed afterward. No real mail was sent.

The new preview branch has URL/publishable-key environment values configured in Vercel project `talix` (`prj_Xmg24E6djhGtCFIJsmP9EblkLDym`, team `bravokelo`). Production variables remain unset; deployment protection is unchanged. Initial repository linking created a disconnected production-labelled deployment automatically; no manual production promotion occurred. Repository writes use GitHub APIs; local git history is not an ordinary remote clone. No service-role key is introduced.

Advisors flag intentional narrowly checked security-definer endpoints. Private staff allowlist RLS has no client policies/grants by design. Redundant catalog/client SELECT policies were consolidated after the performance advisor identified them, preserving semantics. Fresh-database unused-index notices are not grounds to remove required indexes. Previously reported leaked-password protection remains a production-hardening item, not authorization to upgrade plans. Two synthetic 1×1 core-test PNG assets remain in Storage folders `a76900bf-1d6c-45c9-ade8-ad5a71a832d7` and `081c7e39-61b7-428c-a313-f8b234f2c1b3`; dashboard cleanup is pending.

## Operational boundary: confirmation mail

Live public Auth settings show password/email signup enabled, signup allowed, and automatic confirmation disabled. Mail delivery, sender and allowed confirmation destinations cannot be inspected/edited with the available Supabase connector tools. No real test email was sent. The application supports PKCE and email token-hash callbacks; its configured destination must be allowed and its confirmation template/delivery verified before public signup is claimed ready. Default Supabase mail only sends to organization team addresses; arbitrary prospective customers require suitable SMTP configuration. No new mail provider was selected and verification was not bypassed.

The browser tool requires user approval before falling back from an insufficient plugin. The concrete remaining work is to inspect the existing Auth mail/URL/template settings in the Supabase dashboard, scope the callback to the reviewed preview, and determine whether the existing sender can deliver the signup confirmation. A new provider/cost decision, if needed, belongs to the owner. This is service provisioning, not manual customer business creation. See SETUP and ADR 0002.

## Exact restart

1. Inspect Issue #3, this branch, its draft PR, latest CI and connected preview; retain the foundation governance and underlying unmerged core.
2. With permission for the dashboard fallback, finish the mail/confirmation settings and verify customer signup with an owner-initiated email. Do not send unsolicited real mail or turn off verification.
3. After the owner signs up, identify their verified account explicitly for Talix staff access. Test add/edit/withdraw offerings in the admin UI; do not auto-promote the first signup.
4. Review the complete stacked changes and customer experience with the owner; acceptance precedes merge.

## Deferred

Real subscription/commerce payment processing, subscription upgrades/proration/cancellation, commercial pricing, addon entitlements, industry modules, wider CRM/support/reporting, inventory/BOM/COGS, custom roles, consumer accounts, employee invitation/self-service provisioning, tax/shipping/scheduling, notifications/marketing and external integrations.

Advisor references: [anonymous security-definer execution](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [authenticated security-definer execution](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [deny-by-default RLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), and [Auth mail](https://supabase.com/docs/guides/auth/auth-smtp).
