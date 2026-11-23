# Toolya Tool Builder – Version 0.3

Stand: 23.11.2026. Diese Entwicklungsfunktionen sind Teil eines offenen Pull Requests und **nicht** auf `main`/toolya.app veröffentlicht.

Der Builder ergänzt den vorhandenen Offline-Generator um drei funktionsfähige, wiederverwendbare Beispiele, automatisch erzeugte Node-Tests und eine abgeschottete lokale Vorschau. Er benötigt außer Node.js keine neuen Produktivabhängigkeiten.

## Vorlagen und Bausteine

| Vorlage | Eingabe | Wiederverwendbare Logik | Speicherung |
| --- | --- | --- | --- |
| `starter` (Standard) | Keine | Platzhalter-Button | Keine |
| `counter` | Buttons +1 / −1 | `counterStep` mit Grenzen | Nur Arbeitsspeicher |
| `percentage` | Teil / Gesamt | `percentageOf`, prüft Eingaben und null/negative Nenner | Keine |
| `checklist` | Eintrag hinzufügen / entfernen | `addChecklistItem`, `removeChecklistItem` | Nur Arbeitsspeicher |

Die gemeinsamen reinen Funktionen liegen unter `shared/toolya/tool-builder/blocks.mjs`. Die Funktionsvorlagen sind in `scripts/tool-builder.cjs` definiert. Sie greifen **nicht** auf Supabase, Netzwerke, Browser-Speicher oder produktive Nutzerdaten zu.

Der Builder nutzt weiterhin `shared/toolya/platform.mjs` für Header, Footer, Wortmarke und die gespeicherte Charakterwahl. Vorhandene Tool-Rollen können über `--outfit` als Entwurfsillustration genutzt werden. Eine neue Tool-Registrierung findet nicht statt.

## 1. Entwurf prüfen und erstellen

```bash
npm run tools:scaffold -- \
  --slug mein-prozentrechner \
  --title "Mein Prozentrechner" \
  --description "Ein einfacher Rechner für Prozentwerte." \
  --outfit budget \
  --template percentage \
  --dry-run
```

Nach Prüfung der Ausgabe `--dry-run` entfernen. Der Befehl erstellt nur ein **neues** Verzeichnis `tools/mein-prozentrechner/` und überschreibt niemals ein bestehendes. Bei `counter`, `percentage` und `checklist` entstehen vier Dateien: `index.html`, `app.mjs`, `app.test.mjs` und `README.md`. Der reine `starter` erstellt wie bisher drei Dateien.

## 2. Automatisch erzeugten Test ausführen

```bash
node --test tools/mein-prozentrechner/app.test.mjs
npm run test:ai
```

Das generierte `app.test.mjs` demonstriert die geprüfte, reine Funktion. Es ist ein **Ausgangspunkt**: Für eine produktive Fachfunktion müssen zusätzliche fachliche Randfälle und echte UI-Tests ergänzt werden.

## 3. Lokale Vorschau öffnen

```bash
npm run tools:preview -- --slug mein-prozentrechner --port 4173
```

Anschließend im **lokalen Browser** `http://127.0.0.1:4173/tools/mein-prozentrechner/` öffnen. Der Server bindet ausschließlich `127.0.0.1` und akzeptiert nur `GET`/`HEAD`. Er liefert die neue Entwurfsseite, ihr `app.mjs`, die benötigten öffentlichen `shared/toolya/`-Module und statische Assets aus. Repository-Konfigurationen, Tests, andere Tools, Supabase-Migrationen, versteckte Dateien und Schreiboperationen werden nicht ausgeliefert.

Die strenge Preview-CSP setzt `connect-src 'none'` und verhindert Browser-API-Verbindungen; es gibt keinen API-Proxy. Externe Ressourcen und Drittanbieter-Integrationen sind in dieser Vorschau nicht funktionsfähig. Die Vorschau ist **nicht** als öffentliches Hosting, sichere Sandbox für fremden Code oder Produktionstest gedacht. Nur auf vertrauenswürdigen Entwicklerrechnern verwenden.

## Automatische Absicherung im PR

- `npm run test:ai`: Generator-Sicherheit, Funktionsbausteine, Beispiel-Testdateien, Vorschau-Routen und Ablehnung anderer Dateien.
- `node tests/ai/tool-generator.browser.cjs`: bisherige gemeinsame Maskottchen-/Header- und Footer-Prüfung.
- `node tests/ai/tool-builder.browser.cjs`: alle drei funktionalen Vorlagen in isoliertem Chromium, mit abgeblockten externen Requests und ohne echte Nutzerkonten.
- Die GitHub Action `ai-development.yml` führt diese Prüfungen im PR aus, ohne Secrets und ohne Supabase-Verbindung. Failures müssen im PR überprüft und behoben werden.

## Grenzen vor einem Release

- Ein Builder-Ergebnis ist **kein fertiges Tool**. `noindex,nofollow`, nicht in Navigation, Sitemap, Tool-Inventar oder `TOOLS` registriert.
- Keine E-Mail, Authentifizierung, Account-Synchronisation, Cloud-Speicherung, Hintergrundprozesse oder Datenmigration.
- Fachfunktion, Barrierefreiheit, mobile Qualität, DE/EN-Texte, Sicherheitsfreigaben und Produktlogik müssen vor Veröffentlichung gesondert geprüft werden.
- Die acht Original-PNGs bleiben unverändert, ebenso die vorhandenen zwölf Tools, Wishlist/Amazon-Importer und alle produktiven Supabase-Daten.
- Das unabhängige Dashboard-320-px-Problem aus Issue #315 wurde in PR #316 separat behoben und nach vollständig erfolgreicher CI auf `main` übernommen. Die Builder-Änderungen müssen gegen den aktualisierten Hauptbranch erneut geprüft werden.

Siehe `AGENTS.md`, `docs/ai/ARCHITECTURE.md` und `docs/ai/TOOL-GENERATOR.md`.

## Schnittstelle zu ChatGPT (Version 0.4)

Für KI-gestützte neue Tool-Ideen gibt es zusätzlich den [ChatGPT-Handoff](CHATGPT-TOOL-HANDOFF.md): ChatGPT übersetzt die natürliche Aufgabenbeschreibung in ein strikt validiertes JSON-Briefing unter `docs/ai/briefs/`, der Builder erzeugt daraus nur einen Offline-Entwurf und kennzeichnet noch offene Kriterien. GitHub Actions stellt die Ergebnisse als überprüfbares Artefakt zur Verfügung, ohne automatisch zu committen oder zu deployen.

Validierung: `npm run tools:from-brief -- --spec docs/ai/briefs/ai-prozentrechner-entwurf.json --validate-only --json`.
