# Open-tab checkout recovery — Sprint #90 / #51

Owner approved the bounded recovery behavior on October 23, 2026 Pacific; exact final commit, CI, preview and acceptance belong in #51/#92 and the PR. No merge or production operation is authorized. #49 is not approved and deferred to Inventory & BOM; #94 separately tracks reload/tab-close recovery.

## Demonstrated defect and correction

The executed diagnosis used the real checkout UI and actual migration SQL in isolation: commit the first order, abort response delivery, edit phone and retry. The old client generated a new request UUID and committed a second order. SQL already correctly returns the existing order for an identical request and rejects changed details under a reused key.

The client now captures one copied attempt before sending, synchronously guards overlapping submits and retains it through unknown responses. Pending/unknown review locks customer/cart/location/simulation edits, Back/Cancel/Close/Escape and backdrop dismissal. Repeated native Escape was reproduced closing the modal because a later browser cancel event was non-cancelable; the shared TaskDialog now opts out of native close requests with `closedby="none"` while busy, retaining its cancel handler for older implementations. Unlocked dialog dismissal remains unchanged. Retry sends the same record. Confirmed response tokens must be valid UUIDs before private tracking navigation. Missing/malformed success is unknown, not a new draft. A confirmed return to storefront can start an intentional new order. No private token, customer details or attempt is persisted or logged.

## Definitive rejection contract

The only draft-unlocking response is HTTP 400 with SQLSTATE P0001 and one of the exact pre-write validation messages in the existing `checkout_simulated` definition: invalid simulation, unavailable location/product, required contact details, invalid cart/quantity/options, unknown option, oversized/nonpositive total. Invalid simulation is rejected before lookup and cannot commit on any replay of the same unchanged invalid payload. Other allowed validation happens after the existing-order lookup: an identical committed request returns its result before current catalog validation; reused-key payload conflict stays unresolved. These errors abort the PostgreSQL transaction. Generic HTTP failures, fetch exceptions, malformed confirmations and other SQL errors cannot prove no committed order and retain the attempt.

The installed Supabase/PostgREST client returns server `code`/`message`/status, while fetch failures return a non-SQL error/status 0; source inspected in `node_modules/@supabase/postgrest-js/src/PostgrestBuilder.ts`. SQL and actual client-adapter behavior are exercised together; no provider error is inferred solely from HTTP status. SQL authority and all existing grants/RLS remain unchanged.

## Verification scope

`tests/browser/checkout.spec.ts` runs in desktop/mobile-viewport Chromium, Firefox and WebKit. Its adapter executes all repository migrations under anonymous RPC authority. It commits before delaying/aborting delivery, attempts conflicting edits/dismissal and same-task double submit, replays through gateway failure/malformed confirmation/reused-key conflict, verifies identical payload/key and exactly one order/payment event, and resolves the private order result. A second journey executes a real pre-write SQL rejection, verifies zero orders and editable correction, then proves a separately confirmed intentional new order. Existing unit/SQL coverage retains tenant denials, pricing, snapshot and changed-key protections. PGlite is not independent concurrent-session or live Supabase/PostgREST evidence.

Exact executed results, browser versions and matching preview evidence must be recorded in the PR/#92 before review readiness; this document does not imply unexecuted checks passed. Deployed frontend/adapted-SQL verification and actual development-service verification must be distinguished. Tests use synthetic data; no production data or real payments.

Manual review: add an item/extra, open checkout and enter details. During a delayed request confirm locked inputs and dismissal; after a dropped response confirm the unknown-outcome notice and keyboard-operable Retry this order. Confirm the same order result on retry. A definitive validation rejection should permit correcting details/cart. After confirmed result, Return to storefront should allow an intentional new order. Review desktop/phone widths, keyboard focus, status announcement and touch/reflow. Physical-device and real assistive-technology evidence retain the owner-approved limitation in SUPPORTED-ENVIRONMENTS.md; automated DOM/keyboard checks do not certify those checks.

## Limits and release boundaries

The attempt lives only in the current storefront component. Reload, tab closure or navigation away may lose it; #94 requires separate recovery/persistence/security design. No ad hoc browser storage, provider, new endpoint, dependency, migration, service permission, payment processor or production operation is introduced. Main automatic deployment remains disabled. Applicable standards include Q02–Q07, S04–S10, T01–T04, W01/W02/W05/W06, X44/X54, AC03/AC08/AC11/AC14 and D01–D04. Merge and any environment execution remain separate decisions.
