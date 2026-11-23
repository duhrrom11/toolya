# Toolya

Zwölf kostenlose Alltagstools auf https://toolya.app, veröffentlicht über GitHub Pages aus `main`.

Der Maskottchen-Release ist live: beide flauschigen Begleiter, je 16 Emotionen mit zwei Frames, toolbezogene Outfits, freiwillige Ko-fi-Aufrufe und Kitzel-Easter-Egg. Acht Original-PNGs unverändert. PR #9 und Release-Commit `72303962` sind veröffentlicht; Pages und alle Prüfungen auf main erfolgreich. Alle zwölf öffentlichen Tool-Routen wurden live auf Erreichbarkeit geprüft.

Die bestehende Wishlist unter `/tools/wishes/` und ihr Amazon-Importer bleiben erhalten. Supabase-Projekt: `yheogmeaosuigyaxkwth`. Nachlass-Backend und Mail-Worker aktiv; Brevo-Konfiguration erkannt, kein echter Versandtest durchgeführt. Bisherige Helferlein-Konten, Daten und Hosting werden nicht überschrieben oder automatisch übertragen.

[Release-Nachweise](docs/TOOLYA-RELEASE-STATUS.md) · [Master-Roadmap](docs/TOOLYA-MASCOT-UNIVERSE-WORK-ROADMAP.md)

## KI-Entwicklung und neue Tool-Prototypen

[Agentenregeln](AGENTS.md) · [AI-Architektur](docs/ai/ARCHITECTURE.md) · [Entwicklungsablauf](docs/ai/DEVELOPMENT-WORKFLOW.md) · [Tool Generator](docs/ai/TOOL-GENERATOR.md)

Der Offline-Scaffold (`npm run tools:scaffold -- --help`) erzeugt nur unveröffentlichte Tool-Entwürfe. Isolierte Prüfungen: `npm run test:ai`. Die vorhandenen Tools und das produktive Supabase-Projekt werden dadurch nicht verändert.

### Tool Builder – unveröffentlichte Entwürfe

[Funktionsvorlagen und lokale Vorschau](docs/ai/TOOL-BUILDER.md) – Vorlagen `counter`, `percentage`, `checklist` sowie generierte Node-Tests. Alle lokalen Entwürfe bleiben `noindex` und werden nicht automatisch zur Live-Webseite oder Supabase hinzugefügt.

```bash
npm run tools:scaffold -- --slug mein-testtool --title 'Mein Testtool' --description 'Ein einfacher lokaler Entwurf.' --template counter --dry-run
npm run tools:preview -- --slug mein-testtool
```

Der Vorschau-Befehl funktioniert erst **nach** Anlegen des Entwurfs ohne `--dry-run`; er ist ausschließlich über `127.0.0.1` erreichbar.

### ChatGPT → Tool Builder (strukturierte Tool-Ideen)

Die [ChatGPT-Übergabeanleitung](docs/ai/CHATGPT-TOOL-HANDOFF.md) erklärt, wie ein Coding-Agent eine Idee in ein streng validiertes [Tool-Brief-JSON](docs/ai/tool-brief.schema.json) überführt. Die CI erstellt daraus einen unveröffentlichten Entwurf samt Tests und einem überprüfbaren GitHub-Artefakt; keine externen KI-API-Schlüssel oder produktiven Supabase-Daten nötig.

```bash
npm run tools:from-brief -- --spec docs/ai/briefs/ai-prozentrechner-entwurf.json --dry-run --json
npm run tools:build-briefs
```

Das zweite Kommando ist für isolierte Entwickler-/CI-Checkouts vorgesehen und erzeugt temporäre Vorschauen unter `test-results/ai-brief-artifacts/`; es nimmt **keinen** Git-Commit und keine Veröffentlichung vor.

### Übersetzungsqualität DE/EN

[Toolya Translation Quality System](docs/i18n/README.md) und [verifiziertes DE/EN-Inventar](docs/i18n/INVENTORY.md): schreibgeschützter Inventarbericht für die zwölf Tools und 17 Marketing-/Informationsseiten, versioniertes [Glossar](docs/i18n/glossary.json), Katalog-/Platzhaltertests und isolierte Browser-Prüfungen bei 320/390 px.

```bash
npm ci --ignore-scripts
npm run i18n:check
npm run i18n:report
npm run test:i18n
```

Berichte und DE/EN-JSON-Exporte werden lokal unter `test-results/i18n-quality/` abgelegt. Keine automatische Änderung von Kundendaten, Laufzeitübersetzungen oder Suchmaschinenindexierung.

### Allgemeine ChatGPT-Produktivität (ohne zusätzlichen Dienst)

Sechs wiederverwendbare Arbeitsmuster und vier schlanke Kontextpakete für Recherche, Entwicklung, Marketing, Entscheidungen, Dokumente und Automatisierung: [ChatGPT Productivity System](docs/ai/productivity/README.md).

```bash
npm run productivity:list
npm run productivity:prompt -- --render --pattern research --context toolya-core --task 'Vergleiche aktuelle Optionen mit geprüften Quellen.'
npm run productivity:check
```

Die Muster sind direkt in ChatGPT übertragbar. Die lokalen Prüfungen verwenden nur synthetische Beispiele, keine Modellaufrufe oder Supabase-Daten. Externe Werkzeuge (Fabric CLI, Promptfoo, MarkItDown, n8n) werden nicht automatisch installiert oder aktiviert.
