# Toolya Cloud-only – Ungültigen Backup-Export kontrolliert abweisen

Datum: 2026-11-15; Branch: `feature/toolya-connect-phase-b`.

## Änderung
`exportJsonBackup()` fängt Fehler bei `JSON.stringify` ab und weist nicht serialisierbare Werte sowie JSON-`null` mit verständlichen Fehlermeldungen zurück. Ein Download wird in diesen Fällen nicht erzeugt.

## Minimalprüfung
Neuer Regressionstest mit zyklischem Objekt und `null` prüft, dass kein Download-Element erzeugt wird. Der Backup-Testsatz wurde im isolierten JavaScript-Harness ausgeführt: **8/8 bestanden**. Kein offizieller Node-/CI- oder Browser-E2E-Lauf.

## Status
Code und Test im Featurebranch committed. Keine Datenbankänderungen, kein Merge, kein Deployment, keine produktiven Daten verändert.
