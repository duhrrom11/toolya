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
- Duo uses existing independently drawn emotion/outfit atlas frames; these are frame illustrations and whole-character CSS motion, not skeletal animation or independently controlled gaze/limbs.
- Category costumes: finance/bookkeeper, home/gardener, organization/planner, travel/mechanic, animals/pet helper. All resets to the approved hero duo.
- Five taps within five seconds, 15-second cooldown, keyboard-native buttons, warning/dialog/quiet/hidden guards.
- Reduced-motion, motion-off and hidden preferences integrated. No sound. Original runtime tools unchanged.
- Follow-up: restore preview transport, visually compare same viewport and state, fix drift, exercise interactions and check console before release.
- No merge, deployment or production data changes.
