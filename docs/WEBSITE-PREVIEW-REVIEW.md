# Go Live viewport correction — #96

## Accepted review status — October 24, 2026 Pacific

The owner visually accepted this correction and authorized Sprint #91 integration.
The prior configuration hold is historical: general Preview development connection
configuration was separately approved and corrected (PR #102). The owner explicitly
waived hosted runner testing for Sprint #91 only; it is not a passing journey claim
or a precedent for later sprints. #105 / draft PR #106 remain incomplete and excluded.
[#97](https://github.com/BravoKelo/Talix/issues/97) owns current exact-head CI,
preview/acceptance evidence and actual merge outcomes. Main automatic deployment
remains disabled; production and database/security settings are unchanged.

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

The Linux WebKit follow-up reproduced an overflowing 769px frame with native
wheel scrolling stuck at zero. A diagnostic run retained the original failure,
confirmed programmatic scrolling, then observed native wheel scrolling after
changing root overscroll behavior. The correction removes the frame document's
`overscroll-behavior: contain`; it retains ordinary browser-owned scrolling,
uniform scaling, the static sandbox and the existing React portal. It adds no
wheel interception, synthetic scrolling, browser-specific branch or dependency.
The regression still requires native movement when content overflows and always
checks footer reachability. Temporary event/style probes and WebKit-first
fail-fast ordering are removed before final validation. #97/PR own the resulting
exact-head full-suite evidence; a local pass alone does not resolve Linux CI.

Historical configuration hold: the October 23 hold was later superseded as recorded above. The original reproduction and implementation evidence remain valid; #97 owns current review and integration status.

## Owner review

After a verified development preview is available, open Website Setup → Go live.
Compare Desktop against the same website at 1120px, then select Tablet/Mobile
while resizing the workspace. Check hero/photo proportions, heading wrapping,
all page content and footer, keyboard navigation, and absence of horizontal
overflow. Open Website Appearance and compare the same modes; stage a branding
change, then Cancel and confirm saved values remain. Confirm preview cannot
order and choosing a mode does not publish. Physical-device and actual screen
reader evidence remain deferred under SUPPORTED-ENVIRONMENTS.md.
