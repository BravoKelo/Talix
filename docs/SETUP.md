# Talix setup and acceptance

## Connect the existing development project

1. Verify the project identity and existing tables/migrations first. The connected Talix development project is `lzepujggusieapablzhn`; its core migrations are already applied; inspect current history for the customer-onboarding update. Do not use AMZ-PSE or create a substitute project.
2. Use Node.js 24 and `npm ci`. Authenticate the Supabase CLI with your own authorized account, then `npx supabase link --project-ref <talix-ref>`.
3. Inspect `npx supabase migration list` and `npx supabase db push --dry-run`. If existing schema conflicts with the new migration, investigate before applying it. Then apply the reviewed development migration with `npx supabase db push`.
4. Obtain the Talix URL and publishable key. Set the two variables in `.env.local` and in the Talix Vercel project's preview/development environment. These are public browser credentials; no service-role key is required. Redeploy after changing public build-time variables.
5. Business owners enter `/signup`, choose their sample plan and extras, confirm their email, and finish their price review. Their first location starts unpublished; add products and publish it in Settings. There is no public employee signup or email invitation implementation in this slice. Create employee Auth accounts explicitly, then owners grant each location's viewer/fulfillment access through the workspace.
6. Review Supabase authentication redirects/site URL for the actual deployment and run the acceptance workflow below.

## Acceptance workflow

- Owner signs in, creates a subscription with multiple locations, configures subscription branding and local operating details.
- General products appear at both locations; a local product appears only at its own location. Owner can upload an image and edit price/optional extras/availability.
- Customer chooses a location, adds products/options, enters name/email/phone, and selects an approved or declined simulated payment.
- Declined orders remain outside active fulfillment. The private link permits a simulated approval retry on the same order.
- The correct location receives the paid order. Authorized fulfillment staff advance received → in progress → ready → completed.
- Viewer cannot advance orders; employee cannot access another tenant or unassigned location, manage settings/products, or refund.
- Owner issues partial and full simulated refunds with reasons; histories and private tracking reflect them. Full refund cancels uncompleted orders; completed orders retain fulfillment history.
- Disable a location/product and verify new checkout is rejected. Remove an employee's location access and verify access disappears.
- Retry identical checkout/refund request IDs and verify no duplicate payment/refund. Altering details with the same ID must fail.

## Limits before production use

This is a development slice, not a live commercial launch. Currency is USD; taxes, shipping, stock deductions, operating-hour enforcement and scheduled ordering are not implemented. Hours are descriptive text. No emails/texts, actual billing, real payments, custom roles, CRM reporting, customer accounts, integrations, or industry modules exist yet.

Publishable locations are publicly readable and permit anonymous simulated checkout. A production launch needs its own approved payment/tax/fulfillment policies and abuse controls; production environment values remain unset; database changes were applied only to the Talix development project.

The private order link is a bearer secret. Its read RPC returns status/items/totals, never customer contact details. Do not paste real customer links into public tickets. Product images are public business assets. Replacing an image leaves the old asset in storage; cleanup is deferred.

## Signup service configuration and Talix staff access

Customer onboarding uses Supabase email/password signup with confirmation enabled. Before public use, configure the exact preview `/auth/confirm` destination in Auth URL Configuration. For cross-device confirmation use a confirm-signup template pointing at `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`. The application accepts only email-type token verification and internal destinations; it never trusts an arbitrary `next` URL. Verify the complete mail → confirmation → resumed review flow. Keep Auth site/allowed redirects scoped to the accepted preview, not a broad arbitrary URL.

The default Supabase mail service only sends to organization team addresses and is rate limited. A custom SMTP sender is required for arbitrary prospective customers; provider/cost/credentials need an explicit decision. Do not turn off confirmation to work around delivery, and do not substitute a fake email-success message for a provider error. Current operational status is in CURRENT-STATE.

After the owner creates their verified account through signup, explicitly identify that account for staff access. An authorized operator adds its Auth UUID to `private.talix_admins` through an administrative channel. There is no first-user or public self-grant mechanism. The customer does not need the dashboard to create a business. The application reveals the Talix admin link only to allowed staff; `/admin` and catalog writes independently check access. Never use user metadata or a client-submitted role to grant staff privileges.

Admin adds/edits business types, plans and extras; availability controls new sales. Name/description/price/frequency changes preserve existing purchase snapshots. Extras must have the selected plan’s billing frequency and either match its business type or apply to all types. Current pricing is USD, sample-only, and does not activate future addon benefits.
