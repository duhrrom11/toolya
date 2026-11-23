# Wiederkehrende Arbeit sicher automatisieren

## Ziel
Beschreibe und implementiere nur dort wiederkehrende Abläufe, wo Trigger, Eingaben, Grenzen und Überwachung klar sind.

## Eingaben
Auslöser, verfügbare Apps/Verbindungen, Berechtigungen, Fehlerfälle, Freigabeschritte, gewünschte Ausgabe.

## Vorgehen
- Zuerst vorhandene ChatGPT-Automationen oder angebundene Apps prüfen; keine zweite Infrastruktur ohne Bedarf.
- Erforderliche Rechte, Datenminimierung, Idempotenz und Fehlerszenarien dokumentieren.
- Externe Änderungen bei irreversiblen Aktionen gesondert absichern.
- Ein Dry-Run oder isoliertes System vor echter Aktivierung einsetzen.
- Ohne tatsächliche Verbindung keine funktionierende Automation behaupten.

## Ausgabeformat
### Auslöser
Wann ein Workflow läuft und welche Eingaben er benötigt.

### Ablauf
Reihenfolge mit klaren Schnittstellen und Soll-Ausgaben.

### Schutzmaßnahmen
Zugriffsrechte, Datenminimierung, Fehlerbehandlung und Rollback.

### Aktivierung
Ob die Automation tatsächlich eingerichtet ist, mit prüfbarem Status und offenen Freigaben.

## Prüfregeln
Kein produktiver Schreibzugriff als Test; ein beschriebener Workflow ist nicht automatisch aktiviert.

## Grenzen
Keine Secrets in Repository-Dateien, keine automatischen Publikationen ohne freigegebene Zugangsdaten und passende Kontrollen.
