# Talix current state

## Recovery and active review

Repository BravoKelo/Talix; active branch feature/customer-onboarding, draft PR #4 stacked on unmerged feature/core-commerce PR #2. Foundation governance remains on foundation/project-governance and in AGENTS.md. Main is unchanged. Acceptance is required before merge or production promotion.

The October 8 review batch addresses Issues #5–9: authenticated workspace/logout, logged-out navigation, visible duplicate-email feedback, discoverable additional subscriptions, and editable Users with predefined/custom subscription/location permissions. The batch is implemented and locally verified; publishing this checkpoint triggers branch CI and preview deployment, whose exact commit statuses must be checked in GitHub/Vercel.

## Verified implementation

Business-neutral Next.js/Supabase/Vercel core, no industry modules. Multiple subscriptions per client and locations per subscription; general/local products, guest ordering, generic fulfillment, simulated payments/refunds only. Landing-page signup and staff-managed sample offerings exist. Billing is sample-only; no card collection or real charges. Ordering addresses are automatically generated.

Current-user server verification and full-navigation sign-out prevent stale workspace reuse. Users starts with editable configured accounts; Owner is protected. Manager, Supervisor, Lead, Fulfillment and Viewer show explicit allowed/denied permissions. Custom roles use checkboxes. Subscription/shared permissions and each location role are separate. Managers cannot grant authority they lack or change their own access. Existing Auth accounts are required; invitations remain deferred.

## Development services

Only Supabase project lzepujggusieapablzhn is used. All 13 public application tables have RLS. New migrations 20261008021501_configurable_user_roles and 20261008021928_index_membership_business_roles are applied. Advisor composite-FK indexing finding was corrected; remaining unused-index notices are informational. Checked privileged RPC/private staff allowlist notices and previously recorded leaked-password protection remain launch-hardening items.

Email confirmation is owner-approved pending development functionality. Protected preview uses TALIX_EMAIL_CONFIRMATION_PENDING=true; Auth Confirm email is off, freshly verified. Confirmation displays authenticated email and '(Feature coming soon)'; Continue completes the saved subscription. No email is sent. Before launch disable the flag, restore mandatory Auth verification and configure sender/redirects. Automatically confirmed development accounts do not establish mailbox ownership.

Stable protected preview: https://talix-git-feature-customer-onboarding-bravokelo.vercel.app/ . Production remains unconfigured; no promotion or protection changes.

## Validation

Lint, TypeScript, 33 unit/SQL tests, six desktop/mobile browser scenarios and production build passed locally. Browser coverage includes signup/reload/price changes, staff offerings, configured users/custom roles/editing, additional subscription creation, logout/back/direct workspace denial and duplicate-email feedback. Actual Supabase checks verified no-mail signup, custom-role/location assignment, denied user-list access, immediate role revocation, membership removal, duplicate-email error and sign-out. Both disposable identities and all associated client/subscription data were removed; zero fixture identities remain. No real owner account was modified.

## Exact restart

1. Inspect PR #4, Issues #5–9, branch head, CI and matching preview deployment. Review ADR 0003 and both applied migrations before permission changes.
2. Owner tests the protected preview and records remaining defects. Keep issues open pending acceptance/merge.
3. After acceptance, review the stacked complete diff and merge in dependency order. Do not infer acceptance from automated tests.

Deferred: employee invitations, owner transfer/shared client ownership, real billing/payments, commercial tiers/addon entitlements, industry modules, inventory/BOM/COGS, full CRM/support/reporting, consumer accounts, integrations and transactional/marketing delivery. Product vision retains these intentions without speculative core implementation. Historical checkpoints remain in PROJECT-HISTORY.md.
