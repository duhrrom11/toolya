# Toolya AI Development System – Architektur und Kontext

Stand der Bestandsaufnahme: 23.11.2026. Diese Datei ist ein Navigations- und Entscheidungsdokument, kein Ersatz für aktuelle Quellen im Repository.

## Reihenfolge der Quellen

1. AGENTS.md: verbindliche Regeln und Sicherheitsgrenzen für Coding-Agenten.
2. Tatsächlicher Code auf dem Zielbranch und aktuelle Tests (höchste technische Aussagekraft).
3. docs/ai/project-map.json: maschinenlesbarer, geprüfter Wegweiser, keine automatisch aktualisierte Dateiliste.
4. docs/runtime-port-inventory.json: die zwölf kanonischen Tool-Routen.
5. docs/TOOLYA-RELEASE-STATUS.md und historische Mascot-Roadmap: Release-Historie; ältere Abschnitte können überholt sein.
6. Für Supabase-Schema/Policies: Migrationen und aktive Konfiguration getrennt prüfen; niemals die Historie als Live-Beleg interpretieren.

## Bestehende Architektur (per Repository geprüft)

- Ziel: https://toolya.app. Statisches Hosting über GitHub Pages von main. Kein React-, Next.js- oder Vite-Monorepo.
- Frontend: HTML-Seiten unter tools/<slug>/, CSS, JavaScript und ES-Module.
- Gemeinsame Laufzeit: shared/toolya/platform.mjs mit Header-, Footer-, Maskottchen- und Einstellungsintegration; shared/toolya/buddy.mjs; weitere gemeinsame Styles unter shared/toolya/.
- Cloud-Zustandsverwaltung: shared/toolya/cloud-controller.mjs. Operationen müssen bestätigte Remote-Antworten prüfen; keine ungefragten lokalen Schreib-Fallbacks.
- Bestehende Webtools: baking, budget, car, estate, housemates, loans, meters, moving, parking, pet-health, plants, wishes.
- Bestehende Prüfungen: Node-Tests (tests/platform/, tests/mascot/, tests/amazon/, tests/security/) und isolierte Playwright-Prüfungen.
- GitHub Actions: .github/workflows/mascot-release.yml, amazon-scraper.yml; weitere themenbezogene Workflows wie connect-due-tasks.yml und moving-planner.yml.
- Produktives Backend: eigenständiges Toolya-Supabase-Projekt; Browser-/Laufzeitschlüssel sind keine Berechtigung zum Überschreiben von Daten.

## Unveränderliche Produktprinzipien

- Die zwei festgelegten Charaktere (türkis/weiß und lila/creme) und ihre Nutzerauswahl bleiben erhalten. Die Themenfarbe darf die Charakterauswahl nicht überschreiben.
- Die vorhandenen acht Original-PNGs in assets/toolya/originals/ bleiben bytegleich; SHA256SUMS ist der Prüfanker.
- Header und Footer müssen die vorhandene identische Toolya-Wortmarke verwenden; keine improvisierten Logos.
- Gemeinsamer Footer und nutzergewählte Maskottchen erscheinen in allen bestehenden Tools; bei neuen Tools erst prüfen und dann freischalten.
- Wishlist/Amazon-Importer, Nachlass-Sicherheitsgates, vorhandene Konten und Datensätze nicht beeinträchtigen.
- Erst barrierefrei und responsive; Tastatur, reduzierte Bewegung, Statusmeldungen, Datenschutz sowie vorhandene Locale-Ansätze prüfen.

## Grenzen und ehrliche Statusangaben

- Ein Scaffold ist ein unveröffentlichter HTML/JS-Entwurf, kein fertig entwickeltes oder automatisch registriertes, lokalisiertes Tool.
- Neue Slugs fehlen zunächst in der TOOLS-Zuordnung von platform.mjs. Explizite Draft-Metadaten dürfen eine vorhandene Outfit-Rolle für den bestehenden Header-/Footer-/Maskottchen-Renderer ausleihen; ohne gültige Draft-Metadaten gilt weiterhin der Home-Fallback.
- Die Entwurfsdarstellung achtet auf die gespeicherte Maskottchen-Auswahl; die Freigabe einer neuen Tool-Rolle bleibt ein separater Pull Request.
- Projekt-Wissensdateien werden nur durch Commits aktualisiert; sie sind keine Echtzeit-Indexierung und kein automatischer ChatGPT-Memory-Sync.
- Neue Tool-Module und neue Backend-Abhängigkeiten benötigen eigene Tests und dokumentierte Entscheidungen.
- Auth, Datenbank, Secrets, E-Mail und Deployments sind nicht Bestandteil des Scaffolds.

## Weitere Einstiegspunkte

- docs/ai/DEVELOPMENT-WORKFLOW.md: Arbeitsablauf und Akzeptanzkriterien.
- docs/ai/TOOL-GENERATOR.md: sichere CLI, Grenzen und Release-Checkliste.
- docs/ai/project-map.json: gepflegte, maschinenlesbare Pfade.
- AGENTS.md: verpflichtende Regeln.
