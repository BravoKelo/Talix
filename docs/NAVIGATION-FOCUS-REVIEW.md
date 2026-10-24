# Navigation dialog focus — #64 / Sprint #91

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

The owner explicitly chose to keep new Vercel preview configuration blocked on
October 23, 2026 Pacific, after automatic approval review rejected copying the
existing development settings. No configuration was changed. This is a draft;
deployed verification and visual acceptance remain incomplete.

Review later in an approved development preview: open the mobile menu or desktop
More menu with the keyboard, choose About and Contact, tab in both directions,
and close with Escape/Close/backdrop. Check visible focus and its return. Resize
while a dialog is open to exercise an unavailable original trigger. Recheck a
product-options dialog and cart/checkout, including busy-state dismissal limits.
Leave unmerged pending exact-head owner acceptance and separate integration.
