# Toolya Cloud-only – RLS-Owner-Schutz und Auth-Race-Regression

Datum: 2026-11-15; Branch: `feature/toolya-connect-phase-b`.

## Direkte PostgreSQL-RLS-Prüfungen
In `toolya-staging`, ausschließlich `toolya_test.user_data`, wurden vier Assertions innerhalb einer vollständig zurückgerollten Transaktion geprüft:
1. INSERT mit fremder `user_id` als `authenticated` wird mit SQLSTATE `42501` verweigert.
2. INSERT mit eigener `user_id` ist innerhalb der Testtransaktion lesbar.
3. UPDATE, das die eigene `user_id` auf einen fremden Besitzer umstellt, wird mit `42501` verweigert.
4. Nach abgewiesenem UPDATE bleibt die eigene Zeile unverändert zugeordnet.

Alle **4/4** Assertions bestanden. Die Rolle und JWT-Claims wurden nur transaktionslokal simuliert; kein echter signierter JWT verwendet. Temporäre Grants und Testdatensätze wurden per `ROLLBACK` zurückgenommen.

## Auth-Gate-Test
Zusätzlicher Regressionstest in `tests/cloud-auth-gate.test.mjs`: Eine spätere, aber ältere `getUser()`-Antwort darf eine bereits erfolgreich geprüfte neuere Identität nicht überschreiben. Die Generation-Prüfung des Guards hat den Test bestanden. **4/4 Auth-Testkörper** im isolierten JavaScript-Harness bestanden. Keine Änderung an der Guard-Implementierung erforderlich.

## Abschluss
Read-only-Supabase-Kontrolle: **0 Testdatensätze**; `anon` und `authenticated` ohne dauerhafte Schema-USAGE. Keine produktiven Datenänderungen, kein Merge, kein Deployment.

## Noch offen
Echte Browser-E2E-Tests, signierte JWT-Sessions, unabhängige parallele Datenbankverbindungen, vollständiger offizieller Node-/GitHub-Actions-Lauf.
