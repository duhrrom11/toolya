# Cloud-only Schreibstelleninventar – Autokosten und Haushaltsbuch

Ermittelt durch Quellcodeinspektion auf `feature/toolya-connect-phase-b`. Zeilennummern beziehen sich auf den untersuchten Stand vor weiteren Änderungen.

## Autokosten: `tools/car/index.html`

- `getData()` L463: synchroner Read aus `kfz_tracker_pro_v3`.
- `saveData()` L471: synchroner Write in `localStorage`, anschließend asynchrones `helferleinCloudBridge.changed(data)`.
- Schreibaufrufe: L529 (Fahrzeug anlegen), L570 (Kilometerstand), L609 (Fahrzeug samt Kinddaten löschen), L626 (Reifensatz anlegen), L636 (Reifensatz löschen), L682 (Ereignis anlegen), L730 (Ereignis bearbeiten), L740 (Ereignis löschen), L1060 (Backup-Import).
- Datei-/Bildverarbeitung über Callbacks, z.B. `compressImage()`; muss in asynchronen Save-Workflow eingebunden werden.
- Weitere Reads: Fahrzeugauswahl, Ereignis-/Reifenrendering, Berichte, Backup-Export.

## Haushaltsbuch: `tools/budget/index.html`

- `getData()` L637: synchroner Read aus `kassenbon_data`.
- `householdCloudSnapshot()` L645: Bundle `entries`, `budgets`, `goals`.
- `saveData()` L686: synchroner lokaler Buchungswrite, asynchrones `householdCloudChanged()`.
- `saveBudgets()` L708: synchroner lokaler Budgetwrite.
- `saveSavingsGoals()` L730: synchroner lokaler Sparzielwrite.
- `saveData`-Aufrufe L1109 (Buchung anlegen/bearbeiten), L1211 (Buchung löschen).
- `saveBudgets`-Aufruf L1534 (Budgetdialog).
- Sparziel-Aufrufe und alle Backup-Importe gesondert migrieren.
- Backup-Import L1888/L1893 schreibt mehrere `localStorage`-Schlüssel direkt, außerhalb der gewöhnlichen Save-Funktionen; **muss** vor Cloud-only-Freigabe auf transaktionalen Bundle-Import umgestellt werden.
- Weitere Reads in Formularen, Auswertungen, CSV-/Backup-Exporten und Berichten.

## Umsetzungsfolge

1. UI-Controller von synchronen `getData/saveData`-Verträgen entkoppeln. Cloud-State im Arbeitsspeicher mit `revision` verwalten, niemals localStorage als maßgebliche Quelle verwenden.
2. Jeden mutierenden Event-Handler zu `async`-Ablauf umbauen. Erst nach `await repository.save(snapshot, revision)` Formulare leeren, Dialoge schließen und Erfolg anzeigen. Bei Fehler Eingaben erhalten.
3. Während eines laufenden Writes weitere Mutationen pro Werkzeug serialisieren; bei anderem Tab/Gerät CAS-Konflikt melden, aktuellen Snapshot laden und keine blinde Wiederholung.
4. Haushaltsbuch immer als **ein** Bundle speichern; `saveData`, `saveBudgets`, `saveSavingsGoals` und Backup-Import auf denselben Zustand anwenden.
5. Migration nur bei verifizierter Anmeldung, bestätigtem Backup, leerem Cloud-Ziel und nach erfolgreichem Readback. Lokale Daten nicht löschen.
6. Erst nach isolierten Tests Login-Gate und neue Controller in beide Seiten einbinden.

## Neu im Branch, aber bewusst nicht live verdrahtet

- `shared/toolya/cloud-auth-gate.mjs`
- `shared/toolya/cloud-repository.mjs`
- `shared/toolya/legacy-cloud-migration.mjs`

## Offene Risiken / Freigabesperren

- Asynchrone Controller-Umstellung ist noch nicht implementiert; bestehende Seiten bleiben im alten Modus.
- Ein Client-seitiger Timestamp als CAS-Revision ist bei extrem eng aufeinanderfolgenden Writes nicht die ideale serverautorisierte Version. Für die endgültige Lösung bevorzugt serverseitige Revision/atomaren RPC prüfen.
- `user_data` speichert Snapshots, keine einzelnen Buchungen; Connect benötigt eine eigene serverseitig atomare Übertragung.
- Vollständige Browser-/E2E-Tests, Auth-Wechsel, Offline, konkurrierende Writes, große Bilddaten, Migration mit vorhandenem Cloud-Datensatz, beschädigte Altbestände sind offen.
- Keine produktive SQL-Migration, kein Deployment, kein Merge.
