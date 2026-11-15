# Toolya Cloud-only – Vorhandene Cloud und lokale Schlüssel erneut prüfen

Datum: 2026-11-15; Branch: `feature/toolya-connect-phase-b`.

## Änderung
Im `cloud-already-exists`-Pfad von `prepareCloudTool()` werden nach Nutzerbestätigung und lokalem Backup nun neben Benutzerkonto, Cloud-Revision und Dateninhalt auch die vorhandenen lokalen Datenschlüssel (`localKeys`) erneut mit dem geprüften Ausgangszustand verglichen. Ein veränderter Schlüsselbestand führt zum Abbruch; Cloud-Daten werden nicht überschrieben.

## Minimalprüfung
Gezielte Prüfung des aktuellen Branch-Codes: Alle vier Vergleiche vorhanden. Keine vollständigen Node-/CI-/Browser-Tests durchgeführt.

## Status
Codeänderung im Featurebranch committed. Keine Datenbankänderungen, kein Merge, kein Deployment, keine produktiven Daten verändert.
