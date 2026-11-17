# Toolya – gewichtete Roadmap

Stand: 17.11.2026. Status: Offen → In Arbeit → Umgesetzt → Verifiziert; Blockiert benennt konkrete fehlende Voraussetzungen.

Gewicht = relative Arbeitsgröße (1 klein, 2 mittel, 3 groß, 5 sehr groß), keine Qualitätsnote. Fortschritt = Summe der Gewichte **verifizierter** Aufgaben / Summe aller erfassten Gewichte des Bereichs. In Arbeit/Umgesetzt zählen noch nicht. Unteraufgaben werden nicht doppelt gezählt.

## Maßnahmen

| ID | Kategorie | Gewicht | Seite/Komponente | Ist | Soll | Umsetzung | Aufwand | Abhängigkeiten | Risiko | Status | Nachweis |
|---|---|---:|---|---|---|---|---|---|---|---|---|
| I01 | Bestandsaufnahme | 2 | Repository/Branches/CI | 38 HTML, 93 Branches, 3 offene PRs erfasst | Architektur und offene Änderungen nachvollziehbar | Inventar und PR-Abgleich dokumentieren | 1 h | GitHub | niedrig | Verifiziert | clone; runs 43921114382/304/071; PR-Suche |
| I02 | Bestandsaufnahme | 2 | Supabase/Analytics | Projekte und RLS-Metadaten geprüft | Verwendetes Backend und Zugriffsumfang erfassen | Metadaten, Advisors und Analytics-Projektzuordnung prüfen | 2 h | Supabase/Amplitude | mittel | Verifiziert | security-inventory.md; Amplitude default erreichbar, Toolya-Zuordnung nicht bestätigt |
| I03 | Bestandsaufnahme | 3 | Alle Seiten live | 38 HTTP-Routen; öffentliche Kernseiten, Nachlass-Login/Erben und Auth-Umleitung geprüft | 38 Routen klassifiziert und erreichbare Ansichten geprüft | Öffentliche Seiten, Sonderseiten und Auth-Zustände erfassen | 3 h | Browser/Anmeldesitzung | mittel | In Arbeit | page-inventory.json; Screenshots 01/02 |
| I04 | Bestandsaufnahme | 1 | Markenentscheidungen | Aktueller Auftrag, AGENTS und Roadmap abgeglichen | Kein Verlust verbindlicher Vorgaben | Aktuellen Footerauftrag und Originalassets festhalten | 0,5 h | Originalassets | niedrig | Verifiziert | AGENTS.md; Masterauftrag |
| D01 | P1 – Design | 2 | Footer/Consent | Widerrufslink geht auf Startseite verloren; 2 Footer auf privacy | Ein Footer mit dauerhaftem Widerrufslink | Link beim Austausch bewahren und nach spätem Mount einhängen | 1 h | platform.mjs; consent.js | mittel | Verifiziert | Live DOM; Screenshot 02; mountFooter/init |
| D02 | P1 – Design | 2 | Wortmarke/Token | Schriftfamilie wird seitenabhängig geerbt | Identische Markenfamilie/Gewicht/Abstände | Gemeinsame Tokens aus bestehender Startseite übernehmen | 1 h | platform/header/footer CSS | niedrig | Verifiziert | Live computed styles Inter vs ui-sans |
| D03 | P1 – Design | 1 | Pflanzen/Tier-Header | Grüne Themenfarben | Bläuliches Türkis unabhängig von Charakter | Nur vorhandene Themenvariablen korrigieren | 0,5 h | header.css | niedrig | Verifiziert | header.css data-tool=plants/pet-health |
| D04 | P1 – Design | 2 | Ko-fi/Footer-CSS | Doppelte konkurrierende Regeln/Keyframes | Eine wartbare aktive Definition | Aktuelles Rendering erhalten, Altdefinition entfernen | 1 h | footer.css; platform.mjs | mittel | Verifiziert | Zwei ty-kofi-banner-Regelgruppen |
| D05a | P1 – Design | 1 | Lokale verschlüsselte Dateiübergabe | Dunkles Inline-Design und gemeinsame CSS durch CSP nicht nutzbar | Helle gemeinsame Gestaltung mit erhaltenen Daten-/Kryptogrenzen | Nur eigene Stylesheets erlauben; lokale Übergabe von Analytics ausschließen; synthetischen Dateirundlauf prüfen | 3 h | CSP-Prüfung; bestehende Krypto | mittel | Verifiziert | PR #94; CI 43933662418; Pages 43934169905; Live-DOM/Styles und Bytegleichheit bestätigt |
| D05b | P1 – Design | 4 | Übrige Seiten/responsive | Nicht vollständig visuell geprüft; Legacy-Wishlist/Dark-CSS | Gemeinsame Marke, keine Überläufe, Hellmodus | Ansichten 320/768/1440 und Tastatur systematisch prüfen | 1–2 Tage | I03; isolierte Auth-Fixtures | mittel | In Arbeit | page-inventory.json; Legacy-Seiten; Auto-/Haushaltsbuch-Formularbreiten in Prüfung |
| D06a | P1 – Design | 1 | Nachlass Besitzer/Vertrauenspersonen | Grüne UI-Flächen und inaktive Dark-CSS-Reste, zusätzlicher alter Footer bei Erben | Gemeinsame türkise Bedienelemente im Hellmodus, ein Footer mit erhaltenem Schlüsselhinweis | Estate-CSS mit vorhandenen Tokens verbinden; Footerhinweis in main erhalten | 2–4 h | D02; isolierte Nachlass-Prüfung | mittel | Verifiziert | PR #93; CI 43932478466; Pages 43933043137; Live-Farben/Footer und Bytegleichheit bestätigt |
| D06b | P1 – Design | 2 | B3/Wishlist/Dashboard Formulare/Karten/Dialoge | Weitere historisch getrennte UI-Systeme | Konsistente Zustände und Eingaben | Übrige bestehende UI schrittweise mit Tokens verbinden | 1–2 Tage | D02; echte Ansichten/isolierte Fixtures | mittel | In Arbeit | B3, Wishlist, Dashboard Styles; erstes gemeinsames Kontrollpaket im Prüfbranch |
| D07 | P1 – Design | 2 | Öffentliche Infoseiten | Eigener Header und zusätzliche Begleiterkarte | Einheitliche gemeinsame Navigation/Marke | Rechtsseiten/Galerie an vorhandene Komponenten anschließen | 2 h | D02 | niedrig | Offen | Screenshot 02-privacy-before |
| S01 | P2 – SEO | 3 | Indexierung/Metadaten | Private Legacy-Seiten teils ohne noindex/canonical | Bewusste Indexierungsstrategie je Route | robots/sitemap/canonical und Auth-/Public-Seiten abgleichen | 3 h | P1-Abnahme | mittel | Offen | SEO-Inventur |
| S02 | P2 – SEO | 3 | 12 Tools/Suchintention | Keine aktuelle vollständige Zuordnung | Eindeutige Themen und sinnvolle verlinkte Erklärungen | Keyword-/Seitenmatrix auf vorhandene Funktionen stützen | 4 h | P1; verfügbare SEO-Daten | niedrig | Offen | SEO-Fachanhang in Erstellung |
| S03 | P2 – SEO | 3 | Performance/Schema/Social | Keine aktuellen CWV-Baselines; Metadaten teils veraltet | Korrekte Angaben, belastbare Baseline | Bilder/CDNs/schema prüfen; Messung ohne erfundene Werte | 4 h | P1; Messwerkzeuge | mittel | Offen | Quellcode; keine Rankingdaten erhoben |
| C01 | P3 – Inhalte | 3 | FAQ/Anleitungen | Anmeldung und lokale Speicherung widersprüchlich | Texte erklären tatsächlich vorhandene Abläufe | Alle Tools gegen aktuelle Funktionen abgleichen | 1 Tag | P2-Abschluss | mittel | Offen | index FAQ und Auth-Gate |
| C02 | P3 – Inhalte | 3 | Datenschutz/Impressum | Firebase-Tresor und optionales Konto veraltet | Technisch korrekter prüfpflichtiger Entwurf | Dienste/Fakten erfassen; fehlende Rechtspflichtangaben markieren | 4 h | C01; Betreiberangaben/juristische Prüfung | hoch | Offen | privacy.html Abschnitte 3/4 |
| C03 | P3 – Inhalte | 2 | Plattformtexte | Alte Namen und teils technische Nutzertexte | Einheitliche verständliche Sprache | Buttons, Fehler, Leerzustände und Hilfen prüfen | 4 h | C01 | niedrig | Offen | Noch keine vollständige Textabnahme |
| X01 | Weitere Optimierungen | 3 | RLS/RPC/Sicherheit | Advisors und Metadaten untersucht, kein bestätigter P0 | Owner-/Rollen-/Speichergrenzen wirksam | Gezielte isolierte Negativtests und Rechteprüfung | 1 Tag | Supabase; isolierte DB | hoch | In Arbeit | Sicherheitsfachanhang in Erstellung |
| X02 | Weitere Optimierungen | 2 | WG-Speichern | Client UPDATE, live keine UPDATE-Spaltenrechte | Eigene Inhalte speichern, owner_id unveränderbar | Isoliert reproduzieren und minimalen Rechtefix vorbereiten | 3 h | X01 | hoch | Offen | Live has_column_privilege; housemates client |
| X03 | Weitere Optimierungen | 2 | Öffentliche Profile | Public SELECT auch ohne Veröffentlichung | Veröffentlichungsabsicht und sichtbare Daten stimmen überein | Policy/Produktentscheidung und Datenminimierung prüfen | 3 h | X01; Wishlist-UI | hoch | Offen | Live wishlist_profiles policy |
| X04 | Weitere Optimierungen | 2 | Abschluss/Monitoring | Alte Releaseberichte, noch kein aktueller Gesamtnachweis | Aktueller Release und offene Grenzen dokumentiert | CI/Pages/live bytegleich prüfen und Backlog aktualisieren | 2 h | Arbeitspakete abgeschlossen | mittel | Offen | docs/TOOLYA-RELEASE-STATUS historisch |
| X05 | Weitere Optimierungen | 1 | Galerie/Analytics | Consent klassisch und als Modul geladen | Einmalige Initialisierung je Seitenaufruf | Doppelladung isoliert bestätigen und idempotent absichern | 1 h | mascots.html; Consent | mittel | Offen | Unabhängige Codeprüfung; noch kein Laufzeitnachweis |

## Reihenfolge

1. I01–I04 Bestandsaufnahme vertiefen; D01 als belegten Montage-/Widerrufsfehler vorziehen.
2. D01–D04 gemeinsamer Footer/Marke; danach D05a/D05b, D06a/D06b und D07 vollständige Designabnahme.
3. Erst dann S01–S03; anschließend C01–C03.
4. X01–X03 nach Risiko prüfen; ein belegter kritischer Fehler darf vorgezogen werden.
5. X04 und Release-Nachweise laufend pro Paket aktualisieren.

## Fortschritts-Dashboard

| Bereich | Verifiziert/Gesamtgewicht | Fortschritt | Status |
|---|---:|---:|---|
| Bestandsaufnahme | 5/8 | 62,5 % | In Arbeit |
| P1 – Design-Konsistenz | 9/17 | 52,9 % | In Arbeit |
| P2 – SEO | 0/9 | 0 % | Offen |
| P3 – Inhalte & Rechtstexte | 0/8 | 0 % | Offen |
| Weitere Optimierungen | 0/10 | 0 % | In Arbeit |

24 übergeordnete Aufgaben: 9 verifiziert, 15 nicht abgeschlossen. Die Aufteilungen D05 → D05a (1) + D05b (4) und D06 → D06a (1) + D06b (2) verändern das Gesamtgewicht nicht. Keine globale Prozentzahl für den noch wachsenden Prüfumfang.

## Fortsetzungsstand

Aktuelle Phase: P1 – Designharmonisierung. Bestandsaufnahme läuft hinsichtlich vollständiger Browserabnahme weiter. PR [#91](https://github.com/duhrrom11/toolya/pull/91) gemergt; Releasecommit `1b611811afddef8bd0da78da00ba50c66cd896ea`, Pages [43928099016](https://github.com/duhrrom11/toolya/actions/runs/43928099016) erfolgreich. D01–D04 im Code, auf main und live bestätigt. 75 Node-Tests, sechs PR-Checks, neue Vier-Seiten-/Drei-Breiten-Prüfung und Originalasset-Hashes bestanden. Details und Grenzen im Master-Audit.

D06a abgeschlossen: PR [#93](https://github.com/duhrrom11/toolya/pull/93), Release `384d5856578e578934a82168639969b2bfa41eb7`, erfolgreicher PR-Lauf 43932478466 und Pages 43933043137. Farben, Light-Mode, ein Footer und erhaltener Schlüsselhinweis live bestätigt; CSS und heirs.html bytegleich. Geöffnete Oberflächen ausschließlich synthetisch geprüft.

D05a abgeschlossen: PR [#94](https://github.com/duhrrom11/toolya/pull/94), Release `d055c155e00a02e74ae5804d6066820dd9106ed1`, erfolgreiche PR-CI 43933662418 und Pages 43934169905. main-CI 43934172697, Amazon 43934172716 und isolierte Browser 43934172711 ebenfalls erfolgreich. Helles Design, ein gemeinsamer Footer, eigener Stylesheetzugriff und keine Analytics-Initialisierung live bestätigt; Consent-JS/handover.html live bytegleich. Alle elf Krypto-Bedienelemente und assets/heir-e2ee-handoff.js unverändert. Realer Dateirundlauf ausschließlich mit synthetischen Dateien im isolierten Runner geprüft.

Historischer Plan vor PR #96: D06b/B3 – `assets/helferlein-b3.css` und die überlagernden Tool-Styles der zehn regulären B3-Tools auf bestehende Marken-Tokens, Buttons/Formulare/Karten und Fokuszustände abstimmen. Vor Änderungen aktive grüne Klassen und dynamische Auswahlzustände erfassen; rote Warn-/Löschaktionen bewahren. Mit gezielten authentifizierten Fixtures tatsächliche Toolansichten prüfen, keine Startseiten-Redirects als Toolabnahme zählen. Danach übrige Wishlist-/Dashboard-Stile und D07/Infoseiten. D05b enthält weiterhin die vollständige responsive Abnahme sowie die sekundäre doppelte Wortmarke auf der Erbenseite. Noch keine reguläre SEO-/Textumsetzung beginnen.

Die [Designfamilienmatrix](design-family-inventory.md) ist fortgeschrieben. Zwei veröffentlichte Produktpakete dieser Fortsetzung: #93 und #94. Rollback jeweils per gezieltem Revert des Releasecommits; keine Datenbankmigration in beiden Paketen.

Private Live-Flows sind mangels bestätigter Anmeldesitzung nicht vollständig abgenommen; isolierte/synthetische Prüfungen sind kein Ersatz für alle produktiven Ansichten. Alte Wishlist-Seiten nicht ungeprüft entfernen. Keine juristische Freigabe. Keine produktiven Nutzerdaten geändert.

Geänderte Produktdateien in PR #91: `assets/toolya-consent.js`, `shared/toolya/platform.mjs`, `shared/toolya/tokens.css`, `shared/toolya/footer.css`, `shared/toolya/header.css`, `privacy.html`, `legal.html`. Dazu gezielte Browserregressionen und Audit-Dokumente. Rollback: gezielter Revert des genannten Releasecommits; keine Datenbankmigration erforderlich.

## P1-Fortsetzung 17.11.2026 – gemeinsames B3-Kontrollpaket

PR #95 mit dem bisherigen Releaseprotokoll nach erfolgreicher CI gemergt (`4c9cc38ec699440db66af3ca0540f53a1aee172e`); Pages 43976906485 erfolgreich.

D06b in Arbeit: gemeinsame B3-Navigation, Dashboard-Editor und Formulargeometrie an vorhandene Marken-Tokens angebunden. Themenfarben bleiben auf den Header beschränkt; bestehende Warnaktionen und App-/Auth-/Cloud-Logik werden nicht geändert. Tastaturfokus, deaktivierte Zustände und reduzierte Bewegung sind berücksichtigt. Repräsentative echte Auto-/Haushaltsbuch-Ansichten werden über isolierte Auth-/Cloud-Fixtures bei 320/768/1440 geprüft; vorhandenes Tailwind-Darstellungs-CSS ist für diese Designprüfung ausdrücklich zugelassen. Keine produktiven Konten oder Daten.

Geänderte Dateien: `assets/helferlein-b3.css`, `tests/browser/tool-pages-ui.spec.cjs`, `.github/workflows/toolya-browser-tests.yml` und diese Roadmap. Browsernachweise werden jetzt auch bei erfolgreicher CI als Artefakt aufbewahrt. Die lokale Ausführungsumgebung und ein interaktiver Browser stehen derzeit nicht zur Verfügung; daher ist die Sichtprüfung dieses Pakets noch offen. Bis zu CI- und visueller Abnahme keine Veröffentlichung dieses neuen Pakets behaupten. D06b bleibt unvollständig; Gewicht und Fortschritt unverändert (9/17, 52,9 %). Weitere Tool-Overrides, primäre App-Buttons, Karten sowie Wishlist/Dashboard folgen separat.

Nächste Aktion: aktuellen PR-Commit prüfen, CI-Fehler ggf. korrigieren, erzeugte Screenshots sichten; erst danach Merge und Pages-/Live-Verifikation. Bei nicht verfügbarer Sichtprüfung Branch erhalten. Rücknahme vor Merge durch Verwerfen des Branches möglich; keine Migration.

Sichtprüfung PR [#96](https://github.com/duhrrom11/toolya/pull/96), 17.11.2026: bisheriger Produktstand `a74b535a4b745145215eb9225de12808e7079dca` mit fünf grünen Checks und 47/47 Browserprüfungen. Lokale Laufzeit weiterhin nicht verfügbar. Als gezielte Alternative liefern die zwei isolierten Design-Fixtures auf Entwurfs-PRs kompakte JPEG-Ansichten über CI-Diagnoselogs; keine echten Konten, Nutzerdaten oder externen App-Anfragen. Vollständige PNG-Nachweise bleiben im Actions-Artefakt. Nächster Schritt: diese Bilder tatsächlich sichten, Ergebnis dokumentieren, erst danach integrieren. Noch keine zusätzliche Aufgabe abgeschlossen.

## P1 – visuelle Abnahme des gemeinsamen B3-Pakets, 17.11.2026

PR [#96](https://github.com/duhrrom11/toolya/pull/96): gemeinsame Navigation, Editor-Aktionen, Formulargeometrie und Fokuszustände. Produkt-CSS seit `a74b535a4b745145215eb9225de12808e7079dca` unverändert; `a292421f8030bd64d3c01a54926c89c21910bc90` ergänzt ausschließlich isolierte Bilddiagnostik und Dokumentation.

**Nachweislich geprüft:** Browserlauf [43978267219](https://github.com/duhrrom11/toolya/actions/runs/43978267219), 47/47 erfolgreich. Alle fünf Checks auf a292421 erfolgreich. Reale lokale Auto-/Haushaltsbuch-HTML-Seiten mit abgefangener Anmeldung/Cloud, bestehendem Tailwind-Darstellungs-CSS, ohne produktive Konten oder Daten. Je Tool drei Breiten (320/768/1440), je normale Seite und geöffneter Dashboard-Editor: alle zwölf JPEG-Ansichten tatsächlich gesichtet. Gemeinsame türkise Navigation, Editor-Primäraktion, weiße Sekundäraktionen, Umbruch, Fokus und deaktivierte Zustände ohne visuellen Blocker für dieses begrenzte Paket. Kontrast der geprüften primären Bedienelemente >=4,5, kein horizontaler Dokumentüberlauf und null Cloud-Schreibvorgänge automatisiert bestätigt. Bewegungsreduktion nach Korrektur der Hover-Spezifität bestanden.

Die Diagrammbibliothek bleibt in dieser synthetischen Prüfung inert; leere Diagrammflächen sind kein Nachweis eines Produktionsfehlers. Browser-Standardsprache erzeugt englische Datei-/Datums-Controls; keine Lokalisierungsabnahme daraus ableiten. Begrenzte Bildschirmhöhe: keine vollständige Sichtprüfung aller tieferen Toolabschnitte behauptet. Die vollständigen PNGs liegen im Actions-Artefakt; hier archivierte kompakte JPEGs zeigen die tatsächlich gesichteten Ausschnitte.

**Weiter offen:** Allgemeine App-Speicherbuttons sind noch uneinheitlich (Auto grau/rot, Haushaltsbuch teils grün). Diese gehörten nicht zu den gemeinsamen b3-action-Komponenten dieses Pakets. D06b bleibt In Arbeit, ebenso vollständige Prüfung der anderen acht B3-Tools und Wishlist/Dashboard; D05b bleibt offen. Keine Gesamt-WCAG-Abnahme oder produktive angemeldete Live-Abnahme behauptet.

Bildnachweise: `docs/audits/evidence/pr96-*.jpg` (zwölf Ansichten). Lokale Laufzeit bleibt nicht verfügbar; die vorherige Blockade der Bildsichtung wurde durch ausschließlich synthetische CI-Bilddiagnostik überwunden. Nächste Aktion: finalen Dokumentations-/Bildcommit prüfen; danach PR #96 mergen, Pages und ausgeliefertes CSS kontrollieren. Bis zum erfolgreichen Deployment ist dieses Paket noch nicht veröffentlicht. Fortschritt bleibt 9/17 (52,9 %), 9/24 Aufgaben verifiziert.

## Veröffentlichungsabschluss PR #96 – 17.11.2026

**Veröffentlicht und statisch live verifiziert.** Release `5ab8a9334692acbd7206553f9d8f7b3fa376cfbe`, PR [#96](https://github.com/duhrrom11/toolya/pull/96). Finale fünf PR-Checks auf `25cca1b516fec0b33bcd79b84f0c50fcf4771f5b` erfolgreich. GitHub Pages [43979209858](https://github.com/duhrrom11/toolya/actions/runs/43979209858) erfolgreich; main Plattform/Nachlass [43979210725](https://github.com/duhrrom11/toolya/actions/runs/43979210725), isolierte Browser [43979211283](https://github.com/duhrrom11/toolya/actions/runs/43979211283) und Amazon [43979210728](https://github.com/duhrrom11/toolya/actions/runs/43979210728) erfolgreich.

Schreibfreie Live-Prüfung am **17.11.2026, 00:27 Uhr Europe/Berlin** (UTC 2026-11-16T23:27:20.263Z): B3-CSS beim ersten Versuch bytegleich; SHA-256 `1631571945fd0555983ece99196d06ccc4ec126ad69eb12c6d3516f259e740ac`. Auto-/Haushaltsbuch-HTML jeweils HTTP 200 und Verweis auf gemeinsames Stylesheet bestätigt. Maschineller Nachweis: [pr96-live-delivery.json](pr96-live-delivery.json). Ausschließlich öffentliche statische GETs; keine Anmeldung, keine produktiven Daten oder privaten API-Aufrufe.

Die zwölf tatsächlich gesichteten isolierten Bildausschnitte sind dauerhaft unter `evidence/pr96-*.jpg` gespeichert. Das begrenzte gemeinsame Komponentenpaket ist abgenommen. **D06b bleibt In Arbeit**: normale App-Buttons, weitere Tool-Overrides, Karten, Wishlist/Dashboard und Prüfung der anderen acht B3-Tools stehen aus. Fortschritt weiterhin 9/17 = 52,9 %, insgesamt 9/24 verifiziert; keine künstliche Aufwertung durch Teilarbeit.

Nächste konkrete Aktion: normale Speicher-/Bearbeiten-Aktionen zunächst auf Auto/Haushaltsbuch anhand ihres Zwecks klassifizieren und harmonisieren (Speichern nicht mit Löschen/Alarm gleichsetzen). Auf 768 px sind die verschachtelten Auto-Formulare eng; breitere Eingaben/Unterteilung prüfen (D05b). Danach dieselben tatsächlichen Auth-Fixtures auf die übrigen B3-Tools erweitern. Keine reguläre SEO-/Textphase vor P1-Abschluss.

Rollback: gezielter Revert des obigen Releasecommits; keine Migration oder Datenrücksetzung erforderlich. Lokale Laufzeit/interaktiver Browser weiter nicht verfügbar, Bildsichtung über synthetische CI-Diagnostik möglich. Private Live-Zustände bleiben nicht vollständig verifiziert. Die vorherigen Abschnitte mit ausstehender Abnahme/Veröffentlichung dokumentieren historische Zwischenstände; dieser Abschluss ist für PR #96 maßgeblich.

### CI-Zeitfehler beim Abschlussprotokoll

Der erste Dokumentationslauf 43979589098 scheiterte an `core.test.mjs`, v8 Charakterwechsel: zwei Date.now()-Aufrufe in render(true) können die unveränderte Ablauffrist geringfügig verlängern. Im selben PR wird die absolute Frist erhalten und pro Render nur einmal die Zeit abgelesen. Der bestehende Test verwendet eine kontrolliert bei jedem Aufruf fortschreitende Uhr und verlangt exakt gleiche Frist; die Prüfung wird nicht gelockert. Zusätzlich prüft der schreibfreie main-Releasecheck das ausgelieferte buddy.mjs bytegenau. Keine Auth-/Datenlogik geändert. PR #96 bleibt erfolgreich veröffentlicht; dieser begrenzte Begleiter-Fix wird separat per PR #97 integriert und geprüft.

## Historischer Prüfstand – App-Aktionen und Formularbreiten, 17.11.2026

Ausgangsrelease `1047f59cdbf46debec846fbc4ea26899b5c7595b` (#96/#97 veröffentlicht und geprüft). D06b/D05b weiterhin In Arbeit/Offen. Dieses Paket kennzeichnet ausschließlich bekannte normale Aktionen von Auto und Haushaltsbuch mit vorhandenen b3-action-/b3-outline-Klassen. Primäraktionen werden türkis, Nebenaktionen weiß mit gut lesbarer Schrift. Löschen, Belegbilder entfernen und Abmelden bleiben unberührt. Keine Änderung an Handlern, IDs, Texten, Daten-/Auth-Logik; Quellvergleich nach Ausblenden der Klassenattribute identisch.

Auto: äußere Erfassungs-/Listenraster bis 1279 px einspaltig, damit verschachtelte Eingaben auf Tablets genug Breite haben. Haushaltsbuch: sechs Finanzfelder ab 768 px in zwei Reihen mit je drei Feldern, umbrechende Formularkopfzeile beim Bearbeiten. Bestehende gemeinsame Fokus-/Bewegungs-/Deaktivierungszustände wiederverwendet; Editier-/Budget-/Sparziel-Dialoge mit gemeinsamer Eingabegeometrie.

Vorhandene zwei Design-Browsertests gezielt erweitert: synthetische vorhandene Datensätze im abgefangenen Cloud-Adapter, tatsächliche dynamische Bearbeiten-/Löschknöpfe, drei Breiten, Dialoge, Kontrast, Mindesthöhe, Tastatur, Hover/Drücken und null Cloud-Schreibvorgänge. Vorhandene Schreibfehler-/Auth-/Konflikttests bleiben bestehen. Schreibfreier main-Releasecheck prüft künftig auch beide Themen-CSS und beide HTML-Dateien bytegenau.

Status: implementiert im Prüfbranch, noch nicht verifiziert oder veröffentlicht. Nächste Aktion: CI, kompakte Form-/Aktions-/Dialogbilder tatsächlich sichten, nötige Korrekturen, dann Merge/Pages/Live-Vergleich. P1 bleibt 9/17 = 52,9 %, 9/24 Aufgaben verifiziert. Übrige acht B3-Tools und Wishlist/Dashboard bleiben offen. Keine Datenbankänderung; Originalassets unverändert.

Erste Sichtprüfung: CI 47/47 erfolgreich; auf 320 px dennoch KM-Schaltfläche im Auto-Kärtchen gequetscht und Dialogbeschriftungen mitten im Wort umgebrochen. Vor Integration korrigiert: Fahrzeugidentität und Aktionen dürfen umbrechen, Dialogaktionen erhalten sinnvolle Mindestbreite, gemeinsame Aktionsschrift 0,875 rem/700 mit natürlichem Wortumbruch. Zusätzliche geometrische Assertions decken die tatsächlichen Fehler ab. Noch keine Veröffentlichung.

## P1 – App-Aktionen und Formularaufteilung: Teilabnahme PR #98

Stand: 17.11.2026. PR [#98](https://github.com/duhrrom11/toolya/pull/98), geprüfter Produktstand `a4494d15308eae996766cdf323ac21255b9a910c`. Sechs Checks auf diesem Stand erfolgreich: platform, estate-security, isolated-browser-tests, isolated, privacy und Two-context Chromium / no production data. Browserlauf [43982530156](https://github.com/duhrrom11/toolya/actions/runs/43982530156): 47/47 bestanden. Danach ausschließlich Bild-/Auditdokumentation ergänzt; finale Commit-Prüfung und Veröffentlichungsnachweis sind im verlinkten PR nachvollziehbar.

**Bestätigt:** 18 Ausschnitte tatsächlich gesichtet: Auto und Haushaltsbuch, je Formulare/Aktionsbereich/Dialog bei 320, 768 und 1440 px. Normale Primäraktionen türkis, Nebenaktionen mit gemeinsamer heller Gestaltung und einheitlicher Schrift. 44-px-Mindesthöhe, Kontrast >=4,5 für geprüfte primäre Buttons, Fokus, reduzierte Bewegung, Hover/Drücken, dynamische Bearbeiten-/Löschaktionen und null Schreibvorgänge in den beiden Design-Fixtures erfolgreich geprüft. Bestehende Auth-/Cloud-Konflikt-/Nachlassprüfungen bestehen. Rote Löschaktionen, Belegbilder entfernen und Abmelden nicht umgefärbt.

Auto: bis 1279 px stehen äußere Erfassungs-/Listenbereiche untereinander, ab 1280 wieder nebeneinander. Auf 768 px wurden die Kennzeichen-Eingaben mit mehr als 290 px Breite geprüft. Haushaltsbuch: sechs Finanzangaben ab 768 px in zwei Reihen mit je drei Feldern. Die Kopfzeile beim Bearbeiten bricht auf kleinen Displays sinnvoll um. Zwei visuell erkannte mobile Fehler (gequetschte KM-Aktion, mitten im Wort umbrechende Dialogbuttons) vor Abnahme korrigiert und durch geometrische Assertions abgesichert.

**Prüfumfang:** synthetische vorhandene Datensätze, abgefangene Auth-/Cloud-Antworten, lokales tatsächliches Tool-HTML, lediglich vorhandenes Tailwind-Darstellungs-CSS zusätzlich erlaubt. Diagrammbibliothek weiterhin inert; keine Diagrammabnahme. Englische Browser-Datei-/Datumssteuerung ist Testumgebung, keine Content-Lokalisierungsprüfung. Keine produktiven Konten, privaten Daten oder Schreibzugriffe; keine vollständige private Live-Abnahme oder WCAG-Zertifizierung.

Nachweise: [pr98-visual-review.json](pr98-visual-review.json), 18 dauerhaft gespeicherte JPEGs unter `evidence/pr98-*.jpg`. HTML-Quellvergleich nach Ausblenden aller Klassenattribute identisch zum Ausgangsstand; Änderungen an dynamischen Button-Templates betreffen ebenfalls ausschließlich Klassen. Keine Handler-/ID-/Text-/Auth-/Datenänderung; Original-PNGs unverändert.

**Fortsetzung:** D06b und D05b bleiben In Arbeit; alle übrigen Ansichten sind damit nicht pauschal abgenommen. Als Nächstes Umzugskisten und Verleih an denselben vorhandenen Komponenten ausrichten und mit tatsächlichen isolierten Toolansichten prüfen; danach die übrigen B3-Tools und Wishlist/Dashboard. Account-/Hilfeflächen und semantische Statusfarben separat beurteilen. Kein regulärer SEO-/Textumbau vor P1-Abschluss.

**Veröffentlichungsgrenze:** visuelle und isolierte Abnahme dieses Pakets abgeschlossen. Konkreter Mergecommit, Pages und bytegenaue Live-Bestätigung werden nach Integration im dauerhaft verlinkten PR #98 protokolliert. Der schreibfreie main-Check vergleicht gemeinsames CSS, beide Themen-CSS, beide Tool-HTML-Dateien und buddy.mjs mit dem tatsächlichen Release; Status/JSON im Plattform-Job bzw. dessen Artefakt. Nur statische GETs, keine private UI-Prüfung. Rollback durch gezielten Revert des Releasecommits; keine Migration.

Gewichteter Gesamtstand unverändert: 9/17 P1 = 52,9 %, insgesamt 9/24 Aufgaben verifiziert; 15 nicht abgeschlossen. Teilarbeit an zwei Tools wird nicht als Abschluss der größeren D06b-/D05b-Aufgaben gezählt. Dieser Abschnitt ist der aktuelle Fortsetzungsstand; ältere nächste Schritte sind historische Zwischenstände.

## P1-Fortsetzung – Umzugskisten und Verleih, 17.11.2026

Ausgangsrelease `ea91589862bceca00b2fc8a496827b1a90f25a94` (#98 veröffentlicht). D06b/D05b bleiben In Arbeit. Normale Aktionen der beiden nächsten Tools werden mit den bestehenden b3-action-/b3-outline-Komponenten verbunden. Löschen, Abmelden und Statusfarben bleiben erhalten. Im Tool-HTML einschließlich Templates ausschließlich Klassen geändert; nach Maskierung aller Klassenattribute identischer Quellcode. Keine Daten-/Auth-/Handler-/Textänderung, keine Migration und keine Originalassets geändert.

Tabletformulare bis 1279 px breiter; im Verleih Kontakt-/Inventarkarten auf Tablets zweispaltig über dem eigentlichen Verleihformular. Aktionszeilen dürfen umbrechen, mobile Editierdialoge erhalten ausreichend breite Felder, gemeinsame Fokus-/Aktionsgestaltung und interne Scrollbarkeit. Unterartikel-Eingaben im Kistendialog mit passendem mobilen Raster.

Zwei zusätzliche isolierte Browserfälle verwenden die tatsächlichen Seiten mit synthetischen geladenen Cloud-Snapshots. Drei Breiten (320/768/1440), fünf Bildausschnitte je Tool/Breite (Einrichtung, Erfassung, Liste, Dialog oben, Dialogaktionen), dynamische Bearbeiten-/Löschknöpfe, Kontrast, Mindesthöhe, Fokus, kein horizontaler Überlauf und null Cloud-Schreibvorgänge werden geprüft. Die bisherigen Prüfungen bleiben bestehen; ältere Auto-/Haushaltsbuch-JPEGs werden weiter als Artefakte erzeugt, die direkte Bilddiagnostik fokussiert dieses Paket. Releasecheck ergänzt beide Themen-CSS und beide Tool-HTML-Dateien.

Status: implementiert im Prüfbranch; CI, tatsächliche Sichtprüfung und Veröffentlichung stehen aus. Fortschritt unverändert 9/17 = 52,9 %, 9/24 Aufgaben verifiziert. Nächste Aktion: CI-Ergebnisse und Bildausschnitte prüfen, Fehler beheben, Abnahme dauerhaft dokumentieren, erst danach Merge/Pages/Live-Verifikation. Weitere sechs B3-Tools sowie Wishlist/Dashboard bleiben offen.

Erste Sichtprüfung PR #99: 49 Browserprüfungen bestanden. Dabei trotzdem enge mobile Inventarfilter und 16-px-Versatz der Verleih-Setupkarten auf Tablets erkannt. Vor Integration korrigiert: Filterraster einspaltig mobil/dreispaltig ab 768 px mit ausgerichteten Eingaben; Kartenmargin gegenüber Tailwind space-y zuverlässig zurückgesetzt. Neue Breiten-/Positionsassertionen sichern die tatsächlichen Befunde ab. Noch kein Veröffentlichungsabschluss.

## P1 – Umzugskisten und Verleih: visuelle Teilabnahme PR #99

Stand 17.11.2026, Produktstand `8589dca643e8d8f69754475295aaaf0e7d40a001`, PR [#99](https://github.com/duhrrom11/toolya/pull/99). Sechs Checks erfolgreich (platform, estate-security, isolated-browser-tests, isolated, privacy, Two-context Chromium / no production data). Browserlauf [43989548520](https://github.com/duhrrom11/toolya/actions/runs/43989548520): 49/49 bestanden. Nach diesem Produktstand ausschließlich Audit-/Bildnachweise ergänzt; finale Commitprüfungen und Veröffentlichung werden im PR mit Releasecommit, Pages-Lauf und Live-Hashprotokoll dokumentiert.

**Nachweislich bestätigt:** 30 aufgenommene Ausschnitte (28 unterschiedliche JPEG-Payloads) tatsächlich gesichtet: Einrichtung, Erfassung, Liste, Dialog oben und Dialogaktionen für beide Tools bei 320/768/1440 px. Primäraktionen türkis, Nebenaktionen hell, gemeinsame Schrift/Fokusgestaltung, mindestens 44 px für geprüfte Aktionsbuttons, Primärkontrast >=4,5 und kein horizontaler Seiten-/Dialogüberlauf in den geprüften Zuständen. Dynamische Bearbeitungsaktionen öffnen die echten Dialoge. Keine Browserfehler und null Schreibvorgänge in diesen beiden Design-Fixtures.

Umzugskisten: äußeres Raster unter 1280 px einspaltig; Standortfelder mobil untereinander, Inventarfilter mobil einspaltig und ab 768 px dreispaltig. Unterartikel-/Dialogaktionen umbrechbar, Dialog intern scrollbar. Verleih: Setupkarten auf Tablets nebeneinander und oberhalb des Erfassungsformulars, auf Desktop bestehende Aufteilung erhalten; Datumsfelder mobil untereinander und Aktionsleisten umbrechbar. Bei erster Sichtung trotz grüner Tests erkannte zu schmale mobile Kistenfilter und 16-px-Versatz der Verleihkarten korrigiert; zusätzliche Breiten-/Positionsprüfungen bestehen. Alle finalen Bildpayloads erneut gesichtet.

**Belege und Grenzen:** [pr99-visual-review.json](pr99-visual-review.json), 30 Bildpfade unter `evidence/pr99-*.jpg` mit dokumentierten Duplikaten. HTML einschließlich dynamischer Vorlagen ist nach Ausblenden sämtlicher Klassenattribute identisch zum Ausgangsrelease ea91589862bceca00b2fc8a496827b1a90f25a94. Keine Handler-/ID-/Text-/Auth-/Datenänderungen und keine Originalassets geändert. Synthetische Cloud-Snapshots, abgefangene Anmeldung/Cloud-Anfragen, tatsächliches Tool-HTML; vorhandenes Tailwind-Darstellungs-CSS erlaubt. Englische native Datum-/Dateifelder stammen aus der Testumgebung. Keine Produktionskonten/-daten/-schreibzugriffe. Kamera, QR-Erzeugung, externe Kalender/GPS-Ziele und private produktive Gesamtabläufe sind hier nicht abgenommen; keine vollständige WCAG-Prüfung.

**Veröffentlichung:** Der main-Releasecheck vergleicht gemeinsames B3-CSS, buddy.mjs sowie CSS und HTML von Auto, Haushalt, Umzug und Verleih bytegenau mit toolya.app (zehn Dateien). Tatsächliche Ergebnisse nach Merge im dauerhaft verlinkten PR #99 und Plattform-Job (`B3_LIVE_DELIVERY`); die visuellen Nachweise stammen aus isoliertem Chromium, keine Behauptung einer angemeldeten Live-Sichtprüfung. Rollback: gezielter Revert des Releasecommits, keine Datenbankmigration.

**Fortsetzung:** D06b/D05b bleiben In Arbeit. Vier der zehn regulären B3-Tools in diesem App-Aktions-/Formularpaket visuell geprüft; sechs weitere sowie Wishlist/Dashboard und weitere Familien bleiben offen. Nächste konkrete P1-Einheit: Zählerstände und Pflanzenpflege. Kein regulärer P2-/P3-Umbau vor P1-Abschluss. Gewichteter Dashboardstand unverändert: Bestandsaufnahme 5/8 (62,5 %), P1 9/17 (52,9 %), P2 0/9, P3 0/8, weitere 0/10. Insgesamt 9/24 Aufgaben verifiziert, 15 nicht abgeschlossen. Teilabnahme ersetzt keinen Abschluss der größeren Aufgaben. Dieser Abschnitt ist der aktuelle Fortsetzungsstand; ältere nächste Schritte sind historische Zwischenstände.

## P1-Fortsetzung – Zählerstände und Pflanzenpflege (17.11.2026)
Ausgangsrelease 31831d6ac7ac1f87dc4823931fd1346856a6a853, PR #99 veröffentlicht und Live-Nachweis dort protokolliert. D06b/D05b bleiben In Arbeit (9/17 = 52,9 %; 9/24 Aufgaben verifiziert).

Aktuelles Paket: primäre/sekundäre Aktionen mit bestehenden B3-Klassen verbinden; Tablet-Eingaben in zwei breite Spalten und desktop vorhandene drei/vier Spalten. Pflanzen-Bearbeitung mobil einspaltig, Zusatzdialoge scrollbar und Lager-/Saatgutzeilen umbrechbar. Shared Dialogklasse für konsistente Eingaben und Fokus. Warn-/Löschaktionen und Daten-/Authlogik unverändert. Pflanzen erhalten ein gezieltes Themen-Stylesheet und Scopeklasse; übrige HTML-Änderungen ausschließlich Klassen.

Status: Implementierung im Prüfbranch, visuelle Abnahme/CI/Merge/Pages noch ausstehend. Zwei zusätzliche isolierte reale UI-Fixtures mit synthetischen Snapshots, keine Produktivkonten/-daten/-schreibzugriffe. Veröffentlichung erst nach grüner CI und tatsächlicher Sichtprüfung. Restliche B3-Tools: WG, Haustiergesundheit, Parkplatz, Backform; danach Wishlist/Dashboard und übrige Designfamilien.
