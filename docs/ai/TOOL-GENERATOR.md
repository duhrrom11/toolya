# Toolya Tool Generator – Version 0.1 (Fundament)

Ein bewusst kleiner Offline-Generator für **neue** statische Tool-Prototypen. Er verwendet nur Node.js-Bordmittel und erstellt keine Supabase-Objekte, Secrets, Benutzerdaten oder GitHub-Commits.

## Aufruf

Im Repository:

    node scripts/create-tool.cjs --slug mein-tool --title "Mein Tool" --description "Ein Tool fuer den Alltag." --dry-run

Danach denselben Aufruf **ohne** --dry-run verwenden, um tools/mein-tool/index.html, app.mjs und README.md zu erzeugen. Alternativ: npm run tools:scaffold -- --slug ... --title ... --description ... .

## Sicherheitsgrenzen

- Nur Slugs aus Kleinbuchstaben, Ziffern und einzelnen Bindestrichen; kein Pfad-Traversal.
- Eine bereits vorhandene Tool-Directory wird niemals überschrieben.
- Ungültige Titel/Beschreibungen sowie Steuerzeichen und mehrzeilige Angaben werden abgewiesen; HTML-Metadaten sind escaped.
- --dry-run schreibt **keine** Dateien. Der Generator selbst ruft weder APIs noch GitHub noch Supabase auf.
- Die Entwurfsseite ist noindex,nofollow und führt nur einen lokalen Platzhalter-Klick aus.
- Ausschließlich neue lokale Dateien. Bestehende Tool-Seiten, Auth-/RLS-Regeln, CI und Produktionsdaten bleiben unberührt.

## Wichtige Integrationsgrenzen

- Gemeinsamer Plattform-Loader wird referenziert. Ein neuer Slug ist jedoch noch nicht im TOOLS-Mapping in shared/toolya/platform.mjs; dort greift noch der Home-Fallback.
- Das erzeugte Header-Markup ist Platzhalter und **kein** fertiger markenkonformer Themen-Header. Vor Veröffentlichung bestehende Header-/Footer-/Wortmarken-Assets sowie Nutzerauswahl der Maskottchen verifizieren.
- Kein automatischer Eintrag in Navigation, Startseite, Sitemap, Runtime-Inventar oder SEO-Seiten.
- Kein Backend, keine Authentifizierung, kein Datenspeicher, keine Lokalisierungsabdeckung. Diese Punkte gehören in den konkreten Tool-PR.

## Checkliste vor echter Veröffentlichung

1. Tatsächliche Fachfunktion und Tests hinzufügen; Platzhalter entfernen.
2. Gemeinsame Module wiederverwenden, TOOLS-Rolle und Maskottchen-Header korrekt integrieren.
3. Bestandsschutz für die zwölf vorhandenen Tools und Wishlist/Importer prüfen.
4. Mobile/Keyboard/Reduced Motion/Locale/Datenschutz prüfen.
5. Falls Cloud benötigt: eigene Sicherheitsanalyse von Auth, RLS, Schreibbestätigungen und Konflikten; isolierte Tests.
6. SEO-Entscheidung treffen und erst dann noindex/Navigation/Runtime-Inventar ändern.
7. PR mit Testnachweisen erstellen; Live erst nach geprüftem Release bestätigen.

## Validierung

    node --check scripts/create-tool.cjs
    node --test tests/ai/*.test.cjs

Die Tests verwenden ein temporäres Testverzeichnis und löschen es wieder. Es wird kein Tool in Produktion generiert. Die GitHub-Action ai-development.yml führt diese Prüfungen bei passenden Änderungen aus.
