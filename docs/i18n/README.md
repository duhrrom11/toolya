# Toolya Translation Quality System – DE/EN

Stand: 23.11.2026. **Quellcode-Audit und Tests, keine produktive Übersetzungsfreigabe.**

## Bestandsaufnahme der bestehenden Architektur

- Browser-basierte, statische HTML/CSS/JS-Tools; deutsche Quelltexte sind die Ausgangssprache. `shared/toolya/i18n/locale.mjs` unterstützt aktuell nur `de` und `en`.
- Der vorhandene `i18next`-Singleton (`i18next-singleton.mjs`) registriert alte Kataloge über `i18next-legacy-resources.mjs`. `i18next-runtime-adapter.mjs` übersetzt **nur** ausdrücklich bekannte, anwendungseigene Strings und Präfixe. Ein automatischer Zugriff auf frei eingegebene Daten wäre falsch.
- Bestehende Übersetzungen stehen in mehreren ES-Modulen: `dashboard-copy.mjs`, `marketing-copy.mjs`, `wishes-copy.mjs`, `estate-copy.mjs`, `admin-copy.mjs` und insbesondere `interface.mjs` mit *selektorbasierten* Übersetzungen sowie Dialog-/Laufzeitmeldungen.
- Die Tool-Laufzeit benutzt das gesonderte `tool-entry.mjs` und teilweise Legacy-Übersetzer; Marketingseiten das `marketing.mjs`-Modul; Dashboard die `dashboard-entry.mjs` und `dashboard-dom.mjs`-Komponenten.
- Öffentliche DE/EN-Guide-Paare existieren. Die englischen Guides sind wegen teilweise deutsch bleibender App-Oberflächen **bewusst `noindex,follow`**. Kein Test entfernt diesen Status.
- Das Inventar enthält 12 kanonische Tool-Oberflächen sowie 17 DE/EN-Marketing- und Informationspaare (Startseite, 13 Leitfäden, Galerie, Datenschutz, Impressum). Zusätzlich wird die Dashboard-Oberfläche über die bestehenden `tests/i18n` geprüft.

## Reproduzierbares Inventar der Übersetzungslücken

```bash
npm ci --ignore-scripts
npm run i18n:check
npm run i18n:report
npm run test:i18n
```

Der Bericht wird erzeugt unter `test-results/i18n-quality/REPORT.md` und `report.json`. Zu **jedem der zwölf Tools** führt er die Anzahl vorhandener Selektor-Regeln, in statischem HTML auffindbarer Selektoren, Dialog-/Laufzeit-Einträge und **heuristischer deutscher Textkandidaten** auf. Zu **jeder der 17 Marketingseiten** erfasst er die Sprachkennzeichnung, sichtbare DE/EN-Linkzuordnung und in englischem HTML möglicherweise noch vorhandene deutsche Textstellen.

Die Metadaten stammen aus `docs/i18n/quality-config.json`, die Quellkataloge werden **direkt zur Laufzeit des Audits aus den bestehenden ES-Modulen importiert**. Änderungen am Originaltext werden nicht vorgenommen. Der Bericht liefert außerdem Namespace-Zählungen der DE- und EN-Schlüssel und konkret benannte Prüffälle für ungleiche Interpolationsplatzhalter.

**Wichtige Unterscheidung:** Ein deutscher statischer Text ist noch **kein bewiesener Übersetzungsfehler**. Viele Texte werden erst im Browser durch Selektoren ersetzt, und einige Selektoren zeigen nur auf dynamisch erzeugte Komponenten. Die statischen Zahlen sind überprüfbare **Review-Kandidaten**, nicht Prozentsätze der tatsächlich unübersetzten Nutzeroberfläche. Einen sicheren echten Abdeckungsprozentsatz können wir daraus noch nicht behaupten. Die vollständige fachliche Prüfung erfordert zusätzliche UI-Szenarien in authentifizierten, isolierten Testumgebungen.

## Automatische Qualitäts-Gates

- Harte Fehler: fehlendes DE/EN-Marketingseitenpaar, falsches `lang`, fehlende Sprachwahl, versehentlich entfernte `noindex`-Kennzeichnung bei englischen Guides, fehlender oder leerer Eintrag im bestehenden i18next-Ziel-Namespace, ungültige Routen-Konfiguration und beschädigtes Glossar.
- Review-Hinweise: unterschiedliche Platzhalter (`{{name}}`, `{amount}`, `${value}`, `%s`), dynamische oder statisch nicht auffindbare CSS-Selektoren, deutsch wirkende Texte auf englischen Seiten, horizontales Überlaufen oder abgeschnittene Sprachumschalter bei 320/390 px.
- Die Tests prüfen mit synthetischen Nachrichten, dass Platzhalterfehler erkennbar sind. Die bestehende Dashboard-Sprachumstellung bleibt reversibel und schreibt **keine** nutzereingegebenen Werte um.
- Chromium lädt die 17 englischen Marketing-/Infoseiten lokal bei **320 und 390 px**. Externe Requests werden blockiert; Sprachwechsel, Sichtbarkeit des DE-Umschalters und unveränderte lokale Beispiel-Nutzerdaten/Maskottchenwahl werden geprüft. Layoutwarnungen werden als eigene JSON-Evidenz abgelegt und zunächst bewusst **nicht** als produktive Korrektur umgesetzt.
- Der GitHub-Workflow `.github/workflows/i18n-quality.yml` führt bestehende und neue `tests/i18n/*.test.mjs` und den lokalen Browser-Audit auf Pull Requests aus. Es gibt keine echten Authentifizierungen, Supabase-Zugriffe, Testmails oder Veränderungen an Live-Daten.

## Versioniertes Glossar

`docs/i18n/glossary.json` enthält bevorzugte DE/EN-Begriffe mit Kontext und die geschützte Wortmarke. Neue Übersetzungen sollen das Glossar berücksichtigen, aber bestehende freigegebene Texte **nicht automatisch überschreiben**. Toolya, Amazon, Nutzernamen, Passwörter, benutzererzeugte Beschreibungen, Diagnosen, Zahlen, IDs, Platzhalter und URLs dürfen nicht blind übersetzt werden.

## Prüfung von `i18next-cli`

[i18next-cli](https://github.com/i18next/i18next-cli) bietet Extraktion aus JS/TS, Linting, Locale-Synchronisierung und optional Type-Erzeugung. Die aktuelle CLI erkennt primär Schlüssel in üblichen `t()`-Aufrufen beziehungsweise konfigurierten AST-Stellen. Toolya hat jedoch viele **deutschschlüsselbasierte `Object.freeze`-Kataloge**, Selector-Paare in Arrays und Legacy-DOM-Zuordnungen. Diese lassen sich **nicht einfach durch `i18next-cli extract` erfassen**, insbesondere HTML-Quelltexte und selektorbasierte Zuordnungen ohne zusätzliche Plugins/AST-Regeln. Ein unkontrollierter `extract`-/`sync`-Schritt könnte bestehende Übersetzungen umschreiben. Deshalb bewusst **nicht installiert, nicht auf produktiven Katalogen ausgeführt**. Nach Migration zu stabilen, in `t()` referenzierten Keys kann eine separate CLI-Konfiguration im isolierten Branch sinnvoll sein.

## Prüfung von `i18n-check`

[@lingual/i18n-check](https://github.com/lingualdev/i18n-check) prüft parallel aufgebaute Sprachdateien und kennt das i18next-Format. Toolya speichert die primären Quellen aber in ES-Modulen und die Selector-Metadaten sind **EN-only**. Darum exportiert dieser Audit für die vorhandenen bilingualen i18next-Namespaces **read-only** unter `test-results/i18n-quality/catalogues/{de,en}/*.json` eine vergleichbare Kopie. `_selectors`-Metadaten sind bewusst ausgenommen; es wäre fachlich falsch, dafür eine fiktive deutsche JSON-Übersetzung zu erzeugen.

Diese Exporte können künftig durch `i18n-check` separat geprüft werden; **die CLI selbst ist nicht installiert und wurde nicht als bestanden behauptet**. Vor einer solchen Integration muss die aktuell gewählte CLI-Version und die Verzeichnis-/Source-Locale-Konfiguration verifiziert werden. Die vorhandenen Node-Tests prüfen Namespace-Gleichheit, leere Einträge und Platzhalter schon jetzt ohne neue npm-Abhängigkeit.

## Sicherheit und Freigabe

Die Prüfungen erzeugen ausschließlich lokale Reports und GitHub-Actions-Artefakte. Bei einem echten Übersetzungs-PR müssen die Inhalte, rechtliche Texte, Fachbegriffe, Account-/Nachlass-Meldungen, mobile Layouts und die beiden Maskottchen separat geprüft werden. Keine neuen öffentlichen englischen SEO-Seiten indexieren, solange die App-Übersetzung unvollständig ist. **Kein Merge oder Deployment allein aufgrund dieses Inventars.**

**Referenzen:** `AGENTS.md`, `docs/ai/ARCHITECTURE.md`, `tests/i18n/marketing.test.mjs`, `tests/i18n/interface.test.mjs` sowie die bestehenden `shared/toolya/i18n/*.mjs`-Module.
