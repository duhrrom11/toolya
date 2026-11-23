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
- docs/ai/TOOL-GENERATOR.md beschreibt Grenzen, Tests und das Release-Gate.

## Dokumentationsquellen

- docs/ai/ARCHITECTURE.md – Architektur, Code-Map, Markenregeln und Quellenhierarchie.
- docs/ai/DEVELOPMENT-WORKFLOW.md – autonomer Entwicklungsablauf und Qualitätsgates.
- docs/ai/TOOL-GENERATOR.md – Nutzung und Grenzen des lokalen Scaffolds.
- docs/ai/project-map.json – maschinenlesbare Orientierung.
- docs/TOOLYA-RELEASE-STATUS.md und docs/TOOLYA-MASCOT-UNIVERSE-WORK-ROADMAP.md – Release-Historie, ältere Abschnitte ausdrücklich historisch lesen.
