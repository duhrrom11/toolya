# Toolya Connect – integrierte Ausgabe (Stand 2026-11-17)

## Produktentscheidung
Toolya Connect erhält **keinen eigenen Bereich**. Verbindungen erscheinen nur dort, wo
Nutzerinnen und Nutzer einen passenden Datensatz erstellen oder eine Ausgabe auslösen:
als optionale, standardmäßig ausgeschaltete Auswahl direkt an der Speichern-/Ausgabe-Aktion.

Das Muster gilt für alle künftigen fachlich passenden Werkzeuge und Bereiche.
Es werden **keine** funktionslosen Verbindungsoptionen für noch nicht unterstützte Ziele angezeigt.

## Erste produktive Verbindung: Autokosten → Haushaltsbuch
- Beim Anlegen eines Autokosten-Eintrags steht direkt vor „Eintrag speichern“
  „Diese Ausgabe auch ins Haushaltsbuch übernehmen“.
- Der Autokosten-Eintrag wird zuerst regulär in Toolya Cloud gespeichert.
- Nur bei ausdrücklicher Auswahl folgt eine Bestätigung und die serverseitige Übertragung.
- Die RPC `toolya_connect_car_to_budget` prüft Identität, Quell-/Zielrevision,
  positive Ausgabe und Duplikate. Der Zielstand wird atomar aktualisiert.
- Kein Belegtransfer. Die Zahlungsart muss im Haushaltsbuch geprüft werden.
- Bei fehlgeschlagenem Transfer bleibt der erfolgreich gespeicherte Autokosten-Eintrag
  bestehen; die Oberfläche meldet ausdrücklich, dass keine Übertragung bestätigt ist.

## Weitere Verbindungen
Erst nach Definition einer sicheren Datenzuordnung, Consent, Idempotenz und
serverseitiger atomarer Speicherung je Zielwerkzeug sichtbar machen. Keine
allgemeine Connect-Seite, keine stillen Hintergrundübertragungen.

## Qualität und Betrieb
Die Cloud-RPC und Migration existieren bereits im Repository. Tests verwenden
isolierte Daten und dürfen keine produktiven Datensätze anlegen.
GitHub-Actions-Status und GitHub-Pages-Deployment sind für jeden Release separat
zu prüfen.
