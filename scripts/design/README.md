# Header navigation proposal — Issue #35

Prepared for the existing Figma file NsJQpQsR2YNjTwNHdWPWu7. Not an implemented or approved design.

Figma inspection resolved approved preset components, original shopping icons, Inter study fonts, local Study colors and a library navigation-button variant. Code Connect mappings are absent. The existing application uses system sans; the Figma study retains its established Inter typeface.

A separate empty proposal wrapper 32:1184 was created. Header composition did not complete: first syntax and transient imported-definition references were corrected, then the service reported the Starter-plan MCP tool limit. The corrected script has not been validated on canvas. Existing approved frames remain unchanged.

Resume with figma-use and figma-generate-design skills. Inspect wrapper 32:1184 before executing this script; keep approved frames intact. It proposes expanded/collapsed/mobile states for five presets. Complete the mobile/desktop menu-open, long-navigation overflow and owner Header settings link editor views, which are not yet in this script. Verify 48px controls, logo/centered identity/account/cart positions, editable layers and screenshots. Obtain owner design review before implementation; schema/security execution remains separate.

## Browser prototype — owner-approved fallback workflow

Owner approved a separate browser prototype while Figma access is unavailable. `public/prototypes/header-navigation.html` is a self-contained review surface, not the implemented storefront. It has all five layouts, scroll collapse, desktop overflow/More, mobile navigation dialog, name/photo layout placeholder, editable labels/destinations/order, add/remove, and browser-local Save/Cancel. Website links show destination previews rather than navigating; the sample cart does not submit orders. No API, business settings, schema, billing or production behavior changes.

Nine targeted interaction groups passed across five presets and desktop/mobile preview modes: expanded/compact rendering, 56px compact height, menu/Escape, cart access, More/overflow, live editing and reorder, Save/Cancel/reload, invalid HTTPS URL rejection, and photo identity placeholder. No browser script errors. Desktop and mobile menu screenshots were visually inspected. Tests use the prototype's local state, not live business data. Visual acceptance remains pending; recreate the accepted design as editable Figma layers when the account's allowance returns.

### Compact editor correction

Owner requested a tighter left section while retaining touch friendliness and confirmed intended placement under Storefront design → Header. The review sidebar is now 300px (from 340px), has compact navigation summary rows and one expanded link editor at a time. Reorder actions remain 48px targets; link summaries are 56px minimum. Adding a link opens its editor, and reordering preserves which link is being edited. Save/Cancel remain visible. Nine interaction groups passed again, including initial collapsed rows, sidebar width and measured touch targets; the compact resting view was visually inspected. The outer review toolbar is prototype-only, not a new workspace settings page.

### Color ownership correction

Owner agreed to separate workspace and business branding. Outer settings/review CSS now uses the existing Talix palette from globals.css: navy #112e50, action blue #174b91, selected gold #e8b94f, background #f4f7fb, ink #172c48 and supporting tokens. The embedded storefront remains in Retail Demo's green/warm neutral palette; its source was verified byte-identical before formatting. Nine interaction groups passed again with no script errors; screenshot inspected. No application settings or database changed.
