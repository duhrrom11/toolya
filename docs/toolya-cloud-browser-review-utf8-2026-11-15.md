# Toolya Cloud-only: weitere Integrations- und Browser-Codeprüfung

Datum: 2026-11-15; Branch: `feature/toolya-connect-phase-b`.

## Browser-Codeprüfung (statisch)
Beide Toolseiten `tools/car/index.html` und `tools/budget/index.html` wurden im Featurebranch geprüft:
- Cloud-Bootstrap prüft Nutzeridentität vor und nach `prepareCloudTool`.
- Auth-Listener sperrt bei `SIGNED_OUT`; bei `SIGNED_IN` wird die Benutzeridentität nachgeprüft.
- Cloud-Gate bleibt bei Bootfehlern sichtbar.
- **Kein echter Browser gestartet, keine DOM-/E2E-Testausführung und kein realer Supabase-Login**. Die Prüfung belegt daher keine vollständige Browser-Funktion.

## Gefundener und behobener Fehler
`shared/toolya/cloud-repository.mjs` prüfte die 5-Millionen-Grenze bisher über `JSON.stringify(data).length`, also UTF-16-Codeeinheiten. Die PostgreSQL-RPC prüft `octet_length(p_data::text)` in UTF-8-Bytes. Mehrbyte-Zeichen (z. B. Emojis) konnten die Client-Prüfung passieren und serverseitig zurückgewiesen werden.

Korrektur: `TextEncoder().encode(serialized).byteLength` mit konservativer Grenze von 4.000.000 Bytes (Spielraum für PostgreSQL-JSONB-Serialisierung). Zwei Regressionstests für große und kleine Emoji-Payloads ergänzt.

Die **5 Repository-Testkörper** wurden mit einem isolierten JavaScript-Harness und UTF-8-Byte-Längen-Shim ausgeführt: **5/5 bestanden**. Ein offizieller Node-Testlauf ist weiterhin nicht bestätigt.

## Sicherheitskontrolle
Read-only-Abfrage im genehmigten Schema `toolya_test`:
- 0 Testdatensätze
- `authenticated` ohne dauerhafte Schema-USAGE
- `anon` ohne RPC-EXECUTE

Keine SQL-Schreiboperationen in diesem Arbeitsschritt. Keine Änderungen an produktiven Tabellen oder Daten. Kein Merge, kein Deployment.

## Noch offen
Echte Browser-End-to-End-Tests, signierte JWT-Authentifizierung, parallele Datenbankverbindungen und bestätigter GitHub-Actions-Run.
