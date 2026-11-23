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
