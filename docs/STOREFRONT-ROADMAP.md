# Storefront adoption and deferred work

Issue #32 authorizes a visual shared storefront using current data and permissions. These are documented requirements/proposals, not implementation authorization.

## Current foundation and adoption assessment

| Path | Foundation in #32 | Remaining validation or gap |
| --- | --- | --- |
| Existing website + Talix commerce | Ordinary link to the current `/shop/<slug>`; business branding, location selection and shopping stay together | Verify a real business's published link and return journey. No external-site button/editor is installed here; no iframe or third-party integration. |
| Talix as primary business website | One-page business introduction, saved logo/name, location address/phone/descriptive hours, visual catalog and ordering action | Talix's global sign-in/signup navigation and footer remain. No independently editable business navigation/pages, rich business content, SEO/social identity controls or website publishing workflow. A complete primary website is not claimed. |

## Separately bounded proposal: minimum primary website experience

Propose a future owner-reviewed slice limited to a business-first public shell around the shared storefront, with clearly defined business information/contact sections, navigation to shopping and an intentional relationship to Talix sign-in/signup. First review whether the existing name/introduction/logo/location data is sufficient for an acceptable one-page website. Define required public content, ownership/editing permissions, missing-content behavior and accessibility before implementation. If new stored content is needed, present the exact additive schema/security proposal separately; no such change is authorized by #32.

Acceptance proposal: review a real business's entry → identity/contact → location → product → checkout journey on desktop/mobile, including no products/unpublished locations. Decide public metadata, legal/support information and launch readiness before representing Talix as that business's complete website. Real payments and communications remain independent launch boundaries.

Custom domains, page builders/templates, content persistence, rich media/slideshows, editable external links, imports and embedding are excluded. Hosting/deployment behavior must be separately approved if it changes. This document does not authorize any of them.

## Industry subscriptions and future tiers

The core must remain useful without an industry subscription. Industry-specific workflows belong to the corresponding future industry subscription, with possible tier levels within it. Conceptual names such as Talix Basic, Talix Restaurant and Talix Restaurant Pro describe direction, not current entitlements or sellable benefits.

Keep the existing subscription-wide branding, location-scoped catalogs and database authorization boundaries. The #32 presentation consumes generic products/options and does not branch on business type or sample plan names. Future industry/tier delivery needs demonstrated features, explicit scope, entitlement rules and separate owner approval before any schema, permission or module framework is introduced. Existing sales offerings/purchase snapshots do not imply feature entitlements.
