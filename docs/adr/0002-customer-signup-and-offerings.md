# ADR 0002: Customer signup and editable Talix offerings

Status: Owner-approved bounded scope; implementation subject to acceptance.
Date: October 6, 2026 (Pacific).

## Evidence

The owner rejected manual business onboarding in the Supabase dashboard and approved the real landing-page signup experience: business/contact information, one business type per subscription, tier, optional Talix products, and a visible billing total/frequency. Sample offerings are approved until commercial terms are defined. Offerings must be addable/editable in Talix admin at any time. Customer screens must avoid technical terminology. Issue #3 owns this scope.

## Decision within the approved scope

Keep the existing Next.js/Supabase/Vercel foundation. Add business types and Talix offerings as an editable sales catalog, client contact fields, a subscription business type, and an immutable purchase snapshot. These additions are required by the accepted signup/catalog behaviors; they do not create industry-specific workflows or a module framework.

Public visitors can read available catalog entries and obtain a database-priced quote. Confirmed signed-in owners create subscriptions through one checked transaction, persisting client details, membership, an unpublished first location, and agreed terms. The server compares the reviewed quote under locks; catalog edits require a new price review. Repeating the same confirmation is safe. Retire the older account-creation shortcut. Existing subscriptions retain their terms after catalog changes. Existing draft subscriptions without a purchase are preserved.

Email/password signup uses existing Supabase Auth with verification retained. Non-authoritative form input lives in user metadata only to resume onboarding; it never grants permissions or determines prices. Both PKCE callbacks and email token-hash confirmation are supported. No service-role key or custom email-provider integration is introduced.

Talix staff access is an explicit, private administrator allowlist. Business ownership never grants Talix staff privileges. Only authorized staff can add/edit/withdraw business types, plans, and extras. The admin customer view displays the contact details and purchased terms required by this slice; it is not the full support/tickets/reporting CRM. Initial real staff assignment requires identifying the owner's verified account; no public administrator bootstrap exists.

## Operational boundaries

Everything is sample pricing and simulated subscription billing. There is no recurring charge engine, processor, card collection, upgrade/proration/cancellation system, addon entitlement enforcement or industry-specific behavior. Potential public signup requires verified email delivery, correct allowed confirmation destinations and suitable mail capacity. Default Supabase mail is restricted; configuring a new mail provider or bypassing verification is not authorized by this decision. Existing deployment protection remains in place.

## Owner-approved amendment — October 6, 2026 (Pacific)

The owner has no domain or sender and approved simulating the email step without a demonstration label. The development project uses supported Auth automatic confirmation, returning a real session without sending signup mail. `TALIX_EMAIL_CONFIRMATION_PENDING=true` enables the pending-feature page outside Vercel production. Signup checks public Auth settings and refuses to call signup if automatic confirmation is absent, avoiding a mail attempt. The signup client uses the supported immediate-session flow instead of PKCE in this mode. The confirmation page checks the actual authenticated account and saved draft server-side; Continue completes the saved purchase; only changed prices or unavailable selections require another review. No schema, custom Auth, password persistence, service-role key, administrator elevation or RLS bypass is added.

This supersedes the earlier restriction against disabling confirmation for the existing **development project only**, as explicitly authorized by the owner. Auth marks automatically confirmed emails in its own user record; that timestamp does not prove mailbox ownership during this development stage. Do not use real sensitive business data or launch against this configuration. Before public launch disable the application flag, enable Confirm email in the live Auth project, configure delivery and verify the actual confirmation journey. Production hosting is still disconnected. The database confirmed-user condition and all tenant/staff permissions remain unchanged.

## Shared client profile amendment — Issue #10

On 2026-10-07 Pacific (2026-10-08 UTC), the owner approved preserving the existing shared client profile when adding another subscription. The new subscription keeps its own name/contact/location details in the immutable purchase snapshot. The additive migration replaces only the existing subscription function's client upsert with insert-if-absent and an existing-client lookup, within its owner transaction lock. Original migrations, signatures, policies, grants and history remain unchanged. Separate development execution approval was obtained and the migration applied; CURRENT-STATE records its version and verification. This amendment does not introduce profile editing or repair historical overwritten profiles.

## Approval provenance and validation

The signup journey, sample offerings, technology foundation and later development confirmation exception were explicitly authorized. Detailed final visuals and final merge acceptance remain separate. Embedded SQL tests and browser adapters verify transaction behavior; actual latest deployed Auth/data/workflows need separate end-to-end evidence. The current operational handoff is CURRENT-STATE.
