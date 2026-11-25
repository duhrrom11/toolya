# Export acceptance matrix — 9553109

Source CI: [quality](https://github.com/duhrrom11/toolya/actions/runs/45647974799), [browser](https://github.com/duhrrom11/toolya/actions/runs/45647974825), [artifact](https://github.com/duhrrom11/toolya/actions/runs/45647974799/artifacts/15039256654). 171 files, 235 candidate lines; CSV 8, JSON 92, PDF 26, QR 54, print 8, download 54. Categories overlap; API JSON and QR display are not necessarily exports.

| Function | Evidence / remaining work |
| --- | --- |
| Budget all/tax CSV | Existing bilingual unit tests verify formulas, signed and missing amounts, dates. |
| Wishes own CSV/JSON | New bilingual security and private-data unit regression pending CI; real download, auth switch and cancellation remain review items. |
| Admin discovery CSV/JSON | Existing CSV parser/formula tests; actual bilingual download and schema invariance remain review items. |
| Moving JSON backup, PDF, QR labels | Existing isolated browser tests verify byte identity, cancellation, translated report labels, QR deep links and missing libraries. |
| Meter handover/history PDF | Existing isolated browser tests verify labels and unchanged readings. |
| Car, budget, parking, housemates, pet, loans, plants PDF | Existing dependency retry tests; full per-report content and data invariance still require review. |
| Estate key print and encrypted backup | Existing isolated security and browser tests; no production writes. |
| Wishes gift-task report, year review and dashboard backup JSON/print | Source identified; full actual bilingual download/print and no-write evidence still required. |
| Car, pet and loans ICS | Existing browser coverage; new shared calendar byte folding, escaping and stable fields regression pending CI. |
| Budget warranty ICS | Source identified; date/alarm semantics and bilingual actual download still require review. |
| Shared backups and QR | Review remaining candidates by actual handler; do not count API JSON or display-only QR as exports. |

The inventory now includes ICS explicitly. No strict release waiver, noindex change or production test data.
