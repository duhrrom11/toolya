# Toolya Cloud-only – isolierte Testausführung und Integrationsfixes

Datum: 2026-11-15. Branch: `feature/toolya-connect-phase-b`.

## Ausgeführte Tests
Vier Testdateien wurden aus dem Featurebranch über den GitHub-Connector gelesen:
- `tests/cloud-controller.test.mjs` – 6 Tests
- `tests/cloud-backup.test.mjs` – 4 Tests
- `tests/cloud-repository.test.mjs` – 3 Tests
- `tests/cloud-migration.test.mjs` – 4 Tests

**Ergebnis: 17/17 bestanden.** Die Testfunktionen wurden in einem isolierten JavaScript-Ausführungskontext mit dem tatsächlichen Modulcode, simulierten Supabase-Clients und einem JSON-basierten `structuredClone`-Polyfill ausgeführt. Ein erster Durchlauf ohne Polyfill ergab 14 Harness-Fehler (`structuredClone is not defined`), keine nachgewiesenen Produktfehler. Der korrigierte Durchlauf bestand vollständig.

**Einschränkung:** Der Test-Harness führte die Testkörper aus, nicht den offiziellen `node:test`-Runner. Es wurden weder echte Supabase-Anfragen noch echte PostgreSQL-Transaktionen getestet. Node 22 ist lokal verfügbar, jedoch kein Repository-Checkout (GitHub-DNS aus dem Container nicht erreichbar). Ein erfolgreicher GitHub-Actions-Run wurde nicht bestätigt.

## Codeänderungen
- `tools/car/index.html`, `tools/budget/index.html`: vor und nach dem asynchronen Cloud-Bootstrap wird die verifizierte Benutzer-ID geprüft. Bei Kontowechsel während Migration oder Laden bleibt die Oberfläche gesperrt.
- Weitere vorangegangene Fixes: numerische Revisions-Mocks, reentrante Mutationssperre, SQL UPDATE RETURNING in interne Variablen.

## Isolierte Supabase-Instanz
Es gibt keine eindeutig freigegebene neue Testinstanz. Die bestehenden Projekte `toolya-staging` und `Helferlein` werden nicht als Testziel für SQL-/Datenschreibtests verwendet. Ein neues Supabase-Projekt kann Kosten verursachen und erfordert eine vom Benutzer bestimmte Organisation. Daher **kein Projekt angelegt und kein SQL ausgeführt**.

## Nächste Schritte
1. Benutzer benennt Supabase-Organisation für ein **neues, vollständig isoliertes Testprojekt**; Kostenfreigabe erfolgt gegebenenfalls über die Plattform.
2. Das SQL-Skript `docs/isolated-toolya-revision-rpc.sql` dort auf einem Schema ohne echte Daten ausführen; Tests für SELECT/INSERT/UPDATE-RLS, Concurrent CAS, anonymen Zugriff und JWT-Identität.
3. GitHub-Actions-Run und echten Node-Testlauf bestätigen.
4. Browser-End-to-End-Tests der beiden Toolseiten durchführen; insbesondere Kontowechsel während Dateidialog und Backup-Migration.
5. Kein Merge/Deployment, bis alle Freigabesperren geschlossen sind.

**Sicherheitsstatus:** Keine Produktivdaten verändert, keine Datenbank-DDL ausgeführt, `main` unverändert, kein Merge, kein Deployment.
