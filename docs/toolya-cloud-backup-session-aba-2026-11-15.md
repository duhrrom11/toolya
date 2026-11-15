# Toolya Cloud-only – Backup-Import: Session-ABA-Schutz

Datum: 2026-11-15. Branch: `feature/toolya-connect-phase-b`.

## Sicherheitsproblem
Der Import eines Cloud-Backups prüfte nach den asynchronen Bestätigungen die Controller-Bereitschaft und die Snapshot-Revision. Ein Logout und erneutes Laden konnte jedoch eine wieder bereite Session mit **derselben Revision** erzeugen. Die alte Importbestätigung wäre dann für die neue Sitzung weiterverwendet worden (ABA-Szenario).

## Umsetzung
`shared/toolya/cloud-controller.mjs` stellt den bestehenden internen Generation-Zähler als schreibgeschützte Eigenschaft `sessionGeneration` bereit. `shared/toolya/cloud-backup.mjs` merkt sich den Wert vor den Bestätigungen und verweigert den Import, wenn sich dieser bis zum Schreibversuch geändert hat – selbst bei identischer Revision.

## Regression
Neuer Test in `tests/cloud-backup.test.mjs`: Beim zweiten Bestätigungsdialog wird `invalidate()` gefolgt von `load()` aufgerufen. Revision bleibt 1, Controller wird wieder bereit, aber der alte Import wird ohne Schreibaufruf abgewiesen. **6/6 Backup-Testkörper** im isolierten JavaScript-Harness bestanden; kein offizieller Node-/Browser-E2E-Lauf.

## Sicherheitsstatus
Read-only-Abfrage im Supabase-Testprojekt: `toolya_test.user_data` enthält **0 Zeilen**; keine dauerhafte Schema-USAGE für `anon` oder `authenticated`. Keine SQL-Schreiboperationen in diesem Schritt. Kein Merge, kein Deployment, keine produktiven Datenänderungen.

## Offen
Offizieller Node-/CI-Lauf, echte Browser-E2E-Tests, signierte Supabase-Sessions und unabhängige parallele PostgreSQL-Verbindungen.
