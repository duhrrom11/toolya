# Toolya homepage redesign QA

final result: blocked

## Target and implementation
- Approved source: `/workspace/scratch/6efad5209ab9/generated_images/exec-94faedac-a562-4980-a037-16dfec208dac.png` (1487 × 1058 pixels).
- Implementation: `index.html`, `assets/toolya-home.css`, `shared/toolya/home.mjs`.
- Intended desktop CSS viewport: 1440 × 1024; responsive breakpoints 1000, 680 and 370 pixels.
- State: signed out, initial favorites empty unless existing local preferences supply them.
- Implementation screenshot: unavailable. Cloud Browser tab 4 at the required local preview route repeatedly displayed `upstream connect error or disconnect/reset before headers. reset reason: connection termination`.
- Read-only preview served HTTP 200 (59,987 bytes) inside its execution session. This is NOT visual verification.

## Findings
- [P1, blocking acceptance] Browser preview transport unavailable. No rendered design comparison, responsive acceptance, pointer/keyboard/touch interaction acceptance or console-error acceptance can be claimed.
- Full-view and focused-region comparison: blocked; no false side-by-side or density-normalization claim.

## Required fidelity surfaces
- Fonts/typography: implemented system sans-serif with deliberate heading weights, sizes and wrapping; visual comparison pending.
- Spacing/layout: hero, horizontal real favorites, category filters and pastel two-column tool cards implemented; desktop/mobile overflow and density checks pending.
- Colors: blue turquoise #009fc4 / accessible darker primary #007e9f, ivory, pink, blue, lavender and peach. No green UI card palette. Contrast/rendered-state inspection pending.
- Images: generated transparent hero duo and four independent transparent card illustrations; original eight PNG hashes verified by existing tests. Other icons are vendored Bootstrap Icons (MIT). Asset scale/crop/halos pending browser comparison.
- Copy/content: all twelve existing tool routes and IDs retained. Shorter card labels and descriptions. Real favorites preserved; no fabricated initial favorites. No production API or tool-data modifications.

## Verification actually completed
- `node --test tests/mascot/*.test.mjs tests/platform/*.test.mjs tests/amazon/*.test.mjs`: 68 passed, 0 failed.
- All executable inline homepage scripts, home.mjs and preview server: node --check passed.
- Original PNG invariance and local HTML reference resolution passed as part of the suite.
- Browser-rendered interactions, console errors, desktop/mobile, dark mode and reduced-motion rendering: NOT verified.

## Implementation details / remaining acceptance
- Home-specific hover lift/glow, pointer tilt, press depression, star pop, finite reactions and category entrance transitions.
- Duo now has dedicated 4×2 transparent pose atlases for both characters: neutral, blink, wave, point down-left, celebrate, laugh, gaze left and gaze right. Eyelids, gaze and paw positions are separately drawn states and independently selected per character. These are registered frame illustrations, not skeletal rigs. The arch is a separate transparent asset. Browser assessment of registration and transitions remains pending.
- Category costumes: finance/bookkeeper, home/gardener, organization/planner, travel/mechanic, animals/pet helper. All resets to the approved hero duo.
- Five taps within five seconds, 15-second cooldown, keyboard-native buttons, warning/dialog/quiet/hidden guards.
- Reduced-motion, motion-off and hidden preferences integrated. No sound. Original runtime tools unchanged.
- Follow-up: restore preview transport, visually compare same viewport and state, fix drift, exercise interactions and check console before release.
- No merge, deployment or production data changes.

## Continuation: 15 November 2026
- GitHub run 43658283889 (Amazon) passed; estate-security job 132641657116 passed.
- Platform job 132641656796 failed at the old `.toolya-idle` homepage locator: the redesign intentionally replaces that shortcut with the header duo. No application crash was reported in that failure.
- Shared idle/keyboard/warning/dialog tests moved to the plants tool. Added real homepage touch/favorite persistence/category/settings/motion and desktop hover checks, with all production requests still blocked.
- Dedicated character pose atlases, separate arch, offscreen pausing, cancellation of animations when settings/dialogs block motion, and back/forward-cache restoration implemented. New CI pending.
- Cloud Browser local-preview transport retried and remains unavailable. No rendered visual acceptance claimed.

## CI-rendered comparison, first iteration
- Exact checked commit: dabb96b1a726bb1090c40e60a353893f6e9ce859. Platform and estate-security passed in run 43658954489; Amazon passed in run 43658954502.
- Real Chromium screenshots from artifact 14139074509: desktop 1440×2766 pixels (CSS viewport1440×1024, density1), mobile367×4862 pixels (CSS viewport320×812, density1).
- Opened the actual source and CI screenshots. Full-view comparison `/tmp/toolya-home-comparison.png`: source normalized from1487×1058 to1440×1024 and compared with the screenshot's first1024 pixels. Mobile screenshot separately inspected at readable scale.
- [P1] Mobile headline had no whitespace at the hidden line break and exceeded its container. Fixed source whitespace, restored explicit mobile line breaks and reduced responsive font size. Added h1 client/scroll-width assertion.
- [P1] Mobile settings gear invisible because the old text-only button was hidden by font-size0. Added actual vendored gear icon and visible-icon assertion; shortened the sign-in label while preserving its accessible registration label.
- [P2] Old high-specificity orange account styles overrode the chosen palette. Added equally specific cyan/ivory overrides.
- [P2] Desktop capture occurred during opacity crossfade, producing temporary doubled figures. Screenshot now waits for both illustration layers' final computed opacity.
- [P2] Legacy main max-width/margins created excessive inset and vertical gaps. Matched intended1440px main width and500px desktop hero, removed redundant spacing utilities.
- [P2] Tool order counted HTML comments when placing the plant card. Explicit canonical card order now matches the approved four-card arrangement.
- Corrections are awaiting the next CI screenshot comparison. Local Cloud Browser transport remains unavailable; `final result: blocked` still applies. No local interactive preview handoff or publication claimed.

## CI comparison, second iteration
- Revised platform job132644715988 passed on commit00a20d425d81d49156cd7abf3fb8ea38cf0fcc11; artifact14138908642 inspected. Desktop1440×2612, mobile351×4689. Source/desktop composite `/tmp/toolya-home-revised-comparison.png`.
- Confirmed fixes: mobile headline, visible settings gear, neutral account button, clean rest-state characters, correct first four cards, main inset and header spacing.
- [P2] Mobile card intrinsic minimum width still extended the full-page screenshot beyond the320px CSS viewport, despite root scrollWidth being clipped. Fixed card/link min-width and width constraints plus long German title wrapping. Added actual per-card bounding-box assertion instead of relying only on document scrollWidth. New screenshot comparison pending.
