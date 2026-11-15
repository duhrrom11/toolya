# Cloud-only UI Integration – Review 2026-11-15

Branch: `feature/toolya-connect-phase-b`. **Nicht produktionsreif; kein Merge/Deployment.**

## Implementiert
- Beide Toolseiten starten einen Auth-/Cloud-Bootstrap mit Vollbild-Sperre; bei Fehler keine private Toolbedienung.
- Die Opt-in-Cloud-Bridge wird in diesen zwei Seiten nicht mehr gestartet.
- Autokosten: Fahrzeug erstellen, Kilometerstand ändern, Fahrzeug löschen, Reifen anlegen/löschen, Ereignis erstellen/bearbeiten/löschen über `await saveData`.
- Haushaltsbuch: Buchung erstellen/bearbeiten/löschen, Budgets und Sparziele speichern/ändern/löschen über `await`-Speicherfunktionen.
- Backup-Importe: Autokosten-JSON sowie Haushaltsbuch-Teilbereiche werden nach Vorschau/Bestätigung als Cloud-Snapshot gespeichert. Keine `localStorage.setItem`-Aufrufe mehr in diesen zwei HTML-Dateien.
- Migration beim ersten Laden: vorhandenen lokalen Altbestand prüfen; bei leerer Cloud nur nach Zustimmung und Sicherungsdownload übertragen, Cloud-Readback; keine Löschung der lokalen Altbestände.
- Cloud-Repository: JSONB-Vergleich unabhängig von Objekt-Key-Reihenfolge.

## Isolierte statische Checks
Codeinspektion per GitHub-Fetch:
- Beide Seiten enthalten Cloud-Bootstrap.
- Sämtliche inventarisierten CRUD-Funktionen sind `async`.
- Kein direkter `localStorage.setItem` in den zwei Toolseiten.
- Backup-Importe warten auf Cloud-Speicherbestätigung.
- Alte Bridge wird nicht mehr gemountet.

## Offene kritische Freigabesperren
1. **Keine Browser-/Node-Laufzeittests der eingebundenen Seiten ausgeführt.** Der Container konnte GitHub nicht erreichen; GitHub-Connector liefert Quellcode, aber keinen ausführbaren Browser. GitHub Actions hat noch keinen verifizierten erfolgreichen Run.
2. Alle Ereignis- und Bild-Callbacks, Nebenwirkungen und Auth-Zustandswechsel in echtem Browser testen. Cloud-Controller und Repository-Unit-Tests erweitern.
3. **Sicherungsimport kann Cloud-Daten ersetzen** (nur nach ausdrücklicher Bestätigung). Vor dem Ersetzen ist ein automatischer Export des bestehenden Cloud-Snapshots als Sicherung und ein aussagekräftiger Diff-/Vorschau-Dialog nachzurüsten.
4. `user_data.updated_at`-CAS: serverseitige Revision/atomare RPC bevorzugen; clientseitig gesetzte Timestamps können bei sehr schnellen Writes und Konkurrenzfällen problematisch sein.
5. Im Fehlerfall wird der UI-Sperrstatus nicht erneut als Overlay angezeigt, obwohl Writes blockiert sind; Fehlerzustände und erneutes Laden UX-seitig verbessern.
6. **Konto-Zuordnung von lokalen Altbeständen:** Falls kein Owner-Marker existiert, muss die Migration Nutzer über die mögliche Fremdzuordnung auf gemeinsam genutzten Geräten informieren.
7. Bestehende Cloud-Snapshots und lokal vorhandene abweichende Daten brauchen expliziten Konflikt-/Exportdialog; derzeit Cloud gewinnt und lokal bleibt erhalten.
8. Große Bilddaten, Payload-Grenzen, Offline/Timeout, mehrere Tabs/Geräte, Account-Wechsel, RLS und Readback in isolierter Testumgebung prüfen.
9. Anmeldeweg: Sperrbildschirm verweist zur öffentlichen Startseite; durchgängige Rücknavigation nach Login testen.
10. `tools/car/index.html` und `tools/budget/index.html` sind jetzt **nur auf diesem Featurebranch** Cloud-only; `main` bleibt unangetastet.

## Nicht geschehen
Keine produktive Supabase-Änderung, keine Testdaten in Produktion, kein Merge, kein Deployment.
