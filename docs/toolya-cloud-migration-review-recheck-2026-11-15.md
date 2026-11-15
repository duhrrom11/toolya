# Toolya Cloud-only – Migrationsvorschau erneut absichern

Datum: 2026-11-15; Branch: `feature/toolya-connect-phase-b`.

## Änderung
Vor dem ersten Migrations-Schreibvorgang wird nach Bestätigung und Sicherung erneut geprüft, ob der Benutzer (`again.userId`), die Menge der vorhandenen lokalen Datenschlüssel (`again.localKeys`) und die lokalen Daten (`again.local`) unverändert sind. Bisher wurden beim zweiten `inspect()` nur Status und Dateninhalt verglichen; Änderungen der Schlüsselmenge konnten wegen Standardwerten unsichtbar bleiben.

## Minimalprüfung
Regressionstest: Bei Haushaltsbuchdaten wird während der Backup-Bestätigung ein zuvor fehlender Schlüssel mit dem Standardwert `[]` hinzugefügt. Die Migration wird vor dem Schreiben abgebrochen. Migrationstestsatz im isolierten JavaScript-Harness: **6/6 bestanden**. Kein offizieller Node-, Browser- oder CI-Lauf.

## Status
Code und Test im Featurebranch committed. Keine Datenbankänderungen, kein Merge, kein Deployment, keine produktiven Daten verändert.
