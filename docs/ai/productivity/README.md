# ChatGPT Productivity System – Version 1.0

Ziel: wiederholbare, effiziente ChatGPT-Arbeit **über das Coding hinaus**. Versionierte eigene Promptmuster, kontextsparsame Projektprofile und überprüfbare Ergebnisverträge. Alle neuen Werkzeuge sind rein lokal, ohne Modellaufruf, Zugangsschlüssel oder Supabase-Zugriff.

## Schnellstart

```bash
# Verfügbare Arbeitsmuster und erlaubte Kontextprofile
npm run productivity:list

# Eine konkret nutzbare ChatGPT-Anweisung zusammenstellen und kopieren
npm run productivity:prompt -- --render --pattern research --context toolya-core --task 'Untersuche die wichtigsten Alternativen für die nächste Toolya-Funktion mit aktuellen Belegen.'

# Deterministische Strukturprüfungen inklusive absichtlich fehlerhafter Beispiele
npm run productivity:check
```

Das Ergebnis der zweiten Zeile ist **nur Text zur Verwendung in ChatGPT**; es wird weder an ein Modell gesendet noch als ChatGPT-Profil installiert. Projektkontexte werden dabei nur für die aktuelle Aufgabe ausgewählt. Die Vorgaben in `AGENTS.md` bleiben für Entwicklungsarbeiten verbindlich.

## Arbeitsmuster

| Muster | Zweck | Typische Kontexte |
| --- | --- | --- |
| `research` | Quellengestützte Recherche, Trend- und Wettbewerbsanalyse | `general`, `toolya-core` |
| `implementation` | Softwareentwicklung, PR, Tests, Freigabestatus | `general`, `toolya-engineering` |
| `marketing` | Content-Entwürfe, Faktenprüfung, KPI-Konzept | `general`, `toolya-marketing` |
| `decision` | Vergleich, Empfehlungen, Risiken und Ungewissheit | `general`, `toolya-core` |
| `document` | Dokumentenextraktion, Fundstellen, Aufgaben und Lücken | `general`, `toolya-core` |
| `automation` | Wiederkehrende Aufgaben, Berechtigungen und Aktivierung | `general`, `toolya-core` |

Die zugehörigen, **selbst formulierten** Muster liegen in `patterns/*.md`. Sie orientieren sich am Prinzip wiederverwendbarer Fabric-Muster, sind aber keine kopierten Fabric-Prompts. `catalog.json` ist die verbindliche Wegweisung für Muster, erlaubte Kontexte und Ausgabeabschnitte.

## Qualitätskontrolle: Was tatsächlich geprüft wird

- `scripts/productivity.cjs --check` prüft alle Muster- und Kontextpfade, Pflichtabschnitte und 12 rein **synthetische** Antwortbeispiele (je 1 positiver und 1 negativer Fall pro Muster).
- Ausgaben werden auf die für den jeweiligen Aufgabentyp vereinbarten Überschriften, ausreichenden Abschnittstext und deren Reihenfolge geprüft.
- Recherche/Dokumentation benötigt einen strukturellen Fundstellenhinweis oder das explizite Kennzeichen fehlender Verifikation. Entwicklungs- und Automationsausgaben müssen ihren Status benennen.
- `tests/ai/productivity.test.cjs` prüft zusätzlich Kontextisolation, ungültige Eingaben, erlaubte Auswahlen und die CLI. Die vorhandene `test:ai`-CI führt alles ohne API- oder Kundendaten aus.

**Wichtig:** Die Qualitätssicherung ist bewusst **deterministisch und strukturell**. Sie überprüft weder den Wahrheitsgehalt einer Quelle noch die Qualität einer tatsächlichen ChatGPT-Modellantwort, wenn diese nicht ausdrücklich als Testeingabe geliefert wird. Ein erfolgreiches Beispiel behauptet keine Produktivwirkung oder höhere KI-Qualität. Für Modellvergleiche wäre Promptfoo mit einer getrennten, ausdrücklichen Modellkonfiguration nötig.

## Kompatibilitätsentscheidung (geprüfte Upstream-Repos, 23.11.2026)

| Repository | Kompatibilität zur ChatGPT-Arbeit | Entscheidung |
| --- | --- | --- |
| [Fabric](https://github.com/danielmiessler/Fabric) | Markdown-Promptmuster können direkt gelesen/kopiert und in ChatGPT benutzt werden. Fabric CLI benötigt eigene Installation, Konfiguration und Modellzugang. | Musterprinzip übernommen, **Fabric CLI nicht installiert**. |
| [Promptfoo](https://github.com/promptfoo/promptfoo) | Modell-/Prompt-Evaluation über separate Provider (API oder lokal), nicht als automatische Auswertung aller privaten ChatGPT-Unterhaltungen. Optionaler JS-Fixture-Provider liegt unter `promptfoo/`. | Offline-Node-Vertragsprüfungen sind das verbindliche CI-Gate. Promptfoo selbst **nicht als npm-Abhängigkeit installiert**, optionales Beispiel noch kein Modell-Benchmark. |
| [MarkItDown](https://github.com/microsoft/markitdown) | Python-CLI für lokale PDF-/Office-Konvertierung in KI-freundliches Markdown. ChatGPT kann verbundene/hochgeladene Dokumente bereits direkt verarbeiten. | **Nicht installiert**; bei echten Konvertierungsproblemen gezielt einsetzen, Extrakte manuell gegen Original prüfen. |
| [n8n](https://github.com/n8n-io/n8n) | Separater Cloud-/Self-hosted Workflow-Server, eigene App-Credentials und Betrieb. Keine direkte n8n-Action im aktuell verbundenen Workflow festgestellt. | **Nicht installiert/verbunden**. Erst konkrete wiederkehrende Aufgabe identifizieren und vorhandene ChatGPT-Automationen und Apps prüfen. |

Upstream-Verweise: [Fabric-Promptmuster](https://github.com/danielmiessler/Fabric/blob/main/README.md), [Promptfoo-Provider](https://www.promptfoo.dev/docs/providers/custom-api/), [Promptfoo-Assessments](https://www.promptfoo.dev/docs/configuration/expected-outputs/), [MarkItDown-CLI](https://github.com/microsoft/markitdown), [n8n-Lizenz und Selfhosting](https://github.com/n8n-io/n8n). Diese Dokumentation ist ein Integrationsstand, keine Behauptung über zukünftige Plugins oder Kontozugriffe.

## Optional: Promptfoo-Interoperabilität

`promptfoo/promptfooconfig.yaml` und `promptfoo/fixture-provider.cjs` demonstrieren sechs reine Fixture-Checks ohne echte Modelle. Der Provider gibt **nur bereits eingecheckten synthetischen Text** zurück. Er wird bewusst nicht in CI installiert oder zum LLM-Test hochgestuft.

Für eine separate, kontrollierte Entwicklerumgebung mit Promptfoo CLI und Node.js >= 22.22:

```bash
# Nur synthetische Testdaten, keine personenbezogenen Daten oder Keys.
promptfoo eval -c docs/ai/productivity/promptfoo/promptfooconfig.yaml --no-share --no-cache
```

Die Kommandozeile wurde in dieser Integration **nicht als echter Promptfoo-Lauf ausgeführt**. Die optionale Installation kann Netzwerkzugriffe verursachen; auch `--no-share` schützt nicht automatisch vor Datenübertragung durch einen später ausgewählten Remote-Modellprovider. Eigene Modelltests deshalb nur mit expliziter Freigabe, geeigneten Testdaten und überprüften Provider-Einstellungen durchführen.

## Dokumente und Automatisierungen

**Dokumente:** Vorhandene ChatGPT-Datei- und Quellenzugriffe bevorzugen. Falls lokal ein komplexes Dokument nach Markdown umgewandelt werden muss, MarkItDown ausschließlich in einem geeigneten abgeschotteten Arbeitsverzeichnis und nach Bedarf installieren. Der aufbereitete Text muss anhand von Tabellen, Seiten, Fußnoten und Anhängen gegen das Original gegengeprüft werden. Keine geheimen Inhalte automatisch in GitHub speichern.

**Workflows:** Für Terminaufgaben erst die vorhandenen ChatGPT-Automationen und die verbundenen Apps nutzen. n8n würde einen zusätzlichen Server, Credentials, Updates, Netzwerk- und Berechtigungskonzept benötigen. Deshalb keine generischen aktiven n8n-Flows und keine Webhooks mit Produktivschlüsseln in diesem PR.

## Pflege des Systems

Neue Muster: eigene `patterns/<id>.md`, passende Route und Ausgabeabschnitte in `catalog.json`, mindestens ein synthetischer Positiv- und Negativfall in `fixtures.json`, danach `npm run productivity:check` und PR. Kontexte so klein wie möglich halten, aktuelle Quellen höher bewerten als alte Zusammenfassungen und keine privaten Chatverläufe, Tokens oder persönliche Dokumente in öffentliche Repository-Dateien übernehmen.

Dieses System ist eine **Arbeitsvorlagen- und QA-Schicht**, kein dauerhafter KI-Agent, kein Ersatz für das ChatGPT-Gedächtnis, keine automatische Aktivierung von Plugins und kein Ersatz für fachliche menschliche oder automatisierte End-to-End-Prüfungen.
