# Toolya Tool Generator – Version 0.2 (gemeinsame Plattform im Entwurf)

**Erweiterung V0.3:** `--template counter|percentage|checklist`, automatisch erzeugte Unit-Tests und eine sichere Vorschau sind unter [Tool Builder](TOOL-BUILDER.md) dokumentiert. Standard `starter` und bestehende Entwürfe bleiben erhalten.

Ein lokaler, dependency-freier Generator für **neue, unveröffentlichte** Tool-Prototypen.
Er erzeugt drei Dateien unter `tools/<slug>/`. Er ruft weder GitHub noch Supabase auf,
verändert keine Produktivtabellen und überschreibt niemals bestehende Tool-Verzeichnisse.

## Aufruf

```bash
npm run tools:scaffold -- \
  --slug mein-tool \
  --title "Mein Tool" \
  --description "Ein neues Tool fuer den Alltag." \
  --outfit plants \
  --dry-run
```

Erst wenn die Ausgabe und der Slug stimmen, denselben Befehl **ohne** `--dry-run` verwenden.
`--outfit` ist optional; Standard ist `home` (neutraler Alltagsbegleiter).
Die Rolle kann derzeit nur aus den bereits vorhandenen Tool-Rollen stammen:
`home`, `wishes`, `budget`, `housemates`, `moving`, `estate`, `car`,
`pet-health`, `parking`, `loans`, `plants`, `meters`, `baking`.

## Was schon automatisch funktioniert

- Der neue Entwurf lädt `shared/toolya/platform.mjs` und verwendet dessen **bestehenden**
  Themen-Header, Toolya-Wortmarke, Footer, Einstellungsdialog und Maskottchen-Renderer.
  Keine Kopie der Komponenten oder improvisierte zweite Wortmarke.
- Das `--outfit` wird als validierte, rein lokale Metainformation eingebettet.
  Nur eine neue Tool-Route mit explizitem `data-toolya-draft="true"` darf auf
  diese bestehende Outfit-Rolle zurückgreifen; registrierte Tools behalten ihre eigene Rolle.
- Die Charakterfarbe richtet sich weiterhin nach den Einstellungen des Nutzers
  (türkis/weiß oder lila/creme), nicht nach dem ausgewählten Outfit.
- Eine bestehende Originalgrafik wird nicht verändert: die Plattform zeigt den
  vorhandenen Outfit-Atlas an.
- Ohne JavaScript ist die einfache semantische Seitenüberschrift samt Link zur
  Hauptseite sichtbar; die erweiterte Toolya-Oberfläche benötigt JavaScript.
- Das generierte `app.mjs` enthält ausschließlich einen lokalen
  Beispielbutton mit einer Statusmeldung, noch **keine Fachfunktion**.

## Sicherheitsgrenzen

- Slug validiert, kein Traversal, kein Überschreiben, HTML-Texte escaped.
- Eine `--dry-run`-Ausführung schreibt keine Dateien.
- Prototype bleiben `noindex,nofollow` und werden nicht in Navigation, Sitemap,
  Tool-Inventar oder `TOOLS` eingetragen.
- Keine Authentifizierung, keine Datenpersistenz, keine Secrets, keine Cloud-Requests
  durch den Generator oder dessen Beispiel-Fachlogik.
- Das gemeinsame Plattformmodul kann wie bisher externe Ressourcen für
  Anzeige/Einwilligung nachladen; Browser-Tests blockieren externe Requests.
- Automatische Gestaltung bedeutet **nicht** Produktionsfreigabe oder fertige
  Übersetzung: DE/EN-Fachtexte und verantwortliche Datenverarbeitung bleiben
  pro echtem Tool zu implementieren.
- Keine Änderungen an den zwölf bestehenden produktiven Routen, der Homepage,
  Wishlist/Amazon-Importer oder Backend-Migrationen.

## Bevor ein neuer Tool-Slug produktiv wird

1. Fachfunktion implementieren; Platzhalter ersetzen.
2. Tool-Slug und passende Rolle in `shared/toolya/platform.mjs` bewusst
   registrieren und die Vorschau-Markierung entfernen.
3. Falls eine eigene Outfit-Illustration nötig ist, separat entwickeln und
   Atlas-/Lizenz-/Originaldateischutz prüfen.
4. Navigation, SEO, Sitemap und Runtime-Inventar nach freigegebenem Umfang ergänzen.
5. Responsivität, Tastaturbedienung, Mobilgeräte, reduzierte Bewegung, Dialoge,
   DE/EN-Übersetzung und beide gewählten Maskottchen kontrollieren.
6. Falls Datenzugriff nötig: Auth, RLS, Schreibbestätigungen, Offline-/Konfliktfälle
   sicher implementieren und isoliert testen – nie an Produktivdaten herumtesten.
7. PR mit Prüfnachweisen erstellen; nur geprüfte Änderungen freigeben.

## Verifikation

```bash
node --check scripts/create-tool.cjs
npm run test:ai
# benötigt Playwright und Chromium; im neuen GitHub-Actions-Gate enthalten:
node tests/ai/tool-generator.browser.cjs
```

Der Browser-Smoke erstellt genau ein temporäres Tool-Verzeichnis im Checkout,
prüft die gemeinsame Plattform und beide Maskottchen bei 320 px und löscht
die temporären Dateien am Ende. Alle externen Browser-Requests werden blockiert.
Keine Testdaten oder Requests an produktive Supabase-Datenbanken.

Siehe auch `AGENTS.md`, `docs/ai/ARCHITECTURE.md` und
`docs/ai/DEVELOPMENT-WORKFLOW.md`.
