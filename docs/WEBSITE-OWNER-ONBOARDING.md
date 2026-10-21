# Website and storefront owner onboarding

Status: owner-approved implementation with conditional corrections under issues #75–#79. Migrations are applied to development only; merge, production migration execution, and production release are not authorized.

## Final owner paths

- **Use a Talix template** follows Website setup, Business identity, Locations & ordering, Template & appearance, Web address and Go live. Business identity is a details review, not a partial preview. Go live contains the complete private customer preview and an explicit publish action and confirmation.
- **Use my existing website** follows Website setup, Existing website and Review connection. It stores a validated HTTPS address, omits all template controls, keeps the external site primary and keeps Open storefront pointed at Talix ordering. Saving this path does not publish or unpublish a Talix marketing website.
- **Decide later** is a one-step save-and-return path. It does not present template, readiness or launch controls and confirms that no new website was published. If a Talix website was already live, saving this choice leaves that site unchanged.

Website Appearance is the single owner entry for shared presentation controls when a Talix template is selected. The standalone Storefront appearance entry remains for the existing-site and deferred paths. Every template begins with Home, Shop, About and Contact. Owners can copy those defaults into an editable list, rename, reorder, delete or add supported links, and restore the standard set without rebuilding it.

## Data classification and lifecycle

| Data                            | Classification                                                                           | Access                                                                                          | Public exposure                             | Retention/removal                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| Website path and draft template | Private business configuration                                                           | Subscription members may read through existing subscription access; only an owner may change it | None                                        | Follows the subscription lifecycle; an owner may replace it            |
| Existing website address        | Private business configuration; may contain commercially sensitive paths or query values | Subscription members may read; only an owner may replace or clear it                            | None; excluded from catalog and diagnostics | Follows the subscription lifecycle; clearable by the owner             |
| Setup and launch timestamps     | Private operational metadata                                                             | Subscription members may read; owner operations write                                           | None                                        | Follows the subscription lifecycle                                     |
| Live template identifier        | Public presentation configuration                                                        | Public catalog after explicit launch                                                            | Identifier only                             | Replaced by later owner launch; null preserves the existing storefront |

The existing-site address is HTTPS-only, at most 2,048 characters, contains no credentials, backslashes, spaces, or control characters, and is never fetched in this batch. Logs and support records must not include its full value.

## Safe operations and recovery

Owner-facing failures preserve the in-memory draft and give a bounded retry. The authoritative returned row is required before success is shown. Unknown or interrupted launch responses are recovered by rereading subscription state; repeating launch for the same template is safe. This batch adds no logging provider, incident process or support commitment. Formal operational diagnostics and incident ownership under issue #71 belong to future production-readiness planning and do not block this implementation or PR.

## Acceptance evidence

Automated checks must cover owner and non-owner authority, cross-tenant denial, URL validation, public-field redaction, published-location gating, empty-catalog acknowledgement, launch idempotency, existing-storefront compatibility, focus restoration, error relationships, and readable color configuration.

The approved browser, device and assistive-technology policy is recorded in [SUPPORTED-ENVIRONMENTS.md](SUPPORTED-ENVIRONMENTS.md). Physical-device and real assistive-technology checks are explicitly deferred to the owner's schedule and are not a blocker for this batch, PR acceptance or merge. Until their results are recorded, Talix makes no claim that those checks have been completed. Unperformed checks remain unverified, never passing by implication.

Representative business owners must be able to distinguish the four templates by customer goal before implementation acceptance. This is a product-validation gate, not an automated test.

## Current branch evidence — October 19, 2026 Pacific

- TypeScript passed.
- ESLint passed with one pre-existing unused-variable warning in `scripts/design/header-navigation-proposal.js`.
- All 71 unit and isolated SQL tests passed, including owner-only save/launch, direct-write denial, unsafe-address rejection, launch gates, idempotency, and public redaction.
- The production build passed.
- All 32 existing Chromium desktop/mobile browser scenarios passed after the new handoff and preview coverage was added. This is automated emulation evidence only; it is not the approved multi-browser, physical-device, or assistive-technology acceptance matrix.
- The additive migration was applied unchanged to development as `20261019201906_website_owner_onboarding`. Live rolled-back owner/outsider checks passed, all nine existing subscriptions retained neutral defaults, private fields remain outside the public catalog, and no synthetic data was retained. It has not been applied to production.
- The two new authenticated security-definer advisor findings are expected for the owner-gated RPCs. Both use an empty search path, deny anonymous execution, and recheck `private.is_owner`; advisor categories, anonymous findings, and performance findings are otherwise unchanged.

The implementation remains pending full diff review, representative-owner template validation, and product-owner acceptance. The owner-approved deferral of physical-device and real assistive-technology evidence is recorded but does not block this batch. Exact-head Core checks passed before the migration-evidence documentation follow-up; the updated head must pass again. Stable product/location pages, custom domains, embeds, customizable websites, managed marketing, billing, infrastructure, production migration execution, and production release remain outside this batch.

## Acceptance-gate evidence — October 20, 2026 Pacific

- A shared authoritative-mutation check now prevents affected product, location, appearance and featured-location changes from reporting success without a returned row. Focused zero-row, successful-row and database-error regressions pass.
- Public session-reading routes now pass through the Supabase writable refresh boundary while authenticated and private responses remain non-cacheable. A real Talix development Auth session with an intentionally expired access timestamp rotated its access/refresh credentials, persisted the new cookie across new home and storefront requests and returned `no-store`. The disposable no-mail account was deleted; a follow-up query confirmed zero matching accounts remain.
- Onboarding error-summary focus, field relationships, correction focus and next-step focus pass in configured Chromium, Firefox and WebKit paths. WebKit exposed a preview-dialog focus-return difference; the trigger now receives focus explicitly after closing and the focused WebKit regression passes.
- The full local unit/isolated SQL suite has 86 passing tests. Lint has no errors and retains one unrelated pre-existing design-script warning; TypeScript and the production build pass. Final exact-head multi-engine CI remains required before issue closure.
