# Toolya DE/EN – Technische Release-Checkliste

**Code-HEAD:** `f2ca109737f262149b7f64801496c08abe7fd928` · [PR #291 (Draft)](https://github.com/duhrrom11/toolya/pull/291) · **Status: NOT READY.** Kein Merge nach main, kein Deployment, kein noindex-Wechsel.

Diese Checkliste erfasst die 34 durch den automatischen i18n-Audit als nur teilweise lokalisiert markierten Ansichten. Die Markierung ist ein Review-Auftrag: vorhandene Regressionstests sind nicht mit vollständiger Sprach-/Funktionsabnahme gleichzusetzen. Nutzerdaten und gespeicherte Statuscodes dürfen durch Übersetzungen niemals verändert werden.

## 1. Ausstehende Ansichtsabnahmen (34)

| Bereich | Ansicht | Release-Abnahme |
| --- | --- | --- |
| Haupttools | `tools/moving/index.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Haupttools | `tools/housemates/index.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Haupttools | `tools/plants/index.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Haupttools | `tools/baking/index.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Haupttools | `tools/budget/index.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Haupttools | `tools/car/index.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Haupttools | `tools/loans/index.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Haupttools | `tools/meters/index.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Haupttools | `tools/parking/index.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Haupttools | `tools/pet-health/index.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Wunschlisten | `tools/wishes/public.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Wunschlisten | `tools/wishes/dashboard.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Wunschlisten | `tools/wishes/collection.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Wunschlisten | `tools/wishes/discover.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Wunschlisten | `tools/wishes/feed.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Wunschlisten | `tools/wishes/planner.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Wunschlisten | `tools/wishes/profile.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Wunschlisten | `tools/wishes/occasions.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Wunschlisten | `tools/wishes/reservations.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Wunschlisten | `tools/wishes/assistant.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Wunschlisten | `tools/wishes/bookmarks.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Wunschlisten | `tools/wishes/cockpit.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Wunschlisten | `tools/wishes/gift-analytics.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Wunschlisten | `tools/wishes/gift-tasks.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Wunschlisten | `tools/wishes/notifications.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Wunschlisten | `tools/wishes/report.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Wunschlisten | `tools/wishes/social.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Nachlass | `tools/estate/index.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Nachlass | `tools/estate/heirs.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Nachlass | `tools/estate/handover.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Nachlass | `tools/estate/print-key.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Dashboard und Admin | `dashboard/index.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Dashboard und Admin | `admin-stats-dashboard/index.html` | Teilübersetzung · End-to-End-Abnahme offen |
| Dashboard und Admin | `admin-stats-dashboard/wishlist-finder.html` | Teilübersetzung · End-to-End-Abnahme offen |

Für **jede** der 34 Ansichten vor technischer Freigabe prüfen: vollständige DE/EN-Formulare, dynamische Fehler/Erfolge/Leerzustände, Authentifizierung, CloudOnly-Snapshots ohne Schreibzugriff beim Sprachwechsel, Datums-/Zahlen-/Währungsformate, sichere Freitexte, Exporte, 320px-Mobilansicht, Tastatur und Screenreader. Mit synthetischen Fixtures testen, keine Produktivnutzer/Produktivdatensätze.

## 2. Gemeinsame Release-Gates

- [x] Alle 72 HTML-Seiten besitzen einen EN-Einstieg oder eine englische Route; laut automatischem Audit keine vollständig fehlende EN-Abdeckung.
- [x] Der aktuelle Code hat **223/223 Node-i18n-Tests bestanden**, [GitHub Actions #44993279217](https://github.com/duhrrom11/toolya/actions/runs/44993279217).
- [x] Auf dem vorherigen Code-HEAD `930d21d3` liefen sechs gezielte mobile Chromium-Regressionen erfolgreich, [GitHub Actions #44992912002](https://github.com/duhrrom11/toolya/actions/runs/44992912002).
- [x] Der neueste Hauptbranch mit Connect-Fälligkeiten ist in den Entwicklungsbranch integriert, ohne Merge nach main.
- [x] Die 17 englischen öffentlichen Seiten behalten bis zur ausdrücklichen geschützten Freigabe `noindex`.
- [ ] Alle 34 Ansichten fachlich vollständig auf DE und EN geprüft, einschließlich nicht sichtbarer Zustände und Accessibility-Texte.
- [ ] 48 heuristisch gefundene Dateien mit möglichen deutschen Laufzeitmeldungen einzeln triagiert; echte Fehler abgestellt, Fehlalarme dokumentiert.
- [ ] Isolierte Registrierung, Anmeldung, Abmeldung, Sitzungslaufzeit, Nutzerwechsel, Race Conditions und echter Passwort-Recovery-Mailrückweg end-to-end.
- [ ] Alle betroffenen PDF-/ICS-/CSV-/QR-/Druck-/Backup-Ausgaben mit realen Download-/Druckmechanismen und synthetischen Daten geprüft.
- [ ] Mobile Browser und reale Screenreader-/Tastatur-Akzeptanz für alle 34 Ansichten; responsive Darstellung und Kontrast.
- [ ] Relevante Sicherheit/CloudOnly/Datenintegrität inklusive XSS, benutzergenerierten Titeln und Versionskonflikten für alle betroffenen Flows abgenommen.
- [ ] Sämtliche notwendigen Node-/Chromium-/Plattform-/Connect-GitHub-CI-Läufe am **abschließenden Code-HEAD** grün.
- [ ] Veröffentlichung vorbereitet und dann erst **READY FOR RELEASE APPROVAL**; PR bis dahin Draft.
- [ ] Geschützte Freigabe für Merge, Produktionsdeployment und gegebenenfalls noindex-Entfernung durch den Nutzer – **nicht Teil dieser technischen Entwicklung**.

## 3. Wiederaufnahme

Als Nächstes die zehn Haupttools gezielt fertigstellen, dann 17 Wunschlisten-Ansichten, vier Nachlassansichten sowie Dashboard und zwei Adminansichten. Pro abgeschlossenem Teilbereich konkrete DE/EN-Testnachweise ergänzen und Status erst nach tatsächlicher Ausführung ändern. Parallel Auth-Recovery in einer getrennten Testumgebung, Exporte und A11y vervollständigen. Aktuelle Ergebnisse in [Fortschritt](i18n-release-progress.md) und [Release-Bericht](i18n-release-report.md) abgleichen.
