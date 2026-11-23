# Entwicklungsauftrag von Problem bis überprüftem Pull Request

## Ziel
Bearbeite eine Entwicklungsaufgabe mit minimalen Regressionen, verifizierbaren Tests und präziser Freigabeaussage.

## Eingaben
Auftragsziel, bestehende Architektur, relevante Dateien, Sicherheitsgrenzen, Prüfumgebung, vorhandene Entscheidungen.

## Vorgehen
- Repositorium, AGENTS.md und konkrete Originaldateien prüfen. Kein Framework ohne Not austauschen.
- Im separaten Branch arbeiten; Änderungen klein halten und bestehende Komponenten wiederverwenden.
- Isoliert testen und Fehlerursachen vor Korrekturen ermitteln. Keine echten Kundendaten als Testfixtures.
- Vor jeder Freigabe den exakten Diff, Tests und tatsächlichen PR-/Deploymentstatus prüfen.
- Für Toolya: beide Maskottchen, Wortmarke, Shared UI und produktive Supabase-Sicherheitsgrenzen beachten.

## Ausgabeformat
### Änderungen
Tatsächlich angepasste Dateien und Funktionsverhalten; nicht geplante Arbeit als erledigt bezeichnen.

### Prüfungen
Ausgeführte Tests, konkrete Ergebnisse und offen gebliebene Checks.

### Veröffentlichung
Branch, PR, Merge und Live-Deployment als getrennte Zustände benennen. Unbestätigt ist nicht veröffentlicht.

## Prüfregeln
Die Aussage "Tests bestanden" setzt tatsächlich ausgeführte Prüfungen voraus. Ein PR ist keine Veröffentlichung. Bei Backendänderungen Auth/RLS und Fail-Closed prüfen.

## Grenzen
Keine produktiven Schreibtests, Secrets, Testmails oder stillen Merges. Fehlende Tools transparent benennen.
