# Aktuelles Releaseziel – vom Nutzer bestätigt

**14.11.2026: toolya.app im Repository duhrrom11/toolya, einschließlich Übernahme der übrigen Tools.** Frühere Nennungen von tooly.app sind ein Schreibfehler; diese fremde Domain wird nicht verändert. Quelldokument und Vorarbeit stammen aus duhrrom11/Helferlein, Branch feature/toolya-buddy-wishlist-v4.

## Aktueller Umsetzungsstand
- Zwölf kanonische Tools, englische Routen und benötigte Runtime-Abhängigkeiten übernommen; vorhandene Toolya-Wishlist samt Amazon-Importer bewahrt.
- Einheitlicher Begleiter mit gespeicherten Einstellungen, zurückhaltenden Meldungen, Fünf-Tipp-/Tastatur-Kitzelreaktion, Abklingzeit und Dialog-/Warnungssperren.
- Zwei neue Charakter-Atlanten mit je 32 Bildern (16 Emotionen mit zwei Zuständen) und ein Outfit-Atlas mit beiden Charakteren für 16 Rollen. Bilder separat erzeugt, acht Original-PNGs unverändert. WebP-Ableitungen zusammen rund 2,3 MB; Emotionen bedarfsgeladen. Neue Bilder sind Frame-Illustrationen, kein frei bewegliches Skelett.
- Echte lokale Speicherbestätigungen ausdrücklich als lokal gekennzeichnet; Online-Erfolg erst nach bestätigter Cloud-Antwort. Wishlist meldet Teilfehler als Warnung. Keine erfundenen Spenden oder Speichervorgänge.
- Ko-fi-Ziel unverändert. Datenschutz-/Rechtstexte und Hauptnavigation auf Toolya umgestellt. Alte Helferlein-Daten bleiben auf der bisherigen Origin; kein automatischer Import.
- Kritisches Gate: Nachlass wird nur mit geprüfter eigener Toolya-Datenstruktur und eigenem Edge-Endpunkt veröffentlicht. Ohne konfigurierte Mail-Secrets bleiben Notfallalarme serverseitig gesperrt. Kein Ersatz durch unbelegte Zustellannahmen.
- Geprüfter Code-Commit: `a1db13a442980db3efa516a7a6300b01cdef98f6`. Plattform/Maskottchen einschließlich Browserprüfung aller zwölf Routen bei 320 px und isolierter PostgreSQL-17-/Nachlass-Prüfung erfolgreich: https://github.com/duhrrom11/toolya/actions/runs/43612863134 . Amazon-Scraper-Prüfung erfolgreich: https://github.com/duhrrom11/toolya/actions/runs/43612863159 . 67 Node-Prüfungen im Plattform-Gate bestanden. Mobile Screenshots einschließlich neuer Navigation und Wunschlisten-Outfit gesichtet.
- Konkrete Fehler behoben: überbreiter Wunschlisten-Link (Box-Sizing), veraltete Nachlass-Mail-Routenerwartung und unzulässige externe Maskottchen-Ressourcen auf der streng geschützten Druckseite. Die Druckseite behält ihre CSP.
- **Release noch nicht veröffentlicht. Externer Blocker:** Zwei `apply_migration`-Anfragen für `toolya_estate_read_release_v2` sind bei der erforderlichen Supabase-Plattformbestätigung abgelaufen. Kein SQL-Fehler, keine erfolgreiche Migration. Anschließende reine Metadatenabfrage bestätigt: `estate_private.read_vaults` und `public.estate_release_v2(text,uuid,jsonb)` fehlen weiterhin. Die Bestätigung wird nicht durch DDL über `execute_sql` umgangen.
- Bereit zur Prüfung: https://github.com/duhrrom11/toolya/pull/9 . Quell-Repository/Helferlein-main und bisheriges Hosting bleiben unverändert. Keine produktiven Testdatensätze, keine Alarm-/Mailauslösung.
- **Fortsetzung nach Plattformbestätigung:** Beide vorbereiteten Nachlass-Migrationen auf Toolya anwenden; RLS/EXECUTE prüfen; eigenen `estate-emergency`-Endpunkt deployen und ausschließlich den schreibfreien Health-Aufruf prüfen; vorhandene Mail-Konfiguration feststellen (keine Zustellfähigkeit behaupten). Bei fehlenden Mail-Secrets erforderliche Konfiguration klären. Erst anschließend PR freigeben/mergen, GitHub Pages erfolgreich abschließen und alle zwölf Live-Routen/Assets auf https://toolya.app verifizieren. Bis dahin keine vollständige Abnahme behaupten.

## Historischer Ausgangsauftrag

# TOOLYA MASCOT UNIVERSE
## Verbindliche Master-Roadmap bis zum vollständigen Live-Release
**Projekt:** Toolya / https://tooly.app
**Repository:** duhrrom11/Helferlein
**Ausgangsbranch:** feature/toolya-buddy-wishlist-v4
**Ziel:** Vollständig entwickelte, lebendige Maskottchen auf tooly.app und sämtlichen Tools veröffentlichen.
**Priorität:** Fertigstellung und produktive Veröffentlichung vor unnötigen Test- und Dokumentationsrunden.

## 1. Arbeitsauftrag und Freigaben
ChatGPT Work übernimmt die eigenständige technische und gestalterische Umsetzung bis zur vollständigen Veröffentlichung.
Der Nutzer erteilt ausdrücklich Freigabe für GitHub-Codeänderungen, Branches, Commits, Pull Requests, Merges und Deployments; notwendige Supabase-Schema-, Konfigurations- und Policy-Änderungen; neue Grafiken, Animationen, Module und Ressourcen; Fehlerbehebung, Release-Vorbereitung und produktive Veröffentlichung. Routineentscheidungen selbstständig treffen.

**Grenzen:** Die acht vorhandenen Original-PNGs niemals verändern oder überschreiben. Beide verbindlichen Maskottchen im Charakterdesign bewahren. Bestehende Nutzerdaten, Authentifizierung, Datenschutz und Sicherheitsregeln schützen. Keine unnötigen Testdaten in produktiven Supabase-Tabellen. Vor irreversiblen/riskanten Aktionen erforderliche Sicherheitsprüfungen und Plattformbestätigungen beachten. Neue Datenbankstrukturen nur bei echtem Bedarf.

**Arbeitsprinzip:** Implementieren, gezielt prüfen, Fehler beheben, veröffentlichen, Live-Funktion bestätigen. Keine endlosen kleinen kosmetischen Commits.

## 2. Bestehenden Stand übernehmen
Vor Beginn aktuellen GitHub-Stand lesen, bestehende Implementierungen wiederverwenden.
Vorhanden: zwei auswählbare Maskottchen (Türkis-Weiß und Lila-Creme); acht Original-PNGs für Begrüßung, Erfolg, Tipp, Fehler; ToolyaBuddy-Komponente mit Meldungsprioritäten und Bestätigungsdialogen; Wunschlistenintegration; Animationseinstellungen, Ruhemodus, Barrierefreiheit; Android-Vorschau und automatisierte Tests; SHA-256-Schutz der Originalgrafiken.

**Befund 14.11.2026:** Branch-Head f3f89831; Node-Tests erfolgreich; Chromium-CI scheitert an nicht unterstützter Playwright-/Ubuntu-26.04-Kombination. Zuerst CI-Umgebung reparieren und vorhandene Komponente stabilisieren. Vor Arbeitsbeginn erneut prüfen, da der Stand sich ändern kann.

## 3. Phase 1 – Zentrales Maskottchen-System
Die Wunschlisten-Komponente in ein wiederverwendbares, plattformweites System überführen:
- Gemeinsamer technischer Kern für sämtliche Tools.
- Beide Hauptcharaktere auswählbar.
- Einheitliche Ereignissteuerung, Charakterauswahl, Animationen und Einstellungen.
- Tool-spezifische Konfiguration für Kleidung, Requisiten, Meldungen und Verhalten.
- Einfache Integration ohne vollständigen Umbau vorhandener Tools.
- Schnelles Laden, mobile Optimierung, zuverlässige Fallbacks.
- Nutzerpräferenzen (Charakter, Animationsintensität, Ruhemodus) beibehalten.
**Ergebnis:** Toolya begleitet die ganze Plattform, nicht nur die Wunschliste.

## 4. Phase 2 – Mehr Emotionen und Posen
Beide Figuren erhalten eine umfangreiche Bibliothek mit mehreren Varianten je Emotion:
1. Fröhlich/begeistert
2. Stolz/triumphierend
3. Neugierig/interessiert
4. Nachdenklich/konzentriert
5. Überrascht/verblüfft
6. Besorgt/vorsichtig
7. Traurig/mitfühlend
8. Verlegen/schüchtern
9. Frech/verschmitzt
10. Müde/schläfrig
11. Lachend/kichernd
12. Dankbar/gerührt
13. Motiviert/anfeuernd
14. Verwirrt/ratlos
15. Feiernd/tanzend
16. Liebevoll/herzlich

Beispiele: Erfolg mit Daumen hoch, Jubelsprung oder Tanz; Fehler mit Schulterzucken/besorgtem Blick; Tipp mit Kopfneigung/Zeigegeste; Überraschung mit großen Augen/aufgestellten Ohren; Dankbarkeit mit Herz/Verbeugung/Winken. Nicht immer dieselben Standbilder wiederholen.

## 5. Phase 3 – Hochwertige Animationen
Echte Teilbewegungen: Blinzeln/Augenbewegungen; Ohren aufstellen, neigen und wackeln; Pfoten bewegen/winken; Schwanzwedeln; Kopfbewegungen/Schulterzucken; Hüpfen/Tanzen/Jubeln; Kichern/Lachen; Schlafen/Aufwachen/Strecken; dezente Idle-Bewegungen.
Technik: zusätzliche transparente Ebenen, konsistente Frames oder geeignete Animationsformate. **Original-PNGs unverändert**, zusätzliche Assets separat. Charaktertreu, flüssig, Android-schonend; bei reduzierter Bewegung statische, vollständig nutzbare Darstellung.

## 6. Phase 4 – Emotionale, abwechslungsreiche Meldungen
Jede Meldung kombiniert tatsächliches Ereignis, passende Emotion, eine von mehreren geeigneten Posen, Animation und kurzen freundlichen/humorvollen Text. Bei wiederholten Ereignissen abwechslungsreiche Varianten statt immer derselben Pose.
Beispiele:
- Speichern: „Tadaaa! Alles sicher verstaut!“
- Fehler: „Ups! Da hat sich wohl ein kleines Chaos eingeschlichen.“
- Tipp: „Pssst! Ich hab da einen cleveren Trick!“
- Aufgabe erledigt: „Juhuuu! Wir sind ein echtes Dreamteam!“
- Leerer Zustand: „Hier ist ja noch Platz für große Ideen!“
Erfolg nur nach bestätigter erfolgreicher Aktion. Kritische Warnungen klar und zuverlässig.

## 7. Phase 5 – Eigenes Outfit für jedes Tool
Beide Hauptcharaktere behalten, aber jedem Tool passende Outfits, Accessoires und thematische Animationen geben. Beispiele:
| Toolbereich | Outfit und Verhalten |
| --- | --- |
| Wunschliste | Geschenkexperte, Schleife, Geschenkpaket |
| Haushaltsbuch / WG-Kasse | Buchhalter, Taschenrechner, Münzen |
| Küche | Kochmütze, Schürze, Kochlöffel |
| Auto / KFZ | Mechaniker, Schraubenschlüssel |
| Pflanzen | Gärtner, Strohhut, Gießkanne |
| Haustiere | Tierfreund, Pfotenmotiv, Leckerli-Tasche |
| Umzugskisten | Umzugshelfer, Karton, Handschuhe |
| Parken | Parkwächter, Warnweste |
| Notizen | Schreiber, Stift, Notizbuch |
| Energie / Zählerstände | Energietechniker, Blitzsymbol |
| Digitaler Nachlass | Dezenter seriöser Begleiter |
| Verleih | Organisator, Klemmbrett |

**Tatsächliche vollständige Tool-Liste aus Repository ermitteln.** Für jedes vorhandene Tool Outfit, Reaktionen und echte Ereignisse definieren. Bei Nachlass, Gesundheit und kritischen Fehlern Humor respektvoll zurücknehmen.

## 8. Phase 6 – Ko-fi-Buttons durch Maskottchen ersetzen
Alle bestehenden Ko-fi-Spendenaufrufe auf tooly.app finden und durch anklickbare, sympathische Maskottchen-Aufrufe ersetzen. Bestehende Zieladresse https://ko-fi.com/duhrrom beibehalten, solange nichts anderes vorgegeben wird.
Abwechslungsreiche Texte:
- „Ein Käffchen für meinen Werkzeugkasten? ☕“
- „Meine flauschigen Ohren arbeiten heute Überstunden!“
- „Ich werde nicht mit Keksen bezahlt. Skandal!“
- „Ein kleiner Kaffee und ich hüpfe vor Freude!“
- „Meine Schraubenschlüssel brauchen dringend Koffein!“
- „Unterstützt du uns? Ich wedle auch extra mit dem Schwanz!“
- „Pssst … mein Sparschwein ist noch ziemlich hungrig!“
- „Ich arbeite für Applaus. Aber Kaffee wäre auch toll!“
- „Ein Kaffee für die Menschen hinter Toolya? Ich sage Danke!“
- „Mit einem Käffchen machst du dieses Flauschwesen glücklich!“
Kuratiert abwechseln, nicht aufdringlich wiederholen, keine erfundenen Spendenereignisse. Freiwilligkeit eindeutig kennzeichnen; Touch, Tastatur und Screenreader unterstützen.

## 9. Phase 7 – Kitzel-Easter-Egg
Fünfmal innerhalb eines kurzen Zeitfensters auf das Maskottchen tippen/klicken oder per Tastatur aktivieren. Danach kichert es heftig, krümmt sich vor Lachen oder rollt sich spielerisch zusammen; Ohren/Schwanz wackeln; Lachanimation und wechselnder Spruch.
Beispiele:
- „Hihihihi! Ich bin doch soooo kitzlig!“
- „Hahaha! Hör auf, meine Ohren lachen schon mit!“
- „Kicher! Noch einmal und ich falle um!“
- „Hihihi! Meine Pfoten halten das nicht aus!“
- „Du hast meinen geheimen Kitzelknopf gefunden!“
Kurze Abklingzeit; wechselnde passende Reaktionen; zuverlässiges Touch- und Tastaturverhalten; bei reduzierter Bewegung sanfte/statische Reaktion; nicht während wichtiger Dialoge; normale Bedienung nie stören.

## 10. Phase 8 – Plattformweite Integration
1. Wunschlistenintegration fertigstellen.
2. Gemeinsame Maskottchen-Bibliothek stabilisieren.
3. Startseite und Navigation integrieren.
4. Tool-spezifische Outfits und Ereignisse einbauen.
5. Ko-fi-Aufrufe vollständig ersetzen.
6. Alle übrigen Tools anbinden.
7. Einstellungen und Darstellung vereinheitlichen.
Bestehende Toolfunktionen bewahren; keine falschen Erfolgsmeldungen, verdeckten Bedienelemente oder unnötigen produktiven Datenänderungen.

## 11. Phase 9 – Minimal notwendige Tests
**Live-Release hat höchste Priorität.** Keine überdimensionierte Testsuite oder kosmetische Testschleifen. Unbedingt prüfen:
- Anwendung startet ohne JavaScript-Fehler.
- Bilder und Animationen laden.
- Wichtige Meldungen funktionieren.
- Bestätigungen und sicherheitskritische Funktionen bleiben zuverlässig.
- Easter-Egg funktioniert auf Touchgeräten.
- Ko-fi-Link funktioniert.
- Tools bleiben mobil bedienbar.
- Keine Datenbeschädigung/ungewollten Datenbankänderungen.
- Releasekritische GitHub Actions erfolgreich.
- Live-Seite funktioniert nach Deployment.
Bestehende Tests wiederverwenden; neue nur für wichtige Fehler- und Integrationsrisiken.

## 12. Phase 10 – Produktiver Live-Release
**Verbindliches Endziel: https://tooly.app und alle vorhandenen Tools.**
ChatGPT Work:
1. Hosting- und Deployment-Struktur ermitteln.
2. Vollständigen Integrationsstand prüfen.
3. Releaseblocker selbstständig beheben.
4. Notwendige Supabase-Anpassungen sicher durchführen.
5. Releasekritische Tests erfolgreich abschließen.
6. Freigegebene Änderungen in Veröffentlichungsbranch übernehmen.
7. Produktiv deployen.
8. Live-Seite und Tool-Routen prüfen.
9. Live-Probleme beheben oder bei kritischen Fehlern zurückrollen.
10. Commit, Deployment und geprüfte URLs dokumentieren.
Ein GitHub-Commit allein ist keine Fertigstellung.

## 13. Definition von vollständig fertig
- Beide Maskottchen vollständig integriert.
- Geplante Emotionen/Posen funktionieren.
- Hochwertige, zuverlässige Animationen.
- Meldungen zeigen unterschiedliche passende Reaktionen.
- Jedes vorhandene Tool besitzt passendes Outfit.
- Ko-fi-Buttons durch funktionierende Maskottchen-Spendenaufrufe ersetzt.
- Kitzel-Easter-Egg funktioniert.
- Android und wesentliche Barrierefreiheit gewährleistet.
- Alle Tools funktionieren weiter.
- System auf tooly.app live und überprüft.

## 14. Arbeitsweise für ChatGPT Work
Selbstständig und produktionsorientiert: Repository, Roadmap und CI lesen; vollständige Tool-Liste und Integrationsstellen erfassen; größere Arbeitspakete umsetzen; vorhandene Assets/Komponenten wiederverwenden; Routineentscheidungen treffen; Emotionen/Outfits/Animationen originalgetreu erweitern; nur notwendige Tests; Fehler selbst beheben; kontrolliert veröffentlichen; bis zu allen Abnahmekriterien oder tatsächlicher externer Blockade fortfahren. Nach größeren Abschnitten kurz berichten: erledigt, offen, GitHub-Stand, CI-Stand, Live-Status.

**Oberstes Ziel:** Ein lebendiges, witziges und unverwechselbares Toolya-Maskottchen-Erlebnis auf der gesamten Plattform – vollständig fertiggestellt und produktiv veröffentlicht.

## Übergabehinweis
Diese Roadmap ist die **neuere Nutzerfreigabe** und ersetzt für künftige Arbeiten die früheren generellen Verbote von Merge, Deployment und Supabase-Zugriff in tools/wishlist/TOOLYA-MASTER-ROADMAP.md. Sicherheitsprüfungen und erforderliche Bestätigungen bleiben verbindlich. Work soll die alte Roadmap entsprechend aktualisieren, ohne den historischen Stand zu verfälschen.


## Umsetzung 14.11.2026 – gemeinsamer Kern, noch KEIN Live-Release

- Ausgangsstand: `9dfc79e`; die Original-PNGs bleiben unverändert.
- Gemeinsamer Adapter `shared/toolya/platform.mjs` auf Startseite und allen elf kanonischen Helferlein-Tools plus Wishlist eingebunden. Historische Redirect-Routen bleiben Redirects.
- Bestehende Wishlist-Komponente wiederverwendet, einheitliche persistierte Einstellungen, Tool-Kontexte, optionale Begrüßungen und explizite `toolya:notice`-Ereignisschnittstelle. Keine Erfolge aus Klicks oder Formularübermittlungen geraten. Die konkreten Erfolgs-/Fehlerereignisse der übrigen Tools müssen noch angebunden werden.
- Ko-fi-Handlungsaufrufe einschließlich nachträglich erzeugter Einstellungen werden mit Charakterbild, wechselndem Text, Freiwilligkeit und unverändertem Link dargestellt. Rechtliche Fließtextverweise bleiben erhalten. Gesundheits-/Nachlassbereich verwendet zurückhaltende Texte.
- Fünf Aktivierungen in fünf Sekunden lösen wechselnde Kitzeltexte aus; 15 Sekunden Abklingzeit, Touch/Tastatur, Sperre bei Warnungen, Bestätigungen, Ruhemodus und ausgeblendetem Begleiter. Reduzierte Bewegung bleibt respektiert.
- GitHub-Chromium-Runner auf Ubuntu 24.04 fixiert; notwendige plattformweite Browserprüfungen ergänzt.
- Lokal: 94/94 Node-Prüfungen bestanden. Browserstart durch Umgebungsbeschränkung verhindert (`socket() failed: Operation not permitted`), daher KEINE lokale Browserabnahme behauptet. GitHub-Browserergebnis separat nachtragen.

### Tatsächlicher Releaseblocker: Domain und Repository stimmen nicht überein
Direkter HTTP-Abruf am 14.11.2026:
- `https://tooly.app` liefert eine fremde englische Seite „Tooly – A powerful Chrome Extension“.
- `https://toolya.app` liefert „Toolya – Bald verfügbar“.
- `duhrrom11/toolya` hat `CNAME=toolya.app`, eine eigenständige Wishlist unter `tools/wishes/` und ein anderes Supabase-Projekt.
- `duhrrom11/Helferlein` veröffentlicht weiterhin separat über GitHub Pages. Diese Änderung wird NICHT durch einen Helferlein-Merge automatisch auf toolya.app verfügbar.

Vor einer produktiven Übernahme muss das beabsichtigte Ziel eindeutig geklärt werden. Keine fremde Domain umkonfigurieren, keine gesamte Helferlein-Anwendung unkontrolliert in das getrennte Toolya-Projekt kopieren.

### Noch offen – keine vollständige Abnahme
16 Emotionen mit mehreren echten Posen pro Figur; neue charaktertreue Outfits statt der bisher rein textlichen Tool-Kontexte; unabhängige Augen-/Ohren-/Pfoten-/Schwanzanimationen; reale Ereignisse in sämtlichen Tools; zielgerechte Übernahme in den tatsächlichen Veröffentlichungsstand; erfolgreiche Browser-CI, Merge, Deployment und Liveprüfung. Ganzbild-CSS-Animationen und Kontextsymbole sind ausdrücklich KEIN Ersatz für diese Grafikanforderungen.


### Verifizierter Zwischenstand und PR #414
- Code-Commit `5434b056864e918be585ef1666154fed70228ff9`: Workflow https://github.com/duhrrom11/Helferlein/actions/runs/43606530753 erfolgreich: 94 Node-Prüfungen, sechs Android-/Dialogprüfungen und drei plattformweite Browserprüfungen (einschließlich elf Tool-Routen, Touch, Tastatur, Idle-Begleiter, Ko-fi und Warnungs-/Dialogsperren).
- Originalbild-Hashes erneut lokal und in GitHub bestätigt. Keine produktiven API-Aufrufe oder Datenbankänderungen in den neuen Browserprüfungen; die Supabase-Bibliothek wird dafür aus der vorhandenen lokalen Kopie geliefert.
- Android-Textzoom-Überlauf der isolierten Vorschau durch umbrechende Beschriftungen und schrumpfende Dialoginhalte behoben.
- PR https://github.com/duhrrom11/Helferlein/pull/414 bleibt Entwurf, kein Merge oder Deployment. Die allgemeinen B3-Prüfungen enthielten feste Erwartungen an den alten Ko-fi-Text; diese werden auf freiwillige Unterstützung mit unverändertem Ziel und unveränderter Linkreihenfolge aktualisiert. Shared-Modul im HTML-Head erhält die bisherigen Inline-Script-Regressionen. 16/16 Offline-Release-Regressionen lokal bestanden.
- Ein bestehender Nachlass-Browsertest klickte nach Ergänzung des Anhang-Entfernen-Buttons fälschlich den ersten Formularbutton; er adressiert jetzt ausdrücklich „Eintrag speichern“. Keine Änderung der Nachlass-Datenlogik.
- Der nachfolgende CI-Lauf muss diese Integrationskorrekturen zusätzlich bestätigen. Das ist weiterhin keine vollständige grafische oder produktive Abnahme. Domain-/Repository-Zuordnung und die oben aufgeführten Grafik-/Ereignisarbeiten bleiben offen.
