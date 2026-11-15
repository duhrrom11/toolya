# Isolierte Supabase-Testumgebung: Kostenfreigabe und Limit (2026-11-15)

## Ergebnis
- Nutzer hat für die Organisation `duhrrom11's Supabade` (`lxdbzmaetvjghlumnsmb`) ein neues, isoliertes Projekt `toolya-cloud-isolated-tests` in `eu-central-1` und den angezeigten Preis **0 EUR/Monat** ausdrücklich bestätigt.
- `get_cost` meldete 0 EUR monatlich; `confirm_cost` lieferte die notwendige Bestätigung.
- `create_project` wurde mit dieser Bestätigung aufgerufen, aber **von Supabase abgelehnt**: der Organisationseigentümer hat das Maximum von **2 aktiven Free-Projekten** erreicht.
- **Kein neues Projekt erstellt.** Keine vorhandenen Projekte pausiert, gelöscht, aktualisiert oder für schreibende Tests benutzt.

## Alternative Tests
- `tests/cloud-rpc-contract.test.mjs` ergänzt: vier statische Regressionstests zu SECURITY INVOKER, Berechtigungen, atomarem Compare-and-Swap, JSON-Validierung und RETURNING-Zielvariablen.
- **4/4** dieser neuen Testkörper in isoliertem JavaScript-Harness gegen das echte SQL-Skript ausgeführt und bestanden.
- GitHub-Workflow führt jetzt fünf Testdateien aus (zuvor vier).
- Frühere isolierte Testausführung: **17/17** Modul-Testkörper bestanden. Diese Ergebnisse sind nicht mit einem offiziellen Node-Testlauf oder PostgreSQL-Test gleichzusetzen.

## Blocker
Für echte PostgreSQL-Integrationstests braucht es ein unabhängiges Testprojekt. Mögliche Wege: Supabase-Plan/Kontingent erweitern (Kosten vorher klären) oder ein ausdrücklich zur Stilllegung freigegebenes, nicht produktives Projekt. Bestehende Projekte nicht automatisch pausieren oder löschen. Alternativ lokales PostgreSQL in einer geeigneten Entwicklungsumgebung starten (in dieser Containerumgebung sind PostgreSQL/Docker/Supabase CLI nicht vorhanden).

**Keine Produktivdatenänderungen, kein Merge, kein Deployment.**
