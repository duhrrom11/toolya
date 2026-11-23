# Toolya Rewards V1 – UX/UI-Designspezifikation

**Stand:** 23.11.2026 · **Artefakt:** konkreter Entwurf zur späteren Umsetzung, **keine produktive Implementierung**.  
**Scope:** Genau **XP, Kompetenzpunkte und Badges**. Ranglisten, Videos, Mystery, zusätzliche Levels, Quests, Ko-fi-XP und Fantasiewelten sind **nicht V1**.  
**Basis:** [Aktuelle Produkt-Spezifikation](TOOLYA-REWARDS-V1-XP-KOMPETENZEN-BADGES.md) und [XP-/KP-/Badge-Regelwerk](TOOLYA-REWARDS-V1-REGELWERK-UND-ABNAHME.md).

## 1. Bestandsbezug und Gestaltungsziel

Live-Frontend laut GitHub-`main` am 23.11.2026:
- `dashboard/index.html` nutzt `dashboard/dashboard.css` und vorhandene Toolya-UI/Settings; Startseite `index.html` und shared platform sind gesondert zu erhalten.
- Dashboard-CSS verwendet system-ui, hellen Hintergrund `#f4f9fb`, Text `#1d3d4b`, Akzent-Türkis `#087b85`, Weißflächen, großzügige Radien und dezente Schatten.
- Kopf-/Fußbereich und Maskottchenwahl sind Bestand. Keine spontane neue Logo- oder Figurenvariante.

**Ziel:** Eine ruhige, erwachsene „Meine Erfolge“-Ansicht im vertrauten Toolya-Stil. Keine Dark-Gaming-UI als neues Hauptdesign, keine Goldmünzen, kein Casino-Look. Qualitätsgefühl durch Raum, gute Typografie, präzise Iconografie und subtile Oberflächen; kleinster Eingriff ins bestehende Dashboard.

**Informationshierarchie:** (1) Gesamt-XP groß und klar, (2) fünf Kompetenzzähler als verständliche Kategorien, (3) persönliche Badge-Vitrine. Keine neue Gamification-Navigation mit zehn Unterseiten. Benutzer muss auf einen Blick erkennen, **was er verdient hat, wofür und wie es weitergeht**.

## 2. Seitenarchitektur und responsive Wireframes

### 2.1 Desktop (≥1024 px)

Bevorzugter Pfad nach Architekturprüfung: `dashboard/#erfolge` bzw. ein dezenter „Meine Erfolge“-Bereich im bestehenden Dashboard (keinen Pfad als implementiert ausgeben). Keine zusätzliche öffentliche Seite.

```text
┌─────────────────────────────────────────────────────────────────────┐
│ bestehender Toolya-Header / Logo / Konto / Einstellungen            │
├─────────────────────────────────────────────────────────────────────┤
│ Mein Dashboard   |   Meine Erfolge                                   │
│                                                                     │
│ MEINE ERFOLGE                                      [Info zu Punkten]│
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ GESAMT-XP             1.240 XP (Beispieldaten)                  │ │
│ │ 13 bestätigte Tool-Erfolge · Kein täglicher Pflichtfortschritt │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ DEINE KOMPETENZEN                                                   │
│ ┌────────────────────────────────┬────────────────────────────────┐ │
│ │ Organisation            150 KP │ Finanzen                 100 KP │ │
│ │  [dezente Kategorie-Ikone]     │ [dezente Kategorie-Ikone]       │ │
│ ├────────────────────────────────┼────────────────────────────────┤ │
│ │ Fürsorge                 60 KP │ Planung                   80 KP │ │
│ ├────────────────────────────────┴────────────────────────────────┤ │
│ │ Vorsorge & Wünsche                                  40 KP       │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ DEINE BADGES                                         3 von 9        │
│ ┌────────────────┬────────────────┬──────────────────────────────┐ │
│ │ [Emblem]       │ [Emblem]       │ [Emblem]                     │ │
│ │ Erster Schritt │ Neugierig      │ Vielseitig                   │ │
│ │ erworben       │ erworben       │ noch nicht erworben          │ │
│ └────────────────┴────────────────┴──────────────────────────────┘ │
│                                                                     │
│ bestehender Toolya-Footer                                           │
└─────────────────────────────────────────────────────────────────────┘
```

**Hinweis:** Die Beispielzahlen sind rein illustrativ und dürfen weder als echte Nutzerdaten noch als echte Fortschrittsberechnung gelten. „13 bestätigte Erfolge“ muss bei späterem Build aus tatsächlichen gezählten anerkannten Events stammen oder entfallen.

### 2.2 Tablet (600–1023 px)

Header unverändert; Gesamt-XP volle Breite; Kompetenzkarten in zwei Spalten, fünfte über volle Breite oder im Zweiersystem mit sinnvoller Ausrichtung; Badgekarten je zwei pro Reihe. Text immer zweizeilig möglich; keine abgeschnittenen Kompetenznamen.

### 2.3 Smartphone (<600 px)

Gesamt-XP zuerst; darunter **eine** Kompetenzkarte je Zeile, fünfmal; Badges in zwei Spalten nur bei mindestens ~360 px, sonst eine Spalte. Keine horizontale Scrollpflicht. Karte vollständig als Einheit bedienbar; ein Badge-Detail erscheint als zugänglicher Dialog oder einfache aufklappbare Beschreibung, ohne Touch-Zwang.

```text
┌─────────────────────────────┐
│ bestehender mobiler Header  │
│ Mein Dashboard / Erfolge    │
│                             │
│ Gesamtfortschritt           │
│ 1.240 XP                    │
│                             │
│ Kompetenzen                 │
│ Organisation       150 KP   │
│ Finanzen           100 KP   │
│ Fürsorge            60 KP   │
│ Planung             80 KP   │
│ Vorsorge & Wünsche  40 KP   │
│                             │
│ Badges                3/9   │
│ [Badge]     [Badge]         │
│ [Badge]     [Badge]         │
│ ...                         │
│ bestehender Footer          │
└─────────────────────────────┘
```

## 3. Komponenten-Spezifikation

### C1 – XP-Headerkarte

- Eyebrow „Dein Gesamtfortschritt“, zentraler numerischer XP-Wert mit semibold/bold Ziffern und ausreichend Kontrast.
- Ruhiger Hilfetext „XP erhältst du für bestätigte Erfolge mit Toolya.“ Bei Bedarf „So funktionieren Punkte“ als aufklappbare Erklärung.
- **Keinen Prozentbalken ohne echtes definiertes Ziel**; V1 hat absichtlich keine zusätzlichen Levelmechaniken. Ein neutrales Diagramm ist optional, die numerische Zahl ist ausreichend.
- Anfangszustand: „Noch keine XP. Wenn du ein Tool erfolgreich nutzt, kann dein erster Erfolg hier erscheinen.“ Keine Pflicht zur Registrierung von beliebigen Nutzern nur wegen der UI.

### C2 – Fünf KP-Karten

- Organisation, Finanzen, Fürsorge, Planung, Vorsorge & Wünsche – exakt fünf Kategorien.
- Jede Karte: Icon/visuelles Merkmal, Kategorie, KP-Wert, kurze Erklärung „Wofür zählen die Punkte?“; optional bei Klick ein leichter Tooltip mit zugehörigen Tools.
- **Kein Prozent-Profil** oder 100 % Meisterschaft, da KP Nutzung reflektieren, keine objektive Fähigkeit; im Entwurf der vorigen Chatansicht gezeigte Prozentbalken sind **nur Platzhalter und nicht als endgültige UI übernehmen**.
- Kategorie-Zuordnung aus geltendem Eventregelwerk, keine umetikettierten Daten.

### C3 – Badge-Vitrine

- 9 Badge-Definitionskarten entsprechend Regelwerk, in klaren Zuständen **erworben**, **noch offen** und ggf. **nicht verfügbar**, wenn eine faire/privacy-sichere Bedingung nicht besteht.
- Einheitliches, erwachsenes Vektor-Emblem-System; nicht erworbene Badges mit neutralem Kontrast, nicht allein durch Blurring oder Graustufenstatus erkennbar.
- Jede Karte zeigt Namen, kurzen Grund, Datum bei Erwerb falls zulässig, **nicht-sensitive** Bedingung für noch offene Badges, Textstatus. Keine echten Namen, Zahlungen, Gesundheit/Nachlassdetails.
- Bei erhaltenem Badge eine kurze optionale unaufdringliche Rückmeldung im Tool. Keine automatischen Fullscreen-Feste, unnötigen Popups, Sound oder haptischen Effekte.
- Badge „Vorbereitet“ bei Datenschutzkonflikten nur in privatem Profil; keine Vorsorge-/Nachlassdetail-Tooltiptexte.

### C4 – XP-Erfolgstoast (nur bei tatsächlicher Serverbestätigung)

- Kurzer Text: „Erfolg bestätigt · +20 XP · +10 KP Organisation“.
- Sichtbar nur nach bestätigter Backendvergabe, nicht bloß erfolgreichem Klick; bei Datenbankverzögerung kein behaupteter XP-Erfolg.
- Automatisch nicht zu schnell ausblenden; keine essenziellen Informationen ausschließlich im Toast; persistierte Punkte auf Erfolge-Seite.
- Bei Rewards-Serverfehler Toolfluss **niemals** blockieren; Fehlermeldung zum Tool und Punktesystem separat behandeln.

### C5 – Badge-Detail (aufklappbar oder Dialog)

- Badge-Name, Symbol, erfüllte bzw. offene Bedingung in normaler Sprache, ggf. Erwerbsdatum.
- Schließen via Escape bei Dialog, Fokus zurück zum Auslöser, keine unfokussierbaren Overlays.
- Sensitive Badges nur neutrale Bedingung ohne Nennung spezieller privater Maßnahmen.

## 4. Entwurfs-Tokens / technische Designvorgaben

**Bestehende Farben aus `dashboard/dashboard.css` ausdrücklich beibehalten**, zunächst ohne neue globale Token-Infrastruktur:

| Rolle | Vorgesehener Wert | Hinweis |
|---|---|---|
| Seitenhintergrund | `#f4f9fb` | Bestand |
| Primärtext | `#1d3d4b` | Bestand |
| Aktions-Türkis | `#087b85` | Bestand |
| Sekundärgrün/Türkis | `#117a81` | bestehender Zahlenton |
| Oberflächen | `#ffffff` | Bestand |
| Kartenrahmen | `#d8e8ee` | Bestand |
| Dezente Schatten | `0 6px 22px #153d4b08` | Bestand |
| Fokus | `3px solid #7954a9`, Offset 3px | bestehender sichtbarer Fokusstil |

- Schriften: vorhandene `system-ui`-Familie; keine externen Fontdownloads notwendig. Wortmarke weiterhin originalgetreu aus bestehender Site-/Header-Komponente beziehen, nicht als Textlogo frei neu bauen.
- Größen: XP-Zahl Desktop ~36–44 px, mobil ~32–38 px; Abschnittstitel 20–24 px; Kartentitel 15–17 px; Fließtext 14–16 px, Zeilenabstand ~1.45–1.6.
- Raster: max. 1160–1208 px Inhalt, Desktop Kartengap ~16–20 px, Mobil 12–14 px.
- Radius: große Karten 18–20 px, kleine Karten 12–16 px, Badge-Symbol-Pod rund.
- Icons: konsistenter Vektor-Stil, lesbare einfache Silhouetten, zurückhaltende Metallic-Anmutung nur innerhalb erworbener Badges; nicht mehrfach generierte ungeprüfte Pixelgrafiken.
- Farbe allein darf weder Kompetenzkategorie noch erworbenen Badge-Status kennzeichnen. Kontrast vor Release mit tatsächlichen Komponenten messen.

## 5. Badge-Art-Direction – keine 3D-Abenteuerwelt

**Neun kleine Embleme:** Jede Badge-Grafik wird als SVG mit fester Kompositionsstruktur, verlässlicher Kontrastkontrolle und begrenzter Farbhierarchie angelegt. Keine fremden Markenlogos.

| Badge | Bildsprache | Gefahren vermeiden |
|---|---|---|
| Erster Schritt | stilisierter markierter Startpunkt | kindliche Fußstapfen-Cartoons |
| Neugierig | schlichter Kompass / drei Wegmarken | Fantasy-Schatzkarte |
| Vielseitig | fünf abstrakte, verbundenen Facetten | Ranglistenpokal |
| Strukturiert | geordnetes Raster / Häkchen | Checkbox als Zertifikat |
| Mit Überblick | subtile Konturlinien / Diagramm | Geldmünzen als Glücksspielgefühl |
| Achtsam | ruhiges Blatt / zurückhaltende Form | medizinisches Symbol |
| Durchdacht | geometrische Lösung / ineinandergreifende Linien | Fantasy-Quest |
| Vorbereitet | geschlossenes Schild mit diskretem Punkt | Testament-Symbol / intime Assoziation |
| Beständig | drei dezente Markierungen / Zeitlinie | Streak-Flamme oder Fristdruck |

**Badges ausschließlich kosmetisch und informativ.** Keine NFTs, kein Geldwert, keine Aufstiegspflichten, kein Vergleich mit fremden Nutzern.

## 6. Zustände und Fehlerbehandlung

| Zustand | Nutzeranzeige | Verhalten |
|---|---|---|
| Konto ohne XP | neutraler Empty State, Erklärung und Zugang zu den Tools | keine künstliche „0 % schlecht“-Anzeige |
| XP/KP geladen | Zähler konsistent und zeitnah aktualisiert | bei Reload unverändert |
| Rewards lädt | stille Skeleton-/Textanzeige, kein springendes Dashboard | begrenzte Wartezeit, Wiederholung möglich |
| Rewards nicht erreichbar | „Deine Erfolge sind momentan nicht verfügbar“ | restliche Tools funktionieren |
| Badge offen | Textstatus und neutrale Voraussetzung | kein Alarm oder negativer Status |
| Badge erhalten | gestaltetes Emblem, Datum soweit möglich | ohne Zwangsmodal |
| Bedingung aus Datenschutzgründen deaktiviert | „Noch nicht verfügbar“ statt unerreichbarem Goal | keine privaten Hinweise preisgeben |
| Nutzer abgemeldet | persönliche Daten verstecken | kein lokales XP als angeblich gespeichertes Konto anzeigen |

## 7. A11y, Performance, Datenschutz

- WCAG 2.2 AA als Zielstandard prüfen; alle Texte ohne Tooltips bedienbar, Keyboard-Fokus sichtbar, 44×44 px bevorzugtes Touchziel, Licht-/Dunkelkontrast gemäß realem Theme.
- Für `prefers-reduced-motion: reduce` Bewegungen entfernen; Animationen nur für unaufdringliches Achievement-Feedback und niemals für Verständnis nötig.
- Beim Öffnen der Erfolge keine zusätzlichen Mediendateien/Videos; kleine statische SVGs, lazy loading bei Bedarf.
- Weder sensitive Tool-Metadaten noch Klarnamen in clientöffentlichen Badge-Konfigurationen oder Analytics.
- Für geteilte Geräte Benutzerwechsel/Auth-Sign-out beachten; Profil-/Erfolge-Cache per Nutzer isolieren.
- Kein Ranking und keine Freigabeoptionen für öffentliche XP in V1.

## 8. Design-Definition-of-Done für spätere Implementierung

1. Die vorhandenen Dashboard-, Header-, Footer- und Toolseiten wurden visuell verglichen; Design fügt sich ohne globales Redesign ein.
2. Auf Desktop/Tablet/Smartphone zeigt die Seite genau XP, fünf KP-Karten und neun definierte Badges.
3. Von XP bis Tooltip alle Zahlen, Texte und Badge-Zustände entsprechen den tatsächlichen Backenddaten; **keine festen Mockwerte in Produktivansicht**.
4. Kleiner Bildschirm und Screenreader können alle Inhalte vollständig wahrnehmen; kein horizontales Scrollen notwendig.
5. Ein Erfolgstoast erscheint nur nach echtem XP-Grant, keine doppelte Gutschrift bei Refresh/Retry.
6. Alle 12 Tool-Oberflächen bleiben nutzbar und unverändert priorisiert; keine modalen Erfolgs-Banner.
7. Es gibt **keine** Ranglisten, Filme, Abenteuer-, Hideout-, Ko-fi-XP- oder zusätzliche Level-UI.
8. Sicherheits- und Privacy-Tests sowie responsive Screenshots liegen zur Abnahme vor.
9. Vor der endgültigen Nutzerabnahme weder Merge nach `main` noch produktive DB-Änderungen/Live-Release.

## 9. Stand der Arbeit

Dieses Dokument ist eine **präzise UI-Designspezifikation**. Es sind weder visuelle Assets, interaktive HTML-Prototypen noch Code auf `main` erstellt worden. Erst nach explizitem technischen Umsetzungsauftrag ist eine Bild-/UI-Prototyp-/Frontendproduktion freigegeben. Das nächste planbare Artefakt wäre ein überprüfbares statisches Wireframe oder ein nicht produktiver HTML-Prototyp mit Mockdaten.


## 10. Interaktiver V1-HTML-Prototyp (23.11.2026)

**Datei:** [`prototypes/toolya-rewards-v1.html`](../prototypes/toolya-rewards-v1.html) – eigenständige, responsive HTML-Datei mit eingebettetem CSS und JavaScript, ausschließlich Beispieldaten. Enthält XP-Hero, fünf KP-Karten, alle neun Badges mit anklickbaren zugänglichen Detaildialogen sowie einen rein lokalen Demo-Knopf zum Testen der Anzeige und Reset. **Kein** produktives XP-Ledger, keine Supabase-Verbindung, kein Server, keine Freischaltung, kein Login, keine Veröffentlichung. Datei für interaktive Ansicht lokal als HTML öffnen; GitHub zeigt HTML standardmäßig nur als Quelltext. Frühere Bild-Mockups sind Entwurfsreferenz, keine echte UI-Implementierung. Bestehende Toolya-Logoassets wurden nicht verändert.
