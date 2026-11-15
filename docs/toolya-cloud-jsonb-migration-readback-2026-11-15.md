# Toolya Cloud-only – JSONB-Migrations-Readback

Datum: 2026-11-15; Branch: `feature/toolya-connect-phase-b`.

## Fehler und Korrektur
Bei der Übernahme vorhandener Gerätedaten vergleicht `legacy-cloud-migration.mjs` den anschließend gelesenen Cloud-Datenstand mit der lokalen Vorschau. Der Vergleich über `JSON.stringify` war von der Reihenfolge der Objektschlüssel abhängig. PostgreSQL `jsonb` kann Schlüssel anders anordnen; eine erfolgreiche Speicherung konnte deshalb fälschlich als fehlgeschlagen angezeigt werden.

Die Vergleiche von Vorschau und Readback verwenden nun rekursiv kanonische JSON-Schlüsselreihenfolge. Array-Reihenfolge und Werte bleiben relevant. Kein bestehender Cloud-Datenstand wird überschrieben; die lokale Sicherung bleibt erhalten.

## Regressionstest
Neuer Test `JSONB key reordering does not falsely fail confirmed migration`: Das simulierte Repository liefert denselben Dateninhalt mit umgeordneten Objektschlüsseln zurück. Erwartet wird `status=confirmed` und genau ein Schreibaufruf.

Mit dem aktuellen Featurebranch wurden **5/5 Migrationstestkörper** im isolierten JavaScript-Harness erfolgreich ausgeführt. Dies ist **kein** offizieller Node-Testlauf und **kein** vollständiger Browser-End-to-End-Test.

## Datenbankkontrolle
Read-only-Abfrage im genehmigten Schema `toolya_test` ergab **0 Testdatensätze**, ohne dauerhafte Schema-USAGE für `anon` oder `authenticated`. Keine SQL-Schreiboperationen und keine Änderungen an bestehenden Tabellen/Funktionen/Policies.

## Offen
Offizieller Node-Testlauf und CI, signierte Supabase-Auth, Browser-E2E, unabhängige parallele PostgreSQL-Verbindungen. Kein Merge, kein Deployment.
