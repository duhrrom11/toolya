# English 1.0 – evidence and main reconciliation (2026-11-24)

## Verified individual tests

CI run [45490125362](https://github.com/duhrrom11/toolya/actions/runs/45490125362/job/138785890353), head a6c118ea5d474725748caef0f6869f8d14c05548, checked synthetic merge c8a2bca. The job as a whole failed (365 passed, 8 failed), but the following exact cases passed:

| TAP case | Verified scope |
| --- | --- |
| 241 | Seven PDF export paths render EN and DE without mutating synthetic records |
| 256 | Dynamic budget cards and receipt badges provide paired display-only DE/EN copy |
| 261 | Budget QR sticker labels round-trip without changing private QR payload |
| 272 | Household and parking PDFs localize report values without modifying stored records |

These are individual regression-test results, not complete app acceptance. No production test records were used in these isolated tests.

## Main reconciliation

Main 5cccf344a680dfe081aca1868b835a69acaf00b8 intentionally retires mascots.html and en/mascots.html (2cfd765 and 21b35da). Merge 50c2fba preserves all release changes and the current shared mascot settings. Commit 12cdad1 updates navigation, PWA, SEO and audit expectations to 16 public bilingual pairs and 13 English guide cards; 12 canonical apps remain. Both retired pages must remain absent. New CI is required.

## Not accepted yet

34 opt-in application views and 38 heuristic message-file candidates require further runtime review. These counts are not confirmed translation defects. Complete authenticated and dynamic journeys, accessibility, export checks and SEO release readiness remain open. English public noindex must stay in place until acceptance. Do not merge into main or deploy on this evidence alone.

## Verified evidence after main reconciliation

Head a7cf47e1a3fa21622a47b370e107231e6f430d68:

- [Translation quality](https://github.com/duhrrom11/toolya/actions/runs/45491783881/job/138791735669): 373 tests passed, zero failed; 32 local bilingual layout checks, zero visual review warnings; public wishlist editorial DE/EN at 320 and 390 px; 48 application shell and 36 authenticated shell checks passed. These are shell checks, not exhaustive state-by-state acceptance.
- [Platform tests](https://github.com/duhrrom11/toolya/actions/runs/45491783922/job/138791778761): 124 unit/static tests passed, including PWA, sitemap, social previews and original mascot assets; isolated real SDK sign-in, 12 tool routes and 10 reloads, refresh and sign-out passed; two-device isolated synchronization passed. The overall job failed on navigation to retired /mascots.html. Commit df57980 replaces that obsolete navigation with an English mascot-settings assertion; new CI required.
- [Estate/security](https://github.com/duhrrom11/toolya/actions/runs/45491783922/job/138791777300): isolated mail, PostgreSQL security and recovery, household access and encrypted backup cases passed; Chromium owner/trustee security, print, local QR, mobile widths 320/375/768/1280/1440 passed. This is security/functional evidence, not comprehensive translation evidence.
- [Strict audit](https://github.com/duhrrom11/toolya/actions/runs/45491783848): 70 HTML, 129 JS/MJS, 16 English public pages, zero missing routes, zero public German heuristic candidates, five language entrypoints assign document language. All 16 English public pages remain noindex; 34 app views and 38 message-file candidates still require review. Strict gate remains failed.

No production test records were created. No release approval is granted.

## Hardened shell checks
Head ada9f09: quality run 45492725039, job 138794998373 passed 373 static tests, 32 layout checks, 72 anonymous and 54 authenticated shell cases at 320/375/768px. Draft CI head a50a7fc: nine workflows succeeded, full isolated browser workflow skipped intentionally, strict gate failed. New occasion/bookmark copy changes require fresh focused regression evidence; no full acceptance claimed.

## Verified fast CI at b49803a
[Quality run 45496003133 / job 138806549452](https://github.com/duhrrom11/toolya/actions/runs/45496003133/job/138806549452): 384 tests passed, zero failed; both ten-tool validation and meter-calendar regression tests passed (349–350). 12 canonical tools, 16 marketing pages and 16 namespaces: zero critical or review findings in catalogue check. Nine workflows succeeded; full browser suite skipped on draft; strict audit failed (34 incomplete views, 38 candidate files, 16 noindex pages). This is not exhaustive runtime acceptance. New Connect, backup and bulk-action fixes require fresh CI evidence.
