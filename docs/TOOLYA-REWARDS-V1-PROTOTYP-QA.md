# Toolya Rewards V1 – Prototyp-Qualitätssicherung

**Datum:** 23.11.2026 · **Geprüfter Branch:** `planning/toolya-rewards-mystery-v1`  
**Prototyp:** [`prototypes/toolya-rewards-v1.html`](../prototypes/toolya-rewards-v1.html)  
**Geltung:** ausschließlich nicht produktiver, selbstständiger Konzeptprototyp.

## Änderungen nach der ersten Freigabe

- **Punkte-Beispieldaten plausibilisiert:** Ursprünglich 1.240 XP und nur 13 Ereignisse – mit den vorläufigen Rewards-V1-Regeln nicht herleitbar. Neue Ausgangsdaten: **100 XP, 5 bestätigte Ersterfolge**, 20 KP Organisation, 20 KP Finanzen, 10 KP Fürsorge, 0 KP Planung, 0 KP Vorsorge & Wünsche. Das entspricht exakt **5 × (20 XP + 10 KP)**. Der Badge-Zustand ist entsprechend **Erster Schritt, Neugierig und Vielseitig** (3 von 9).
- **Einmalige interaktive Demo:** Der Button für den simulierten neuen Tool-Ersterfolg vergibt nur einmal weitere **20 XP + 10 KP Organisation**. Dadurch steigen die Punkte auf 120 XP, die bestätigten Erfolge auf 6 und der Badge **Strukturiert (30 KP Organisation)** wird neu freigeschaltet; Badge-Zähler danach 4/9. Der Knopf wird deaktiviert; erneuter Klick darf keine weiteren Punkte bringen. Reset stellt die Ausgangsdaten wieder her.
- **Keine Datenbank- oder Cloud-Anbindung:** HTML, CSS und JavaScript lokal in einer Datei; keinerlei produktive Rewards-Implementierung. Interaktionen ändern nur flüchtige Demo-Zahlen.

## Statische Verifikation – Ergebnisse

**11 von 11 Quelltext-/Invariantenprüfungen bestanden** auf der im Branch gespeicherten HTML-Datei:
1. Doctype und Abschluss des HTML-Dokuments vorhanden.
2. Die simulierten XP/KP entsprechen der Beispiel-Ökonomie und fünf Kompetenzkategorien existieren.
3. Genau neun Badge-Definitionen vorhanden.
4. Explizit nur Beispieldaten, kein Supabase-Client.
5. Keine externen Script-, Bild- oder CSS-Anforderungen.
6. Responsive Breakpoints 1100 / 700 / 420 px vorhanden.
7. Badge-Dialog mit Dialogsemantik und Escape-/Tab-Behandlung.
8. Reduced-Motion-Regel vorhanden.
9. Demo-Button einmalig, danach deaktiviert.
10. Reset reaktiviert den Demo-Button.
11. Keine Live-Formulare im Prototyp.

**Nicht ausgeführt:** Ein tatsächlicher visueller Browsertest mit Screenshots auf Mobile/Tablet/Desktop und eine vollständige E2E-Klicksimulation. Diese Prüfungen bleiben für die finale Designabnahme erforderlich. Die statischen Tests beweisen nicht, dass alle Browserlayouts fehlerfrei sind.

## Manuelle Browsertest-Checkliste

Die eigenständige HTML-Datei herunterladen und lokal mit Firefox, Chrome/Chromium und einem Mobilbrowser öffnen. Nicht als öffentlichen GitHub-Pages-Link veröffentlichen.

- **Desktop 1440×900:** XP-Karte, fünf KP-Karten, Badge-Vitrine mit 9 Einträgen, kein ungewolltes Scrollen in X-Richtung, Text ohne Überlappung.
- **Tablet 768×1024:** 3/2-Kompetenzraster bzw. umgebrochene Karten, Badges in zwei Spalten, Header vorhanden.
- **Mobil 390×844 und 320×640:** gut lesbares Einspalten-Layout ohne horizontalen Überlauf; beide Demo-Buttons erreichbar.
- **Badge-Detail:** Jeden der neun Badges öffnen; Status und Bedingung korrekt; Escape/Schließen/Overlay funktionieren; Fokus kehrt zur angeklickten Badge-Karte zurück.
- **Demo:** Start bei 100 XP / KP [20,20,10,0,0] / 3 Badges; erster Klick → 120 XP / KP [30,20,10,0,0] / 4 Badges; weiterer Klick → **keine** Änderung; Reset → Ursprungswerte.
- **Zugänglichkeit:** Tastatur nur Tab/Enter/Escape, sichtbare Fokusmarkierungen, 200 % Textzoom, systemweite Bewegungsreduktion, Screenreader-Bezeichnungen.
- **Sicherheit:** keine Anfragen an Supabase, keine Weiterleitung zu Live-Tool-Aktionen, keine echten Nutzerdaten, keine Cookies/Storage-Änderung.

## Freigabestatus

- **Dokumentiert:** Produktziel, UX/UI und voraussichtliches Punktemodell.
- **Prototyp im Planungsbranch:** erstellt und statisch überprüft.
- **Offen:** visuelle Browserprüfung, Nutzerabnahme des Interaktionsverhaltens, Backend-Architektur und produktive Funktion.
- **Nicht geschehen:** Branch nach `main` gemergt, Livesite geändert, produktive Supabase-Migration, echtes XP vergeben.
