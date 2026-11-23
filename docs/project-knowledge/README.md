# Toolya – zentrale Projektwissensbasis

Stand: 2026-11-22. **Dokumentationsbranch; keine Produktivänderung.**

## Zweck und Verlässlichkeit
Diese Dokumente sind ein Einstiegspunkt für neue Chats und Entwicklungsaufträge. **Repository-Code und aktuelle CI/Deployment-Nachweise** haben Vorrang bei Aussagen über Implementierung; verbindliche Produktentscheidungen stehen in [decisions.md](decisions.md). Historische Chat-Aussagen sind keine aktuellen Live-Nachweise. Bei Widersprüchen nicht stillschweigend überschreiben, sondern mit Datum und Quelle klären.

## Navigation
- [Entscheidungen und Markenregeln](decisions.md)
- [Architektur und Grenzen](architecture.md)
- [Status, offene Arbeiten und Nachweise](status-and-backlog.md)
- [Chat-Bereinigung und Übergabe](chat-retention.md)

## Bestehende maßgebliche Dokumentation
- [Master-Audit](../audits/toolya-master-audit.md)
- [Audit-Roadmap](../audits/toolya-roadmap.md)
- [Release-Status](../TOOLYA-RELEASE-STATUS.md) – historisch, Aktualität prüfen
- [Maskottchen-Roadmap](../TOOLYA-MASCOT-UNIVERSE-WORK-ROADMAP.md) – historisch, Aktualität prüfen
- [Repository-README](../../README.md)

## Arbeitsregel für zukünftige Assistenten
1. Diese Wissensbasis und AGENTS.md (falls vorhanden) lesen.
2. Aktuellen main-HEAD, offene PRs, CI und betroffene Dateien prüfen.
3. Vor Implementierung entscheiden: verbindlich, Idee, historisch oder offen.
4. Keine echten Testdaten in produktivem Supabase; keine ungefragten Produktionsänderungen.
5. Nach abgeschlossener Arbeit Dokumentation mit konkreten PR-/Commit-/Testnachweisen aktualisieren.

**Grenze:** Die gesamte frühere Chat-Historie wurde nicht vollständig exportiert. Diese Wissensbasis ist eine geprüfte Erstkonsolidierung der verfügbaren Erinnerungen und eingelesenen GitHub-Dokumente, kein verlustfreies Archiv sämtlicher Chats.

## Thematische Konsolidierung (23.11.2026)

Aus dem ChatGPT-Export vom 22.11.2026 wurden 103 Gespräche inventarisiert und nach Hauptthema eingeordnet. Die folgenden Dateien sind **kuratierte Zusammenfassungen**, keine Rohtranskripte oder vollständigen Live-Nachweise:

- [Marke, Design und Maskottchen](categories/01-design-brand.md)
- [Plattform, Cloud und Sicherheit](categories/02-platform-security.md)
- [Tools und Funktionen](categories/03-tools-products.md)
- [Marketing, SEO und Content](categories/04-marketing-seo.md)
- [Internationalisierung](categories/05-internationalization.md)
- [Projektsteuerung](categories/06-project-governance.md)
- [Helferlein-Historie](categories/07-helferlein-legacy.md)

Die vollständige Liste der Chat-Titel und Chat-IDs sowie vorläufige Archivierungsempfehlungen wird **nur außerhalb des Repositories** im privaten Auswertungsdokument aufbewahrt. Keine Rohchats, personenbezogenen Details oder Zugangsdaten nach GitHub kopieren. Die Chat-Auswertung identifiziert Anforderungen und historische Arbeitsstände; aktuelle PRs, Branches, CI, Supabase und Live-Website sind vor jeder Releasebehauptung separat zu prüfen.
