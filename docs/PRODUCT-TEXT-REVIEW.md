# Product text contrast — #62 / Sprint #91

## Accepted review status — October 24, 2026 Pacific

The owner visually accepted this correction and authorized Sprint #91 integration.
The prior configuration hold is historical: general Preview development connection
configuration was separately approved and corrected (PR #102). The owner explicitly
waived hosted runner testing for Sprint #91 only; it is not a passing journey claim
or a precedent for later sprints. #105 / draft PR #106 remain incomplete and excluded.
[#97](https://github.com/BravoKelo/Talix/issues/97) owns current exact-head CI,
preview/acceptance evidence and actual merge outcomes. Main automatic deployment
remains disabled; production and database/security settings are unchanged.

The isolated actual storefront reproduced a white product name and price on a
white card (1:1 contrast); its fixed description remained rgb(102,113,137).
Nothing was saved to a service. Current main already has a 4.5:1 Save guard;
the remaining correction makes that rule visible and actionable at the field.

The editor now displays the measured contrast against the actual white product
background, a field-associated explanation and invalid state, and moves focus
to Product text when Save rejects it from any tab. An explicit Use readable
default action changes only the draft; valid brand colors are retained and Save
remains explicit. Existing Save/Cancel, authorization and persistence contracts
are unchanged. Header and button foreground handling is unchanged.

Legacy invalid saved colors are identified in the editor without rewriting
stored settings. They remain stored, and the published presentation remains
unchanged, until an authorized owner/settings manager chooses a correction and
saves. This is not a data cleanup, database constraint or migration. Direct API
clients remain subject to the existing database contract; expanding that
contract or bulk-correcting stored values needs separate approval.

Regression coverage exercises white-on-white preview, threshold-adjacent colors,
valid branding, field descriptions/invalid state, correction by keyboard,
rejected Save without writes, draft-only default correction, explicit Save and
legacy settings. Actual website product names/prices and the fixed description
are checked. The PR and #97 own executed results, exact SHA, CI and verified
development preview. Physical-device/real screen-reader checks remain deferred
under SUPPORTED-ENVIRONMENTS.md. This stacked branch builds on #96 / PR #98;
its PR targets that feature branch to keep the contrast-only diff reviewable.

Review: open Website Appearance → Style, try white and a light gray, then Save
from another tab. Confirm the error returns focus to Product text. Choose the
readable default or a valid dark brand color, verify the draft, Save, reopen and
check preservation. Cancel must discard unsaved correction. Existing invalid
settings must show guidance without changing before Save. Check phone, tablet
and desktop widths and keyboard operation. The earlier configuration and visual-review holds are superseded by the accepted review status above.
