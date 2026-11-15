# Toolya Cloud-only – Ungültige Importdaten vor Bestätigung abweisen

Datum: 2026-11-15; Branch: `feature/toolya-connect-phase-b`.

## Änderung
`confirmCloudReplacement()` behandelt nun Fehler bei der JSON-Serialisierung eingehender Importdaten ausdrücklich. Zyklische Objekte, BigInt-Werte und nicht serialisierbare Wurzelwerte werden vor den Bestätigungsdialogen mit `Importdaten sind kein gültiges JSON.` abgewiesen. Der Cloud-Snapshot bleibt unverändert.

## Minimale Prüfung
Neuer Regressionstest mit zyklischen Importdaten: kein Bestätigungsdialog, kein Schreibvorgang, erwartete Fehlermeldung. Der Backup-Testsatz wurde im isolierten JavaScript-Harness ausgeführt: **7/7 bestanden**. Kein offizieller Node-, Browser- oder CI-Lauf.

## Status
Code und Test im Featurebranch committed. Keine Datenbankänderungen, kein Merge, kein Deployment, keine produktiven Daten verändert.
