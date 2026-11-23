# Toolya Wishes: englische redaktionelle Texte auf der öffentlichen Finder-Seite

Stand: 23.11.2026 · Eigenständige, noch unveröffentlichte Folgeänderung nach dem DE/EN-Quality-System (#319).

## Ausgangslage

Die bestehende Wishlist-Lokalisierung in `shared/toolya/i18n/wishes-dom.mjs` übersetzt seit langem Überschriften, Buttons, Formulare und definierte Statusmeldungen. Sie übersetzt bewusst **nicht beliebige Paragraphen und Spans**, weil diese in Wunschlisten, privaten Profilen und frei eingegebenen Inhalten nutzererzeugte Daten enthalten können.

Die Prüfung von `tools/wishes/public.html` zeigte deshalb eine **bestätigte** Lücke: feste, vom Toolya-Team verfasste Erklärungen zum Wunschlisten-Finder, redaktionelle Abschnittsüberschriften, der Affiliate-Hinweis und Datenschutzinformationen blieben auch bei `?lang=en` deutsch. Der deutsche Seitentitel wurde ebenfalls nicht übersetzt; `<html lang="de">` blieb unverändert.

## Umsetzung

- **28 konkrete, statische Textknoten** in `public.html` ausdrücklich mit `data-wishes-copy` markiert. Das Attribut verändert weder Sichtbarkeit noch das Styling.
- Die **29 englischen Quelltextzuordnungen** (28 Texte + der Seitentitel) sind in `shared/toolya/i18n/wishes-copy.mjs` eingefügt. Wichtige Aussagen über öffentliche Sichtbarkeit, nicht bestätigte Identitäten, Datenschutz und Amazon-Partnerlinks wurden inhaltlich erhalten.
- Der bestehende DOM-Übersetzer erlaubt nur `p[data-wishes-copy]` und `span[data-wishes-copy]` zusätzlich zu seiner bisherigen festen Auswahl. Er verwendet weiterhin die exakte `wishesText`-Tabelle und schreibt ausschließlich in Textknoten, niemals `innerHTML`.
- Die bestehende Exclusion-List für `.profile-card`, `.gift-card`, `[data-user-content]`, `[contenteditable]` und andere private Bereiche bleibt erhalten. Kein Scan beliebiger `p`-/`span`-Texte.
- Der gemeinsame Wishlist-Sprachumschalter setzt nun die Dokument-Sprache auf `en` bzw. `de` und verwendet für bekannte öffentliche Titel die exakte Übersetzung. Für bisher nicht abgedeckte Titel bleibt der vorherige Fallback erhalten.
- HTML-Quelltext bleibt deutsch als Standard und wird nicht per API, CMS oder Cloud umgeschrieben. Der englische Zustand ist eine browserseitige, reversible UI-Darstellung.

## Verifizierbare Tests

`tests/i18n/wishes.test.mjs` prüft alle 28 markierten Texte im **echten öffentlichen HTML**: vorhandene Katalogschlüssel, echte EN-Abweichungen, Rückübersetzbarkeit, unveränderte unmarkierte Texte und unveränderte synthetische Profildaten/Inputs. Titel sowie Sichtbarkeits-, Affiliate- und Datenschutzinformationen werden separat geprüft.

`tests/i18n/wishes-editorial-browser.cjs` prüft die echte öffentliche HTML-Seite in **isoliertem Chromium** bei 320 und 390 px: englischen Titel, Sprachwahl, `<html lang>`, deutsche Rückumschaltung und Erhalt der gespeicherten synthetischen Nutzer-/Maskottchendaten. Der Browser blockiert alle Zugriffe außerhalb des **lokalen** Testservers, einschließlich Supabase. Die GitHub-CI integriert den Test in `.github/workflows/i18n-quality.yml`.

```bash
npm ci --ignore-scripts
npm run test:i18n
node tests/i18n/wishes-editorial-browser.cjs
npm run i18n:check
```

## Grenzen und noch offene Arbeit

- Dies ist **eine gezielte Übersetzung von 28 festen Texten einer öffentlich sichtbaren Tool-Seite**, keine vollständige 100%-Lokalisierung aller 17 Wishlist-Ansichten oder der anderen elf Tools.
- Von dynamischen Inhalten und den abgesicherten Statusmeldungen werden nur bereits bekannte, exakt übereinstimmende Quellen übersetzt. Benutzerinhalte, importierte Listen, Namen, Notizen, IDs und verschlüsselte Daten sind weiterhin tabu.
- Der alte Inventarbericht zählt deutsche Quelltextkandidaten, nicht im Browser tatsächlich unübersetzte Texte; seine Ausgangswerte bleiben daher auch nach einer erfolgreichen Runtime-Übersetzung sichtbar.
- Englische Marketing-/Informationsseiten bleiben bewusst `noindex`, bis die jeweilige App-Übersetzung fachlich vollständig geprüft wurde.
- Keine Änderung an der Wishlist-Cloudlogik, Amazon-Importer, Authentifizierung, Datenbankschema, Supabase-Laufzeitkonfiguration, Maskottchen-Originaldateien oder gespeicherten Nutzerdaten.

Weitere echte Lücken sollten auf Grundlage isolierter Browserbeobachtungen in kleinen, fachlich prüfbaren PRs geschlossen werden.
