# Toolya Cloud-only – Inkonsistente Snapshot-Existenz abweisen

Datum: 2026-11-15. Branch: `feature/toolya-connect-phase-b`.

## Korrektur
`createCloudController().load()` prüft jetzt neben dem Revisionswert auch die Konsistenz von `exists` und `data`: Ein nicht vorhandener Snapshot muss `data:null` und `revision:null` zurückgeben. Ein vorhandener Snapshot muss ein nicht-null Datenfeld und eine positive ganzzahlige Revision liefern. Widersprüchliche Antworten führen zu einem gesperrten Controller, nicht zu einem scheinbar gültigen lokalen Startzustand.

## Regression
Der bestehende Test für inkonsistente Cloud-Leseantworten umfasst nun acht fehlerhafte Kombinationen (vorher vier). Alle **8/8 Controller-Testkörper** mit aktuellem Branch-Code im isolierten JavaScript-Harness bestanden; die acht fehlerhaften Antwortvarianten sind Unterfälle eines dieser Tests. Kein bestätigter offizieller Node- oder Browser-Testlauf.

## CI und Supabase
Der GitHub-Actions-Abruf für Commit `681a9ce7ca53f9e3d782abf96f7ff2fd349713d4` ergab keine Workflow-Runs; CI-Erfolg bleibt unbestätigt. Read-only-Supabase-Kontrolle im genehmigten Schema `toolya_test`: **0 Datensätze**, keine dauerhafte Schema-USAGE für `anon` oder `authenticated`.

Keine SQL-Schreiboperationen, keine produktiven Datenänderungen, kein Merge, kein Deployment.

## Offen
Vollständiger Node-/CI-Lauf, signierte Supabase-Sessions, Browser-E2E und unabhängige parallele PostgreSQL-Verbindungen.
