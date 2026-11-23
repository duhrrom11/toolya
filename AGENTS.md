# Toolya – verbindliche Entwicklungshinweise für KI-Agenten

Repository: duhrrom11/toolya. Production target: https://toolya.app (niemals tooly.app). Deployment derzeit über GitHub Pages von main.

## Zu Beginn jeder Entwicklungsaufgabe

1. Dieses AGENTS.md lesen, danach docs/ai/ARCHITECTURE.md, docs/ai/DEVELOPMENT-WORKFLOW.md und die betroffenen Originaldateien/Tests.
2. docs/ai/project-map.json ist ein Einstiegspunkt, **nicht** das Live-Schema oder eine vollständige Dateiliste. Aktuellen Branch-Code vor Entscheidungen prüfen.
3. Bereits existierende Module unter shared/toolya/ wiederverwenden, insbesondere platform.mjs, buddy.mjs und cloud-controller.mjs. Keine vorschnelle React/Next.js-Migration.
4. Arbeit auf einem separaten Branch, gezielte Tests, Pull Request (PR) und klare Statusmeldung. Kein ungeprüfter Merge oder Release. Historische Statusmeldungen sind kein Beleg für heutige Deployments.

## Bestehende Produkt- und Markenregeln

- Bewahre alle acht PNGs in assets/toolya/originals/ Byte für Byte. SHA256SUMS verifizieren. Niemals Originaldateien überschreiben.
- Beide festgelegten Toolya-Maskottchen erhalten (türkis/weiß und lila/creme); die Nutzerauswahl bleibt auch in thematischen Tool-Headern und im Footer maßgeblich.
- Header und Footer verwenden dieselbe festgelegte Wortmarke/das identische Asset. Keine improvisierten Logos oder abweichenden Schriftzüge.
- Die zwölf vorhandenen Tool-Routen, die Wishlist und der Amazon-Importer müssen intakt bleiben; die Startseite nicht ohne Auftrag umgestalten.
- Tastatur, Fokus, mobile Ansicht, reduzierte Bewegung, Datenschutz, vorhandene Locale-Funktion und sachlich richtige Erfolgs-/Fehlermeldungen beachten.

## production: Supabase und Datensicherheit

- Produktives Toolya-Supabase-Projekt yheogmeaosuigyaxkwth; niemals Laufzeit-Clients auf das frühere Helferlein-Projekt umstellen.
- Bestehendes Helferlein bleibt unverändert. Keine Nutzer- oder Browserdaten automatisch zwischen Origins übertragen.
- Keine Testdatensätze, Testmails, Probealarme oder destruktiven Prüfungen in produktiven Tabellen. Tests lokal/isoliert und ohne externe Requests ausführen.
- Keine Secrets oder echte personenbezogene Daten in Code, Chat-Ausgaben, Fixtures oder Commit-Nachrichten aufnehmen.
- Auth, RLS, Rechte und bestätigte Cloud-Antworten nicht umgehen; kein stiller Offline-Fallback, keine unbelegten Speicherungserfolge.
- Nachlass-Alarme bleiben ohne bestätigte Mail-Provider-Konfiguration fail-closed; keine fiktiven Zustellbestätigungen.
- Datenbankmigrationen oder produktive Deployments nur mit passenden Sicherheitsprüfungen; nichts als live behaupten, bevor es verifiziert ist.

## Tool Generator und Tests

- Der Offline-Generator scripts/create-tool.cjs erzeugt nur neue, unveröffentlichte noindex-Prototypen. Niemals bestehende Tool-Pfade überschreiben.
- Neue Tool-Routen zunächst nicht als produktiv registrieren. Neue Slugs brauchen eigene TOOLS-/Maskottchen-, Navigation-, SEO- und Sicherheitsprüfung.
- Minimalprüfungen: node --check scripts/create-tool.cjs; node --test tests/ai/*.test.cjs. Relevante bestehende Prüfungen zusätzlich ausführen.
- docs/ai/TOOL-GENERATOR.md und docs/ai/TOOL-BUILDER.md beschreiben Funktionsvorlagen, lokale Vorschau, Testgenerierung und das Release-Gate.
- Für neue Funktionen ausschließlich die reinen Offline-Bausteine in shared/toolya/tool-builder/blocks.mjs verwenden, bis fachliche Backend-Integration ausdrücklich geprüft wurde. Keine persistenten Daten oder Produktions-API-Aufrufe in generierte Testvorlagen aufnehmen.

## ChatGPT → Tool Builder (AI-Handoff v0.4)

- Für neue Tool-Ideen aus natürlicher Sprache zuerst die reale Plattformstruktur prüfen und anschließend eine **deklarative**, versionierte JSON-Beschreibung nach `docs/ai/tool-brief.schema.json` erstellen; Details in `docs/ai/CHATGPT-TOOL-HANDOFF.md`.
- Die JSON-Datei liegt als `docs/ai/briefs/<slug>.json` vor und erlaubt ausschließlich die vorhandenen vier Offline-Vorlagen. `scope` muss `offline-draft` sein. **Niemals** Skriptcode, SQL, Secrets oder Produktiv-Daten in den Brief einfügen.
- `npm run tools:from-brief -- --spec docs/ai/briefs/<slug>.json --dry-run --json` prüft die maschinenlesbare Übergabe ohne Schreibwirkung.
- Die isolierte GitHub-CI erstellt aus Briefs reviewbare Entwürfe und Test-Artefakte. Das ist **keine** Veröffentlichung, kein automatischer Cloud-Anschluss und kein Beweis für erfüllte Akzeptanzkriterien.
- Nur nach separater Implementierung, isolierten Tests und expliziter Freigabe eine neue Route in Navigation, SEO, Backend oder produktivem Hosting aufnehmen.

## Dokumentationsquellen

- docs/ai/ARCHITECTURE.md – Architektur, Code-Map, Markenregeln und Quellenhierarchie.
- docs/ai/DEVELOPMENT-WORKFLOW.md – autonomer Entwicklungsablauf und Qualitätsgates.
- docs/ai/TOOL-GENERATOR.md – Nutzung und Grenzen des lokalen Scaffolds.
- docs/ai/project-map.json – maschinenlesbare Orientierung.
- docs/TOOLYA-RELEASE-STATUS.md und docs/TOOLYA-MASCOT-UNIVERSE-WORK-ROADMAP.md – Release-Historie, ältere Abschnitte ausdrücklich historisch lesen.

## Übersetzungen und Qualität (DE/EN)

- Vor Übersetzungsänderungen `docs/i18n/README.md`, `docs/i18n/glossary.json` und die tatsächlichen Quellen unter `shared/toolya/i18n/` lesen.
- Die vorhandene i18next-/Legacy-Integration bleibt maßgeblich. Keine zweite Runtime-Bibliothek einführen, keine Kataloge blind durch Extraktion überschreiben.
- `npm run i18n:check`, `npm run i18n:report`, `npm run test:i18n` und den isolierten mobilen Chromium-Test nutzen.
- Ein statischer deutscher Text ist zunächst ein Review-Kandidat; der Bericht darf keine vollständig bestätigte Übersetzungsquote behaupten.
- Wortmarke Toolya, Nutzereinträge, Passwörter, gespeicherte Account-/Cloud-Werte, Anhänge und Mascot-Auswahl niemals übersetzen oder verändern.
- Bestehende englische Guides bleiben noindex, solange fachliche Prüfung und produktive App-Übersetzung nicht abgeschlossen sind; DE/EN-Links und korrektes `lang` erhalten.
- Die Qualitäts-CLI schreibt ausschließlich Berichte und isolierte JSON-Exporte nach `test-results/`, niemals in die produktiven Kataloge. i18next-cli und i18n-check sind evaluiert, aber hier nicht installiert.

## Allgemeine ChatGPT-Arbeit (Productivity System v1)

- Für Recherche, Umsetzung, Marketing, Entscheidungen, Dokumente und Automatisierung passende **eigene** Arbeitsmuster in `docs/ai/productivity/patterns/` nutzen; Index und kompatible Kontextpakete unter `docs/ai/productivity/catalog.json`.
- Nur tatsächlich benötigten Kontext laden (allgemein oder Toolya-spezifisch). AGENTS.md und aktuelle Quelldateien haben Vorrang vor statischen Kurzprofilen.
- `npm run productivity:list` und `npm run productivity:prompt -- --render --pattern research --context general --task '...'` stellen lokal eine kopierbare Anweisung zusammen, **ohne** Modell-API oder ChatGPT-Connector-Einstellungen zu ändern.
- `npm run productivity:check` prüft strukturelle Ausgabeverträge mit synthetischen Fixtures, **nicht** die faktische Richtigkeit echter ChatGPT-Antworten. Fehlende Quellen oder Aktionen ausdrücklich kennzeichnen.
- Fabric-Musterprinzip übernommen; Promptfoo, MarkItDown und n8n sind optionale externe Werkzeuge, derzeit keine Runtime-/CI-Abhängigkeit. Details: `docs/ai/productivity/README.md`.
- Niemals Chat-Inhalte, persönliche Dokumente, API-Keys oder produktive Daten in Prompt-/Fixture-Dateien committen. Keine Automationen, Veröffentlichungen oder Provider-Verbindungen ohne tatsächlich geprüfte Berechtigungen.
