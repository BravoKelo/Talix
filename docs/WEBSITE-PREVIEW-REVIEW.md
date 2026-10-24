# Go Live viewport correction — #96

Sprint #91 / #97 authorizes this bounded correction. Recovered main was
`4bb93bbcc75e20b4ed2db4eb7d424a0b2c18e666`, with Sprint #90 merged.

## Reproduction and correction

The actual Website Setup → Go live journey at a 1280px workspace rendered the
selected Desktop preview at **329px**, rather than 1120px. A failing browser
assertion and screenshot captured that result before the correction. The old
`width:100%` / `max-width` contract mixed panel-width container queries with host
viewport media queries and typography. Selecting Desktop did not create a desktop
viewport.

`WebsitePreview` now gives the existing private React header/template a real
1120px desktop, 768px tablet or 390px mobile viewport. A uniform transform scales
the entire frame to the available panel width. Media queries and viewport units
run in that viewport; the frame document supplies the one scrolling surface.
Go Live and Website Appearance share the component and unsaved appearance values
remain in component memory. The frame uses the application's styles and React
rendering, not a public storefront URL, external website or a second catalog or
checkout client. Its static document has no scripts; sandbox permits same-origin
access for the existing React portal. Existing preview-only navigation and
disabled ordering remain; publication still requires the separate explicit action.

## Verification and limits

The onboarding regression exercises all three modes at 1280, 768, 390 and 320px
host widths, genuine viewport width, equal horizontal/vertical scale, internal
and host content boundaries, keyboard controls, footer reachability and staged
appearance changes. Screenshots are local test artifacts. #97 and the PR own
final exact-head CI and executed results; this document is not a passing-check
claim.

Deployment blocker: automatic approval review rejected creating branch-scoped
copies of the unchanged existing development preview variables, classifying it
as a persistent infrastructure change outside the sprint's restrictions. No
variable was created. The owner explicitly chose to keep preview configuration
blocked on October 23, 2026 Pacific. Do not retry or work around that hold without
new authorization. A verified development preview and deployed comparison
against the published website remain required before visual acceptance. Do not
label this PR ready until that evidence is recorded. No production, migration,
schema, security configuration, merge or branch deletion is authorized.

## Owner review

After a verified development preview is available, open Website Setup → Go live.
Compare Desktop against the same website at 1120px, then select Tablet/Mobile
while resizing the workspace. Check hero/photo proportions, heading wrapping,
all page content and footer, keyboard navigation, and absence of horizontal
overflow. Open Website Appearance and compare the same modes; stage a branding
change, then Cancel and confirm saved values remain. Confirm preview cannot
order and choosing a mode does not publish. Physical-device and actual screen
reader evidence remain deferred under SUPPORTED-ENVIRONMENTS.md.
