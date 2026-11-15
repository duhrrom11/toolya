# Toolya Cloud-only – Backup-Export nur für Snapshot-Objekte

Datum: 2026-11-15; Branch: `feature/toolya-connect-phase-b`.

## Änderung
`exportJsonBackup()` verlangt jetzt ein nicht-null JSON-Objekt als Wurzel. Primitive Werte und Arrays werden vor der Serialisierung abgewiesen. So entstehen keine vermeintlichen Snapshot-Sicherungen aus falschen Wurzeltypen.

## Minimalprüfung
Gezielte Prüfung gegen den aktuellen Branch-Code: `null`, Zahl, Array und `undefined` werden abgewiesen; **0 Downloadversuche**. Der vorhandene Regressionstest wurde um Zahl und Array erweitert. Kein vollständiger Node-/CI-/Browser-Lauf.

## Status
Code und Test im Featurebranch committed. Keine Datenbankänderungen, kein Merge, kein Deployment, keine produktiven Daten verändert.
