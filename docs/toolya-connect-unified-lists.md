# Toolya Connect – Dashboard-Aufgaben und gemeinsame Einkaufsliste

## Produktregel

Das Dashboard zeigt **Projektionen der Originaldaten**, keine heimlich kopierten Tool-Snapshots. Ein Abhaken schreibt in die Originalquelle zurück, deren Revisions- und Berechtigungsregeln weiterhin gelten. Jedes Tool bleibt die Quelle seiner eigenen Aufgaben und Einkaufsartikel.

### Bestehende Anbindungen

| Quelle | Im Dashboard | Rückkanal |
|---|---|---|
| Dashboard-Einkaufsartikel | Gemeinsame Einkaufsliste | Eigener Cloud-Eintrag mit RLS/CAS |
| WG-Organisator: `shopping[]` aller berechtigten `wg_spaces` | Gemeinsame Einkaufsliste | `done` im jeweiligen WG-Snapshot via `updated_at`-CAS |
| WG-Organisator: `cleaning[]` | „Meine Aufgaben“ | `done` im jeweiligen WG-Snapshot via `updated_at`-CAS |
| Pflanzenpflege-Gießplan | Fällige Aufgaben | Bestehender Gießplan-Adapter: Gießhistorie, Zisterne, Rhythmus via Cloud-CAS |

Gleichlautende Artikel werden nicht durch Titelvergleich zusammengefasst. Jeder Eintrag behält seine `source`, `groupId`, `itemId` und den Originallink.

**Geschenk-Wunschlisten sind keine Einkaufslisten.** Eine automatische Übernahme könnte fremde oder nur vorgemerkte Geschenke fälschlich als Kaufauftrag zeigen. Für diese fachlich andere Funktion wäre eine ausdrückliche „Zur Einkaufsliste hinzufügen“-Aktion erforderlich.

WG-Daten können auch anderen freigegebenen Mitgliedern gehören. Der Dashboard-Connector liest ausschließlich die über Supabase RLS erlaubten `wg_spaces` (Eigentümer oder Mitglieder); er kopiert weder WG-Informationen in die privaten Dashboard-Tabellen noch liest er lokale `wg_shopping`-Caches anderer Browser.

## Adaptervertrag für alle folgenden Toolya-Tools

Implementierung: `shared/toolya/connect-source-registry.mjs`.

Ein freigegebener Adapter benötigt:

- Stabile, geprüfte `id` und `load()` mit `{shopping:[],tasks:[]}`.
- Pro Eintrag: `{source,kind,id,text,done,origin,url}` und optional `groupId,itemId,assignee`.
- `setDone(item,boolean)` mit Benutzerprüfung, aktueller Originalrevision, bestätigtem Cloud-Write und Konfliktfehler bei konkurrierenden Änderungen.
- Fail-closed-Verhalten bei Auth-Fehlern und Kontowechsel; keine stillschweigende Offline-Kopie.
- Isolierte Tests für Eigentümer-/Mitgliederzugriff, Konflikte, Wiederholung und verlorene Netzwerkantworten.

Die gemeinsame Einkaufsliste erlaubt das Drucken ohne Datenversand an Drittanbieter. Beim Drucken werden nur offene Artikel inklusive Herkunft angezeigt; bestätigte Artikel lassen sich am Bildschirm optional einblenden. Es wird der Browser-Druckdialog verwendet.

## Grenzen / nächster Ausbau

Die überprüfte Tool-Landschaft enthält als echte Einkaufsliste das Feld `wg_spaces.payload.shopping`. Weitere Tools können über neue, spezifische Adapter angeschlossen werden, sobald dort eigenständige Einkaufslisten oder Aufgaben vorhanden sind. Pflanzen-Lagerbestand ist kein automatisch zu kaufender Bedarf; Wünsche sind keine bestätigten Einkäufe.

**Kein Anspruch, dass damit bereits jede beliebige Tätigkeit jedes Toolya-Tools automatisch eine Aufgabe erzeugt.** Neue Tool-Verbindungen benötigen pro Tool eine fachliche Zuordnung: Fälligkeit, Erledigung und zulässige Rückwirkung. Automatische Erledigungen dürfen insbesondere keine Buchungen, Zahlungen, Preisänderungen oder anderen irreversiblen Aktionen auslösen.

## Produktivschutz

- `dashboard_shopping_items` ist die einzige neue Datenbanktabelle und hat owner-only RLS.
- WG- und Gießplan-Bestände bleiben in ihren ursprünglichen Strukturen.
- Keine automatischen Einträge im Produktivkonto und keine Löschmigrationen.
- Merge erst bei grünen Tests inklusive Plattform- und Browser-Regressionen.
