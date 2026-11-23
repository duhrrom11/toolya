# Plattform, Architektur, Sicherheit

**Quellen:** Export-Chats „Toolya Migration prüfen“, „Cloudonly Migration Prüfen“, „Tool Ideen Brainstorming“, „Toolya Cloud erklären“, „Toolya Connect Auswahl“, „Dashboard verbessern“; README.md, AGENTS.md, package.json, Master-Audit.

## Entscheidungen
- Toolya ist eigenständig von Helferlein; keine stillschweigende Übertragung von Nutzerdaten.
- Cloud-only/Supabase für geschützte Nutzerdaten und Anmeldung; kein Umgehen von RLS, Auth oder Verschlüsselung.
- Toolya Connect soll Daten zwischen geeigneten Tools kontrolliert synchronisieren. Beispiele aus Gesprächen: Gießplan-Aufgaben ↔ Dashboard-Aufgaben, Einkaufslisten aus Tools ↔ zentrale Einkaufsliste; Dubletten und Nutzerbestätigung berücksichtigen.
- Nachlass-Notfallfreigaben und E-Mail-Versand müssen fail-closed bleiben, wenn die Zustellung nicht belegt ist.
- Produktionsdaten nicht mit Testdaten verändern; keine echten Versandsimulationen als Zustellnachweis.

## Historische Spuren
- Chats nennen u.a. PR #13 für Nachlass-Funktionen und PR-/CI-Nachweise für Cloud-only; ihr aktueller Merge-/Live-Status ist hier nicht neu geprüft.
- README.md nennt GitHub Pages, zwölf Tools und separates Supabase-Projekt.
- package.json nennt Cloud-only-, Connect-, Amazon- und Browserprüfungen; Testskripte sind kein Nachweis vollständiger Funktionsfähigkeit.

## Offene Prüfungen
Aktuelle Auth-/RLS-Grenzen, Connect-Schema/RPC/Transfers, Backups/Import/Export, Nachlass-Worker und Status der betroffenen PRs im Code und gegebenenfalls read-only in Supabase prüfen.
