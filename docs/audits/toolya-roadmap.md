# Toolya – gewichtete Roadmap

Stand: 16.11.2026. Status: Offen → In Arbeit → Umgesetzt → Verifiziert; Blockiert benennt konkrete fehlende Voraussetzungen.

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
| D05b | P1 – Design | 4 | Übrige Seiten/responsive | Nicht vollständig visuell geprüft; Legacy-Wishlist/Dark-CSS | Gemeinsame Marke, keine Überläufe, Hellmodus | Ansichten 320/768/1440 und Tastatur systematisch prüfen | 1–2 Tage | I03; isolierte Auth-Fixtures | mittel | Offen | page-inventory.json; Legacy-Seiten |
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

Nächste konkrete P1-Einheit: D06b/B3 – `assets/helferlein-b3.css` und die überlagernden Tool-Styles der zehn regulären B3-Tools auf bestehende Marken-Tokens, Buttons/Formulare/Karten und Fokuszustände abstimmen. Vor Änderungen aktive grüne Klassen und dynamische Auswahlzustände erfassen; rote Warn-/Löschaktionen bewahren. Mit gezielten authentifizierten Fixtures tatsächliche Toolansichten prüfen, keine Startseiten-Redirects als Toolabnahme zählen. Danach übrige Wishlist-/Dashboard-Stile und D07/Infoseiten. D05b enthält weiterhin die vollständige responsive Abnahme sowie die sekundäre doppelte Wortmarke auf der Erbenseite. Noch keine reguläre SEO-/Textumsetzung beginnen.

Die [Designfamilienmatrix](design-family-inventory.md) ist fortgeschrieben. Zwei veröffentlichte Produktpakete dieser Fortsetzung: #93 und #94. Rollback jeweils per gezieltem Revert des Releasecommits; keine Datenbankmigration in beiden Paketen.

Private Live-Flows sind mangels bestätigter Anmeldesitzung nicht vollständig abgenommen; isolierte/synthetische Prüfungen sind kein Ersatz für alle produktiven Ansichten. Alte Wishlist-Seiten nicht ungeprüft entfernen. Keine juristische Freigabe. Keine produktiven Nutzerdaten geändert.

Geänderte Produktdateien in PR #91: `assets/toolya-consent.js`, `shared/toolya/platform.mjs`, `shared/toolya/tokens.css`, `shared/toolya/footer.css`, `shared/toolya/header.css`, `privacy.html`, `legal.html`. Dazu gezielte Browserregressionen und Audit-Dokumente. Rollback: gezielter Revert des genannten Releasecommits; keine Datenbankmigration erforderlich.

## P1-Fortsetzung 17.11.2026 – gemeinsames B3-Kontrollpaket

PR #95 mit dem bisherigen Releaseprotokoll nach erfolgreicher CI gemergt (`4c9cc38ec699440db66af3ca0540f53a1aee172e`); Pages 43976906485 erfolgreich.

D06b in Arbeit: gemeinsame B3-Navigation, Dashboard-Editor und Formulargeometrie an vorhandene Marken-Tokens angebunden. Themenfarben bleiben auf den Header beschränkt; bestehende Warnaktionen und App-/Auth-/Cloud-Logik werden nicht geändert. Tastaturfokus, deaktivierte Zustände und reduzierte Bewegung sind berücksichtigt. Repräsentative echte Auto-/Haushaltsbuch-Ansichten werden über isolierte Auth-/Cloud-Fixtures bei 320/768/1440 geprüft; vorhandenes Tailwind-Darstellungs-CSS ist für diese Designprüfung ausdrücklich zugelassen. Keine produktiven Konten oder Daten.

Geänderte Dateien: `assets/helferlein-b3.css`, `tests/browser/tool-pages-ui.spec.cjs`, `.github/workflows/toolya-browser-tests.yml` und diese Roadmap. Browsernachweise werden jetzt auch bei erfolgreicher CI als Artefakt aufbewahrt. Die lokale Ausführungsumgebung und ein interaktiver Browser stehen derzeit nicht zur Verfügung; daher ist die Sichtprüfung dieses Pakets noch offen. Bis zu CI- und visueller Abnahme keine Veröffentlichung dieses neuen Pakets behaupten. D06b bleibt unvollständig; Gewicht und Fortschritt unverändert (9/17, 52,9 %). Weitere Tool-Overrides, primäre App-Buttons, Karten sowie Wishlist/Dashboard folgen separat.

Nächste Aktion: aktuellen PR-Commit prüfen, CI-Fehler ggf. korrigieren, erzeugte Screenshots sichten; erst danach Merge und Pages-/Live-Verifikation. Bei nicht verfügbarer Sichtprüfung Branch erhalten. Rücknahme vor Merge durch Verwerfen des Branches möglich; keine Migration.
