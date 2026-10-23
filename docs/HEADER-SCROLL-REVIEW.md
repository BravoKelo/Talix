# Header scroll correction — Sprint #90 / #81

Status: implemented on `fix/81-header-scroll-stability`; owner acceptance, exact-head CI and deployed-preview workflow verification are separate gates. Sprint [#92](https://github.com/BravoKelo/Talix/issues/92) owns final commits, PR, preview links and check results. No merge or production release is authorized.

## Cause and bounded correction

On main `1b581d86833ed0d1dc625f4b35f9d15661f1e205`, a single 55px wheel scroll crossed the 48px collapse threshold. The centered desktop/tablet header shrank from 115px to 57px including its border. Chromium and Firefox scroll anchoring moved the document back to 0px, expanding it again. At 390px Chromium alternated between 39px and 55px, changing compact state 49 times in 1.5 seconds without further input; Firefox also oscillated. WebKit did not reproduce the anchoring loop in this sequence. The existing `height` transition did not animate navigation's overriding `height: auto`.

The correction retains existing preset dimensions, branding and navigation. Matched minimum-height, padding and margin transitions preserve the header's total document footprint while its visible part collapses. Reserved space scrolls away with page content. Collapse begins above 48px; expansion occurs at or below 24px to avoid jitter around one boundary. Focus inside the header defers the geometry change until focus leaves, preserving navigation/search controls being used. Reduced motion disables these transitions. Catalog, cart, checkout, data authority, persistence and dependencies are unchanged.

## Validation and limits

The new tests in `tests/browser/storefront.spec.ts` cover all five presets at 1280×844, 768×844 and 390×844 in configured Chromium, Firefox and WebKit projects. They sample every animation frame to check stable content coordinates, preserved 55px scroll position, one collapse and intermediate animation heights; then exercise threshold jitter, upward expansion, repeated directions, cart/Escape/focus return, horizontal fit, reduced motion and keyboard navigation focus. The Chromium mobile project repeats these explicit viewport checks; it is viewport emulation, not physical-device evidence.

Initial isolated reproduction after correction retained 55px and exactly one collapse in all nine engine/width combinations. Lint, TypeScript and all 93 unit/SQL tests passed. Lint retains the pre-existing unused `brand` warning in `scripts/design/header-navigation-proposal.js`. Final full browser, build, CI and deployment outcomes belong in #92 and the PR; unexecuted checks are not implied by this document.

Applicable standards: Q04–Q07, T01–T04, W01/W02/W05, X41–X44/X47/X54, AC03–AC05/AC08/AC11/AC14 and D01–D04. No database, security, integration or architecture contract changes. Physical-device and real assistive-technology checks retain the owner-approved limitation in `SUPPORTED-ENVIRONMENTS.md`; automated focus/DOM checks do not establish screen-reader or WCAG conformance.

## Owner review checklist

Use the exact reviewed development preview linked in #92, with your normal Vercel sign-in. Open `/shop/retail-demo` and a launched website.

1. At desktop, tablet and phone widths, scroll slowly through the first 60px. Confirm a smooth single collapse and no flashing or content jump.
2. Alternate direction near 48px, continue downward, then return toward the top. Confirm stable compact state around the boundary and expansion near the top.
3. Check the five custom presets and centered Standard header. Retain the saved settings after review.
4. Tab through navigation/search, scroll while a header control has focus, then leave it. Confirm focus remains usable and collapse resumes afterward.
5. Open the compact navigation menu and cart; dismiss with Escape and check focus return. Repeat with reduced motion enabled.

Acceptance must identify the exact PR commit. A ready Vercel build alone is not deployed workflow verification.
