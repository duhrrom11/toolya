# Toolya Cloud-only – JSONB-Abgleich im Tool-Adapter

Datum: 2026-11-15. Branch: `feature/toolya-connect-phase-b`.

## Fehler und Korrektur
Der Adapter `shared/toolya/cloud-tool-adapters.mjs` verwendete beim erneuten Prüfen vorhandener Cloud- und Gerätedaten `JSON.stringify(checked.local) !== JSON.stringify(review.local)`. Identische JSON-Objekte mit abweichender Schlüsselreihenfolge wurden dadurch fälschlich als verändert bewertet. Der bereits in der Migration vorhandene kanonische Vergleich `sameJson` wurde exportiert und im Adapter wiederverwendet. Die Array-Reihenfolge bleibt relevant.

## Minimalprüfung
Gezielte JavaScript-Prüfung mit dem aktuellen `sameJson`-Quelltext und Prüfung der Adapter-Verwendung: (1) umgeordnete Objektschlüssel werden als gleich bewertet; (2) geänderte Array-Reihenfolge wird als unterschiedlich bewertet; (3) Adapter nutzt `sameJson`. Alle drei Bedingungen erfüllt. Kein vollständiger Node-/CI-Lauf; keine Datenbanktests.

## Status
Codeänderungen im Featurebranch committed. Keine Änderungen an Datenbank, Produktivdaten oder Berechtigungen. Kein Merge, kein Deployment.
