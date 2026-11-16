# Toolya – gewichtete Roadmap

Stand: 16.11.2026. Status: Offen → In Arbeit → Umgesetzt → Verifiziert; Blockiert benennt konkrete fehlende Voraussetzungen.

Gewicht = relative Arbeitsgröße (1 klein, 2 mittel, 3 groß, 5 sehr groß), keine Qualitätsnote. Fortschritt = Summe der Gewichte **verifizierter** Aufgaben / Summe aller erfassten Gewichte des Bereichs. In Arbeit/Umgesetzt zählen noch nicht. Unteraufgaben werden nicht doppelt gezählt.

## Maßnahmen

| ID | Kategorie | Gewicht | Seite/Komponente | Ist | Soll | Umsetzung | Aufwand | Abhängigkeiten | Risiko | Status | Nachweis |
|---|---|---:|---|---|---|---|---|---|---|---|---|
| I01 | Bestandsaufnahme | 2 | Repository/Branches/CI | 38 HTML, 93 Branches, 3 offene PRs erfasst | Architektur und offene Änderungen nachvollziehbar | Inventar und PR-Abgleich dokumentieren | 1 h | GitHub | niedrig | Verifiziert | clone; runs 43921114382/304/071; PR-Suche |
| I02 | Bestandsaufnahme | 2 | Supabase/Analytics | Projekte und RLS-Metadaten geprüft | Verwendetes Backend und Zugriffsumfang erfassen | Metadaten, Advisors und Analytics-Projektzuordnung prüfen | 2 h | Supabase/Amplitude | mittel | Verifiziert | security-inventory.md; Amplitude default erreichbar, Toolya-Zuordnung nicht bestätigt |
| I03 | Bestandsaufnahme | 3 | Alle Seiten live | 2 öffentliche Ansichten und 1 Auth-Umleitung geprüft | 38 Routen klassifiziert und erreichbare Ansichten geprüft | Öffentliche Seiten, Sonderseiten und Auth-Zustände erfassen | 3 h | Browser/Anmeldesitzung | mittel | In Arbeit | page-inventory.json; Screenshots 01/02 |
| I04 | Bestandsaufnahme | 1 | Markenentscheidungen | Aktueller Auftrag, AGENTS und Roadmap abgeglichen | Kein Verlust verbindlicher Vorgaben | Aktuellen Footerauftrag und Originalassets festhalten | 0,5 h | Originalassets | niedrig | Verifiziert | AGENTS.md; Masterauftrag |
| D01 | P1 – Design | 2 | Footer/Consent | Widerrufslink geht auf Startseite verloren; 2 Footer auf privacy | Ein Footer mit dauerhaftem Widerrufslink | Link beim Austausch bewahren und nach spätem Mount einhängen | 1 h | platform.mjs; consent.js | mittel | Verifiziert | Live DOM; Screenshot 02; mountFooter/init |
| D02 | P1 – Design | 2 | Wortmarke/Token | Schriftfamilie wird seitenabhängig geerbt | Identische Markenfamilie/Gewicht/Abstände | Gemeinsame Tokens aus bestehender Startseite übernehmen | 1 h | platform/header/footer CSS | niedrig | Verifiziert | Live computed styles Inter vs ui-sans |
| D03 | P1 – Design | 1 | Pflanzen/Tier-Header | Grüne Themenfarben | Bläuliches Türkis unabhängig von Charakter | Nur vorhandene Themenvariablen korrigieren | 0,5 h | header.css | niedrig | Verifiziert | header.css data-tool=plants/pet-health |
| D04 | P1 – Design | 2 | Ko-fi/Footer-CSS | Doppelte konkurrierende Regeln/Keyframes | Eine wartbare aktive Definition | Aktuelles Rendering erhalten, Altdefinition entfernen | 1 h | footer.css; platform.mjs | mittel | Verifiziert | Zwei ty-kofi-banner-Regelgruppen |
| D05 | P1 – Design | 5 | Alle 38 Seiten/responsive | Nicht vollständig visuell geprüft; Legacy-Wishlist/Dark-CSS | Gemeinsame Marke, keine Überläufe, Hellmodus | Ansichten 320/768/1440 und Tastatur systematisch prüfen | 1–2 Tage | I03; isolierte Auth-Fixtures | mittel | Offen | page-inventory.json; Legacy-Seiten |
| D06a | P1 – Design | 1 | Nachlass Besitzer/Vertrauenspersonen | Grüne UI-Flächen und inaktive Dark-CSS-Reste, zusätzlicher alter Footer bei Erben | Gemeinsame türkise Bedienelemente im Hellmodus, ein Footer mit erhaltenem Schlüsselhinweis | Estate-CSS mit vorhandenen Tokens verbinden; Footerhinweis in main erhalten | 2–4 h | D02; isolierte Nachlass-Prüfung | mittel | In Arbeit | Live-Ausgangsansicht; assets/estate-app.css; heirs.html |
| D06b | P1 – Design | 2 | B3/Wishlist/Dashboard Formulare/Karten/Dialoge | Weitere historisch getrennte UI-Systeme | Konsistente Zustände und Eingaben | Übrige bestehende UI schrittweise mit Tokens verbinden | 1–2 Tage | D05 | mittel | Offen | B3, Wishlist, Dashboard Styles |
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
2. D01–D04 gemeinsamer Footer/Marke; danach D05, D06a/D06b und D07 vollständige Designabnahme.
3. Erst dann S01–S03; anschließend C01–C03.
4. X01–X03 nach Risiko prüfen; ein belegter kritischer Fehler darf vorgezogen werden.
5. X04 und Release-Nachweise laufend pro Paket aktualisieren.

## Fortschritts-Dashboard

| Bereich | Verifiziert/Gesamtgewicht | Fortschritt | Status |
|---|---:|---:|---|
| Bestandsaufnahme | 5/8 | 62,5 % | In Arbeit |
| P1 – Design-Konsistenz | 7/17 | 41,2 % | In Arbeit |
| P2 – SEO | 0/9 | 0 % | Offen |
| P3 – Inhalte & Rechtstexte | 0/8 | 0 % | Offen |
| Weitere Optimierungen | 0/10 | 0 % | In Arbeit |

23 übergeordnete Aufgaben (Fachanhang-Unterpunkte ohne Doppelzählung): 7 verifiziert, 16 nicht abgeschlossen. D06 wurde ohne Änderung des Gesamtgewichts 3 in D06a (1) und D06b (2) aufgeteilt. Keine globale Prozentzahl für den noch wachsenden Prüfumfang.

## Fortsetzungsstand

Aktuelle Phase: P1 – Designharmonisierung. Bestandsaufnahme läuft hinsichtlich vollständiger Browserabnahme weiter. PR [#91](https://github.com/duhrrom11/toolya/pull/91) gemergt; Releasecommit `1b611811afddef8bd0da78da00ba50c66cd896ea`, Pages [43928099016](https://github.com/duhrrom11/toolya/actions/runs/43928099016) erfolgreich. D01–D04 im Code, auf main und live bestätigt. 75 Node-Tests, sechs PR-Checks, neue Vier-Seiten-/Drei-Breiten-Prüfung und Originalasset-Hashes bestanden. Details und Grenzen im Master-Audit.

Aktuell bearbeitet: D06a auf Branch `audit/estate-design-turquoise-20261116`. Farben/Font-Tokens und helles Estate-Stylesheet umgesetzt; wichtiger Schlüsselhinweis auf der Erbenseite im main erhalten. Produktive CSP, Authentifizierung, Key-/Freigabelogik, Übergabe und Druck unverändert. 75 Node-Tests erfolgreich. Noch kein Merge/Deployment dieses zweiten Pakets. Nächste Aktion: responsive Browser-/Sicherheits-CI auswerten, Bilder prüfen, dann integrieren und live bestätigen.

Danach separat `tools/estate/handover.html` unter unveränderter CSP/Netzwerksperre behandeln; anschließend D05/D06b/D07 fortsetzen. Vollständige Matrix: [design-family-inventory.md](design-family-inventory.md). Noch keine reguläre SEO-/Textumsetzung beginnen.

Private Live-Flows sind mangels bestätigter Anmeldesitzung nicht vollständig abgenommen; isolierte/synthetische Prüfungen sind kein Ersatz für alle produktiven Ansichten. Alte Wishlist-Seiten nicht ungeprüft entfernen. Keine juristische Freigabe. Keine produktiven Nutzerdaten geändert.

Geänderte Produktdateien in PR #91: `assets/toolya-consent.js`, `shared/toolya/platform.mjs`, `shared/toolya/tokens.css`, `shared/toolya/footer.css`, `shared/toolya/header.css`, `privacy.html`, `legal.html`. Dazu gezielte Browserregressionen und Audit-Dokumente. Rollback: gezielter Revert des genannten Releasecommits; keine Datenbankmigration erforderlich.
