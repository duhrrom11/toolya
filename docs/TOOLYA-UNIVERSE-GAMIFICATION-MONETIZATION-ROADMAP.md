# Toolya Universe – verbindliche Produkt-, Gamification- und Monetarisierungs-Roadmap

**Status:** Konzept beschlossen als Arbeitsrichtung; Details/Features sind Vorschläge, keine automatische Implementierungsfreigabe.  
**Stand:** 22.11.2026  
**Repository:** `duhrrom11/toolya` · **Domain:** `https://toolya.app` (nicht tooly.app)  
**Arbeitsbranch:** `feature/gamification-mascot-levels-v1`  
**Produktionsbranch:** `main` (GitHub Pages; für diesen Entwicklungsbereich gesperrt bis zur ausdrücklichen Freigabe)  
**Projektziel:** Erwachsene mit tatsächlich hilfreichen Online-Tools langfristig binden und dem Betreiber ein kleines, nachhaltiges Nebeneinkommen über Amazon PartnerNet, Ko-fi und ggf. weitere freiwillige, verträgliche Angebote ermöglichen – **ohne Pay-to-win, Druck oder Beeinträchtigung der Kernfunktionen**.

> **WICHTIGE NEUERE NUTZERENTSCHEIDUNG (22.11.2026):** Das neue Gamification-Tool und alle Arbeiten an Toolya Universe und an der in diesem Dokument beschriebenen Monetarisierung **nicht live stellen**. Änderungen ausschließlich auf dem Entwicklungsbranch oder einem davon abgeleiteten, nicht veröffentlichten Feature-Branch. **Keine Merges in `main`, keine Produktionseinsätze, keine Änderungen an produktiven Datenbankschemata oder echten Nutzerdaten ohne eine neue, ausdrückliche Freigabe für die jeweilige Veröffentlichung.** Die allgemeineren früheren Freigaben in älteren Roadmaps/AGENTS.md gelten dafür nicht. Die bereits versehentlich gemergte Gamification wurde anschließend aus `main` zurückgenommen; PR #311 ist historische, bereits rückgängig gemachte Veröffentlichung, **kein** Release-Nachweis.

## A. Lies dies zuerst – Übergabe an neue Chats / ChatGPT Work

1. Die Dateien **`AGENTS.md`**, **diese Roadmap**, **`docs/TOOLYA-MASCOT-UNIVERSE-WORK-ROADMAP.md`** (für bestehendes Maskottchensystem und historischen Live-Release), **`README.md`** und den aktuellen Branch-/PR-/CI-Status lesen. `AGENTS.md` und diese Roadmap bei Konflikten mit älteren Veröffentlichungsfreigaben für das neue Projekt bevorzugen.
2. Bei neuer Arbeit zunächst GitHub-Stand auf `feature/gamification-mascot-levels-v1` feststellen. Keine Annahme, dass ältere Chatinhalte den aktuellen Branchzustand wiedergeben.
3. **Stand am 22.11.2026:** Die prototypische Seite `tools/gamification/index.html` und die 13. Startseitenkarte liegen im Entwicklungsbranch. V1 zählt erstmalige Klicks auf unterschiedliche Tool-Karten mit 50 XP, speichert in `localStorage`, hat fünf Level und folgt der bestehenden Türkis-/Lila-Auswahl. **Das ist ein früher Prototyp, nicht die fertige Vision, und keinesfalls konto-/servergesichert.** Produktive Seite wurde auf zwölf Tool-Karten zurückgesetzt.
4. Nutzerwunsch derzeit: **detailliert konzipieren und planen, nicht implementieren**. Neue Aufgaben nur im konkret vom Nutzer beauftragten Umfang durchführen. Vor einem späteren Live-Release ausdrücklich fragen – die allgemeine Autonomiefreigabe hebt die konkrete Release-Sperre nicht auf.
5. Nach Änderungen Roadmap mit Datum, tatsächlicher Datei/Commit/Branch, Testergebnissen, Entscheidungsstand und offenem nächsten Schritt aktualisieren. Keine fiktiven Fortschritte oder 'erledigt'-Markierungen.
6. Bei Bedarf vorhandene GitHub-, Figma-, Supabase-, Analytics-, SEO-Tools nutzen. Keine Produktionstestdatensätze; keine stillen Datenmigrationen.

## B. Verbindliche Produktprinzipien

- **Tool-first:** Die kostenlosen Tools bleiben schnell, vollständig und unabhängig von XP, Käufen, Mitgliedschaften und Minispielen nutzbar.
- **Erwachsene Zielgruppe:** Hochwertiges Cozy Fantasy mit leichter Magie/Erfinder-Ästhetik; charmant, humorvoll, geheimnisvoll, nicht infantil. Ruhige UI; Begeisterung durch Qualität statt manipulativer Trigger.
- **Emotionales Zentrum:** Genau **zwei bestehende, vom Nutzer festgelegte Original-Maskottchen** – türkis-weiß und lila-creme. Der Nutzer wählt eines; diese Auswahl gilt toolübergreifend für Header, Footer, Hideout und Universe. Ein Themenfarbwechsel darf den Charakter nicht austauschen. Original-PNGs niemals überschreiben oder verändern. Die historische Idee Comic-Chef/Maskottchen ist offen, nicht beschlossen.
- **Marke:** 'Toolya' im Header und Footer mit derselben bestehenden Wortmarke/demselben Asset. Bestehende Hauptseite bleibt über die später ausdrücklich vereinbarten Tool-Karten/Integrationen hinaus unverändert. Der bereits gewählte gemeinsame Footer bleibt erhalten.
- **Fairness:** Kein Pay-to-win, keine gekauften XP, keine käuflichen Zugänge zu Hauptgeschichten, Rätseln, Levels oder spielrelevanten Gegenständen. Kein Verlust angesammelter XP, keine Streak-Strafen, kein Zwangslogin, keine Belohnung für Werbeklicks oder Käufe.
- **Wahlfreiheit:** Universe ist optional, abschaltbar und für Tools nicht erforderlich; reduzierte Animation, stille Ansicht, Tastatur/Screenreader und mobile Geräte unterstützen.
- **Wahrhaftigkeit:** XP nur bei nachweisbaren sinnvollen Vorgängen; nicht für beliebige Seitenaufrufe oder per Client manipulierbare Signale. Kritische Tools wie digitaler Nachlass und Tiergesundheit von lockeren Dialogen/Spendenunterbrechungen ausnehmen.
- **Datensparsamkeit:** Keine Inhalte von Haushaltsbuch, Nachlass, Tiergesundheit oder anderen sensitiven Tools in Gamification-/Tracking-Ereignisse kopieren. Nur erlaubte minimale Ereignisse, Einwilligungen und anonyme/aggregierte Kennzahlen wo möglich.

## C. Erlebnisvision und Spielschleifen

**Arbeitstitel:** Toolya Universe – 'Das Geheimnis der Funken'. Name, Lore und Detaildesign **noch nicht final freigegeben**. Die zwei Figuren sind vorläufig 'Funkenhüter'; echte Alltagsaufgaben lassen 'Funken' (rein erzählerische Ressource, nicht Echtgeld) entstehen.

**Hauptkreislauf, kein Klick-Farming:**
1. Nutzer kommt wegen eines konkreten Tools (Suchmaschine/Direktlink/Favorit).
2. Nutzer erhält vollständig kostenlos das gewünschte Ergebnis.
3. Bei einem fachlich überprüfbaren Erfolg erhält er optional eine kleine positive Rückmeldung, XP oder einen Entdeckungsfortschritt; keine sensiblen Inhalte übertragen.
4. Im Universe sieht er, wie sich Begleiter, Hideout und Geschichte weiterentwickeln.
5. Die Welt macht weitere passende **nützliche** Tools sichtbarer; nie Kauf/Spende als Fortsetzungsbedingung.
6. Bei echtem Kontextbedarf sieht er **klar markierte** Affiliate-Empfehlungen bzw. einen seltenen, jederzeit ignorierbaren Ko-fi-Hinweis. Die Tool-Aufgabe ist bereits abgeschlossen.
7. Auswerten, ob mehr zufriedene Wiederkehrer und Tool-Nutzung entstehen – nicht nur längere Sitzungsdauer.

**Vier Spielertypen:** Entdecker (Geheimnisse), Gestalter (Hideout), Sammler (Erfolge), Begleiter-Typ (Dialoge/Charakter). Dieselbe Welt soll alle bedienen.

### C1. Maskottchen – lebendig statt Punkte-Figur
- Originalfigur und Charakterauswahl behalten. Emotionen, Outfits und Sprite-Atlanten aus `shared/toolya/platform.mjs` und `shared/toolya/buddy.mjs` wiederverwenden; nicht parallel neu aufbauen.
- Kurze, kontextsensitive, variierende Texte und ruhige Idle-Szenen (schlafen, tüfteln, winken, staunen), altersgerechter Humor; nie behaupten, echte Daten gespeichert oder Aktionen erledigt zu haben, wenn dies nicht bestätigt wurde.
- Einstellbare Intensität: Aus / Ruhig / Normal / Lebhaft; klare Abwahl und kein unerwünschtes Pop-up.
- Level lassen Begleiter visuell *kontinuierlich* reifen (Accessoires, kleine Gesten, besondere Animationen), nicht die festgelegten Charaktere ersetzen.
- Persönlichkeitsvariationen nach freiwilligen In-Game-Vorlieben; keine sensiblen Profile aus Toolinhalten ableiten.
- **Ausbaustufen (Entwurf):** Level 1 Neuling; 2 Entdecker; 3 Tüftler; 4 Meister; 5 Legende. Konkrete XP-Kurve vor Implementierung neu balancieren.

### C2. Hideout – emotionaler Anker
- Kleine gemütliche Werkstatt als Start; hochwertige isometrische/2.5D-Szenen statt schwerer Voll-3D-Engine, solange Hardware-Budgets das nicht rechtfertigen.
- Nach und nach Bibliothek, Garten, Dachterrasse, Erfinderwerkstatt, geheimer Keller; Möbel, Beleuchtung, Dekor, Wandbilder, Regal mit Fundstücken, Tageszeit/Wetter als optische Wahl.
- Freischaltung durch echte Nutzung, Entdeckungen und Abenteuer; keine täglichen Pflichten.
- Bausteine sind dynamisch/einzeln nachladbar, auf mobilen Browsern performancetauglich; reduzierte Bewegung bietet gleichwertigen Inhalt.

### C3. Abenteuer und Geheimnisse
- 5 Konzeptgebiete: Werkstattinsel, Flüsterwald, Wolkenbibliothek, Uhrwerkstadt, Sternenobservatorium.
- Anfangsgeschichte: seltsamer Schlüssel im Werkstattboden → Sternensymbol → Karte → verborgene Tür → erster neuer Raum.
- Kleine verzweigende, aber nicht ausgrenzende Storybeats, witzige Dialoge, Fundstücke, Rätsel. Entscheidungen bieten Varianten ohne unwiederbringbare Nachteile.
- Geheimnisse durch authored content statt undurchsichtige Zufalls-/Lootbox-Systeme; niemals Echtgeld-Zufallsbelohnungen.
- Saisonales nur optional und ohne Verfall/Exklusivdruck; Inhalte später nachspielbar halten.

### C4. Fortschritt und Belohnungsdesign
- **Zwei getrennte Anzeigen:** (1) Begleiter-Level/XP für sinnvolle Tool-Nutzung; (2) Weltfortschritt für Hideout/Geschichte/Entdeckungen.
- Abzeichen, Sammlungen und kosmetische Freischaltungen. Klare Anzeige, wodurch Fortschritt entsteht; kein XP-Farming durch Reloads/gleiche Aufgabe.
- Nur serverseitig bestätigte, idempotente Aktionen, sobald kontoübergreifender Fortschritt produktionsreif aufgebaut wird. Der lokale 50-XP-Kartenklick im aktuellen Prototyp ist **kein** verlässlicher produktiver Belohnungsnachweis.
- Keine globale Pflicht-Rangliste; falls später soziale Features kommen: opt-in, Moderation, Datenschutz/Freigabe für öffentliche Profile.

## D. Monetarisierung – Einnahmen mit Nutzerwert koppeln

**Einnahmeziel:** realistisches Nebeneinkommen, nicht maximale Monetarisierung. **Keine Umsatzgarantie.** Keine simulierten Klicks, Käufe, Spenden oder Affiliate-Conversions.

### D1. Amazon PartnerNet – erste Priorität
- Kontextbezogene, nützliche Produkthinweise **nach dem freien Tool-Ergebnis**; z.B. Pflanzenpflege: Feuchtigkeitsmesser/Gießkanne; Umzug: Kartons/Etiketten; Backform: Backzubehör; Auto: sachlich passende Pflegeprodukte; Wunschliste: relevante vorhandene Funktionen, ohne den Importer zu beschädigen.
- Module nur bei passender Nutzerabsicht. Keine wahllosen Banner oder Produkte aus sensiblen Eingaben. Empfehlungen redaktionell geprüft.
- Klare Kennzeichnung als Werbung/Affiliate-Link und erforderlicher Amazon-Partnerhinweis; aktuelle Programmrichtlinien zu Linkformat, Preis-/Produktbildern, API, Tracking, Markenrechten und Offenlegung **vor Implementierung anhand offizieller Regeln prüfen**.
- Einkauf darf weder XP noch Zugang zu Abenteuern, Leveln oder Gegenständen beeinflussen.
- Metriken: Affiliate-Modulansichten, freiwillige Linkklicks, gemeldete Affiliate-Provisionen soweit verfügbar; Umsatz nicht aus Klickzahlen erfinden.
- Test zuerst in einem nachweislich passenden Tool; vor Ausrollung anhand von Nutzen, Klickrate, Verweildauer/Abbruch und Beschwerden beurteilen.

### D2. Ko-fi – zweite Priorität
- Historisch vorhandenes Ko-fi-Ziel: `https://ko-fi.com/duhrrom` (vor Einsatz prüfen). Gemeinsame Maskottchen-/Ko-fi-Integration aus `shared/toolya/platform.mjs` bewahren, nicht doppelt instrumentieren.
- Nur seltene, freundliche, freiwillige Einladungen nach sinnvoller Erfolgssituation oder als unauffälliger Link im Hideout; kein Dialog-Blocking, keine emotionalen Schuldgefühle, keine Suggestion, Figur leide ohne Zahlung.
- Optionaler 'Supporter'-Club mit **nicht spielrelevanten** Inhalten: Einblicke, Artworks/Wallpapers, Abstimmungen; kein XP-Boost und keine exklusiven notwendigen Spielinhalte.
- Transparente projektbezogene Finanzierungsziele für **zukünftige kostenlose** Kapitel, mit ehrlichen Fortschritten und offener Kommunikation bei Verzögerung.
- Vor Einnahmeentscheidung tatsächliche Ko-fi-Kosten, Zahlungsabwicklung, Umsatzsteuer-/Steuerpflichten und Richtlinien prüfen.

### D3. Weitere mögliche Einnahmequellen – nachrangig
- Eigenständige digitale PDFs/Vorlagen/Wallpaper, die Kernfunktionen nicht aus den kostenlosen Tools auslagern.
- Kennzeichnungspflichtige direkte Partnerschaften in passenden Themenbereichen; keine verdeckten Werbegeschichten.
- Sehr sparsame kontextbezogene Werbung erst bei relevanter Reichweite; keine Belohnung für Klicks auf Standardanzeigen.
- Später ggf. freiwillige sponsorfinanzierte, kostenlos zugängliche Ausstellungen, klar sichtbar gekennzeichnet.
- Keine Lootboxen gegen Geld, kein NFT/Krypto, keine erzwungenen Zahlungen, keine Dark Patterns.

### D4. Einnahmeannahmen und Ziele
- Szenariorechnung *nur* mit veränderbaren Annahmen; Beispiel: 10.000 Besuche/Monat × 8 % freiwillige Affiliate-Klicks × 3 % qualifizierte Käufe × 2 € Ø Provision = **48 €**; plus 15 Ko-fi-Beiträge × 3 € = **45 €**; gesamt **93 € brutto** vor Gebühren/Kosten/Steuern. **Reines Modell, keine Ist-Zahlen.**
- Keine unrealistischen garantierten Einnahmen. Zuerst Baseline erheben, dann kontrolliert Varianten vergleichen.
- Erfolgsmessung: Toolabschlussquote, 7-/30-Tage-Wiederkehr, weitere sinnvoll genutzte Tools, Universe-Opt-in/Opt-out, gemessene Einnahmen je 1.000 Besuche, Consent-Rate und negative Signale (Abbrüche/Beschwerden).

## E. Umsetzungsphasen mit Abhängigkeiten, Akzeptanzkriterien und Grenzen

Alle Phasen **nur im Entwicklungsbranch** bis zum separaten Release-Gate. Reihenfolge ist vorgeschlagen, nicht automatisch beauftragt.

### P0 – Grundlagen & Product Brief (Konzept; höchste Priorität)
**Arbeiten:** Bestehende Tools/Maskottchen/Ko-fi/Amazon-Integration und aktuelle Startseite dokumentieren; genaue gewünschte Bildsprache, Lore, fünf Level, UX-Flows, Einwilligungs-/Sicherheitsgrenzen, Einnahmehypothesen, vorhandene SEO-/Analytics-Daten sichten.
**Lieferobjekte:** verbindliche Feature-Matrix, Wireframe-Konzept, technisches Ist-Inventar, klar benannte Nicht-Ziele.
**Akzeptanz:** Freie Tools bleiben unabhängig; zwei Originalfiguren korrekt; kein Pay-to-win; Monetarisierung offen erkennbar; alle offenen Entscheidungen sichtbar.
**Status:** [ ] Ausführliche Bestandsaufnahme/Designbrief noch offen. Grobe Vision in dieser Roadmap festgehalten.

### P1 – Gamification-V1 sachlich korrekt (Entwicklung)
**Arbeiten:** vorhandenen Prototyp prüfen, verlässliche XP-Ereignisse definieren; Level-System und Maskottchenpräferenzen vereinheitlichen; klare Fortschrittsanzeige, freiwilliges Opt-in; Analytics-Events datensparsam designen.
**Akzeptanz:** reproduzierbare, idempotente XP-Vergabe; kein Vorteil durch Reload/Klick-Farming; fehlerfreie mobile und Tastaturansicht; keine Kontodatenverluste; keine persistente Behauptung bei Browser-lokalem Zustand.
**Status:** [~] Früher lokaler Prototyp im Branch; für echte Nutzung und Cloud-Sync noch nicht produktionsreif.

### P2 – Lebendiger Begleiter & erstes echtes Hideout (Entwicklung)
**Arbeiten:** Charakteraktionen, kurze Dialog-Events, ein interaktiver Start-Raum, anpassbare kosmetische Objekte, Speichern/Wiederherstellen; möglichst bestehende Assets/Sprites wiederverwenden.
**Akzeptanz:** beide Figuren bleiben erhalten; Auswahl auf allen Seiten konsistent; ausreichend performant auf Smartphone; reduzierte Bewegung/Abwahl; funktionierende Speichervorgänge.
**Status:** [ ] Nicht umgesetzt.

### P3 – Erste Story & Geheimnisse (Entwicklung)
**Arbeiten:** Schlüssel-Fund, Karte, erste Geheimtür, zwei bis drei kleine Entscheidungen, drei bis fünf sammelbare Fundstücke; durchspielbares, wiederaufnehmbares Mini-Kapitel.
**Akzeptanz:** ohne Kauf/Klick auf Werbung lösbar; kein Zeitdruck; barrierearme gleichwertige Interaktion; Fortschritt zuverlässig.
**Status:** [ ] Nicht umgesetzt.

### P4 – Monetarisierungs-Pilot nach tatsächlichem Nutzen (Entwicklung)
**Arbeiten:** vorhandene Affiliate-/Ko-fi-Implementierung inventarisieren; einen passenden Affiliate-Kontext als Pilot entwerfen; dezenter Ko-fi-Moment; Disclosure/Consent prüfen; keine Doppel-Buttons.
**Akzeptanz:** Ergebnis bleibt kostenlos; Affiliate/Ko-fi eindeutig optional; keine gekauften Level; nachvollziehbare Ereignisse ohne sensible Nutzdaten; aktuelle Partnerbedingungen eingehalten.
**Status:** [ ] Kein neuer Pilot umgesetzt; bestehende Affiliate-/Ko-fi-Bausteine vorhanden.

### P5 – Auswertung, Optimierung und Ausbauplanung
**Arbeiten:** nur auf freigegebener Messgrundlage Nutzwert, Rückkehr, Conversion, Performance und Beschwerden analysieren; Designs/A-B-Tests erst mit zulässigem Consent; zweite Tool-Empfehlung und nächste Hideout-Region priorisieren.
**Akzeptanz:** Entscheidungen werden aus gemessener Wirkung statt bloßen Engagement-Metriken abgeleitet.
**Status:** [ ] Offen; zunächst keine belastbare Universe-Baseline bekannt.

### P6 – Separates Veröffentlichungs-Gate (gesperrt)
**Voraussetzungen:** **neue ausdrückliche Nutzerfreigabe zur Live-Veröffentlichung**, Review des PR-Diffs, Test-/CI- und Browserabnahme, Sicherheits-/Datenschutz-/Affiliate-Konformitätsprüfung, Backup/Rollbackplan, ggf. DSGVO-/Impressum-/Steuerrecht-Review, Produktionsdatenbank ohne Testdaten.
**Erst danach:** freigegebenen Stand in `main` mergen, GitHub Pages Deployment bestätigen, tatsächlich live abrufen, Monitoring und Rollbackbereitschaft prüfen.
**Status:** [ ] GESPERRT – Freigabe fehlt. **Nicht aus älteren Roadmaps ableiten.**

## F. Technisches Zielbild (vorbehaltlich Analyse)

- Statische Toolya-Webseiten auf GitHub Pages; gemeinsamer UI-Kern `shared/toolya/platform.mjs` und `buddy.mjs`; vorhandene Einstellungen über `helferlein-toolya-preferences-v1` (Bestand überprüfen).
- Prototyp unter `tools/gamification/index.html`; aktueller Browser-Key `toolya_gamification_discoveries_v1`. Diese Speicherung ist nur lokal, nicht multi-device und leicht manipulierbar.
- Zukünftige Datenmodelle als **Entwurf, nicht ausgeführt**: `player_profiles` (Konto-/Maskottchenbezug), `xp_events` (einzigartige idempotente Serverereignisse), `world_progress`, `inventory_items`, `hideout_layouts`, `story_state`, `consent_preferences`. Prüfen, ob bestehende Strukturen diese Zwecke bereits erfüllen; keine unnötigen parallelen Tabellen.
- Auth/RLS: nur eigene Datensätze lesbar; write-Rechte für XP-Regeln serverseitig kontrollieren; keine `service_role`-Keys im Browser. Produktions-Supabase `yheogmeaosuigyaxkwth` **vorerst nur lesend inspizieren**, soweit nötig. Keine DDL/DML für diesen Bereich ohne ausdrückliche neue Freigabe.
- XP API mit echten fachlichen Ereignistypen statt blindem clientseitigem Event; serverseitige Idempotenz und Missbrauchsgrenzen. Keine sensible Payload.
- Asset-/Performance-Budget vor Grafikproduktion festlegen. Kein unnötiges Full-3D/Autoplay-Audio. Bildvarianten für mobil, Lazy Loading, Offline-Fallback nur falls sinnvoll und sicher.
- Konflikte bei geräteübergreifendem Sync, Offline-Änderungen und lokalem Altfortschritt explizit lösen; keinerlei automatische Übernahme fragwürdiger Klick-XP als vertrauenswürdige Konto-XP.
- Barrierefreiheit/Datenschutz/SEO: `prefers-reduced-motion`, Tastatur, Screenreader, Fokus, Pausieren, ARIA für Fortschritt; keine Ablenkung von Aufgaben; Cookie-/Consent-Vorgaben und Werbehinweise prüfen; Indexierbarkeit je Route festlegen.

## G. Offene Design- und Produktentscheidungen (noch nicht beschlossen)

1. Endgültiger Name ('Toolya Universe', 'Funken', 'Hideout') und Hintergrundgeschichte.
2. Detaillierter Stil: bevorzugte Arbeitsrichtung ist hochwertige Cozy Fantasy + leichte Erfinder-/Steampunk-Elemente + Geheimnisse, **noch keine finale Designfreigabe**.
3. Persönlichkeiten beider Maskottchen als optionale Varianten statt geschlechtsgebundene Charaktereigenschaften; genaue Dialogstimmen.
4. XP-Schwellen und gesicherte fachliche Ereignisse der einzelnen Tools; auch Umgang mit Gästen, bestehenden Nutzern und Altfortschritt.
5. Wie tief Hideout-/Deko-Individualisierung in V1 gehen soll; Assetbudget/Animationstechnik.
6. Ob und wie Konto, Sync, optionale Analytik und Community-Funktionen zusammenspielen.
7. Auswahl erstes Pilot-Tool für Affiliate-Platzierung und Kennzeichnungskonzept nach Prüfung aktueller Regeln.
8. Inhalt/Preis digitaler Produkte, optionale Ko-fi-Mitgliedschaft, konkrete Support-Ziele, Aufwand/Nutzen.
9. Messbare Zielwerte erst nach Baseline: etwa +Wiederkehr, +nützlich abgeschlossene Tool-Aufgaben, keine höhere Beschwerde-/Abbruchrate.
10. Freigabe für Produktion ist **nicht** erteilt.

## H. Definition of Done / Freigaberegeln

**Eine Phase gilt erst als fertig**, wenn Nutzerwirkung, bestehende Funktionalität, Sicherheit, Mobil/Barrierefreiheit, Datenpersistenz und Tests dokumentiert sind. Bei Mockups ausdrücklich 'Konzept/Prototyp' schreiben.

**Release-fähig** ist Toolya Universe nur bei ausdrücklich erteilter Freigabe, geprüften offiziellen Partnerregeln, nachvollziehbarer nicht-manipulativer XP-Logik, sicherem Datenmodell, funktionierendem Opt-out, korrekt angezeigten Affiliate-Hinweisen, bestandenen Tests und echtem Live-Check.

**Standberichtsformat für künftige Chats:** Datum · Branch/Commit · Was wirklich fertig ist · Was nur geplant ist · Tests/CI · Auswirkungen auf Live-Stand · Nächste zwei bis drei konkreten Arbeitspakete · Blocker/ausstehende Freigaben.

## I. Chronik / Entscheidungen

- **14.–15.11.2026:** Bestehende zwei Maskottchen, gemeinsame Wortmarke, identischer gewählter Begleiter im Tool-Header und Footer und bereits live bestehende Toolya-Maskottchen-Integration festgelegt; historische Details unter `docs/TOOLYA-MASCOT-UNIVERSE-WORK-ROADMAP.md`.
- **22.11.2026:** Nutzer möchte Gamification als **weiteres eigenes Tool**, zunächst Maskottchen-Level; danach Vision für Erwachsene: lebendiger Begleiter + persönliches Hideout + Geheimnisse + Abenteuer.
- **22.11.2026:** Ziel ist ein kleines Nebeneinkommen; Amazon PartnerNet und Ko-fi sind bestehende Monetarisierungswege. Weitere Ideen: optionale Mitgliedschaft, digitale Produkte, klar markierte Partnerschaften, nur zurückhaltende Werbung. **Ausdrücklich kein Pay-to-win.**
- **22.11.2026:** Entwicklungsbranch `feature/gamification-mascot-levels-v1` enthält V1-Prototyp. Frühere versehentliche Veröffentlichung in `main` (PR #311) wurde durch Rücknahme der Startseite und Löschung der Gamification-Seite in `main` korrigiert. Keine erneute Veröffentlichung ohne ausdrückliche Zustimmung.
- **22.11.2026:** Auftrag: detaillierte, für neue Chats nachvollziehbare Roadmap erstellen; dabei **nichts an Funktionen implementieren und nicht live veröffentlichen**.

## J. Nächster sinnvoller Auftrag

**P0 vertiefen:** Vorhandene 12 Tools und ihre realen Abschlussereignisse inventarisieren; konkrete Zuordnung Tool → nützlicher Erfolg → sichere XP-Regel → optionale Affiliate-Empfehlung → Ko-fi-Kontaktpunkt skizzieren. Dazu erste User Journey (Gast vs. angemeldeter Nutzer) und Hideout-Wireframes entwickeln. **Alles zunächst als Spezifikation/Design, nicht als Live-Code.**
