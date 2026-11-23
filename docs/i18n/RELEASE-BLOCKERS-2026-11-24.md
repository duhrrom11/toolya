# Toolya DE/EN – Konsolidierter Release- und Restarbeitenstatus

**Stand:** 24. November 2026 (Berlin). **STATUS: NOCH NICHT VOLLSTÄNDIG ABGESCHLOSSEN – Draft-PR #310, kein Merge in `main`, keine EN-Indexierung.**

## Tatsächlich konsolidierte Entwicklungsarbeit

- Die vorliegende Plattform enthält bereits die vollständig nach `main` übernommene i18n-Grundlage aus PR #291, das DE/EN-Quality-System aus PR #319 und die überprüften 28 öffentlichen Wunschlisten-Texte plus Titel aus PR #321.
- Der ältere **Draft-PR #310** enthielt darüber hinaus 366 Entwicklungscommits mit 79 abweichenden Dateien: zehn Alltagstools, zusätzliche Wunschlisten-/Nachlass-/Admin-Nachrichten, selektorbasierte Interface-Kataloge und vielfältige synthetische Regressionstests.
- Der neue Entwicklungsstand integriert `main` direkt in den bestehenden Draft-Branch (merge commit `28ef44a6`), **ohne** die neueren i18n-Arbeiten oder andere Änderungen aus `main` zu überschreiben. Der anschließende Commit `d3c9b204` stellte vier explizite Wishlist-Sprachmarker wieder her.
- Konkreter `WISHES_COPY`-Abgleich: 791 quellgenaue Schlüssel im alten Draft, 236 in der zuvor veröffentlichten Main-Fassung. Die sichere Vereinigung enthält **792 eindeutige Schlüssel**. 19 abweichende Übersetzungsformulierungen wurden bewusst aus der zuletzt fachlich geprüften Main-Fassung übernommen, ein fehlender Main-Schlüssel ergänzt. Dies zählt **nicht** die separaten Wunschlisten-Laufzeitkataloge und ist **kein** Gesamtzähler aller Ergänzungen.
- Die weiteren bereits auf dem Draft vorhandenen Entwicklungsänderungen sind nun wieder mit aktuellem `main` zusammengeführt. Ihr Vorhandensein bedeutet aber nicht automatisch, dass jeder Nutzerfluss releasefähig ist.

## Vollständiger automatischer Quellbaum-Audit – gemessener Zwischenstand

Quelle: [i18n static checks, Run #45291622520](https://github.com/duhrrom11/toolya/actions/runs/45291622520) auf konsolidiertem Commit `d3c9b204`, mit herunterladbarem `i18n-page-and-message-audit`.

| Prüfgröße | Tatsächlich gemessen |
| --- | ---: |
| HTML-Seiten im Projekt | 72 |
| Frontend-JS/MJS-Dateien außerhalb Tests/Backend | 128 |
| Öffentliche englische Seiten | 17 |
| HTML-Seiten ganz ohne EN-Zugang laut Routing-Audit | 0 |
| Tool-, Dashboard-, Wunschlisten-, Nachlass- und Admin-Ansichten mit unvollständiger E2E-Abnahme | **34** |
| JS-Dateien mit heuristisch deutschen Meldungs-Literalen | **41** |
| Englische öffentliche Seiten mit weiter aktivem `noindex` | **17** |
| Verdächtige statische deutsche Texte in EN-Marketingseiten | 0 nach konservativer Heuristik |

Die 41 Dateien sind eine **Quelltext-Prüfliste**, keine Zahl bewiesener falsch lokalisierter Meldungen. Die bestehenden `i18n`-Wrapper übersetzen bereits viele dieser exakten Dialoge. Ein bloßer Fund des deutschen Originals ist darum kein sicherer Übersetzungsfehler.

**Maschinenlesbare Aufgabenliste:** Der erweiterte Audit `scripts/i18n-coverage-audit.mjs` schreibt `i18n-coverage-report.json` mit Quelle, Zeile, Typ, Priorität, UI-Gruppe und jeweils noch offenem Abnahmekriterium; zusätzlich `i18n-coverage-report.md`. Beide Dateien werden vom GitHub-Workflow als Audit-Artefakt hochgeladen. Sie werden aus dem aktuellen Branch berechnet, nicht aus historischen Schätzwerten.

## Restarbeiten nach großen Batches

| Batch | Tatsächlich vorhandene Arbeit | Noch nachzuweisen |
| --- | --- | --- |
| 1 Organisation: moving, housemates, loans | Gemeinsamer Tool-Sprachschalter, quellgenaue Kataloge, neue Form-/Dialogtexte, isolierte Tool-Sicherheits- und Exporttests | Sämtliche dynamischen Modal-, Validierungs-, QR-/Backup-Pfade in DE/EN bei 320/375/768px |
| 2 Haushalt: plants, baking, budget | Form- und Absatztexte, Rezept-/OCR-/PDF-Beschriftungen, Format-/Vorschau-Regressionen und synthetische Datenprüfung | Vollständiger OCR-/Foto-/Kamera-/Import-/PDF-E2E-Test je Sprache und jeder erreichbare Zustand |
| 3 Fahrzeuge und Versorgung: car, parking, meters | Dialoge, Fahrzeugkategorien, Meter-Historie, GPS-/PDF-/Kalenderanzeige und Tests | Export-Kontrolle, Fehlerfälle, Tastatur/Fokus/A11y und dynamische Cloud-Konflikte vollständig |
| 4 Tiergesundheit: pet-health | Tier-/Medikamenten-/Termin-/Beleg-Anzeigewerte und Backup-/PDF-Labels | Alle realen App-Zustände mit synthetischem Konto, Dateien und Datum-/Zahlenformaten |
| 5 Kernplattform: Home, Dashboard, Konto und Recovery | DE/EN-Marketingseiten, Dashboard-Kataloge und isolierte Recovery-Tests | Alle Auth-Redirect-, Verifizierungs- und Mail-Link-Zustände isoliert abnehmen |
| 6 Wunschlisten, Nachlass, Admin | Viele source-exakte Wishlist-/Estate-/Admin-Kataloge, öffentliche Finder-Texte und isolierte Security-Tests | Alle 17 Wishlist-Ansichten, 4 Nachlassansichten, zwei Adminansichten inkl. dynamischer Rollen-/Berechtigungsfälle |
| 7 Marketing, SEO und Legal | 17 öffentliche EN-Seiten, DE/EN-Links, Canonical-/noindex-Grundlage | Bidirektionale `hreflang`, OG, JSON-LD, Sitemap, redaktionell geprüfte Rechtstexte und erst danach separate Freigabe der Indexierung |

## Sicherheits- und Freigabe-Gates

- Keine Runtime-Übersetzung von Profil-, Wunschlisten-, Tresor-, Rezept- oder Kategorie-Freitexten. Keine Änderung von gespeicherten Schlüsseln, Datenbankwerten, RLS, technischen IDs, QR-Payloads oder verschlüsselten Daten.
- Keine Änderung an produktivem Supabase, Mascot-Originalbildern, gemeinsamer Wortmarke oder bestehendem Live-System. Die zusätzlichen Browserfälle verwenden synthetische Auth-/Cloud-Objekte und blockieren externe Verbindungen.
- Toolya-Tools behalten vor vollständiger fachlicher Abnahme bewusst `html[lang]=de` in einigen EN-Opt-in-Ansichten. Das ist ein **offenes A11y-/Screenreader-Release-Gate** und darf nicht durch unbewiesenes Umschalten auf `en` verborgen werden.
- Alle 17 englischen öffentlichen Seiten behalten `noindex`. Keine automatische Indexierung eines unfertigen EN-Erlebnisses.
- Der [veraltete Minimalansatz PR #309](https://github.com/duhrrom11/toolya/pull/309) bleibt ausdrücklich ausgeschlossen; keine zweite i18next-Laufzeit.
- Eine grüne Node-/Cloud-/Chromium-CI ist erforderlich, aber **nicht hinreichend** für den vollständigen Abschluss der in den 34 Ansichten noch nicht belegten Benutzerreisen.

## Prüfnachweise und noch zu erfüllender Releasezustand

Nach dem ersten konsolidierten Merge-Commit wurden **16 von 16** Workflows auf HEAD `d3c9b204` erfolgreich abgeschlossen, einschließlich i18n, i18next, Plattform, Maskottchen, Estate-Security, Connect, Amazon, Budget, Moving und Cloud-Chromium. Die neue maschinenlesbare Aufgabenliste und die zusätzlichen Zehn-Tool-Browsersmokes benötigen nach ihren Commits eine eigene aktuelle CI-Prüfung; ältere grüne Läufe werden nicht als Nachweis für den neuen HEAD ausgegeben.

**Freigabeentscheidung:** `main` bleibt unverändert. Der große Draft bleibt **nicht releasefähig**, solange die fehlenden dynamischen E2E-Abnahmen, die 34 Ansichten, SEO/A11y- und Exportprüfungen sowie der abschließende CI-Status nicht vollständig nachgewiesen sind.
