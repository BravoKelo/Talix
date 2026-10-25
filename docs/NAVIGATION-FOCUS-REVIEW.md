# Navigation dialog focus — #64 / Sprint #91

## Accepted review status — October 24, 2026 Pacific

The owner visually accepted this correction and authorized Sprint #91 integration.
The prior configuration hold is historical: general Preview development connection
configuration was separately approved and corrected (PR #102). The owner explicitly
waived hosted runner testing for Sprint #91 only; it is not a passing journey claim
or a precedent for later sprints. #105 / draft PR #106 remain incomplete and excluded.
[#97](https://github.com/BravoKelo/Talix/issues/97) owns current exact-head CI,
preview/acceptance evidence and actual merge outcomes. Main automatic deployment
remains disabled; production and database/security settings are unchanged.

The actual mobile storefront reproduced Menu → About with `activeElement=BODY`,
outside the still-open dialog. Changing the view removed the focused menu action
but did not remount the native TaskDialog or rerun its initial-focus effect.

Navigation now supplies a view focus key. TaskDialog focuses the view title on
those changes while retaining the original opener for the entire mounted dialog.
Opted-in navigation views wrap Tab at their available controls so the single
Close control and reverse tabbing keep focus in the active dialog. Other dialog
consumers retain their existing native initial focus and behavior. Escape,
backdrop dismissal and busy-state protection are unchanged.

Restoration uses the dialog's owning document, including a private preview
frame. A connected, visible, enabled original opener is preferred; if it no
longer exists or is hidden, the stable named business-navigation region receives
focus. Existing primary-list-action recovery remains for other consumers. No
dialog framework, routing, commerce or authorization redesign is introduced.

Regressions cover keyboard Menu → About/Contact, title focus, forward/reverse
Tab, Escape/original opener and removed-trigger fallback at 1280/768/390px,
plus existing cart and standard-navigation behavior in all configured engines.
The PR/#97 own executed results and exact-head CI. Actual screen-reader and
physical-device evidence remains deferred under SUPPORTED-ENVIRONMENTS.md.

The earlier configuration and visual-review holds are superseded by the accepted review status above.

Review later in an approved development preview: open the mobile menu or desktop
More menu with the keyboard, choose About and Contact, tab in both directions,
and close with Escape/Close/backdrop. Check visible focus and its return. Resize
while a dialog is open to exercise an unavailable original trigger. Recheck a
product-options dialog and cart/checkout, including busy-state dismissal limits.
Leave unmerged pending exact-head owner acceptance and separate integration.
