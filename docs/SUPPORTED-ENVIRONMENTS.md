# Talix supported environments and verification matrix

Status: approved by the owner on October 20, 2026 Pacific. Physical-device testing is scheduled at the owner's discretion and remains pending until results are recorded. This policy does not itself certify compatibility, accessibility, WCAG conformance or legal compliance.

## Browser and operating-system window

| Experience | Supported browsers | Operating-system window |
| --- | --- | --- |
| Desktop web | Current and previous stable Chrome, Edge and Firefox; current and previous major Safari | Browser vendor-supported Windows and macOS releases |
| iPhone and iPad web | Current and previous major Safari | Current and previous major iOS and iPadOS |
| Android web | Current stable Chrome | Current and previous major Android releases supported by Chrome |

“Current” is evaluated when evidence is collected, not frozen to a version number in this document. Preview, beta, developer and other prerelease browser channels are not supported production targets. Review this matrix quarterly, next by January 20, 2027, and when a browser or operating-system vendor announces an end of support. A retirement or expansion requires a documented product decision and updated evidence; support does not change silently.

## Required evidence for critical owner and shopper journeys

Automated pull-request coverage uses the existing Playwright framework:

- full desktop and narrow-viewport Chromium regression coverage;
- critical owner onboarding and customer website/storefront coverage in Firefox;
- critical owner onboarding and customer website/storefront coverage in WebKit.

Manual evidence records exact browser, operating system and assistive-technology versions, date, tested journey, input mode, device or emulation status, result and remaining limitation. The representative matrix is:

| Platform | Representative evidence |
| --- | --- |
| Windows PC | Chrome, Edge and Firefox; mouse and keyboard-only; NVDA with Firefox and a Chrome smoke check |
| Mac | Safari and Chrome; mouse and keyboard-only; VoiceOver with Safari |
| iPhone | Safari; physical touch, soft keyboard, portrait/landscape and VoiceOver |
| iPad | Safari; physical touch, soft keyboard, portrait/landscape and VoiceOver |
| Android phone | Chrome; physical touch, soft keyboard, portrait/landscape and TalkBack |

Affected flows also require visible and unobscured focus, text zoom and 200% page zoom/reflow checks, plus correction and recovery from validation or denied saves. Browser emulation is recorded as emulation and never substituted for physical touch, mobile screen-reader or soft-keyboard evidence.

## Current acceptance limit

Physical-device and real assistive-technology checks are pending at the owner's discretion. Their deferral does not mark them passed and does not support a public claim of complete device coverage or WCAG conformance. Any material defect found during that testing must be recorded and resolved or receive an explicit exception under AC15 before the affected journey is accepted for that environment.
