# Talix setup and acceptance

## Connect the existing development project

1. Verify the project identity and existing tables/migrations first. The connected Talix development project is `lzepujggusieapablzhn`; nine migrations through `20261008021928_index_membership_business_roles` are already applied. The client-profile correction is prepared and awaits explicit application approval. Do not use AMZ-PSE or create a substitute project.
2. Use Node.js 24 and `npm ci`. Authenticate the Supabase CLI with your own authorized account, then `npx supabase link --project-ref <talix-ref>`.
3. Inspect `npx supabase migration list` and `npx supabase db push --dry-run`. If existing schema conflicts with the new migration, investigate before applying it. Apply only specifically approved pending migrations to development. Current Issue #10 preparation does not authorize applying its pending migration; do not replay the nine applied migrations.
4. Obtain the Talix URL and publishable key. Set the two variables in `.env.local` and in the Talix Vercel project's preview/development environment. These are public browser credentials; no service-role key is required. Redeploy after changing public build-time variables.
5. Business owners enter `/signup`, choose their sample plan and extras, review once, then Continue on the pending email-confirmation page to open the workspace. Their first location starts unpublished; add products and publish it in Settings. There is no public employee signup or email invitation implementation in this slice. Create employee Auth accounts explicitly, then authorized managers assign subscription and separate location roles in Users.
6. Review Supabase authentication redirects/site URL for the actual deployment and run the acceptance workflow below.

## Acceptance workflow

- Owner signs in, creates a subscription with multiple locations, configures subscription branding and local operating details.
- General products appear at both locations; a local product appears only at its own location. Owner can upload an image and edit price/optional extras/availability.
- Customer chooses a location, adds products/options, enters name/email/phone, and selects an approved or declined simulated payment.
- Declined orders remain outside active fulfillment. The private link permits a simulated approval retry on the same order.
- The correct location receives the paid order. Authorized fulfillment staff advance received → in progress → ready → completed.
- Viewer cannot advance orders. Verify each assigned role permits only its explicit actions; employees cannot access another tenant or unassigned location. Test custom-role edits, user removal and revocation.
- Owner or an employee with the location refund permission issues partial and full simulated refunds with reasons; histories and private tracking reflect them. Full refund cancels uncompleted orders; completed orders retain fulfillment history.
- Disable a location/product and verify new checkout is rejected. Remove an employee's location access and verify access disappears.
- Retry identical checkout/refund request IDs and verify no duplicate payment/refund. Altering details with the same ID must fail.

## Limits before production use

This is a development slice, not a live commercial launch. Currency is USD; taxes, shipping, stock deductions, operating-hour enforcement and scheduled ordering are not implemented. Hours are descriptive text. No emails/texts, actual billing, real payments, CRM reporting, customer accounts, integrations, or industry modules exist yet.

Publishable locations are publicly readable and permit anonymous simulated checkout. A production launch needs its own approved payment/tax/fulfillment policies and abuse controls; production environment values remain unset; database changes were applied only to the Talix development project.

The private order link is a bearer secret. Its read RPC returns status/items/totals, never customer contact details. Do not paste real customer links into public tickets. Product images are public business assets. Replacing an image leaves the old asset in storage; cleanup is deferred.

## Signup service configuration and Talix staff access

For the owner-approved current development journey, set `TALIX_EMAIL_CONFIRMATION_PENDING=true` on the protected customer-onboarding preview only (and optionally local development), and turn **Confirm email off** under Authentication → Sign In / Providers in the existing Talix development project. This returns a real signup session without sending an email. No new provider or domain is needed. The application checks `mailer_autoconfirm` before signup and will fail closed until the service setting is correct. Restart/redeploy after changing configuration. Do not apply this setting to a live project. The pending confirmation page gets the email from the authenticated account, survives refresh and Continue completes the saved purchase. Resend is hidden in this mode.

Before public launch remove the flag, turn **Confirm email on** in the live Auth project and configure mail delivery. Vercel production ignores the flag, but the service setting must also be restored; the flag alone cannot restore Auth verification. Automatically confirmed development accounts do not prove ownership of their email addresses. Before public use, configure the exact preview `/auth/confirm` destination in Auth URL Configuration. For cross-device confirmation use a confirm-signup template pointing at `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`. The application accepts only email-type token verification and internal destinations; it never trusts an arbitrary `next` URL. Verify the complete mail → confirmation → workspace flow. Keep Auth site/allowed redirects scoped to the accepted preview, not a broad arbitrary URL.

The default Supabase mail service only sends to organization team addresses and is rate limited. A custom SMTP sender is required for arbitrary prospective customers; provider/cost/credentials need an explicit decision. Development automatic confirmation is explicitly authorized by the later owner amendment in ADR 0002; live verification remains required. The page’s pending-feature message is not evidence of mail delivery. Current operational status is in CURRENT-STATE.

After the owner creates their authenticated account through signup, explicitly identify that account for staff access. An authorized operator adds its Auth UUID to `private.talix_admins` through an administrative channel. There is no first-user or public self-grant mechanism. The customer does not need the dashboard to create a business. The application reveals the Talix admin link only to allowed staff; `/admin` and catalog writes independently check access. Never use user metadata or a client-submitted role to grant staff privileges.

Admin adds/edits business types, plans and extras; availability controls new sales. Name/description/price/frequency changes preserve existing purchase snapshots. Extras must have the selected plan’s billing frequency and either match its business type or apply to all types. Current pricing is USD, sample-only, and does not activate future addon benefits.

## Controlled baseline integration

PR #2 contains foundation history and the older core. PR #4 contains its dependent onboarding/Users changes. After separate final acceptance, retarget #2 to main and merge without activating its intermediate code against the already-upgraded development database; then retarget/merge #4. Preserve branches/history. Verify Vercel production-branch triggers before merging: available normalized connector metadata does not expose that setting. Existing branch-specific preview environment values do not automatically configure main or another branch. No production configuration or promotion is authorized by Issue #10.

Current live validation is limited to evidence explicitly recorded in CURRENT-STATE. Do not infer a complete deployed service journey from embedded SQL/browser tests or READY deployment status. Controlled live verification after the pending database approval must use designated fixtures and preserve real client data.
