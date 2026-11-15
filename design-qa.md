# Toolya homepage redesign QA — 15 November 2026

final result: blocked

The code, isolated browser tests and CI-rendered visual comparison are complete. The remaining blocker is the local Cloud Browser preview transport: it returns an upstream connection error. No working interactive preview handoff or production release is claimed.

## Visual truth and evidence
- Source: `/workspace/scratch/6efad5209ab9/generated_images/exec-94faedac-a562-4980-a037-16dfec208dac.png`,1487×1058 pixels.
- Checked implementation commit: `2d07ebd9b2e8ac3804394cee44f7eb1eb5dbf48b`.
- Platform and isolated estate-security: https://github.com/duhrrom11/toolya/actions/runs/43659941158 — success.
- Amazon: https://github.com/duhrrom11/toolya/actions/runs/43659941228 — success.
- Final screenshot artifact:14139696956 (`mascot-platform-mobile-evidence`) in the platform run.
- Desktop screenshot: `/tmp/toolya-home-release-check/mascot-home-desktop.png`,1440×2612 pixels; CSS viewport1440×1024, deviceScaleFactor1. Source normalized to1440×1024 and compared with the first1024 screenshot pixels in `/tmp/toolya-home-release-comparison.png`.
- Mobile screenshot: `/tmp/toolya-home-release-check/mascot-home-mobile.png`,320×4603 pixels; CSS viewport320×812, deviceScaleFactor1. Focused readable inspection: `/tmp/toolya-home-release-mobile-top.png` (first1750 pixels). Whole mobile page also opened in prior unchanged-layout iteration.
- States: signed out, light theme, real local favorite mechanism populated only inside an isolated browser context. Three quickstart links and four selected card stars deliberately verify that quickstart truncates without deleting saved favorites. The source shows three stars; this fixture difference is intentional.
- Cloud Browser local-preview tab4 was retried and still returned `upstream connect error or disconnect/reset before headers`. Internal HTTP200 is not treated as visual evidence. CI screenshots are actual Chromium renders; they are not a live preview.

## Findings and iteration history
| Iteration | Evidence | Findings and corrections |
| --- | --- | --- |
| Initial CI | Run43658283772, job132641656796 | Old homepage `.toolya-idle` test locator failed because the large duo replaces it. Shared idle/keyboard/warning/dialog coverage moved to the plants tool; added actual homepage tests. |
| First render | Commitdabb96b1, artifact14139074509 | Mobile headline overflow, invisible settings gear, old orange account styling, transient double-image capture, excessive desktop spacing and wrong card order. Fixed whitespace/font sizes, real gear icon, CSS specificity, computed-opacity screenshot wait, hero/main sizing and explicit card ordering. |
| Second render | Commit00a20d42, artifact14138908642 | Verified earlier corrections. Found card intrinsic minimum widths extending the320px viewport. Added width/min-width constraints and real card bounding-box assertion. |
| Third render | Commit1001f93e, artifact14138629369 | Width now320px. Found awkward title breaks; changed mobile cards to icon/title header plus full-width description. |
| Fourth render | Commit674720c6, artifact14139511964 | Readable mobile cards and stable desktop confirmed. Added the requested raster header waves/light points. |
| Final render | Commit2d07ebd9, artifact14139696956 | Header atmosphere and final desktop/mobile views opened and compared. No remaining actionable P0/P1/P2 layout finding in these captured states. Local preview transport remains a handoff blocker. |

## Required fidelity surfaces
- Typography: strong dark headings, blue-turquoise emphasis, readable body text. Mobile long German titles fit. System sans-serif is less rounded than the image mockup (P3).
- Spacing/layout: split desktop hero, horizontal favorites, category row, two-column cards; mobile duo precedes heading, three compact favorites and single-column cards. Header500px on desktop; no viewport overflow in final320px capture. All12 tools retained. Some optional header navigation and card copy are simplified to match the existing product.
- Colors/tokens: ivory, blue turquoise (`#009fc4`, darker accessible primary`#007e9f`), blush, sky blue, lavender and peach. Old orange account styling and decorative green footer accent removed. No green card backgrounds.
- Images: original character identities preserved; transparent hero, separate arch, two independently selected eight-pose atlases, four independent card illustrations and quiet header atmosphere. Original eight PNG hashes unchanged. Standard auxiliary Bootstrap icons are a P3 fidelity simplification. Transparent pixels can retain RGB color values; these are not visible opaque halos in the CI renders.
- Copy/content: genuine tool routes, favorite IDs/storage, account/settings and tool data remain intact. No fabricated online save or donation claims. No production APIs or data modifications.

## Actually completed verification
-68 existing Node module/platform/Amazon checks passed locally and in GitHub.
- JavaScript syntax checked for all executable inline scripts, homepage module, static preview server and browser runner.
- Real isolated Chromium checks passed:12 tool routes,320px reflow, original shared buddy keyboard/touch/cooldown and warning/dialog behavior, homepage five-tap Easter egg, category counts, favorite persistence and three-link limit, hidden/motion preferences, reduced motion, pose asset loading, visible mobile gear, per-card bounds, desktop CTA reaction and hover capture.
- Captured browser page-error lists were empty; no production writes attempted. Supabase/mail/analytics and non-static external requests were blocked in the runner.
- Dark-theme appearance, physical Android hardware and a live local interactive handoff were not visually accepted in this run. No claim of those checks is made.

## Follow-up polish / remaining gate
- P3: closer rounded font and auxiliary illustration family; optional further refinement of compact favorite labels.
- Required before a Product Design interactive handoff: restore local preview transport and inspect the running page in Cloud Browser. No merge or deployment performed.
