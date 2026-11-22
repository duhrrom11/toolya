# Toolya Universe · P0 – Inventar aller 12 Tools, Event-/XP-Matrix und Monetarisierungsplan

**Stand:** 22.11.2026 · **Status:** Spezifikation / Planung; keine Funktionen daraus implementiert.  
**Branch:** `feature/gamification-mascot-levels-v1` · **Produktiv:** unverändert `main` mit 12 Tools.  
**Vorgabe:** Nur im Entwicklungsbranch arbeiten; **kein Merge, keine Veröffentlichung, keine produktive DB-Änderung ohne neue explizite Freigabe**.  
**Übergeordnete Roadmap:** [TOOLYA-UNIVERSE-GAMIFICATION-MONETIZATION-ROADMAP.md](TOOLYA-UNIVERSE-GAMIFICATION-MONETIZATION-ROADMAP.md).

## 1. Was wurde tatsächlich geprüft?

Quellcodebasiertes Inventar der zwölf Startseiten-Toolkarten aus `index.html` im Entwicklungsbranch (ohne die dort zusätzlich vorhandene Prototyp-Karte „Maskottchen-Level“). Jede dieser zwölf Zielseiten wurde aus GitHub gelesen; existierende HTML-Aktions-Buttons und wesentliche vorhandene Handler wurden exemplarisch geprüft. Gemeinsame Integrationsmodule `shared/toolya/platform.mjs` (Maskottchen-Rollen), `shared/toolya/amazon-affiliate.js` (vorhandenes Amazon-Tag, kataloggestützte Produktlinks) und `tools/gamification/index.html` (aktueller lokaler 50-XP-Entdeckungsprototyp) wurden gelesen.

**Präziser Geltungsbereich der Aussagen:** Buttons/Handler belegen, dass ein Vorgang im Code existiert, **nicht**, dass er aktuell in jeder Browser-/Cloud-Konstellation erfolgreich durchläuft. Alle folgenden XP-Events sind **geplante Integrationspunkte**; **keiner ist bereits als gesichertes XP-Event implementiert**. Konkrete Erfolgssignale müssen bei Umsetzung unmittelbar **nach** dem tatsächlich bestätigten Persistenz-/Berechnungsergebnis verifiziert werden. Als erste Implementierungsprüfung die angegebene Funktion und alle aufgerufenen Speicheradapter inklusive Cloud-Fehler- und Offlinepfad verfolgen.

Vorhandene Startseiten-IDs → physische Routen:
`wishlist` → `tools/wishes/public.html`;
`kassenbon` → `tools/budget/index.html`;
`kisten` → `tools/moving/index.html`;
`pflanzen` → `tools/plants/index.html`;
`wg-kasse` → `tools/housemates/index.html`;
`notizen` → `tools/estate/index.html`;
`kfz` → `tools/car/index.html`;
`haustier` → `tools/pet-health/index.html`;
`parken` → `tools/parking/index.html`;
`verleih` → `tools/loans/index.html`;
`energie` → `tools/meters/index.html`;
`backform` → `tools/baking/index.html`.

## 2. Bewertungsmodell und übergreifende XP-Regeln

**Priorität:** A = erste sichere, werthaltige Integrationskandidaten; B = nach P1/Pilot, höhere Komplexität; C = bewusst erst nach Sicherheits-/Ethik-Review oder ohne XP. **Keine Priorität zur Live-Veröffentlichung.**

**Vorgeschlagene XP-Skala, ausdrücklich noch NICHT final:** Erster bestätigter Erfolg pro Tool = 40 XP; zusätzliche sinnvolle Folgeaktion = 15 XP, maximal einmal je Aktionstyp und geeignetem Zeitfenster; toolübergreifendes *Entdeckerabzeichen* nach mindestens drei verschiedenen **erfolgreich verwendeten** Tools = einmalig 30 XP. Keine XP für Öffnen, Suchen, Klicken, Einkäufe, Ko-fi, Besuche, Datenuploads, bloße Änderungen bestehender Einträge, massenhafte Einträge oder sensitive Einträge. Strikte Budgetierung pro Tool je Konto; für Gastmodus entweder rein kosmetische lokale Anzeige mit deutlich markiertem Unsicherheitsstatus oder noch keine garantierten XP. Alle Regeln von Produkt-/Sicherheits-Review abhängig.

**Event-Datenform (Entwurf, keine API):** `event_type`, `tool_id`, `actor_id` (serverseitig aus Auth, kein clientseitiger User-ID-Wert), `source_record_id_or_hash` (so wenig wie möglich; bei sensiblen Tools keine Referenz), `idempotency_key`, `server_confirmed_at`, `event_version`, `xp_awarded`, `reason_code`. Keine Beträge, Namen, Adressen, Belege, Gesundheitsdaten, konkreten Rezepttexte, Wunschlisten-Profile, GPS-Daten, Fahrzeugkennzeichen oder sonstigen Nutzinhalte. Die Existenz sensibler Tool-Nutzung sollte ggf. **gar nicht** im Universe gespeichert werden.

**Grundbedingungen für jede XP-Gutschrift:** (i) Nutzer hat Gamification freiwillig aktiviert; (ii) Event ist ein echter, ausgewählter fachlicher Erfolg; (iii) Abschluss ist verbindlich bestätigt (Cloud: autorisierte Backend-Antwort; Lokal: Speichererfolg, aber kein gleichwertiger gesicherter Kontonachweis); (iv) dedupliziert, gedeckelt und nicht über Retry/Doppelklick auslösbar; (v) Anzeige darf Fehler nicht als Erfolg interpretieren; (vi) XP darf nicht durch Amazon/Ko-fi-Ereignisse ausgelöst werden. **Keine Produktiv-Events oder Migrationen im Rahmen dieses Dokuments.**

## 3. Detaillierte Matrix – alle 12 Tools

| Nr. / Tool, Route & bestätigter Code-Anker | Echter fachlicher Nutzererfolg / vorgeschlagenes XP-Event | Konkrete XP-Regel / Anti-Abuse | Maskottchen-Aktion | Hideout / Funken-Geschichte | Kontextbezogenes Amazon-Angebot (nur Werbung nach Ergebnis) | Ko-fi-Platzierung | Prio |
|---|---|---|---|---|---|---|---|
| **01 Amazon-Wunschlisten finden** `wishlist` · `tools/wishes/public.html`; UI: `submitSearch`, `addList`, `saveProfile`; vorhandene direkte Amazon-Partnerlinks auf Baby-/Hochzeits-/Standardlisten | Reale Aktion: öffentliches Profil auffinden oder eigene Liste freiwillig veröffentlichen. **Kein bestätigter allgemeiner Nutzwert-Abschluss aus Suchklick ableitbar.** Als XP-Event für P1 **nicht verwenden**; zukünftige besondere, nach Prüfung bestätigte eigene Profilveröffentlichung nur bei ausdrücklicher Opt-in-Entscheidung | **0 XP** für Suche, Treffer, fremde Profilaufrufe, Amazon-Links oder Veröffentlichung personenbezogener Daten; keine Spielanreize zur Offenlegung personenbezogener Informationen | Geschenkexperte schaut neugierig, sagt z. B. „Vielleicht findet sich ein passender Wunsch“; keine Behauptung über tatsächliche Käufe oder Listen anderer Menschen | Optional erzählerischer Geschenkepavillon **ohne** Erfassung von Personen-/Wunschlistendaten; frei zugänglich über Story | **Bereits vorhanden:** klar gekennzeichnete Amazon-Partnerlinks für die Einrichtung von Wunschlisten. Keine automatisierte Umwandlung fremder Wunschlisten-Links; bestehendes Verzeichnis und Importer schützen | Dezenter allgemeiner freiwilliger Link im Footer/Erfolg der **eigenen** Veröffentlichung nur nach besonderer Privacy-Prüfung; besser kein prozessbezogenes Overlay | **B/C** |
| **02 Haushaltsbuch** `kassenbon` · `tools/budget/index.html`; `saveReceipt()`, `saveSavingsGoal()`, `saveBudgetsFromModal()` | Validierten Einnahme-/Ausgaben-Eintrag erfolgreich speichern; Sparziel erfolgreich anlegen. Geplantes Event `budget.first_entry_saved` | Einmal **40 XP** für ersten bestätigten echten Eintrag **ohne** Betrags-/Titelweitergabe; kein wiederholtes XP durch editieren/löschen/neuanlegen; Sparziel ggf. **15 XP** einmalig als zweiter fachlicher Typ nach zusätzlicher Prüfung | Buchhalter ordnet ein winziges Buch/Notizblatt, freundliches sachliches Lob; keine Wertung finanzieller Lage | Kleines Bücherregal oder Rechenbrett als rein kosmetische Deko, unabhängig von Geldhöhe | Bereits vorhandene generische Affiliate-Konfiguration: Belegordner/Dokumentenablage; priorisieren nur konkrete Organisationsmaterialien, nicht Kredit-/Finanzprodukte oder aus finanziellen Daten abgeleitete Werbung | **Keine** aufdringliche Spendenbitte nach Eingaben zu finanzieller Situation; statischer Footer-/Hideout-Link, höchstens allgemeiner Dank auf unabhängiger Seite | **B** |
| **03 Umzugskisten** `kisten` · `tools/moving/index.html`; `saveLocation()`, `saveBox()` → `storeBoxData()` → Speicherroutine | Neuen Standort und eine erste beschriftete Umzugskiste erfolgreich speichern. Event `moving.first_box_saved` | **40 XP einmal** nach bestätigter Speicherung der ersten Kiste; Standort allein kein XP; Folgetyp „Umzugsplan tatsächlich abgeschlossen“ erst bei vorhandenem Status-/Workflow-Nachweis definieren, nicht simulieren | Umzugshelfer stemmt virtuell Kiste, richtet Namensetikett gerade, kleine Jubelgeste | Mini-Regal mit Kartons; Fundstück „Messingschlüssel“ als erster Story-Teaser nach toolübergreifendem Fortschritt (nicht unmittelbar käuflich) | Hohe Relevanz: stabile Kartons, Etiketten, Packband, Abroller; **bereits** Konfiguration im gemeinsamen Affiliate-Modul; prüfen, ob derzeit konkrete Katalogprodukte angezeigt werden; nur nach Kistenübersicht | Ein einzelner ruhiger Dank-Link nach bestätigtem Anlegen eines Umzugsplans/erstem Projektmeilenstein, max. nach selbstgewählter Frequenz; niemals vor „Speichern“ | **A – Pilotkandidat 1** |
| **04 Pflanzenpflege** `pflanzen` · `tools/plants/index.html`; `savePlant()`, `waterPlant(id)`, `saveDiaryEntry()` | Pflanze mit gültigem Gießintervall speichern; reale Gießaktion bestätigtermaßen dokumentieren. Event `plants.first_plant_saved` | **40 XP einmal** für erstes gespeichertes Pflanzenprofil; **15 XP** einmal für erste dokumentierte Gießaktion; bestehender `waterPlant` unterdrückt doppelte Gießmeldung am selben Tag – serverseitig zusätzliche Deduplizierung nötig; keine täglichen Pflichtserien | Gartenbegleiter gießt animierte Mini-Pflanze, reagiert auf erledigte Pflege, nie aus Daten Gesundheit der Pflanze diagnostizieren | Erster Blumentopf, Gartenfenster, später kleiner Hideout-Garten; keine realen Pflanzendaten für die Deko übertragen | Feuchtigkeitsmesser, Gießkanne, Pflanzenlampe, Pflanzenschere; Produktempfehlung **nur** auf passender Zubehörsektion und ohne Auswertung privater Notizen/Fotos | Seltenes sympathisches „Dir hat das geholfen? Unterstütze Toolya freiwillig“ nach gespeichertem Pflegeplan; ausblendbar | **A – Pilotkandidat 2** |
| **05 WG-Organisator** `wg-kasse` · `tools/housemates/index.html`; `saveReceipt()`, `saveEvent()`, `addShoppingItem()`, `toggleShoppingItem()` | Gemeinsame Einkaufsliste angelegt und mindestens ein Punkt als erledigt markiert; oder WG-Aufgabe erfolgreich abgeschlossen, **falls tatsächlich persistierter Abschluss nachweisbar**. Kandidat `housemates.first_shopping_item_done` | **40 XP einmal**, nur bestätigter Statuswechsel von offen → erledigt (nicht wiederholbar durch Zurücksetzen); kein XP abhängig von WG-Mitgliedern, Ausgaben oder Pflichterfüllung anderer | Organisator hakt gemeinsam eine Checkliste ab, humorvoll ohne soziale Vergleiche | Eine Gemeinschaftstafel oder kleine Pinnwand im Hideout | Einkaufsliste ist **keine** Zustimmung zu Datenanalyse/Werbeprofiling; nur generische Küchen-/Haushaltsorganisation wie Whiteboard, Vorratsboxen; niemals automatische Produktlinks anhand privater Einkaufszettel | Allgemeiner Fußbereich, kein Bitten während Kostenaufteilung oder bei WG-Konflikten | **B** |
| **06 Digitaler Nachlass** `notizen` · `tools/estate/index.html`; sensible Tresor-/Personen-/Überprüfungsaktionen (`save-funeral`, `save-person`, `save-review`, `review-done`) | Echte erfolgreiche Vorsorge-/Tresoraktivität existiert, ist aber sensibel, sicherheitskritisch und nicht geeignet als Gamification-Erfolg | **0 XP, keine Universe-Events, keine Nutzungsmetadaten für Gamification**, keine Nutzerüberredung zu emotional schwierigen Schritten; keine Verknüpfung mit In-Game-Belohnungen | Bestehender seriöser Vorsorgebegleiter bleibt sachlich und respektvoll; keine Feier-, Spaß- oder Kaufanimation | Kein Bezug privater Nachlassdaten zum Hideout; ein frei verfügbares neutral gestaltetes Archivzimmer ist höchstens Lore, nicht aus Nachlassinteraktionen freischaltbar | Vorhandene allgemeine Affiliate-Konfiguration für Dokumentenaufbewahrung prüfen; **für Universe-Pilot deaktivieren/nicht ausbauen**; nach strengem Privacy-/Ethik-Review möglicherweise statisch gekennzeichnete allgemeine Zubehörlinks fern vom Tresor | **Kein** Ko-fi-Prompt beim Testament/Vollmacht/Tresor/Alarm; falls globaler Footer existiert, nicht aus sicherheitskritischer Interaktion triggern | **C – ausschließen** |
| **07 Autokosten** `kfz` · `tools/car/index.html`; `saveCar()`, `saveEvent()`, `saveTireSet()` | Ein Fahrzeug erfolgreich anlegen und später einen Tank-/Wartungseintrag speichern. Event `car.first_vehicle_saved` | **40 XP** einmal bei bestätigter Anlage, **15 XP** einmalig für erstes bestätigtes Wartungsereignis; kein XP nach Kilometerstand, Betrag oder Anzahl Fahrzeuge | Mechaniker richtet Schraubenschlüssel, zeigt neutralen „Alles dokumentiert“-Hinweis | Werkzeugwand, dekorativer Mini-Motor als freies kosmetisches Fortschrittsobjekt | Reifendruckprüfer, Profiltiefenmesser, Kofferraum-Organizer; **bereits** gemeinsame Konfiguration; rechtlichen/sicherheitsbezogenen Kontext sorgfältig kennzeichnen | Nur allgemeinen freiwilligen Link nach unkritischer Erfolgssituation; nie Warnungen/Servicefälligkeit verdecken | **B** |
| **08 Tiergesundheit** `haustier` · `tools/pet-health/index.html`; `savePet()`, `saveEvent()`, `saveMedication()` | Haustierprofil, Gesundheitsereignisse und Medikation können gespeichert werden, aber Angaben sind sensibel und medizinisch konnotiert | **0 XP für gesundheitliche Ereignisse, Diagnosen, Impfungen, Medikationen und Tierprofile** in V1; keine Gamification-Metadaten; spätere allgemeine „Tool entdeckt“-Auszeichnung nur außerhalb des Gesundheitskontextes denkbar und derzeit **nicht** geplant | Sachlicher, ruhiger Tierbegleiter ohne Feieranreize; kein Verharmlosen von Medikamenten/Tierarztinformationen | Optional rein dekoratives Fantasietier **nicht** aus Tiergesundheitsdaten abgeleitet; keine Profildatenübernahme | Vorhandene Konfiguration: Transportbox, Fellpflege, Reisenapf. Eventuell rein statische, klar markierte Zubehörsektion; **keine** aus Gesundheits-/Allergiedaten abgeleitete Werbung oder Medikationsprodukte | **Kein** Ko-fi-Prompt im Rahmen von Gesundheitsereignissen oder Medikamenten | **C – ausschließen** |
| **09 Parkplatz-Merker** `parken` · `tools/parking/index.html`; `saveParkingSession()` → `processPhotoAndSave()` | Standortbeschreibung/Parkvorgang erfolgreich gespeichert; GPS optional und nicht nötig. Event `parking.first_session_saved` | **40 XP** nur erstmalige serverseitig bestätigte Sitzung, keine Standortkoordinaten speichern oder an Universe übertragen, keine zusätzlichen XP pro Parkvorgang; keine Belohnung für Standortfreigabe | Parkhelfer steckt kleine Flagge in fiktive Karte; keine realen Karten/GPS-Pins im Hideout | Mini-Wegweiser/Kompass an Hideout-Wand ohne Ortsdaten | Nur allgemeines Autozubehör denkbar, schwache Kaufabsicht; besser vorerst **keine** Produktempfehlung im wichtigen Parkplatz-Wiederfinde-Flow | Kein Prompt beim Navigieren/Parkschein/unter Zeitdruck; lediglich separater, statischer Footer-Link | **B (XP), C (Affiliate)** |
| **10 Verliehene Dinge** `verleih` · `tools/loans/index.html`; `saveItem()`, `saveInventoryItem()`, `saveContact()` | Gegenstand erfolgreich als verliehen erfasst. Rückgabe als abgeschlossen markieren ist denkbar, **konkreten Handler vor P1 noch prüfen**. Event `loans.first_loan_saved` | **40 XP** einmal nach bestätigter Erfassung, **15 XP** für erste echte abgeschlossene Rückgabe nur nach verifiziertem Statusübergang; niemals XP für Menge/Wert privater Gegenstände oder Kontakte | Verleih-Organisator platziert symbolisch ein Buch zurück ins Regal | Schlüsselkasten/Inventarregal als Deko, keine übernommenen Gegenstandsnamen | Aufbewahrungs-/Sortierboxen, beschriftbare Etiketten; eher indirekter Bedarf, kein Upselling auf Gegenstandsdetails | Ruhiger Footer-Link; kurzer Dank erst nach eindeutig bestätigter, nicht konfliktbehafteter Rückgabe und Frequenzlimit | **B** |
| **11 Zählerstände** `energie` · `tools/meters/index.html`; `saveReading()`, `saveTarifs()` | Gültigen Strom-/Gas-/Wasserstand erfolgreich speichern; differenzierte Verbrauchsauswertung nach zweiter Messung könnte zusätzlichen Nutzwert bringen. Event `meters.first_reading_saved` | **40 XP** einmal nach bestätigter neuer Ablesung, optional **15 XP** einmal für erste zweite gültige Vergleichsablesung auf demselben Zähler; keine Werte/Adressen/Verbrauchshöhen/Preise ins XP-System senden | Energiehelfer beleuchtet eine kleine Lampe, ohne Verbrauch zu loben oder zu tadeln | Leuchtende Fantasie-Laterne als kosmetischer Raumgegenstand | Energiekostenmessgerät, Notizregister, ggf. Messzubehör; das Affiliate-Modul besitzt bereits einen verifizierten Produktmapping-Fall für ein Energiekostenmessgerät; niemals aus Verbrauchswerten konkrete Produktempfehlungen ableiten | Statischer Link nach sachlicher Auswertung, keine Spendenbitte bei hohen Kosten oder Warnwerten | **A/B – nach Basis-Pilot** |
| **12 Backform-Rechner** `backform` · `tools/baking/index.html`; `calculateRecipe()` → `calculateAll()`/`renderRecipePreview()`/`saveRecipeToStorage()` | Echte erfolgreiche Berechnung mit sinnvollen Eingaben und sichtbarem Ergebnis; kein beliebiges Klickereignis. Event `baking.first_valid_conversion` | **40 XP** einmal für erste nachweislich gültige Berechnung; muss fachliche Validierung und vollständige Ergebnisdarstellung prüfen, **nicht** nur Funktionsaufruf zählen; kein XP bei bloßem Wiederberechnen, Neuladen oder unveränderten Inputs | Backhelfer misst virtuell eine Backform aus, kleiner Mehlwirbel (deaktivierbar) | Miniküche/Backregal im Hideout, nostalgisches Rezeptbuch als kosmetische Deko | Hohe Relevanz: Backformen, Küchenwaage, Backpapier; bestehende Amazon-Konfiguration hat `baking.items=[]`, also **keinen generischen Vorschlags-Content** aus dieser Konfiguration; prüfen, ob Katalogdaten zusätzliche Produkte enthalten | Freiwilliger kleiner Hinweis **nach** sichtbar berechnetem Rezept; nicht mit Druckansicht oder Ergebnis konkurrieren | **A – Pilotkandidat 3** |

## 4. Priorität nach Nutzwert + geringerem Risiko

**Pilotfavorit für die *inhaltliche* P1/P4-Spezifikation: Umzugskisten.** Guter fachlicher Erfolg nach bestätigtem Speichern, direkt passende Amazon-Zubehörartikel, unkritische Maskottchen-Reaktion, klares Hideout-Objekt. Keine Annahme, dass bereits alle Cloud-/Speicherpfade verifiziert wurden.

**Alternative: Pflanzenpflege.** Hoher wiederkehrender Alltagseinsatz, vorhandene einmal-pro-Tag-Wasserungsregel und interessante Home-/Garten-Deko. Mehr Zeit- und Zustandsspezifika, daher nicht erster technischer XP-Test.

**Alternative für schnell erlebbaren Nutzen: Backform-Rechner.** Hoher potenzieller Produktbezug, aber Berechnungen sind manipulationsanfälliger und persistente Erfolge schwerer zu belegen. Für gesicherte XP nur nach spezifizierter Validierung, ansonsten V1 nur kosmetische Gratulation.

**Eher B:** Zählerstände, Autokosten, Verliehene Dinge, WG-Organisator, Haushaltsbuch, Parkplatz-Merker. Ihre Datenarten/Cloud- oder Lebenssituationskontexte verlangen zusätzliche Schutzmaßnahmen.

**Bewusst C / XP 0:** Digitaler Nachlass und Tiergesundheit; bei Wunschlisten ebenfalls XP 0 für Suche, Klicks und Veröffentlichung, um keinen Anreiz für Offenlegung oder Affiliate-Manipulation zu schaffen.

### Pilot-Ablauf „Umzugskiste erfolgreich gespeichert“

1. Nutzer öffnet Umzugsplaner direkt von Suche/Favorit/Startseite. Keine Spielpflicht.
2. Erst Standort anlegen und Kiste erfassen; vorhandene Eingabevalidierung arbeitet unabhängig.
3. Client prüft Speicherausgang. Nur bestätigter Zustand ist fachlicher Erfolg; offline/lokal nur transparent als lokaler Zustand.
4. Opt-in-Nutzer erhält nach idempotenter autorisierter XP-Bestätigung ein kleines sachliches `+40 XP` und eine kurze, wegklickbare Mascot-Reaktion.
5. Im optionalen Universe erscheint ein rein kosmetisches Regal-Objekt. Vorhandene Nutzerdaten wie Kistennamen, Fotos, Standortnotizen verlassen das Umzugstool **nicht**.
6. **Nach** gespeicherter Kistenübersicht darf ein klar mit 'Werbung/Affiliate-Link' gekennzeichnetes Zubehörmodul erscheinen; kein Kaufzwang.
7. Ko-fi erscheint höchstens nach kontextfreiem Erfolg und Frequenzlimit als ruhiger Link, nicht zusammen mit Warnung, Fehler oder Affiliate-Overlay.
8. Bei Fehler, Abbruch oder wiederholtem Speichern keine XP, keine erfundene Erfolgsmeldung, keine Veränderung der Tool-Daten.

## 5. Technische Anbindungsprüfung – zwingend vor P1-Implementierung

**Alle Funktionen in der Matrix sind Anker für Code-Review, noch keine Freigabe für Instrumentierung.** Vor Einbau pro Tool: Funktionsdefinition und konkrete Storage-/Cloud-Abhängigkeiten prüfen; Klassifikation von lokalen vs. autoritativem Servererfolg dokumentieren; State-Änderung und `await`-Fehlerpfade prüfen; einheitliches `toolya:achievement`-Konzept als **Vorschlag** definieren, nicht heimlich in jedem alten Handler schreiben.

- Eine fachliche Aktion kann mehrfach ausgelöst werden. Dedup-Key z. B. `account + event_type + source_business_event_id` oder bei 'erstmals' `account + event_type`. Das Frontend kann keine XP autoritativ vergeben.
- Für rein lokale Tools kein vorgetäuschter Cloud-Beleg. Bei späterem Kontoübergang keine untrusted `localStorage`-XP als echte Cloud-XP übertragen. Migration ist ein eigener bewusst freigegebener Plan.
- **Keine Zweckentfremdung der Produktions-Supabase.** RLS, Berechtigungen, Rate-Limits, Idempotenz und transaktionale Ledger-Struktur erst bei ausdrücklich genehmigter, abgesicherter Entwicklung. Projekt-ID aus Master-Roadmap, keine zusätzlichen produktiven Abfragen oder Testdatensätze nötig für P0.
- Keine schreibenden Testaufrufe in echten Konten; spätere Integrationsprüfungen mit Mocks/Staging oder erlaubten lokalen Fixtures. Keine sensiblen Rohinhalte an Analytics.
- Ereignis-Emission ausschließlich **nach** fachlicher Bestätigung. Unsichere Fälle wie synchroner `saveData` ohne nachvollziehbare persistente Bestätigung bleiben bis Prüfung **nicht auszeichnungsfähig**.
- Bei Tiergesundheit/Nachlass bereits vorhandene `serious:true`-Charakterrollen respektieren; Gamification vollständig getrennt halten.
- Keine geographischen Daten, Geldbeträge oder andere Nutzerdetails in Cross-Tool-Messaging.

## 6. UX-Wireframe in Worten: freies Tool vs. optionale Spielwelt

### A. Direkt vom Tool kommende Nutzer (prioritärer Pfad)
**Tool-Seite oben:** gewohnter Header mit bestehender Wordmark und gewähltem Maskottchen, Hauptbedienung unverändert.  
**Tool-Aufgabe:** der Nutzer führt seine Aktion vollständig aus; kein Banner verdeckt Speicher-/Berechnungsbuttons.  
**Nach bestätigtem Erfolg:** nur bei Universe-Opt-in ein kurzes, optional stummes Gratulationszeichen, sparsam.  
**Unterhalb Ergebnis:** maximal ein redaktionell passendes, klar gekennzeichnetes Amazon-Zubehörmodul; keinen doppelten Empfehlungsblock durch vorhandenes `amazon-affiliate.js` erzeugen.  
**Im Footer:** bestehender Ko-fi-Hinweis bleiben lassen/behutsam optimieren, keine aggressive zusätzliche Aufforderung.

### B. Universe-Besuch
**Universeseite:** aktuelles Level, Fortschritt zum nächsten Meilenstein, Maskottchen der Nutzerauswahl, ein einziges kurzes, humorvolles Ereignis.  
**Hideout:** ruhige interaktive Szene, neue kosmetische Gegenstände; Blick auf Story-Quest, ohne Zeitdruck.  
**Nächster guter Schritt:** optionaler Link zu einem noch nicht genutzten **passenden** Alltagstool; niemals 'Kaufen für XP'.  
**Unterstützung:** freiwilliger Ko-fi-Abschnitt als 'Du möchtest die kostenlose Welt unterstützen?', unabhängig von XP und Quest.

### C. Anmeldung und Gäste
**Gast:** Alle Tools funktionieren; Universe kann ohne Konto demonstriert werden; rein lokale Fortschritte sichtbar als 'nur auf diesem Gerät', mit Backup-/Verlustwarnung.  
**Angemeldeter Nutzer:** Nach ausdrücklicher späterer Freigabe gesicherte eigene XP-/Hideout-Daten geräteübergreifend, ohne private Toolinhalte; Auth muss kontobezogene Zustände schützen.  
**Wechsel/Logout:** kein Vermischen von Fortschritten verschiedener Nutzer auf gemeinsamem Gerät.  
**Abschalten:** Universe-Effekte/UI aus; Tools weiterhin voll funktionsfähig.  
**Ruhemodus:** statische, gleichwertige Darstellung, keine animierte Pflichtaktion.

## 7. Monetarisierungsregeln und bisheriger Integrationsbestand

**Bereits im Repository (kein neuer Code):**
- `shared/toolya/amazon-affiliate.js` enthält Affiliate-Tag `duhrrom-21`, kontextbezogene Vorschlags-Konfiguration (Auto, Umzug, Tiergesundheit, Haushaltsbuch, Nachlass, Backform ohne `items`), `amazon-catalog.json`-Ladepfad und Kennzeichnung `Anzeige` / `rel=sponsored`. Die eigentliche `add()`-Funktion ist im gelesenen Modul **nicht** im `start()` aufgerufen; `loadCatalog()` und `existing()` sind aktiv. Daher **nicht behaupten**, die generischen Vorschläge seien auf jeder Seite live zu sehen. Kataloginhalt und tatsächliches Rendering vor späterer UX-Änderung explizit prüfen.
- Auf `tools/wishes/public.html` befinden sich bereits eigens markierte Amazon-Partnerlinks zur **Erstellung** von Baby-, Hochzeits- und normalen Wunschlisten. Nicht löschen, austauschen oder deren Linkziele ohne Prüfung verändern.
- Gemeinsames Maskottchen und bestehende Ko-fi-Integration befinden sich in `shared/toolya/platform.mjs`; keine Doppelimplementierung anstreben.
- Bevor Amazon-Links/Preise/Bilder/Produktdaten oder Ko-fi-Ziele geändert werden: **aktuelle offizielle Partnerbedingungen**, Impressums-/Werbe-/Datenschutzpflichten und tatsächliche Darstellung getrennt prüfen. P0 hat diese Regeln nicht abschließend geprüft.

**Konkrete Placement-Richtlinie:** höchstens ein sichtbar gesponsorter Produktbereich pro Tool-Ergebnis; kein Autopopup; keine Amazon-Links in Belohnungsanimationen; keine KI-Pseudoempfehlungen mit fiktiven Testergebnissen; keine verborgene Bewerbung aus Gesundheits-, Nachlass-, Haushalts- oder Ortsdaten. Für Ko-fi maximal ein sichtbarer freiwilliger Kontaktpunkt pro Ergebnisansicht; Cooldown über längeres Zeitfenster (exakte Zeit später festlegen); ohne Bettel- oder Verlust-Formulierungen. Kauf/Spende beeinflussen **niemals** XP oder World-State.

## 8. Messkonzept und Datenschutzgrenzen

**North-Star:** Anzahl tatsächlich abgeschlossener, hilfreicher Tool-Aufgaben je wiederkehrendem Nutzer, mit sauber definierter Nicht-Sensitivität. **Sekundär:** freiwillig aktive Universe-Nutzer (keine Pflichtquote), 7-/30-Tage-Wiederkehr, Entdeckung eines weiteren sinnvollen Tools, freiwillige Ko-fi-Zuflüsse, tatsächliche Affiliate-Provisionen/1.000 Besuche, Aufgabenabbrüche, Ladezeiten, Beschwerden, Opt-out-Rate.

**Nur auf zulässiger Grundlage:** minimal aggregierte/nicht-sensitive Ereignisse z. B. `tool_opened` (für Navigation, **kein XP**), `non_sensitive_task_confirmed` (ohne Payload), `universe_opened`, `universe_opted_out`, `affiliate_link_clicked` (ohne Nutzeridentität nach Consent/Regeln). **Nicht** loggen: Nachlass, Tiergesundheit, exakte Finanzwerte, GPS, private Listen, Kontakte, konkrete Query-Texte. Konversionen/Provisionen nur aus tatsächlich verfügbaren, autorisierten Partnerdaten, nie aus geschätzten Klicks als Ist-Umsatz ausweisen.

**Kontrollgruppe:** Spätere Bewertung sinnvoller Retention nur auf rechtlich zulässiger, freiwilliger Messgrundlage; vorab Baseline nach Tooltyp, Geräteklasse, Einstiegskanal. Gamification darf wichtige Nutzungskennzahlen nicht künstlich aufblähen.

## 9. Nachvollziehbare Aufgaben für neue Chats (P0 → P1 → P4)

| ID | Aufgabe | Ergebnis/Abnahme | Priorität | Status |
|---|---|---|---|---|
| P0-01 | Zwölf Tools mit Code-Ankern und geeigneten/nicht geeigneten Erfolgen abbilden | 12/12 Zeilen der Matrix, Einschränkungen je Tool | A | **Erledigt: Planungsdokument** |
| P0-02 | Maskottchen-/Hideout- und Monetarisierungsplätze pro Tool entwerfen | 12/12 Platzierungsideen, keine Kauf-zu-XP-Verknüpfung | A | **Erledigt: Planungsdokument** |
| P0-03 | Nur die tatsächlich verfügbaren Amazon-Module und Ko-fi-Bausteine identifizieren | Modulpfade und klare Hinweise zu noch nicht verifiziertem Live-Verhalten | A | **Erledigt: Code-Inventar, noch kein Browser-Test** |
| P0-04 | Konkret zu integrierende Speichervorgänge vollständig nachverfolgen | Funktions-/Storage-Callgraph, wirklich bestätigter Abschluss und Failed-Pfade je Pilot | A | Offen – späterer Implementierungs-Vorbereitungsauftrag |
| P0-05 | Konkretes Bildschirm-/Wireframe-Design für Gast, Konto, mobile und Ruhemodus | visuelle Entwürfe und navigierbarer Flow, getrennt vom Live-Code | A | Offen – als textuelle UX-Spezifikation begonnen |
| P0-06 | Aktuelle Amazon-/Ko-fi-Regeln und Kennzeichnung prüfen | Legal-/Partner-Checkliste mit Datum und offiziellen Quellen | A | Offen – vor jeder Umsetzung |
| P0-07 | Optionale Analytics-Baseline erheben | ausschließlich zulässige echte aggregierte Kennzahlen; keine fiktiven Erfolgsmetriken | B | Offen |
| P1-01 | Lokalen 50-XP-Klickprototyp durch echte idempotente Events ersetzen | definierter Event-Vertrag + sicheres Ledger + Tests; kein Live-Release | A | Offen |
| P1-02 | Maskottchen-/Hideout-Opt-in und Kontext-UX entwickeln | Accessibility, ruhiges Verhalten und Tool-Priorität geprüft | A | Offen |
| P4-01 | Umzugskisten-Affiliate-Pilot und Ko-fi-Kontaktpunkt prototypisieren | klare Labels, freie Tool-Ergebnisse, keine Doppelmodule | A | Offen |
| REL-01 | Explizite Live-Freigabe erhalten | dokumentierter Freigabeauftrag **nach** technischem Review | Sperre | **Nicht freigegeben** |

## 10. Konkreter nächster sinnvoller Arbeitsschritt

**Noch im Konzept bleiben:** (a) die drei Piloten **Umzugskisten / Pflanzenpflege / Backform-Rechner** als visuelle User-Journey-Wireframes mit Tool → bestätigter Erfolg → Maskottchen → Hideout → Werbung → Ko-fi zeigen; (b) eine Entscheidungsnotiz für Gäste vs. Konten und faire XP-Events erstellen; (c) vorhandenen Amazon-Katalog und Ko-fi-UI in einem später ausdrücklich beauftragten Review gegen tatsächliche Seiten prüfen. Erst danach P1-Implementierung beginnen, wenn beauftragt – und weiterhin ausschließlich im Entwicklungsbranch.

## 11. Übergabe-/Statusnotiz

- Arbeitsbranch: `feature/gamification-mascot-levels-v1`.
- **Tatsächlich fertig:** Code-Inventar und Planungsmatrix, keine neuen Spielfunktionen. Die 12 aktuellen Tools sind bestehend, die Prototyp-Gamification bleibt im Branch.
- **Nicht fertig:** servergestützte XP, Hidden-World-Rendering, korrekte monetarisierungsbezogene Performance-Messung, Browser-End-to-End-Validierung von Events, legaler Partner-Review, Freigabe.
- **Live:** `main` unverändert lassen. Der ursprüngliche versehentliche Universe-Merge wurde zuvor zurückgenommen.
- Immer diese Datei und die Master-Roadmap lesen, bevor weitere P0-/P1-/P4-Aufgaben begonnen werden.
