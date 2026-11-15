# Toolya Cloud-only: erweiterte Auth-, RLS- und Revisionsprüfungen

Datum: 2026-11-15. Branch: `feature/toolya-connect-phase-b`.
Projekt `toolya-staging` (`yheogmeaosuigyaxkwth`), ausschließlich Schema `toolya_test`.

## Tatsächlich geprüft
- Vorher/Nachher-Abfrage: RLS aktiviert; `authenticated` und `anon` ohne dauerhafte Schema-Nutzung; `authenticated` ohne dauerhafte Tabellen-/RPC-Berechtigung; 0 Testdatensätze.
- Echte PostgreSQL-Transaktion mit **11 bestandenen Assertions**: Create Revision 1, Update Revision 2, stale CAS 40001, duplicate Create 40001, JSON-Array 22023, ungültiger Toolschlüssel 22023, Revision 0 22023, persistierte Revision unverändert, fremde RLS-SELECT unsichtbar, fremdes UPDATE 40001, anonymer JWT-Claim 28000.
- Die Berechtigungen wurden nur innerhalb der Transaktion gewährt und mit `ROLLBACK` zurückgenommen. Die finale SELECT-Abfrage ergab 0 Testdatensätze, keine dauerhafte Schema-Nutzung und keine RPC-Ausführungsrechte für `authenticated`.
- Authentifizierung wurde mit `SET LOCAL ROLE authenticated` und simulierten JWT-Claims geprüft, nicht über eine echte signierte Supabase-Session. Parallelität mit zwei echten Verbindungen weiterhin ungetestet.

## Codekorrektur
`shared/toolya/cloud-controller.mjs`: `replace()` merkt sich die Controller-Generation vor dem asynchronen Schreibaufruf. Nach `invalidate()` (z. B. Logout) darf eine verspätete Cloud-Bestätigung den lokalen Zustand nicht wieder aktivieren.

Neuer Regressionstest in `tests/cloud-controller.test.mjs` simuliert verspätete Schreibbestätigung nach Logout. Die sieben Controller-Testfälle wurden mit einem isolierten JavaScript-Harness ausgeführt: **7/7 bestanden**. Das ist kein offizieller `node --test`-Lauf.

## Unverändert
Keine DDL/DML außerhalb `toolya_test`, keine produktiven Datensätze, kein Merge, kein Deployment.

## Offen
Echte Supabase-JWT-/PostgREST-Integration, parallele Transaktionen über unabhängige DB-Verbindungen, vollständiger GitHub-Actions-Lauf und Browser-End-to-End-Prüfungen.
