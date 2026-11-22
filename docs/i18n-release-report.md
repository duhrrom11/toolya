# Toolya – Technischer DE/EN-Release-Bericht

**Stand:** 22.11.2026 · **Code-HEAD mit vollständigem CI-Nachweis:** `6b6068913309084c29c9d0591c78835fff8a6799`
**Repository:** `duhrrom11/toolya` · **Branch:** `feature/i18n-de-en-foundation-20261121` · **PR:** [#291](https://github.com/duhrrom11/toolya/pull/291), Draft
**Status:** **NOT READY — Release-Gate offen**, keine Freigabe zur Produktion

## 1. Implementierte Arbeitspakete in dieser Ausführung

- Tatsächlichen Branch-HEAD aus GitHub verifiziert und bisher unbestätigte Tests geprüft. Der Entwicklungsbranch wurde nach dem veröffentlichten `main`-Fix #306 als Zwei-Eltern-Merge ohne Hauptbranch-Änderung und ohne Asset-Austausch auf den aktuellen Markenstand gebracht. Er liegt null Commits hinter `main`.
- Parkplatz-Verlauf: benutzerdefinierten Text nur beim Rendern escaped, Foto-URLs auf Raster-Data-URLs beschränkt, GPS-Koordinaten und Lösch-IDs validiert, ältere ISO-Timestamps in EN angezeigt und zweisprachige Leer-/Betragszustände ergänzt.
- Auto-/Haustier-/Verleih-/Zählerstand-Ansichten: weitere DE/EN-Laufzeit- und Leerzustände, lesende Locale-Refreshes bei CloudOnly-Bereitschaft, unveränderte persistente Statuscodes und Freitexte.
- Verleih: gemeinsame RFC-5545-/UTF-8-ICS-Erstellung mit stabiler UID, valide ganztägige Termine, DE/EN-Google-Kalenderlink und Messenger-Erinnerungen. Echtes Downloadverhalten mit synthetischen Testdaten geprüft.
- Accessibility: geschlossene `.hidden`-Dialoge bleiben auch bei fehlendem Tailwind-CDN verborgen; kein ungewolltes `inert` auf der Tool-Oberfläche. Mobile Fokus-/Escape-Tastatursteuerung und Datenintegrität browsergetestet.
- CI: bestehende isolierte Chromium-/Plattform-/Connect-Workflows für den i18n-Branch aktiviert und gezielten 5-Fälle-Chromium-Smoke-Workflow ergänzt. Synthetische Node-/Playwright-Regressionen ausgebaut.
- Roadmap, Fortschritt und Draft-PR-Status über mehrere Entwicklungspakete dokumentiert. **Kein Merge nach main, kein Deployment, kein `noindex`-Entfernen, keine Produktivdaten, keine produktiven Testkonten.**

## 2. Tatsächlich ausgeführte Tests

**Auf dem geprüften Code-HEAD: 18 von 18 GitHub-Actions-Workflows erfolgreich.** Kein fehlgeschlagener oder noch laufender Lauf in dieser Head-Auswahl.

| Workflow | Ereignis | Ergebnis | GitHub-Lauf |
| --- | --- | --- | --- |
| Budget Clever sparen – Checks | pull_request | **Erfolgreich** | [#44966691258](https://github.com/duhrrom11/toolya/actions/runs/44966691258) |
| Dashboard unified shopping and task Connect | pull_request | **Erfolgreich** | [#44966691078](https://github.com/duhrrom11/toolya/actions/runs/44966691078) |
| i18n static checks | pull_request | **Erfolgreich** | [#44966691341](https://github.com/duhrrom11/toolya/actions/runs/44966691341) |
| Isolated Toolya browser tests | pull_request | **Erfolgreich** | [#44966691126](https://github.com/duhrrom11/toolya/actions/runs/44966691126) |
| Isolated Toolya browser tests | push | **Erfolgreich** | [#44966687066](https://github.com/duhrrom11/toolya/actions/runs/44966687066) |
| Isolated Toolya browser tests | push | **Erfolgreich** | [#44966687009](https://github.com/duhrrom11/toolya/actions/runs/44966687009) |
| Moving Helper release 2 security and browser CI | pull_request | **Erfolgreich** | [#44966691079](https://github.com/duhrrom11/toolya/actions/runs/44966691079) |
| Moving Planner release checks | pull_request | **Erfolgreich** | [#44966691213](https://github.com/duhrrom11/toolya/actions/runs/44966691213) |
| Moving Planner release checks | push | **Erfolgreich** | [#44966686982](https://github.com/duhrrom11/toolya/actions/runs/44966686982) |
| Toolya Amazon scraper | pull_request | **Erfolgreich** | [#44966691104](https://github.com/duhrrom11/toolya/actions/runs/44966691104) |
| Toolya Connect Gießplan Dashboard | pull_request | **Erfolgreich** | [#44966691184](https://github.com/duhrrom11/toolya/actions/runs/44966691184) |
| Toolya Connect isolated browser CI | pull_request | **Erfolgreich** | [#44966691342](https://github.com/duhrrom11/toolya/actions/runs/44966691342) |
| Toolya dashboard live health | pull_request | **Erfolgreich** | [#44966691090](https://github.com/duhrrom11/toolya/actions/runs/44966691090) |
| Toolya dashboard sprint 1 | pull_request | **Erfolgreich** | [#44966691217](https://github.com/duhrrom11/toolya/actions/runs/44966691217) |
| Toolya Haushaltsbuch – Live-Veröffentlichung prüfen | pull_request | **Erfolgreich** | [#44966691364](https://github.com/duhrrom11/toolya/actions/runs/44966691364) |
| Toolya i18n runtime Chromium smoke | push | **Erfolgreich** | [#44966687023](https://github.com/duhrrom11/toolya/actions/runs/44966687023) |
| Toolya platform and mascot release | pull_request | **Erfolgreich** | [#44966691123](https://github.com/duhrrom11/toolya/actions/runs/44966691123) |
| Toolya platform and mascot release | push | **Erfolgreich** | [#44966687062](https://github.com/duhrrom11/toolya/actions/runs/44966687062) |

Zusätzliche Ergebnisdetails aus den tatsächlichen Protokollen:

| Testgruppe | Verifizierte Tests | Referenz |
| --- | --- | --- |
| Node-i18n-Regressionen | **214 bestanden, 0 fehlgeschlagen, 0 übersprungen** | [CI 44966691341](https://github.com/duhrrom11/toolya/actions/runs/44966691341) |
| Gezielter mobiler Chromium-Smoke (DE/EN, ICS, A11y) | **5 bestanden** | [CI 44966687023](https://github.com/duhrrom11/toolya/actions/runs/44966687023) |
| Vollständige isolierte CloudOnly-Browser-PR-Suite | **178 bestanden** | [CI 44966691126](https://github.com/duhrrom11/toolya/actions/runs/44966691126) |
| Isolierte Browser-Mock-Suite | **166 bestanden, 16 übersprungen** | [CI 44966687066](https://github.com/duhrrom11/toolya/actions/runs/44966687066) |
| Plattform-Node-Tests | **124 bestanden, 0 fehlgeschlagen** | [CI 44966691123](https://github.com/duhrrom11/toolya/actions/runs/44966691123) |
| Plattform-Sicherheitsjob | **erfolgreich** | [CI 44966691123](https://github.com/duhrrom11/toolya/actions/runs/44966691123) |
| Connect-/Planner-/Dashboard-/Budget-/Amazon-Checks | **erfolgreiche jeweilige GitHub-Läufe** | Siehe obige Workflowtabelle |

**Nicht als ausgeführt/abgenommen ausgeben:** vollständiger realer Authentifizierungs-/Recovery-Mail-Rückweg auf isolierter Testinfrastruktur, alle tatsächlichen PDF-/Druck-/QR-Ausgaben jedes Tools, manuelle Screenreader-Prüfung aller Ansichten, alle mobilen Gerätetypen und sämtliche CloudOnly-Nutzerwechsel-Szenarien außerhalb bereits bestehender isolierter Tests. Eine lokale vollständige Repository-Suite war mangels Checkout/DNS in dieser Ausführungsumgebung nicht möglich; GitHub-CI hat die oben genannten Tests wirklich ausgeführt.

## 3. Offene i18n- und Release-Gates

Aktueller i18n-Audit aus dem grünen Node-CI-Lauf: **72 HTML-Seiten**, **121 JS-Dateien**, **17 öffentliche englische Seiten**, **0 Seiten ohne EN-Einstieg**, aber **34 nur teilweise lokalisierte Ansichten** (10 Haupttools, 17 Wunschtools, 4 Nachlass-, 1 Dashboard-, 2 Admin-Ansichten). **48 Quellcodedateien** enthalten potenzielle deutsche Laufzeitmeldungen (heuristischer Befund, noch einzeln prüfen). **17 englische Seiten** tragen absichtlich `noindex`; Englisch kann auf partiellen Seiten derzeit noch nicht durchgängig als vollständige Dokumentensprache ausgezeichnet werden.

**Release-Blocker:**
1. 34 teilweise übersetzte Anwendungsansichten vollständig in DE/EN abgleichen, einschließlich Laufzeitfehlern, Validierungen, dynamischen Zuständen, Accessibility-Namen, Date-/Number-/Currency-Formatierung und mobilen Fällen. Nutzereingaben und persistente Statuscodes dürfen nicht geändert werden.
2. Die 48 heuristisch gefundenen Quellcodedateien einzeln triagieren, nicht bloß die Audit-Markierung entfernen. Den strengen Coverage-Audit erst nach fachlichem Nachweis grün bringen.
3. Auth-/Recovery-Mailrückweg, Sitzungslaufzeit, Nutzerwechsel und Race Conditions in einer **separaten nichtproduktiven Testumgebung** end-to-end prüfen; keine Supabase-Produktivdaten lesen/testen.
4. PDF-/ICS-/QR-/Druckausgaben und mobile/Screenreader-Barrierefreiheit aller betroffenen Tools gezielt abnehmen. Einzelne bereits bestandene Export- und Mobiletests sind **kein** Vollnachweis.
5. Danach finale vollständige Node-/Chromium-/Plattform-/Connect-GitHub-CI auf dem Release-Kandidaten sowie erneute Prüfung von Design/Markenintegrität, `noindex`-Sperre und PR-Draft-Status.

## 4. Technische und organisatorische Risiken

- **Sprachvollständigkeit:** teilweise englische Ansichten können unübersetzte dynamische Meldungen oder unpassende Sprach-/Formatierungsmetadaten enthalten.
- **Authentifizierung:** ein nachweislicher echter Recovery-Mail-Rückweg fehlt trotz isolierter Auth-/Recovery-Tests.
- **Geräte und Screenreader:** automatisierte Chromium-/A11y-Tests ersetzen nicht alle mobilen und assistiven Testkonfigurationen.
- **Export und Nutzertexte:** ICS im Verleih ist mit echten synthetischen Downloads abgesichert; andere PDF/QR/Druckpfade benötigen noch vollständige Funktionsabnahme.
- **Sicherheit und Datenintegrität:** die gezielten XSS-/CloudOnly-Regressionen sind grün, aber kein pauschaler Beweis für sämtliche Tools.
- **Indexierung:** `noindex` muss bis zur ausdrücklichen geschützten Freigabe bleiben.

## 5. Wiederaufnahme / Freigabe

**Nächste Arbeitspakete:** zuerst die 10 partiellen Haupttools, danach die 17 Wunschtools und vier Nachlassansichten, dann Dashboard/Admin; bei jedem Paket isolierte Node- und Chromium-Prüfung, CI, Dokumentation. Strikten Audit, realen Auth-Recovery-Flow und Export/A11y-Gates abschließend abarbeiten.

**Release-Status: NOT READY.** PR #291 bleibt **Draft**. Eine Genehmigung für Merge nach `main`, Produktionsdeployment oder das Entfernen von `noindex` wurde weder eingeholt noch genutzt. Diese geschützten Schritte erst nach sämtlichen technischen Freigabekriterien und ausdrücklicher Nutzerzustimmung ausführen.

**Wiederaufnahmepunkt:** [aktueller Feature-Branch-HEAD](https://github.com/duhrrom11/toolya/commits/feature/i18n-de-en-foundation-20261121/), [Roadmap](https://github.com/duhrrom11/toolya/blob/feature/i18n-de-en-foundation-20261121/docs/i18n-roadmap.md), [Fortschritt](https://github.com/duhrrom11/toolya/blob/feature/i18n-de-en-foundation-20261121/docs/i18n-release-progress.md), [Draft-PR](https://github.com/duhrrom11/toolya/pull/291). Der geprüfte Code-HEAD oben bleibt referenziert, auch wenn danach eine reine Dokumentationsänderung einen neueren HEAD erzeugt.

## Ergänzung 22.11.2026 – Nachgezogener Main-Commit für neue Connect-Fristen

Das Dashboard-Connect-Paket `c75b247ad3401bd75cf38f3b4d4da4df314d67a2` wurde in den Entwicklungsbranch übernommen; die abweichende i18n-Ansicht von `dashboard/dashboard.js` mit der Main-Logik zusammengeführt und eine isolierte Node-Regression für Readonly-Termine ergänzt. Die bisherige vollständige 18/18-CI-Aussage gilt für den dokumentierten Code-HEAD `6b606891`, **nicht automatisch** für den neuen Zwei-Eltern-Merge. Aktuelle Merge-CI und Release-Gates sind erneut zu verifizieren. PR bleibt Draft, kein Produktionsmerge/-deployment und keine Änderung an `noindex`.

### Zusatz: Übersetzbare Connect-Fristen mit strukturierten Anzeigeelementen

Für abgeleitete Verleih-, Auto- und Haustierfristen werden Anwendungswörter vom wörtlich eingegebenen Titel getrennt. Der neue Code ändert weder gespeicherte CloudOnly-Werte noch Bestätigungsrechte. Die neuen Tests und GitHub-Workflows müssen am finalen SHA geprüft werden; der ältere 18/18-Nachweis ist kein Ersatz.

## Nachtrag: Code-HEAD `f2ca109737f262149b7f64801496c08abe7fd928` (22.11.2026)

- Neue Main-Connect-Dashboard-Integration, Readonly-Termine, DE/EN-Deadline-Beschriftungen und source-aware Checkbox-Accessibility, Verleih-Dropdowns mit unveränderten Werten, lokalisierte ICS-/Budgetvalidierung. Keine Produktivdaten-/Produktionsaktion.
- **Nachgewiesen:** [223/223 i18n-Node-Tests auf diesem Code-HEAD](https://github.com/duhrrom11/toolya/actions/runs/44993279217). [6/6 gezielte Chromium-Tests auf Vorgänger `930d21d3`](https://github.com/duhrrom11/toolya/actions/runs/44992912002). Die vollständige CI-Matrix dieses neuen Codes war beim Schreiben noch nicht abgeschlossen; niemals ältere 18/18 als automatisch aktuelle Freigabe behandeln.
- [Einzelansichten und geschützte Release-Gates](i18n-release-checklist.md). **NOT READY / PR Draft**; 34 partielle Ansichten, 48 Dateien, Auth-Mail-E2E, vollständige Exporte und Screenreader-Abnahme bleiben offen.

## Nachtrag: CI-Abgleich auf HEAD `2725d849e29ce49b830f0e4c96d0087a3c10f4ce`

Zum Wiederaufnahmezeitpunkt waren **15/16 aktuelle GitHub-Actions-Läufe erfolgreich abgeschlossen**, ein vollständiger isolierter Chromiumlauf ([#44993409442](https://github.com/duhrrom11/toolya/actions/runs/44993409442)) noch in Bearbeitung. Der aktuelle statische i18n-Lauf ([#44993409414](https://github.com/duhrrom11/toolya/actions/runs/44993409414)) war erfolgreich. Die 223/223 Node-Tests wurden auf dem unmittelbar vorherigen Code-HEAD nachgewiesen; kein unbestätigter Browserlauf wird als grün eingetragen.

Branch liegt 0 Commits hinter main; die 34 Ansichts- und 48 Runtime-Auditpunkte sowie Auth-Mail, PDF/QR/Druck und Screenreader sind weiterhin **nicht abgenommen**. Status bleibt **NOT READY / Draft**. Dieser Dokumentationsnachtrag ist selbst kein neuer Testlauf.
