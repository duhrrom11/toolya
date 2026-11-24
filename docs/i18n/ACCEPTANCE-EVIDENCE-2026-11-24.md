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
