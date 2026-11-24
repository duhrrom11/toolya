# Backformen / Backstudio DE/EN – verifizierbare Abdeckung (23.11.2026)

Geltungsbereich: `tools/baking/index.html`, `tools/baking/backstudio.js`,
`tools/baking/backstudio-pro.js`, `tools/baking/backstudio-layout.js`,
`en/cake-pan-calculator/index.html` und deren i18n-Schicht. Die englische
Oberfläche wird zur Laufzeit umgeschaltet; gespeicherte Nutzereingaben und
intern verwendete Form-/Rezeptwerte dürfen dabei nicht übersetzt werden.

## Nachweis-Matrix

| Bereich | DE/EN-Quellpfad | Browser-Regressionsnachweis | Nachweisgrenze |
| --- | --- | --- | --- |
| Englische Anleitung, FAQ und Formular | `en/cake-pan-calculator/index.html` | Beispielrechnung mit Faktor 0,64; OCR-Anleitung, Gugelhupf-FAQ, `noindex,follow` | Nicht jeder Anleitungssatz einzeln geprüft |
| Rezeptrechner, Mengen und Backzeit | `backstudio.js` | Faktor-, Füllstand-, Zutaten- und Backzeitausgabe in EN/DE; Original-Rezepttext bleibt erhalten | Rechenergebnisse nicht über alle Formen parametrisiert |
| Formenfinder und gespeicherte Formen | `backstudio.js`, `backstudio-pro.js` | Form speichern; Empfehlung und Füllbedarf EN/DE; gespeicherte Form nach Sprachwechsel identisch | Kombinationen aus zwei Formen nicht einzeln im Browser geprüft |
| Rezeptfoto/OCR und Kamera | `backstudio-pro.js` | Quelltexte, Foto-fehlt-Status, verweigerte Kamera, Telefon-Fallback, Rezept-Parsing ohne Mengen; DE/EN und `aria-live` | Echtes Gerät, echte Aufnahme und Tesseract-Erkennung nicht geprüft |
| Backstudio und Tortenplanung | `backstudio.js`, `backstudio-pro.js` | Statische Bedienelemente, dynamische Creme-/Füllmengen und Füllstand; DE/EN | 3D-WebGL mit externer Bibliothek nicht geprüft |
| Backnotizen und Bestätigung | `backstudio-pro.js` | Notiz speichern, suchen, lokalisierte Statusansage, Löschdialog in DE/EN (Abbrechen/Bestätigen); privater Notiztext unverändert | JSON-Download nicht tatsächlich geöffnet |
| Einkaufsliste | `backstudio.js` | Nutzerartikel hinzufügen; Anzeigehinweis, Checkbox-ARIA, DE/EN; gespeicherte Einträge bytegenau unverändert | Exportdatei nicht geöffnet |
| Accessibility | beide Backstudio-Skripte | OCR-/Notizstatus `role=status` + `aria-live=polite`, Bild-/3D-Beschriftungen, Checkbox-Beschriftung, `noindex` | Keine vollständige Tastatur-/Screenreader-Abnahme |
| Modale | `backstudio-pro.js` | Nativer Bestätigungsdialog zum Notizlöschen in beiden Sprachen mit Cancel/Accept | Übrige Seitendialoge nicht vollständig durchgespielt |

Ausgeführt werden vier isolierte echte Playwright-Chromium-Szenarien in
`tests/browser/baking-i18n.spec.cjs` (zusätzlich zu bestehenden i18n-Node-Tests).
Die Tests verwenden nur eine wegwerfbare DOM-/LocalStorage-Fixture oder die
statische englische Route; es gibt keinen Zugriff auf produktive Datenbanken.

## Aussage zum Abdeckungsgrad

**9 von 9 hier inventarisierten Funktionsgruppen besitzen mindestens eine
konkrete Browser-Assertion** (Testabdeckung auf Gruppenebene, **keine**
Vollständigkeitsquote für sämtliche UI-Texte oder Bedienpfade). Vollständige
DE/EN-Textabdeckung ist damit **nicht nachgewiesen**. Das repositoryweite
heuristische Audit `node scripts/i18n-coverage-audit.mjs` meldet 34 teilweise
englische Toolseiten und 41 JavaScript-Dateien mit potenziell deutschen
Laufzeitmeldungen. Diese globalen Zahlen sind **nicht** als Backformen-Fehler
oder als Backformen-Prozentzahl zu verstehen.

Offene Backformen-Prüfpunkte: echte Kamera-/OCR-Eingabe auf Mobilgeräten,
3D-WebGL/externes Three.js, Exportdateien, weitere Modale und
Tastatur-/Screenreader-Durchläufe, zweifache Formen-Kombination sowie
systematische Satz-für-Satz-Inventur aller Hilfetexte. `noindex` bleibt
unverändert, ebenso Formeln, Speicherstruktur und Maskottchen-Auswahl.
