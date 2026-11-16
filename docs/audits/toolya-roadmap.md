# Toolya – gewichtete Roadmap

Stand: 16.11.2026. Status: Offen → In Arbeit → Umgesetzt → Verifiziert; Blockiert benennt konkrete fehlende Voraussetzungen.

Gewicht = relative Arbeitsgröße (1 klein, 2 mittel, 3 groß, 5 sehr groß), keine Qualitätsnote. Fortschritt = Summe der Gewichte **verifizierter** Aufgaben / Summe aller erfassten Gewichte des Bereichs. In Arbeit/Umgesetzt zählen noch nicht. Unteraufgaben werden nicht doppelt gezählt.

## Maßnahmen

| ID | Kategorie | Gewicht | Seite/Komponente | Ist | Soll | Umsetzung | Aufwand | Abhängigkeiten | Risiko | Status | Nachweis |
|---|---|---:|---|---|---|---|---|---|---|---|---|
| I01 | Bestandsaufnahme | 2 | Repository/Branches/CI | 38 HTML, 93 Branches, 3 offene PRs erfasst | Architektur und offene Änderungen nachvollziehbar | Inventar und PR-Abgleich dokumentieren | 1 h | GitHub | niedrig | Verifiziert | clone; runs 43921114382/304/071; PR-Suche |
| I02 | Bestandsaufnahme | 2 | Supabase/Analytics | Projekte und RLS-Metadaten geprüft | Verwendetes Backend und Zugriffsumfang erfassen | Metadaten, Advisors und Analytics-Projektzuordnung prüfen | 2 h | Supabase/Amplitude | mittel | In Arbeit | security-inventory.md; Amplitude default erreichbar, Toolya-Zuordnung nicht bestätigt |
| I03 | Bestandsaufnahme | 3 | Alle Seiten live | 2 öffentliche Ansichten und 1 Auth-Umleitung geprüft | 38 Routen klassifiziert und erreichbare Ansichten geprüft | Öffentliche Seiten, Sonderseiten und Auth-Zustände erfassen | 3 h | Browser/Anmeldesitzung | mittel | In Arbeit | page-inventory.json; Screenshots 01/02 |
| I04 | Bestandsaufnahme | 1 | Markenentscheidungen | Aktueller Auftrag, AGENTS und Roadmap abgeglichen | Kein Verlust verbindlicher Vorgaben | Aktuellen Footerauftrag und Originalassets festhalten | 0,5 h | Originalassets | niedrig | Verifiziert | AGENTS.md; Masterauftrag |
| D01 | P1 – Design | 2 | Footer/Consent | Widerrufslink geht auf Startseite verloren; 2 Footer auf privacy | Ein Footer mit dauerhaftem Widerrufslink | Link beim Austausch bewahren und nach spätem Mount einhängen | 1 h | platform.mjs; consent.js | mittel | Umgesetzt | Live DOM; Screenshot 02; mountFooter/init |
| D02 | P1 – Design | 2 | Wortmarke/Token | Schriftfamilie wird seitenabhängig geerbt | Identische Markenfamilie/Gewicht/Abstände | Gemeinsame Tokens aus bestehender Startseite übernehmen | 1 h | platform/header/footer CSS | niedrig | Umgesetzt | Live computed styles Inter vs ui-sans |
| D03 | P1 – Design | 1 | Pflanzen/Tier-Header | Grüne Themenfarben | Bläuliches Türkis unabhängig von Charakter | Nur vorhandene Themenvariablen korrigieren | 0,5 h | header.css | niedrig | Umgesetzt | header.css data-tool=plants/pet-health |
| D04 | P1 – Design | 2 | Ko-fi/Footer-CSS | Doppelte konkurrierende Regeln/Keyframes | Eine wartbare aktive Definition | Aktuelles Rendering erhalten, Altdefinition entfernen | 1 h | footer.css; platform.mjs | mittel | Umgesetzt | Zwei ty-kofi-banner-Regelgruppen |
| D05 | P1 – Design | 5 | Alle 38 Seiten/responsive | Nicht vollständig visuell geprüft; Legacy-Wishlist/Dark-CSS | Gemeinsame Marke, keine Überläufe, Hellmodus | Ansichten 320/768/1440 und Tastatur systematisch prüfen | 1–2 Tage | I03; isolierte Auth-Fixtures | mittel | Offen | page-inventory.json; Legacy-Seiten |
| D06 | P1 – Design | 3 | Formulare/Karten/Dialoge | Mehrere historisch getrennte UI-Systeme | Konsistente Zustände und Eingaben | Bestehende UI schrittweise mit Tokens verbinden | 1–2 Tage | D05 | mittel | Offen | B3, Estate, Wishlist, Dashboard Styles |
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

## Reihenfolge

1. I01–I04 Bestandsaufnahme vertiefen; D01 als belegten Montage-/Widerrufsfehler vorziehen.
2. D01–D04 gemeinsamer Footer/Marke; danach D05–D07 vollständige Designabnahme.
3. Erst dann S01–S03; anschließend C01–C03.
4. X01–X03 nach Risiko prüfen; ein belegter kritischer Fehler darf vorgezogen werden.
5. X04 und Release-Nachweise laufend pro Paket aktualisieren.

## Fortschritts-Dashboard

| Bereich | Verifiziert/Gesamtgewicht | Fortschritt | Status |
|---|---:|---:|---|
| Bestandsaufnahme | 3/8 | 37,5 % | In Arbeit |
| P1 – Design-Konsistenz | 0/17 | 0 % | In Arbeit |
| P2 – SEO | 0/9 | 0 % | Offen |
| P3 – Inhalte & Rechtstexte | 0/8 | 0 % | Offen |
| Weitere Optimierungen | 0/9 | 0 % | In Arbeit |

21 übergeordnete Aufgaben (Fachanhang-Unterpunkte ohne Doppelzählung): 2 verifiziert, 19 nicht abgeschlossen. Keine globale Prozentzahl für den noch wachsenden Prüfumfang.

## Fortsetzungsstand

Aktuelle Phase: Bestandsaufnahme und erstes P1-Paket. Ausgangscommit 28f73ac. D01–D04 im Code umgesetzt, 75 Node-Tests bestanden; kein Audit-Code gemergt oder veröffentlicht. Nächste Aktion: isolierte Browser-CI des ersten Pakets, dann Merge und Liveprüfung. Private Live-Flows mangels bestätigter Sitzung noch nicht geprüft; Rechtstexte ohne juristische Freigabe. Produktivdaten unverändert.
