# Toolya Cloud-only – Auth- und Readback-Grenzfälle

Datum: 2026-11-15. Branch: `feature/toolya-connect-phase-b`. Projekt `toolya-staging` (`yheogmeaosuigyaxkwth`), ausschließlich Schema `toolya_test`.

## PostgreSQL-Tests
Drei zusätzliche Assertions in einer Transaktion mit `SET LOCAL ROLE authenticated` und temporären GRANTs:
1. Fehlende `request.jwt.claim.sub`-Identität: `28000` erwartet und erhalten.
2. `jsonb_build_object('note', repeat('x',5000001))`: `22023` für Payload über 5 MB erwartet und erhalten.
3. JSON `null`: `22023` erwartet und erhalten.

Alle drei Tests bestanden. Die Transaktion endete mit `ROLLBACK`; keine dauerhaften Berechtigungen oder Testdatensätze.

## Controller-Korrektur
`createCloudController().load()` akzeptierte bisher inkonsistente Repository-Leseantworten (z. B. `exists=true` bei `revision=null` oder `exists=false` bei positiver Revision). Jetzt werden diese Antworten abgelehnt, bevor der Controller bereit wird.

Neuer Regressionstest mit vier fehlerhaften Leseantworten. **8/8 Controller-Testkörper** im isolierten JavaScript-Harness bestanden. Kein bestätigter offizieller Node-Testlauf.

## Abschlusskontrolle
`toolya_test.user_data`: **0 Datensätze**. `anon` und `authenticated` ohne dauerhafte Schema-USAGE; `authenticated` ohne EXECUTE-Recht auf die Testfunktion. Keine Änderungen außerhalb des Testschema, kein Merge, kein Deployment.

## Offen
Signierte JWT-Authentifizierung, Browser-E2E, parallele unabhängige PostgreSQL-Verbindungen und bestätigte CI-Ausführung.
