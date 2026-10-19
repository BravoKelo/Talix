# Website and storefront owner onboarding

Status: approved implementation scope in progress under issue #73. The migration is applied to development only; merge, deployment, production migration execution, and production release are not authorized.

## Data classification and lifecycle

| Data                            | Classification                                                                           | Access                                                                                          | Public exposure                             | Retention/removal                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| Website path and draft template | Private business configuration                                                           | Subscription members may read through existing subscription access; only an owner may change it | None                                        | Follows the subscription lifecycle; an owner may replace it            |
| Existing website address        | Private business configuration; may contain commercially sensitive paths or query values | Subscription members may read; only an owner may replace or clear it                            | None; excluded from catalog and diagnostics | Follows the subscription lifecycle; clearable by the owner             |
| Setup and launch timestamps     | Private operational metadata                                                             | Subscription members may read; owner operations write                                           | None                                        | Follows the subscription lifecycle                                     |
| Live template identifier        | Public presentation configuration                                                        | Public catalog after explicit launch                                                            | Identifier only                             | Replaced by later owner launch; null preserves the existing storefront |

The existing-site address is HTTPS-only, at most 2,048 characters, contains no credentials, backslashes, spaces, or control characters, and is never fetched in this batch. Logs and support records must not include its full value.

## Safe operations and recovery

Website save and launch diagnostics, when operational logging is approved, use: operation name, safe correlation identifier, subscription identifier, outcome, error class, and timestamp. They exclude URLs, page copy, credentials, and other customer content. Owner-facing failures preserve the in-memory draft and give a bounded retry. The authoritative returned row is required before success is shown. Unknown or interrupted launch responses are recovered by rereading subscription state; repeating launch for the same template is safe.

Product owner owns requirement decisions; engineering owns first response and technical recovery; support owns owner communication after a support process is approved. No new logging provider or support commitment is created by this document. Production-critical reliance requires audit finding #68 and a separately approved operations plan.

## Acceptance evidence

Automated checks must cover owner and non-owner authority, cross-tenant denial, URL validation, public-field redaction, published-location gating, empty-catalog acknowledgement, launch idempotency, existing-storefront compatibility, focus restoration, error relationships, and readable color configuration.

Manual acceptance requires current and previous major Chrome, Edge, Firefox, and Safari; physical iPhone Safari and Android Chrome; mobile, tablet, desktop, and wide layouts; mouse, touch, keyboard-only, visible focus, 200% zoom, effective 400% reflow, reduced motion, increased text, and forced colors. Assistive-technology checks are NVDA/Firefox, JAWS/Chrome or Edge, VoiceOver/Safari on macOS and iPhone, and TalkBack/Chrome on Android. Record exact versions and distinguish automated, emulated, physical, and manual evidence. Unperformed checks remain unverified, never passing by implication.

Representative business owners must be able to distinguish the four templates by customer goal before implementation acceptance. This is a product-validation gate, not an automated test.

## Current branch evidence — October 19, 2026 Pacific

- TypeScript passed.
- ESLint passed with one pre-existing unused-variable warning in `scripts/design/header-navigation-proposal.js`.
- All 71 unit and isolated SQL tests passed, including owner-only save/launch, direct-write denial, unsafe-address rejection, launch gates, idempotency, and public redaction.
- The production build passed.
- All 32 existing Chromium desktop/mobile browser scenarios passed after the new handoff and preview coverage was added. This is automated emulation evidence only; it is not the approved multi-browser, physical-device, or assistive-technology acceptance matrix.
- The additive migration was applied unchanged to development as `20261019201906_website_owner_onboarding`. Live rolled-back owner/outsider checks passed, all nine existing subscriptions retained neutral defaults, private fields remain outside the public catalog, and no synthetic data was retained. It has not been applied to production.
- The two new authenticated security-definer advisor findings are expected for the owner-gated RPCs. Both use an empty search path, deny anonymous execution, and recheck `private.is_owner`; advisor categories, anonymous findings, and performance findings are otherwise unchanged.

The implementation remains pending full diff review, representative-owner template validation, the approved manual support matrix, and product-owner acceptance. Exact-head Core checks passed before the migration-evidence documentation follow-up; the updated head must pass again. Stable product/location pages, custom domains, embeds, customizable websites, managed marketing, billing, infrastructure, production migration execution, and production release remain outside this batch.
