# Toolya Cloud-only – Inhaltliche Schreibbestätigung

Datum: 2026-11-15; Branch: `feature/toolya-connect-phase-b`.

## Änderung
Der Cloud-Controller vergleicht nun nach dem Schreiben nicht nur die bestätigte Revision, sondern auch den Inhalt der zurückgegebenen Daten mit dem gesendeten Snapshot. Der Vergleich ignoriert die Reihenfolge von JSON-Objektschlüsseln, berücksichtigt jedoch die Reihenfolge von Arrays. Bei abweichender Antwort wird die Bestätigung verworfen und der Controller bis zum erneuten Laden gesperrt. Diese Prüfung ergänzt die bereits vorhandene Repository-Validierung.

## Minimaler Test
Ein neuer Regressionstest liefert eine korrekte Revision, aber einen abweichenden Snapshot zurück. Erwartet: Ablehnung und gesperrter Controller. Der kleine Controller-Testsatz wurde mit aktuellem Code im isolierten JavaScript-Harness ausgeführt: **10/10 bestanden**. Kein offizieller Node-/CI- oder Browser-E2E-Lauf.

## Status
Code und Test im Featurebranch committed. Keine Datenbankänderungen, kein Merge, kein Deployment, keine produktiven Daten verändert.
