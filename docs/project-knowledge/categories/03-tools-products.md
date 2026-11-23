# Tools und Funktionen

**Quellen:** Export-Chats u.a. „Wunschlisten App entwickeln“, „Amazon Wunschlisten überarbeiten“, „Wishlist Profile Brainstorming“, „Wishlist Profiling Fortsetzen“, „Amazon Wunschlisten Finder Scraper“, „Amazon Wunschlisten Finder fortsetzen“, „Features für Umzugskisten“, „Dashboard verbessern“; README und Audit.

## Erfasste Anforderungen
- Wishlist: öffentliches Verzeichnis; nur öffentliche Amazon-Listen importieren, Quellen und Duplikate beachten. Öffentliche Profile erfordern klare Transparenz über Sichtbarkeit.
- Profilfelder laut späterer Entscheidung: Privatperson Vor- und Nachname **oder** Organisationsname, Land verpflichtend; bestehende Profile nicht blind verändern.
- Wunschlisten-Finder: Fundstellen erst prüfen und auswählen, keine ungefragte Veröffentlichung; bestehende Listen erkennen und doppelte Einträge verhindern.
- Dashboard: toolübergreifende Aufgaben und Einkaufslisten; explizite Bestätigung und druckbare Listen als gewünschte Funktionen.
- Umzugskisten: Feature-Reihenfolge wurde in einem Chat nachträglich angepasst; tatsächliche finale Reihenfolge im Code prüfen.
- Haustier-Apotheke: Produkt-Suchlink als Wunsch; Affiliate-Kennzeichnung und technische Implementierung gesondert prüfen.
- Scrollmeter ausschließlich als Webtool.

## Konflikt / Datenschutz
„Alle Profile öffentlich“ ist eine Produktidee aus einem Chat, **keine Erlaubnis**, persönliche Daten ohne ausdrückliche Nutzerfreigabe oder Datenschutzprüfung offenzulegen. Das Master-Audit weist auf Profil-/Indexierungsrisiken hin.

## Offen
Zwölf Tools und Routen aus aktuellem main vollständig inventarisieren; Funktionen als implementiert nur mit Datei-/CI-/Live-Nachweis markieren.
