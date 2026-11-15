# Toolya Cloud-only: PostgreSQL-Integrationstests im isolierten Schema

Datum: 2026-11-15
Supabase-Projekt: `toolya-staging` (`yheogmeaosuigyaxkwth`)
Git-Branch: `feature/toolya-connect-phase-b`

## Genehmigter Umfang
Der Nutzer hat ausschließlich das neue Schema `toolya_test` innerhalb des bestehenden Projekts genehmigt. Keine bestehenden Tabellen, Funktionen, RLS-Policies oder Benutzerdaten ändern. Kein Merge, kein Deployment.

## Eingerichtet
Migration `create_isolated_toolya_test_schema` erfolgreich:
- `toolya_test.user_data` mit eigener Identity-Spalte, eindeutiger Kombination `(user_id,tool)`, JSONB und positiver Integer-Revision.
- RLS aktiviert, owner-only Policies für SELECT, INSERT und UPDATE.
- `toolya_test.save_snapshot` mit `SECURITY INVOKER`, atomarem INSERT/UPDATE und erwarteter Revision.
- Dauerhafte Schema-/Tabellen-/RPC-Berechtigungen für `PUBLIC`, `anon`, `authenticated` entzogen. Das Schema ist nicht für die Data API exponiert.

## Tatsächlich ausgeführte PostgreSQL-Tests
PostgreSQL 17.11, echte SQL-Ausführung im bestehenden Projekt, ausschließlich `toolya_test`.

Zunächst schlug ein direkter RPC-Aufruf mit `permission denied for schema toolya_test` fehl. Dies war erwartbar, weil das Schema dauerhaft abgeschottet ist. Danach wurden Berechtigungen **nur innerhalb einer Transaktion** erteilt und am Ende mit `ROLLBACK` zurückgenommen.

Erfolgreich getestet:
1. Erstes INSERT mit Revision 1.
2. UPDATE mit erwarteter Revision 1 ergibt Revision 2.
3. Veraltete Revision führt zu SQLSTATE 40001.
4. Doppeltes INSERT führt zu SQLSTATE 40001.
5. Owner-only RLS verhindert Lesen durch anderen simulierten Nutzer.
6. Fremder Nutzer kann den Datensatz nicht mit bekannter Revision aktualisieren.
7. JWT `is_anonymous=true` wird mit SQLSTATE 28000 abgelehnt.

Diese Tests nutzten `SET LOCAL ROLE authenticated` und transaktionslokale simulierte JWT-Claims; das prüft PostgreSQL/RLS/Funktionsverhalten, **nicht** die echte Auth-API mit signierten JWTs. Die SQL-Tests liefen in Transaktionen mit abschließendem `ROLLBACK`; keine Testdaten blieben gespeichert.

Abschlussprüfung: `toolya_test` existiert; **1 Tabelle, 1 Funktion, 0 Datensätze**. `public.user_data.revision` weiterhin nicht vorhanden.

## Grenzen
- Keine gleichzeitigen Transaktionen mit unabhängigen DB-Verbindungen getestet.
- Keine End-to-End-PostgREST-/Browser-Tests, da `toolya_test` absichtlich nicht exponiert ist.
- Die produktive RPC-Funktion `public.toolya_save_snapshot` wurde nicht angelegt; nur Testversion im separaten Schema.
- Die 21 vorherigen isolierten JavaScript-Testfälle bleiben separat dokumentiert.

## Release-Sperre
Vor Produktivfreigabe echte Auth- und Mehrverbindungstests, Browser-Integrationen, CI und Migrationsstrategie prüfen. Keine Änderungen außerhalb `toolya_test` genehmigt.
