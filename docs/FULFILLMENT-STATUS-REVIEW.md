# Fulfillment status accessibility — #66 / Sprint #91

## Accepted review status — October 24, 2026 Pacific

The owner visually accepted this correction and authorized Sprint #91 integration.
The prior configuration hold is historical: general Preview development connection
configuration was separately approved and corrected (PR #102). The owner explicitly
waived hosted runner testing for Sprint #91 only; it is not a passing journey claim
or a precedent for later sprints. #105 / draft PR #106 remain incomplete and excluded.
[#97](https://github.com/BravoKelo/Talix/issues/97) owns current exact-head CI,
preview/acceptance evidence and actual merge outcomes. Main automatic deployment
remains disabled; production and database/security settings are unchanged.

The isolated actual tracking page reproduced a highlighted ready step with
`aria-current=null` and an empty status region. The correction preserves the
progress pills and adds visible Current text, list semantics and
`aria-current="step"` to the actual current fulfillment step. A stable polite,
atomic status region exposes the current status, cancellation or the fact that
a declined payment has not entered fulfillment. Cancelled and declined orders
do not mark a fulfillment step current.

Polling may replace an order object, but unchanged status text remains the same
React text node. Only meaningful status/error/recovery changes alter the live
region. Payment retry, order transitions, private-link handling, branding and
the API/database contracts are unchanged. This is presentation and semantics,
not a new order-state policy.

Browser regressions cover initial received, in progress, ready, completed,
cancelled, declined and simulated retry; three unchanged polls and successive
unchanged polls after updates must produce no live-region mutations. They also
check visible Current text, current-step attributes, list accessibility output,
keyboard retry and no overflow at 1280/768/390px. The existing Firefox/WebKit
critical-project match now includes order tracking, using the existing tools.
These are isolated browser/DOM checks, not live-service or actual screen-reader
certification. Physical-device and real assistive-technology evidence remains
deferred under SUPPORTED-ENVIRONMENTS.md.

The PR and #97 own exact-head CI and actual results. The earlier configuration and visual-review holds are superseded by the accepted review status above.

Review later in an approved development preview: read the initial status, watch
a meaningful update, and confirm Current follows the correct step with no
repeated announcement on unchanged polling. Check ready/completed/cancelled and
declined states, keyboard retry, phone/tablet/desktop layout, and real assistive
technology at the owner's discretion. Leave unmerged pending exact-head owner
acceptance and separately authorized integration.
