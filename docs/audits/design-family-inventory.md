# Toolya – P1-Designfamilien und nächste Arbeitseinheiten

Stand: 16.11.2026 nach PR #93/#94. Lesende Quellcodeprüfung aller 38 HTML-Dateien; keine vollständige Funktions-/Designabnahme daraus ableiten.

| Familie | Seiten | Basis | Nächster sicherer Harmonisierungspunkt |
|---|---:|---|---|
| Startseite | 1 | B3, toolya-home.css, Plattform | Bestehenden Aufbau bewahren, nur gemeinsame Komponenten |
| Persönliches Dashboard | 1 | dashboard.css, Plattform | Eigenen Header gegen gemeinsame Tokens prüfen |
| Rechtstexte | 2 | Tailwind, alpha.css, Plattform | Dokumentheader/Marke; Textinhalt erst P3 |
| Maskottchengalerie | 1 | Inline-CSS, Plattform über gallery.mjs | Gemeinsamer öffentlicher Header, Galeriebedienung erhalten |
| Admin-Statistik | 1 | stats.css, keine Plattform | Markentokens gezielt integrieren; Adminschutz erhalten |
| B3-Tools | 10 | Tailwind, helferlein-b3.css, Themen-CSS | Buttons/Formulare/Karten über vorhandene Variablen harmonisieren |
| Nachlass Besitzer/Erben | 2 | estate-app.css, estate-theme.js, Plattform | Türkise Grundfarben/Light und ein Footer verifiziert (#93); übrige Navigationsharmonisierung bleibt D05b |
| Nachlass Dateiübergabe | 1 | Helles Inline-Grunddesign, gemeinsame Plattform | Light/Styles und Datenverbindungsgrenzen verifiziert (#94) |
| Schlüsseldruck | 1 | estate-print.css, estate-print-ready.js | Bewusst isoliert; keine Analytics-/Plattform-/Bildimporte |
| Aktuelle öffentliche Wishlist | 1 | Umfangreiches Inline-CSS, Plattform | Eng begrenztes Stylesheet für Formulare/Karten |
| Wishlist-Einstieg | 1 | Auth-Weiterleitung, Plattform | Funktion erhalten, keine zusätzliche Ansicht |
| Alte Wishlist-Familie | 16 | Inline-CSS, alpha.css, teilweise workspace.css | Produktbedeutung klären; danach Light-Mode/Navi harmonisieren |

35 Seiten laden platform.mjs direkt, die Galerie indirekt (36/38 effektiv). Nur Admin und Schlüsseldruck ohne Plattform. 38/38 HTML-Dateien nach PR #91 ohne maximale Zoom-/user-scalable-Sperre (Quellcodebefund).

Die 16 älteren Wishlist-Seiten enthalten automatische Dark-Mode-Regeln: assistant, bookmarks, cockpit, collection, dashboard, discover, feed, gift-analytics, gift-tasks, notifications, occasions, planner, profile, report, reservations, social. Ihre Existenz ist keine Freigabe zur Löschung. B3-/Estate-Dark-CSS ist teils durch Light-erzwingende Skripte inaktiv; nicht mit tatsächlich aktivem Dunkelmodus gleichsetzen.

## Besondere Sicherheitsgrenze

Das Ausgangsproblem von handover.html (dark und blockierte gemeinsame CSS-Dateien) ist in #94 behoben. style-src erlaubt nun zusätzlich self für feste eigene Stylesheetpfade; connect-src none und alle anderen CSP-Direktiven bleiben erhalten. Eigene statische GETs sind weiterhin möglich, keine absolute Netzwerklosigkeit behaupten. Die lokale Übergabe und print-key.html initialisieren keine Analytics-Ereignisse/Skripte, selbst bei gespeicherter Zustimmung. Krypto-Code unverändert, synthetischer Dateirundlauf und Request-Prüfung erfolgreich. print-key.html bleibt isoliert und wurde nicht geändert.

## Konkrete nächste P1-Einheit

D06b: die zehn B3-Tools über ihre bestehenden Variablen und klaren Komponenten harmonisieren. `assets/helferlein-b3.css` verwendet noch grüne --b3-accent/#16843d und --b3-accent-2/#75d858; lokale Toolklassen können das überlagern. Aktive Primär-/Sekundär-/Gefahrzustände zuerst erfassen, dann gemeinsame türkise Tokens anwenden. Auth-/Speicherschutz und rote Warnaktionen erhalten. Isolierte echte Toolansichten statt Startseiten-Redirects prüfen. Danach Legacy-Wishlist/Dashboard und Infoseiten; kein vorgezogener SEO-/Textumbau.

Zusätzlich als weitere Optimierung erfasst: mascots.html lädt Consent klassisch und über das Plattformmodul. Bei gespeicherter Zustimmung ist eine doppelte Analytics-Initialisierung aus dem Code wahrscheinlich. Separat mit gezielter isolierter Regression bestätigen; keine pauschale Änderung der Einwilligungsregel.

### Release #96 abgeschlossen

Gemeinsame B3-Komponenten am 17.11.2026 veröffentlicht, Release `5ab8a9334692acbd7206553f9d8f7b3fa376cfbe`. Zwölf isolierte Ansichten tatsächlich gesichtet; Pages und alle main-Checks erfolgreich. Öffentlich ausgeliefertes CSS bytegleich, Auto/Budget liefern HTTP 200 mit Stylesheetverweis. Details: `pr96-live-delivery.json` und Master-Audit. Gewöhnliche App-Buttons, übrige B3-/Wishlist-/Dashboard-Ansichten und volle responsive/private Live-Abnahme bleiben offen.


### Auto/Haushaltsbuch – Teilabnahme #98 (17.11.2026)

Normale App-Aktionen verwenden gemeinsame Primär-/Sekundärklassen und Schrift. Auto-Erfassungs-/Listenraster bis 1279 px untereinander; Haushaltsbuch-Finanzdetails ab 768 px in drei Spalten. Mobile KM-Karte und Auto-Dialogbuttons korrigiert. 18 tatsächliche Bildausschnitte gesichtet, 47 Browserprüfungen und sechs Checks auf a4494d15308eae996766cdf323ac21255b9a910c erfolgreich. Nachweise: `pr98-visual-review.json`, `evidence/pr98-*.jpg`; Veröffentlichungsstatus und Live-Hashes in PR [#98](https://github.com/duhrrom11/toolya/pull/98). D06b/D05b bleiben In Arbeit; nächste Tools Umzugskisten/Verleih, danach restliche Familien. Keine vollständige private Live-/Diagrammabnahme.

## P1 – Umzugskisten und Verleih: visuelle Teilabnahme PR #99

Stand 17.11.2026, Produktstand `8589dca643e8d8f69754475295aaaf0e7d40a001`, PR [#99](https://github.com/duhrrom11/toolya/pull/99). Sechs Checks erfolgreich (platform, estate-security, isolated-browser-tests, isolated, privacy, Two-context Chromium / no production data). Browserlauf [43989548520](https://github.com/duhrrom11/toolya/actions/runs/43989548520): 49/49 bestanden. Nach diesem Produktstand ausschließlich Audit-/Bildnachweise ergänzt; finale Commitprüfungen und Veröffentlichung werden im PR mit Releasecommit, Pages-Lauf und Live-Hashprotokoll dokumentiert.

**Nachweislich bestätigt:** 30 aufgenommene Ausschnitte (28 unterschiedliche JPEG-Payloads) tatsächlich gesichtet: Einrichtung, Erfassung, Liste, Dialog oben und Dialogaktionen für beide Tools bei 320/768/1440 px. Primäraktionen türkis, Nebenaktionen hell, gemeinsame Schrift/Fokusgestaltung, mindestens 44 px für geprüfte Aktionsbuttons, Primärkontrast >=4,5 und kein horizontaler Seiten-/Dialogüberlauf in den geprüften Zuständen. Dynamische Bearbeitungsaktionen öffnen die echten Dialoge. Keine Browserfehler und null Schreibvorgänge in diesen beiden Design-Fixtures.

Umzugskisten: äußeres Raster unter 1280 px einspaltig; Standortfelder mobil untereinander, Inventarfilter mobil einspaltig und ab 768 px dreispaltig. Unterartikel-/Dialogaktionen umbrechbar, Dialog intern scrollbar. Verleih: Setupkarten auf Tablets nebeneinander und oberhalb des Erfassungsformulars, auf Desktop bestehende Aufteilung erhalten; Datumsfelder mobil untereinander und Aktionsleisten umbrechbar. Bei erster Sichtung trotz grüner Tests erkannte zu schmale mobile Kistenfilter und 16-px-Versatz der Verleihkarten korrigiert; zusätzliche Breiten-/Positionsprüfungen bestehen. Alle finalen Bildpayloads erneut gesichtet.

**Belege und Grenzen:** [pr99-visual-review.json](pr99-visual-review.json), 30 Bildpfade unter `evidence/pr99-*.jpg` mit dokumentierten Duplikaten. HTML einschließlich dynamischer Vorlagen ist nach Ausblenden sämtlicher Klassenattribute identisch zum Ausgangsrelease ea91589862bceca00b2fc8a496827b1a90f25a94. Keine Handler-/ID-/Text-/Auth-/Datenänderungen und keine Originalassets geändert. Synthetische Cloud-Snapshots, abgefangene Anmeldung/Cloud-Anfragen, tatsächliches Tool-HTML; vorhandenes Tailwind-Darstellungs-CSS erlaubt. Englische native Datum-/Dateifelder stammen aus der Testumgebung. Keine Produktionskonten/-daten/-schreibzugriffe. Kamera, QR-Erzeugung, externe Kalender/GPS-Ziele und private produktive Gesamtabläufe sind hier nicht abgenommen; keine vollständige WCAG-Prüfung.

**Veröffentlichung:** Der main-Releasecheck vergleicht gemeinsames B3-CSS, buddy.mjs sowie CSS und HTML von Auto, Haushalt, Umzug und Verleih bytegenau mit toolya.app (zehn Dateien). Tatsächliche Ergebnisse nach Merge im dauerhaft verlinkten PR #99 und Plattform-Job (`B3_LIVE_DELIVERY`); die visuellen Nachweise stammen aus isoliertem Chromium, keine Behauptung einer angemeldeten Live-Sichtprüfung. Rollback: gezielter Revert des Releasecommits, keine Datenbankmigration.

**Fortsetzung:** D06b/D05b bleiben In Arbeit. Vier der zehn regulären B3-Tools in diesem App-Aktions-/Formularpaket visuell geprüft; sechs weitere sowie Wishlist/Dashboard und weitere Familien bleiben offen. Nächste konkrete P1-Einheit: Zählerstände und Pflanzenpflege. Kein regulärer P2-/P3-Umbau vor P1-Abschluss. Gewichteter Dashboardstand unverändert: Bestandsaufnahme 5/8 (62,5 %), P1 9/17 (52,9 %), P2 0/9, P3 0/8, weitere 0/10. Insgesamt 9/24 Aufgaben verifiziert, 15 nicht abgeschlossen. Teilabnahme ersetzt keinen Abschluss der größeren Aufgaben. Dieser Abschnitt ist der aktuelle Fortsetzungsstand; ältere nächste Schritte sind historische Zwischenstände.
