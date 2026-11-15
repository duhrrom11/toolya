# Toolya Cloud-only – Controller prüft Schreibbestätigung

Datum: 2026-11-15; Branch: `feature/toolya-connect-phase-b`.

## Änderung
`createCloudController().replace()` akzeptierte bisher nach einem erfolgreichen Repository-Aufruf auch unplausible Revisionswerte. Jetzt muss die Schreibbestätigung eine sichere Ganzzahl enthalten, die bei einem neuen Snapshot genau 1 und bei einem bestehenden Snapshot genau der vorherigen Revision plus 1 entspricht. Fehlende Daten oder fehlende Bestätigung werden abgewiesen. Im Fehlerfall bleibt der Controller bis zum erneuten Laden gesperrt.

## Minimaler Regressionstest
Ein neuer Test simuliert eine Speicherantwort mit Revision 99 statt 1. Erwartet: Abbruch und gesperrter Controller. Die bestehenden Controller-Tests wurden zusammen mit diesem neuen Fall im isolierten JavaScript-Harness ausgeführt: **9/9 bestanden**. Kein offizieller Node-, Browser- oder CI-Lauf.

## Status
Code und Test im Featurebranch committed. Keine Datenbankänderungen, kein Merge, kein Deployment, keine produktiven Daten verändert.
