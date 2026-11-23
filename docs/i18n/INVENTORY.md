# Toolya DE/EN – geprüfte Inventar-Baseline

**Erhebung:** 23.11.2026, erster vollständig bestandener isolierter Qualitätstest im PR #319 (Commit `9afbfcde`). Dieser Snapshot basiert auf dem tatsächlich erzeugten GitHub-Actions-Artefakt und nicht auf Schätzwerten. Das Prüfsystem wurde anschließend erweitert, um eigene Wishes-/Estate-Kataloge in der Tool-Ansicht ausdrücklich mitzuzählen. Die aktuelle dynamische Fassung kann mit `npm run i18n:report` erzeugt werden.

**Originalnachweis:** [GitHub Actions #45282571779](https://github.com/duhrrom11/toolya/actions/runs/45282571779), Artefakt `toolya-de-en-quality-report`, Dateien `report.json`, `REPORT.md`, `layout-report.json` und die DE/EN-Katalog-JSON-Exporte.

## Kataloglage

16 geprüfte i18next-Namespaces. Alle im Altbestand vorhandenen DE-Schlüssel besitzen in den daraus generierten EN-Namespace-Tabellen einen nichtleeren Zielwert; im geprüften Export: **0 fehlende/leere Einträge und 0 Platzhalterabweichungen**.

**Das ist keine vollständige Übersetzungsquote:** Diese JSON-Exports entstehen aus den bereits bekannten DE→EN-Quellen. Neue hart codierte Texte und nur dynamisch erreichbare UI-Zustände sind nicht automatisch erfasst.

## Kanonische Tool-Oberflächen (12)

| Tool | EN-Katalogschlüssel | Selektorregeln | Statische Selektortreffer | Dialogtexte | Laufzeittexte | Deutsche HTML-Prüfkandidaten* |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| wishes | 391 | 0 | 0 | 0 | 0 | 56 |
| budget | 49 | 0 | 0 | 42 | 7 | 26 |
| housemates | 56 | 7 | 7 | 52 | 4 | 46 |
| moving | 30 | 16 | 16 | 30 | 0 | 26 |
| estate | 174 | 0 | 0 | 0 | 0 | 40 |
| car | 30 | 0 | 0 | 30 | 0 | 24 |
| pet-health | 27 | 0 | 0 | 27 | 0 | 24 |
| parking | 30 | 0 | 0 | 24 | 6 | 22 |
| loans | 27 | 0 | 0 | 27 | 0 | 29 |
| plants | 31 | 10 | 10 | 31 | 0 | 35 |
| meters | 32 | 0 | 0 | 32 | 0 | 40 |
| baking | 12 | 23 | 23 | 12 | 0 | 49 |

Die `wishes`- (391 Schlüssel) und `estate`-Kataloge (174 Schlüssel) liegen außerhalb der Legacy-Selektortabellen; dortige Nullen bedeuten **nicht** fehlende Übersetzungen. Für andere Tool-UIs gelten überwiegend die `tool_<slug>`-Namespaces sowie weitere alte DOM- und Dialogzuordnungen.

Die größten statischen Prüfmengen haben Wunschlisten (56 Kandidaten), Backform-Rechner (49), WG-Organisator (46) sowie Digitaler Nachlass und Zählerstände (je 40). Das ist nur eine **Review-Priorisierung**, keine Zahl bestätigter Übersetzungsfehler.

## Marketing- und Informationsseiten (17 DE/EN-Paare)

Alle 17 Paare besitzen die erwartete DE/EN-Sprachkennzeichnung und gegenseitige Sprachwahl. Der konservative Prüfalgorithmus erkannte **0 deutsch wirkende statische Texte auf englischen Seiten**. Die Seiten bleiben `noindex,follow`.

| Bereich | Deutsche Datei | Englische Datei | Statische deutsche Prüfkandidaten in EN |
| --- | --- | --- | ---: |
| Startseite | index.html | en/index.html | 0 |
| Umzugskisten | umzugskisten/index.html | en/moving-boxes/index.html | 0 |
| WG-Organisator | wg-organisator/index.html | en/roommate-organizer/index.html | 0 |
| Pflanzenpflege | pflanzenpflege/index.html | en/plant-care/index.html | 0 |
| Backform-Rechner | backform-rechner/index.html | en/cake-pan-calculator/index.html | 0 |
| Autokosten | autokosten/index.html | en/vehicle-costs/index.html | 0 |
| Haushaltsbuch | haushaltsbuch/index.html | en/household-budget/index.html | 0 |
| Digitaler Nachlass | digitaler-nachlass/index.html | en/digital-estate/index.html | 0 |
| Parkplatz-Merker | parkplatz-merker/index.html | en/parking-spot/index.html | 0 |
| Tiergesundheit | tiergesundheit/index.html | en/pet-health/index.html | 0 |
| Verliehene Dinge | verliehene-dinge/index.html | en/lent-items/index.html | 0 |
| Zählerstände | zaehlerstaende/index.html | en/meter-readings/index.html | 0 |
| Öffentliche Amazon-Wunschlisten | amazon-wunschliste-veroeffentlichen/index.html | en/publish-amazon-wishlist/index.html | 0 |
| Dashboard-Leitfaden | toolya-dashboard/index.html | en/toolya-dashboard/index.html | 0 |
| Maskottchen-Galerie | mascots.html | en/mascots.html | 0 |
| Impressum | legal.html | en/legal.html | 0 |
| Datenschutz | privacy.html | en/privacy.html | 0 |

## Mobile Layoutprüfung

Der isolierte Chromium-Audit testete alle 17 englischen Seiten bei 320 und 390 px, also **34 Seiten-/Breitenkombinationen**. Die Sprachwahl sowie die Unverändertheit einer synthetischen Browsernotiz und der gespeicherten Maskottchen-Wahl wurden geprüft.

**Ein verbleibender Layout-Hinweis:** `en/mascots.html` überläuft bei 320 px um **47 px horizontal**. Nachgewiesen im `layout-report.json` und getrennt in [Issue #320](https://github.com/duhrrom11/toolya/issues/320) dokumentiert. Die übrigen 33 Kombinationen meldeten keinen horizontalen Overflow.

## Grenzen und Folgearbeiten

- Statische Kandidaten zunächst unter isolierten, echten UI-Zuständen auf verbleibende EN-Fehlstellen prüfen. Alte Selektoren können dynamische Komponenten übersetzen.
- Begriffe aus [Glossar](glossary.json) verwenden; neue Texte fachlich freigeben, statt bestehende Kataloge zu überschreiben.
- Interpolationsplatzhalter, private Nutzereingaben, Wortmarke und Mascot-Einstellungen erhalten; anschließend Sprache und Layout regressionsprüfen.
- Keine Freigabe für SEO-Indexierung unvollständiger EN-Guides; keine produktiven Supabase-Tests.

*Ein „Prüfkandidat“ ist ein aus statischen HTML-Textknoten erkannter deutsch anmutender Text. Er kann durch die vorhandene Laufzeitübersetzung bereits korrekt englisch angezeigt werden. Es sind weder bestätigte Lücken noch ein tatsächlicher Abdeckungsprozentsatz.
