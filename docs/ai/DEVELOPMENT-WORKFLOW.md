# Toolya – KI-Entwicklungsablauf

Ziel: reproduzierbare Codeänderungen, minimale Rückfragen und keine unbeabsichtigten Produktionsänderungen.

## Auftrag starten

1. AGENTS.md, docs/ai/ARCHITECTURE.md und die zum Auftrag relevanten Dateien/Tests lesen.
2. Bestehende Komponente/Funktion wiederverwenden; nur wenn nötig neue Bibliotheken oder Komponenten einführen.
3. Änderungstyp zuordnen: statisches Frontend, isoliertes Tool, geteilter Plattform-Code oder sicherheitsrelevantes Backend.
4. Einen separaten Branch von einem aktuellen main-Commit erstellen. Keine ungeprüften Änderungen direkt auf main.

## Implementierung

- Kleine, fachlich zusammengehörige Änderungen mit klaren Commit-Nachrichten.
- Existing users first: keine impliziten Schema- oder Datenmigrationen, keine Testdaten in Produktion.
- Bei gemeinsamem Code alle zwölf kanonischen Tools und die Nutzerauswahl der Maskottchen als mögliche Auswirkungen prüfen.
- Bei UI-Änderungen mobil (320 px), Tastatur/Focus, reduzierte Bewegung und deutsche/englische Beschriftungen soweit vorhanden prüfen.
- Bei Cloud-Änderungen Auth/RLS und Fehlerfälle (Offline, Konflikt, unbestätigte Antwort) separat absichern. Keine Live-Requests in regulären Tests.
- Keine neuen Abhängigkeiten nur für eine kleine Vorlage; Sicherheits- und Wartungskosten berücksichtigen.

## Prüfschritte

1. Syntax prüfen: node --check für neue .cjs/.mjs-Dateien.
2. Isolierte Unit-Tests ohne Netzwerk, Geheimnisse oder produktive Konten ausführen.
3. Relevante vorhandene Tests auswählen; für breitere Plattformänderungen vorhandenes CI auf PR laufen lassen.
4. Prüfen, dass assets/toolya/originals/SHA256SUMS und acht PNG-Dateien unverändert bleiben.
5. Bei Backend-Änderungen mindestens RLS, Permissions und Fail-Closed-Verhalten im isolierten Prüfkontext absichern.
6. Änderungen/diff kontrollieren, nachvollziehbare Ergebnisse im PR festhalten.

## Fertigstellung und Freigabe

- Pull Request gegen main mit Umfang, Testergebnissen, Risiken und bewusst nicht erledigten Punkten eröffnen.
- Kein Merge/Deployment behaupten, bevor GitHub-Status und tatsächliche Veröffentlichung bestätigt sind.
- Prüfungen auf PR-Basis schützen die Produktivseite; wenn Checks fehlen oder fehlschlagen, Ursache benennen.
- Nach genehmigter Veröffentlichung Live-Erreichbarkeit und Auswirkungen auf betroffene Tool-Routen prüfen.
- Dokumentation nur dort aktualisieren, wo eine tatsächliche Entscheidung oder neue stabile Architektur entstanden ist.

## Dokumentierte Entscheidungen

- 2026-11-23: Für den Start des KI-Entwicklungssystems keine Framework-Migration, keine neue Runtime-Abhängigkeit.
- 2026-11-23: Scaffolds sind zunächst noindex, offline und werden nicht in Navigation/TOOLS/SEO übernommen.
- 2026-11-23: Der Entwicklungs-KI-Workflow bleibt über Git-Commits reviewbar; keine automatische Übertragung von Chat-Inhalten oder Secrets.

## Bei Fehlern

Fehlerursache prüfen, möglichst lokal reproduzieren und gezielt nachbessern. Keine verdeckten Workarounds, keine Produktions-Testdaten und keine unkontrollierte Wiederholung von Cloud-Schreibversuchen.
