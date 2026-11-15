# Toolya Cloud-only – Backup-Import nach Sessionwechsel

Datum: 2026-11-15; Branch: `feature/toolya-connect-phase-b`.

## Korrektur
`confirmCloudReplacement` prüfte nach zwei asynchronen Benutzerbestätigungen ausschließlich die Cloud-Revision. Wenn die Session inzwischen ungültig wurde, musste auch die Bereitschaft des Controllers vor dem Überschreiben erneut geprüft werden. Der Import wird jetzt abgebrochen, sobald `controller.ready` false ist oder sich die Revision geändert hat. Es erfolgt dann kein Schreibaufruf.

## Regression
Neuer Test: Session wird während der zweiten Bestätigung mit `controller.invalidate()` ungültig. Erwartet: Import verweigert, null Schreibvorgänge, Controller bleibt gesperrt. **5/5 Backup-Testkörper** im isolierten JavaScript-Harness erfolgreich. Dies ist kein bestätigter offizieller Node-Testlauf oder Browser-E2E.

## Abschluss
Read-only-Supabase-Kontrolle von `toolya_test`: **0 Testdatensätze**, keine dauerhafte Schema-USAGE für `anon` oder `authenticated`. Keine SQL-Schreiboperationen, kein Merge, kein Deployment und keine Änderungen an produktiven Daten.

## Noch offen
Offizieller Node-/CI-Lauf, Browser-E2E, signierte JWT-Authentifizierung und parallele PostgreSQL-Verbindungen.
