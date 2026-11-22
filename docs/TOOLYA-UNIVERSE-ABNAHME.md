# Toolya Universe – Technische Abnahme

## Lokale Vorschau

Im Checkout `npm ci` ausführen, dann bei Bedarf `npx playwright install chromium`. `node tests/universe/browser.cjs --demo` öffnet die echte Oberfläche mit einem synthetischen Konto. Die Vorschau schreibt in einen flüchtigen Testzustand und blockiert externe Anfragen. Die Tool-Links zeigen die realen Pfade, die vorhandenen Tool-Backends werden in dieser Vorschau nicht eingerichtet. Der Testmodus ohne `--demo` sichert Screenshots unter `test-results`. Die CI stellt diese bei erfolgreichem Browserlauf als Artefakt bereit.

## Konten und Spielstand

- Die Registrierungsoberflächen führen zum gemeinsamen Formular unter `/account/register.html`. Login und Passwortwiederherstellung bleiben in ihren bestehenden Oberflächen. Die Anmeldung vom privaten Tool aus akzeptiert nur bekannte interne Rückkehrpfade und übernimmt deren Query und Fragment. Die Nachlass-Anmeldung für das Öffnen des verschlüsselten Tresors bleibt separat. Bestehende verifizierte Konten können ihr Profil ergänzen.
- Die Migration erzeugt ein privates Schema mit zusätzlicher Zeilenabsicherung, einen eindeutigen Punkte-Eintrag je Konto und Meilenstein sowie gezielt freigegebene RPCs. Die Registrierung schreibt das Profil in derselben Transaktion ausschließlich ins private Schema. Die Kontobestätigung und spätere Anmeldungen geben die Profilfelder in ihrem Zugriffstoken nicht mit. Die RPC-Berechtigung prüft eine verifizierte Nicht-Anonym-Identität gegen Auth. Die Rangliste liefert höchstens 30 Anzeigenamen mit allgemeinen Punkten. Konto-Löschung entfernt Universe-Tabellenzeilen über Fremdschlüssel. Die optionale Profilbild-URL wird nicht nachgeladen.
- Vorhandene lokale Klickpunkte werden bei der Umstellung nicht importiert. XP werden nach freiwilliger Aktivierung mit „Tool-Erfolge abholen“ für vorhandene, bereits serverseitig gespeicherte Erfolge eingetragen. Je Quelle sind es einmalig 40 XP. Die Levelgrenzen sind 0, 80, 160, 240 und 320. Private Meilensteine sind getrennt abfragbar und erscheinen auch im Ranglistengesamtwert nicht. Aus- und erneutes Einschalten behält Spielstand und schaltet Ranglistenfreigabe nicht eigenständig wieder ein.
- Das Modell prüft existierende, dem Konto zugeordnete Speicherstände. Einige Werkzeuge speichern clientseitig vorbereitete JSON-Snapshots. Die Datenbank kann bestätigen, dass der Snapshot gehört und als passend gespeichert wurde. Sie kann daraus nicht die Echtheit eines realen Gegenstands oder die Bedienung der Oberfläche beweisen. Die Rangliste bietet rein kosmetischen Fortschritt, und pro Quelle ist nur eine Buchung möglich.

| Quelle | Bestätigter Zustand für 40 XP |
| --- | --- |
| Amazon-Wunschlisten | Ein öffentliches Wunschprofil privat im Konto gemerkt |
| Haushaltsbuch | Ein Eintrag gespeichert |
| Umzugskisten | Eine Kiste gespeichert |
| Pflanzenpflege | Eine Pflanze gespeichert |
| WG-Organisator | Ein Artikel einer zugänglichen WG-Einkaufsliste erledigt |
| Digitaler Nachlass | Verschlüsselte Online-Sicherung vorhanden, separat und freiwillig geprüft |
| Autokosten | Ein Fahrzeug gespeichert |
| Tiergesundheit | Erstes Tierprofil vorhanden, separat und freiwillig geprüft |
| Parkplatz-Merker | Ein Parkvorgang gespeichert |
| Verliehene Dinge | Ein verliehener Gegenstand gespeichert |
| Zählerstände | Ein Zählerstand gespeichert |
| Backform-Rechner | Rezept mit Mengenzeile und positivem Umrechnungsfaktor gespeichert |

## Monetarisierung

Ko-fi ist ein freiwilliger Link. Das Amazon-Modul zeigt im Umzugstool redaktionell bestätigte Katalogprodukte nach einem bestätigten Kistenbestand und mit Werbekennzeichnung. Der eingecheckte Katalog enthält derzeit kein bestätigtes Umzugsprodukt. Ein bereits recherchierter Bosch-ASIN konnte aktuell nicht direkt beim Händler verifiziert werden. Es gibt daher im Kandidatenstand keinen angezeigten Umzugsartikel. Im Nachlass und bei Tiergesundheit entstehen keine neuen Empfehlungen. Das WG-Einkaufslisten-Template gibt keine privaten Artikeltexte mehr an Amazon weiter. Veröffentlichung und Produktempfehlungen bringen keine Punkte. Für die Wirksamkeitsmessung zählen nur tatsächliche Partnerberichte und zulässige aggregierte Aufrufdaten. Im Entwicklungsstand gibt es keine zusätzlichen Analyseereignisse und keine behaupteten Umsätze.

[Amazon-Kennzeichnung](https://partnernet.amazon.de/help/node/topic/GHQNZAU6669EZS98) · [Ko-fi-Gebühren](https://help.ko-fi.com/hc/en-us/articles/360002506494-Does-Ko-fi-take-a-fee) · [DSGVO, Art. 5 und 25](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng/) · [Supabase-Dokumentation zu RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Abnahme und Rückrollprobe

1. Tests gegen die synthetische Datenbank und Chromium-Prüfung aus `.github/workflows/toolya-universe.yml` prüfen. Die SQL-Prüfung deckt Migration beim ersten Anwenden und erneutem Anwenden, alle zwölf Meilensteine, Eigentum, Sichtbarkeit, Einmaligkeit und Questfolge ab. Chromium prüft Spieloberfläche und Registrierung mit synthetischen API-Antworten. Ein zweiter Test verwendet echtes GoTrue und PostgreSQL mit einem lokalen SMTP-Postfach für Pflichtnamen, Kontobestätigung, Rückkehrpfad und Profilanlage.
2. Vor einer späteren Veröffentlichung ein getrenntes Supabase-Projekt oder einen bestätigten isolierten Branch verwenden. Die gehostete Konfiguration mit E-Mail-Versand und Weiterleitungszielen sowie die Migration aus einem Schema-Abbild müssen dort bestätigt werden. Das Projekt mit Anzeigename `toolya-staging` ist anhand der URL im bestehenden Tool-Code der von der Website verwendete Backend-Endpunkt und zählt hier als Produktion. Der verbundene Account hatte beim Abgleich kein isoliertes Toolya-Projekt und keinen Entwicklungsbranch. Neue Supabase-Branches können laufende Kosten auslösen.
3. Vor- und Nachname sind im Entwicklungsstand Pflicht. Der technische Abgleich zeigt, dass die E-Mail das Konto verifiziert, die UUID Konten voneinander trennt und der gesonderte Anzeigename die Rangliste bedient. Für die allgemeine Namenspflicht ist damit derzeit keine objektive Erforderlichkeit belegt. Vor einer Veröffentlichung muss der Betreiber einen konkreten Zweck, eine tragfähige Rechtsgrundlage sowie die Aufbewahrung festlegen oder die Namenspflicht ändern. Der Export- und Löschprozess muss auch unbestätigte Konten und deren private Profilzeilen abdecken. Die separaten öffentlichen Wunschlisten-Angaben bleiben Gegenstand des jeweiligen Veröffentlichungsvorgangs.
4. Vor einem späteren produktiven Rollout ist der Anmeldetrigger mit der neuen Registrierungsoberfläche zu koordinieren. Die alte Registrierungsoberfläche sendet keine Namensdaten. Auth-Weiterleitungen müssen die verwendeten Ziele in der zulässigen Liste unterstützen.
5. Rückrollweg nach einer späteren Freigabe: Auth-Trigger `toolya_universe_signup_profile` von `auth.users` entfernen, dann den Frontend-Stand vor Universe wiederherstellen. Private Universe-Tabellen für einen erneuten Anlauf erhalten und nur nach einem abgestimmten Löschprozess entfernen. Die Migration verändert keine Tabelleninhalte der zwölf Tools.
6. Eine ausdrückliche Endabnahme ist Voraussetzung für Merge, Veröffentlichung und produktive Migration.
