# Export acceptance matrix — 7c71468e

Latest verified CI: [browser job](https://github.com/duhrrom11/toolya/actions/runs/45652075427/job/139339016396) (236/236, including tests 235 and 236), [quality job](https://github.com/duhrrom11/toolya/actions/runs/45652075249/job/139338996229) (409/409, 72/72 public and 57/57 authenticated shell views), [static job](https://github.com/duhrrom11/toolya/actions/runs/45652075305/job/139338993859) (409/409), [strict gate](https://github.com/duhrrom11/toolya/actions/runs/45652075205/job/139338947704) (failed). All 16 workflows and 21 jobs for 7c71468e inspected: 15 workflows and 20 jobs passed. Strict gate remains blocked by 34 partial tool pages, 33 German-message source files for review and 16 English noindex pages.

Additional evidence at 55bb8c11: [static](https://github.com/duhrrom11/toolya/actions/runs/45663943972/job/139380874794) and [quality log](https://github.com/duhrrom11/toolya/actions/runs/45663944193/job/139380941026) each logged 409/409 passing unit tests. [Strict gate](https://github.com/duhrrom11/toolya/actions/runs/45663944479/job/139380874506) remains failed with 34 partial tools and 33 German-message files. Initial job snapshot: 16 passed, 4 running, 1 failed across 21 jobs. No acceptance claimed for unfinished jobs.

Baseline CI: [quality job](https://github.com/duhrrom11/toolya/actions/runs/45650961648/job/139335002727), [static job](https://github.com/duhrrom11/toolya/actions/runs/45650961554/job/139335002663), [browser](https://github.com/duhrrom11/toolya/actions/runs/45650961613), [strict gate](https://github.com/duhrrom11/toolya/actions/runs/45650961748/job/139335002507). Both quality and static jobs logged 409/409 passing tests (including tests 105 and 106). Across 16 PR workflows, 20 of 21 jobs passed; strict gate failed. Inventory: 171 files, 249 candidate lines; CSV 8, ICS 17, JSON 92, PDF 26, QR 54, print 8, download 54. Categories overlap; API JSON and QR display are not necessarily exports.

| Function | Evidence / remaining work |
| --- | --- |
| Budget all/tax CSV | Existing bilingual unit tests verify formulas, signed and missing amounts, dates. |
| Wishes own CSV/JSON | Bilingual security and private-data unit regression passed (test 105 in both jobs); real download, auth switch and cancellation remain review items. |
| Admin discovery CSV/JSON | Existing CSV parser/formula tests; actual DE/EN CSV and JSON downloads, schema invariance and no additional API calls passed at 55bb8c11 ([platform log](https://github.com/duhrrom11/toolya/actions/runs/45663944082/job/139380968846)). |
| Moving JSON backup, PDF, QR labels | Existing isolated browser tests verify byte identity, cancellation, translated report labels, QR deep links and missing libraries. |
| Meter handover/history PDF | Existing isolated browser tests verify labels and unchanged readings. |
| Car, budget, parking, housemates, pet, loans, plants PDF | Existing dependency retry tests; full per-report content and data invariance still require review. |
| Estate key print and encrypted backup | Existing isolated security and browser tests; no production writes. |
| Wishes gift-task report JSON/print | Owner revalidation added in 97958364; isolated DE/EN downloads, cancellation, print invocation and account-switch regression added in 28cc8160. Browser log unavailable at verification; acceptance pending. |
| Dashboard-linked global local JSON backup | Dashboard settings link to home settings #datensicherung; actual handler exportGlobalBackup on DE/EN home pages. Regression added in 6241f65b for unencrypted JSON, cancellation, allowlist/session exclusion and no writes; CI pending. Not a full cloud dashboard backup. |
| Wishes annual review JSON | Reachable gift-analytics.html export; current-account guard and bilingual isolated actual-download regression implemented (4a7d9187, 7c71468e); Passed in browser test 236/236 at 7c71468e (see latest browser job). Separate from legacy own-wishes export in app.mjs, whose active HTML entrypoint is not verified. |
| Car, pet and loans ICS | Existing browser coverage; shared calendar byte folding, escaping and stable fields regression passed (test 106 in both jobs). |
| Budget warranty ICS | Bilingual actual-download regression added in 790c723b; date/alarm, private fields and no-write assertions passed in browser test 235/236 at 7c71468e (see latest browser job). |
| Shared backups and QR | Review remaining candidates by actual handler; do not count API JSON or display-only QR as exports. |

The inventory now includes ICS explicitly. No strict release waiver, noindex change or production test data.
