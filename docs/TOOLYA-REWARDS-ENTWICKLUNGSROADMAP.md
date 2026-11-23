> **NEUERE NUTZERENTSCHEIDUNG VOM 23.11.2026 – ERSTE AUSBAUSTUFE STARK REDUZIERT:** V1 umfasst **ausschließlich XP, Kompetenzpunkte und Badges** als Belohnungen für sinnvolle Tool-Nutzung. Die zehn Mystery-Videos, Ranglisten, Ko-fi-Spenden-XP und alle übrigen Spielmechaniken dieser älteren Roadmap sind **auf später verschoben**, nicht Bestandteil des V1-Auftrags. **Verbindliche aktuelle V1-Roadmap:** [Toolya Rewards V1 – XP, Kompetenzpunkte und Badges](TOOLYA-REWARDS-V1-XP-KOMPETENZEN-BADGES.md). Keine Feature-Implementierung und kein Live-Release beauftragt.\n\n# Toolya Rewards – Entwicklungsroadmap mit zehnteiliger Mystery-Serie

**Stand:** 23.11.2026  
**Status:** **Planung / Spezifikation; noch nichts aus dieser Roadmap implementiert**  
**Repository:** `duhrrom11/toolya` · **Planungsbranch:** `planning/toolya-rewards-mystery-v1` · **Produktionsbranch:** `main`  
**Produkt:** `https://toolya.app`  
**Ansprechpartner für Umsetzung:** ChatGPT Work und/oder Codex nach separatem Entwicklungsauftrag.  
**Veröffentlichung:** kein Merge nach `main`, keine Änderung an produktiven Supabase-Daten oder produktiven Tool-Funktionen ohne ausdrücklich vereinbarten Umsetzungs-/Freigabeschritt.

> **NEUER PRODUKTBESCHLUSS:** Das frühere Toolya Universe mit Abenteuerwelt, Hideout, Quests, Spielkarte und „Werkstätten“ wurde verworfen und der alte Gamification-Branch gelöscht. Nicht aus alten Work-Aufträgen oder geschlossenen PRs wiederherstellen. Toolya soll ein **erwachsenes, fokussiertes XP-/Belohnungssystem** für echte Tool-Nutzung erhalten. **Zehn spannende, kurze Mystery-Thriller-Videos** sind freischaltbare Belohnungen, kein Abenteuerspiel. Ko-fi-Spenden dürfen nach gesonderter fairer Regel XP geben. **Ranking soll bleiben.**

## 1. Product Brief und Nicht-Ziele

**Nutzerwert:** Die zwölf vorhandenen Alltagstools bleiben schnell und fachlich voll nutzbar. Mit echten, bestätigten Erfolgen verdient ein angemeldeter Nutzer XP, Level, Badges und Zugang zu weiteren Episoden einer anspruchsvollen Miniserie. Profil und optionale Ranglisten machen Erfolge sichtbar. Das bestehende Maskottchen-Paar bleibt als Markenelement erhalten, nicht als Spielfigur in einer virtuellen Welt.

**Filmzielgruppe:** Erwachsene. Tonalität: raffinierter Mystery-/Science-Fiction-Thriller mit psychologischer Spannung, starkem Hook ab Sekunde eins, glaubwürdigen Konflikten, trockener Ironie, erwachsener Bild- und Tonsprache, kohärenten Auflösungen. **Keine Kindergeschichte**, keine quietschbunten Fantasy-Quests, keine infantilen Dialoge, keine Jump-Scare-Abhängigkeit, keine zwanghafte Dramatisierung der Tool-Tätigkeiten.

**Feste Grenzen:**
- Keine Abenteuerkarte, kein Hideout, kein überlagerter Quest-Fortschritt, keine 3D-Spielwelt, keine veralteten Universe-Komponenten.
- Keine XP für bloße Seitenaufrufe, Werbeklicks, Affiliate-Käufe, selbst erzeugte Endlosschleifen, ungültige Speicherversuche.
- **Ausnahme bewusste monetäre Unterstützung:** Ko-fi kann XP für eine tatsächlich verifizierte freiwillige Spende erhalten; niemals Voraussetzung für reguläre Tools, Erreichbarkeit der Staffel, finale Story oder Ranglistenchancen.
- Keine Auswertung sensibler Nutzinhalte für Gamification. Keine Freigabe medizinischer/privater Nachlassdaten in Communityflächen.
- Keine stillschweigende Änderung der bestehenden acht Originalmaskottchen-PNGs, der gemeinsamen Toolya-Wortmarke, der bereits live bestehenden Maskottchenwahl/Ko-fi-/Amazon-Integrationen.
- Keine Produktiv-Testdatensätze. Vor tatsächlicher Umsetzung produktive Architektur lesen, Staging verwenden.

## 2. Verbindliche und noch offene Entscheidungen

| Thema | Aktuell beschlossen | Umsetzungsspezifikation / offene Prüfung |
|---|---|---|
| Grundprodukt | Fokus auf Tools, Rewards, Levels, Badges und Ranking | UI-Sprache, Mikroanimationen und Badge-Design |
| Story | Zehn Videos von etwa 60–90 Sekunden, sukzessive durch XP freischalten | Finale Drehbücher, Videolänge pro Folge, Übersetzungen |
| Titel | `Toolya – Das letzte Signal` als akzeptierter **Arbeitstitel** | Endgültiger Titel und Markenprüfung |
| Erzählton | Spannung von den ersten Sekunden; für Erwachsene, kein Kinderfilm | Inhaltliche Altersfreigabe / moderate Thrillerintensität |
| Maskottchen | Beide vorhandenen Charaktere bewahren, Wahl aus Einstellungen respektieren | Filmische Ausarbeitung, Stimmen und Bewegungsgrenzen |
| Anmeldung | Ziel: registrierte Anmeldung für Tool-Nutzung | Bestehende Auth-Gates und öffentliche Wishlist-Discovery gesondert analysieren |
| Konto | Vor-/Nachname verpflichtend; Land und Profilbild-Link optional; später editierbar | Rechtliche Notwendigkeit der Klarnamen, Security, Profil-UI |
| Wunschlisten | Veröffentlichung als Privatperson: Vor- UND Nachname; Organisation/Verein: Organisationsname; Land bei öffentlicher Liste verpflichtend | Öffentliche Suche/SEO/URL-Kompatibilität vs. Loginpflicht |
| Rangliste | Gewünscht | Öffentliches Erscheinen **opt-in**, Nickname statt Klarnamen, Moderation |
| Sensible Tools | Auch Digitaler Nachlass und Tiergesundheit können XP-Belohnungen erhalten | Nur neutraler, sicherer, bestätigter Vorgang, kein sensitive Payload |
| Ko-fi | Verifizierte freiwillige Spenden dürfen begrenzte XP auslösen | Fairness-Cap, Verifikation, Refunds, Identitätszuordnung, aktuelle Ko-fi-Schnittstellen |
| Monetarisierung | Bestehende Amazon-Affiliate- und Ko-fi-Angebote erhalten | Datenschutz/Partnerbedingungen/Disclosure vor Änderungen prüfen |
| Veröffentlichungen | Nutzer soll einen vollständig prüfbaren Kandidaten sehen | **Keine** Live-Veröffentlichung ohne separate Freigabe |

## 3. Zielprodukt – konkrete Bildschirme und Bedienabläufe

### 3.1 Nutzerreise (ohne Ablenkung vom Tool)

1. Angemeldete Person öffnet eines der zwölf kostenlosen Tools. Dessen Bedienung bleibt Hauptinhalt.
2. Nach einer **echten, bestätigten** Handlung erscheint optional eine kleine nicht blockierende „+XP“-Rückmeldung, sofern Nutzer Rewards aktiviert hat. Keine Erfolgsmeldung bei Fehlern, kein konstanter Werbedialog.
3. Profil-Dashboard zeigt Kontostand, Level, nächste Badge-Voraussetzung und „Nächste Folge bei … XP“.
4. Beim Erreichen der Schwelle wird Episode X freigeschaltet; Nutzer kann jederzeit selbst auf „Ansehen“ tippen. Kein Autoplay, keine Ablenkung während Toolaktionen.
5. Angemeldeter Nutzer kann ein privates Profil bearbeiten und, wenn aktiv zugestimmt, einen separaten öffentlichen Anzeigenamen für Rankings setzen.
6. Ko-fi als freiwilliger Unterstützungsweg: Nach tatsächlich verifiziertem Beitrag gibt es innerhalb einer gedeckelten Regel einen kleinen Bonus, ohne dass Nichtzahler story- oder ranglisteseitig benachteiligt werden.

### 3.2 Screens/Komponenten – Scope

| Screen / Komponente | Muss liefern | Nicht liefern |
|---|---|---|
| Tool-Seiten | kleines, stilles Erfolgstoast nach bestätigtem Save/Compute, keine Verschlechterung | Paywall, invasive Dialoge |
| Rewards-Übersicht | XP, Level, Fortschritt, Badge-Vitrine, 10 Episodenkarten | Fantasy-Weltkarte |
| Nutzerprofil | Vorname/Nachname privat; optionales Land und Bild; Bearbeiten, Sichtbarkeit, Nickname | automatische Klarnamenveröffentlichung |
| Rangliste | Teilnehmer opt-in, Pseudonym, validierte XP und gerechte Regeln | sensitive Toolnutzung, Spendenhöhen und private Datensätze |
| Serienbereich | 10 nummerierte Vorschaubilder, Episodenstatus, Video-Player, Untertitel, Transkripte | öffentliches Spoiler-Leak in geschützten Metadaten |
| Einstellungen | Rewards ein/aus, reduzierte Bewegung, Ton-/Untertitelvorgaben, Ranking-Opt-in | Verlust bereits verdienter XP |
| Ko-fi-Hinweis | freiwilliger Link, sachlicher XP-Hinweis, Affiliate/Ko-fi klar getrennt | Druck, täuschende Kaufeinladung |
| Mobile | responsives Kartenlayout und zugänglicher Player | erzwungenes Hochkant/Querformat |

### 3.3 UI-DNA

Erwachsen, klar, technisch hochwertig und markennah. Rewards kann eine etwas dunklere, cineastische Akzentoptik erhalten, **ohne** die eigentlichen Toolseiten umzugestalten. Keine lauten Levelkonfetti-, Baby- oder Glücksspielanmutungen. Beide Originalmaskottchen und identische Wortmarke bleiben unverändert.

## 4. XP-Ökonomie, Badges und Ranking

### 4.1 XP-Fundament

**Vorgeschlagenes Modell, noch zu balancieren:**
- **Echtes Tool-Ergebnis:** einmalige Einführungsgutschrift pro Tool und ausgewählte weitere wiederkehrende, tatsächlich nützliche Erfolge. Geringe Wiederholungs-/Zeitraum-Caps, keine Belohnung für Datenerzeugung ohne Zweck.
- **Erster Nutzungserfolg:** als Startannahme 40 XP pro Tool; **nicht** automatisch 40 XP für jeden Klick. Wiederholungen je Tool unabhängig von Kosten/Anzahl gespeicherter Objekte begrenzen.
- **Sensible Tools:** sichere, freiwillige, neutral formulierte Meilensteine dürfen XP geben. Digitaler Nachlass: keine relevanten Dokumente, Notfall-/Alarmhandlungen oder Todesfalldaten als Incentive. Tiergesundheit: keine Medikation/Impfung/Diagnose als XP-Motor. Bei unlösbarer Datensensitivität nur datenneutrales einmaliges Onboarding-Erfolgssignal.
- **Badges:** Werkzeug-Entdecker, Ordnungsprofi, Pflanzenfreund, Daten-Tüftler, Vielseitig, Profil-Meilensteine; vertrauliche spezifische Badges nur privat. Öffentliche Vitrine darf keine sensiblen Nutzungsrückschlüsse erlauben.
- **Ranking:** Rankings aus validierten XP; Teilnahmeregler aus als Standard, Anzeigename getrennt von echten Pflichtnamen. Keine sinnvollen Anreize für massenhaftes Erzeugen/Verwerfen von Daten. Abuse-/Rate-Limits, periodische und lebenslange Ansichten sowie Gleichstandregeln.
- **Keine gekauften XP-Pakete.** Nach einer erfolgten Ko-fi-Spende können begrenzte Unterstützer-XP vergeben werden – das ist eine Ausnahme, kein Zwang.

### 4.2 Ko-fi-XP – gesonderter Designvertrag

**Nutzerentscheidung:** Ko-fi-Spenden sollen **XP verdienen können**. Noch nicht implementiert, Regeln vor Umsetzung und nach Prüfung aktueller Ko-fi- und Zahlungsdienstbedingungen endgültig definieren.

**Fairness-Vorschlag:** Kleine, nicht nach Spendenhöhe skalierende Unterstützer-Gutschrift, z. B. **25 XP pro erfolgreich verifizierter Spende**, **höchstens einmal pro Kalendermonat und Konto** und **maximal 100 XP pro Jahr**. Diese Werte sind *Designannahmen*, keine veröffentlichten Bedingungen. Auch 1 € darf nicht weniger wert sein als 20 €; kein Stufen- oder Großspender-Ranking. Kein XP für das Öffnen von Ko-fi, Klicks, Versprechen, zurückgebuchte Zahlungen, Test- oder Doppelwebhooks. Gleiche Serienepisoden sind auch vollständig **ohne Zahlung durch Tool-Nutzung** erreichbar. Falls Rankingintegrität oder rechtliche Einordnung dies erfordert, Unterstützer-XP **nur** für das persönliche Level/Profil/Filmunlocks anrechnen und **nicht** für kompetitive öffentliche Ranglisten; finale Entscheidung nach Review. Besser außerdem alternative kostenlose Erfolgswege gleicher XP-Höhe bereitstellen.

**Technische Vorbedingungen:**
- Prüfen, ob Ko-fi tatsächlich sichere Benachrichtigungen/Webhooks/Payment-IDs, Status und Authentifizierung für verifizierte Zahlungen bietet. Nichts erfinden.
- Keine Identitätszuordnung nur durch übereinstimmende sichtbare E-Mail-Adressen, keine freien Meldungen „Ich habe gespendet“ als XP-Beleg. Freiwillige sichere Zuordnung Konto ↔ Zahlungsnachweis nur nach autorisiertem Flow mit klarem Hinweis.
- Signatur-/Token-/Webhook-Schutz nach tatsächlich angebotener Ko-fi-Schnittstelle; serverseitiges dedupliziertes Grant-Ledger, Autorisierung/Replay-Prüfung, ggf. manuelle Nachprüfung.
- Refund/Chargeback/Fraud-/Fehlzuordnungsprozess und Datenschutz-Aufbewahrung/Betroffenenrechte; nicht direkt auf öffentliche Profile „hat gespendet“ schreiben.
- Kein bestehendes Ko-fi-Widget doppelt rendern, keine Preisvergleichs-/Spendendruck-Mechaniken.

### 4.3 Episoden-Schwellen

**Nicht heute fest einzufrieren:** 9 XP-Gates müssen auf tatsächlich erreichbaren XP einer gewöhnlichen Person **ohne Zahlung** beruhen. 12 × 40 XP allein wären nur 480 XP; daher wäre eine Endschwelle von z. B. 1.700 XP ohne belastbare wiederkehrende Tool-Nutzung möglicherweise unfair. Konkrete Schwellen erst anhand eines transparenten Simulationsmodells definieren: (a) drei Nutzungstypen gelegentlich/normal/intensiv, (b) Tool-Nutzen statt Formularmengen, (c) maximale Wartezeit ohne Spenden, (d) freiwillige Nutzung sensibler Tools **nicht** als Pflicht. Episode 1 beim Rewards-Einstieg ohne XP ansehen, Episoden 2–10 an schrittweise höhere kumulative Schwellen koppeln, jede auf kostenlosen Wegen erreichbar. Als Filmzuschauer-Nutzererlebnis sinnvoll: erste drei Folgen relativ früh, später moderater Anstieg, Finale ohne monate- oder jahrelanges Zwangsgrinden.

### 4.4 Daten- und Sicherheitsregeln

Pro Konto serverautoritatives und idempotentes XP-Ledger; Transaktions- oder eindeutig verifizierte Achievement-IDs; Permission Checks und RLS; kein clientseitiger `localStorage` als XP-Wahrheit. Daten von Haushaltsbuch, Nachlass, Tiergesundheit, GPS oder Kontakten nicht ins Gamification-System übertragen. Ausschließlich erlaubte minimal notwendige Metadaten; sensitive Erfolgsursprünge gegenüber öffentlichen APIs verbergen. Reale Konten nicht für Testläufe missbrauchen.

## 5. Tool-Matrix – zwölf sichere Ansatzpunkte

**Wichtig:** Folgende Events sind Konzepte, keine bereits implementierten/wirksam getesteten Rewards. Tatsächliche Funktionspfade und Save-Bestätigungen vor Einbau erneut lesen.

| Tool | Denkbarer echter Abschluss | XP-Schutz | Badge / mögliche Interaktion |
|---|---|---|---|
| Amazon-Wunschlisten | Bestätigte eigene Listenveröffentlichung / sinnvoller Einrichtungsabschluss nur nach Datenschutzprüfung | **Keine XP** für Suche, fremde Profile, Käufe, Amazon-Klicks oder öffentliches Preisgeben persönlicher Daten; ggf. statt Liste lieber neutrales Konto-/Tool-Onboarding | 'Entdecker' ohne Offenlegung persönlicher Listen |
| Haushaltsbuch | Ersten validen Haushaltsbucheintrag nach bestätigtem Speichern | Keine Beträge/Titel/Belege im Rewards-Log; Änderungen nicht farmbar | 'Überblick' |
| Umzugskisten | Erste real gespeicherte beschriftete Kiste | Nicht wiederholbar durch Löschen/Neuanlegen | 'Organisationstalent' |
| Pflanzenpflege | Pflanze mit Gießplan erfolgreich angelegt, genuine Pflege dokumentiert | Nur erste und eng begrenzte unabhängige Folgebestätigungen; keine Streak-Strafe | 'Grüner Daumen' |
| WG-Organisator | Tatsächlich erledigte Einkaufs-/Organisationsaufgabe | Kein XP pro künstlicher Einzel-Aufgabe oder über Fremdmitglieder | 'Teamgeist' |
| Digitaler Nachlass | Sicherer neutraler, bestätigter Vorsorge-Einrichtungsschritt | Nie Testamentdetails, Alarme, Todesfalldaten oder Dokumentenanzahl belohnen; diskret | Privater 'Vorausschauend' oder neutraler Badge |
| Autokosten | Fahrzeug erstellt; sachlich dokumentiertes Wartungsereignis | Keine Kaufbeträge, Kennzeichen oder Mehrfach-Einträge für Punkte | 'Gut vorbereitet' |
| Tiergesundheit | Neutrales, bestätigtes Haustier-/Organisationsprofil | Nie Diagnosen, Medikamentengaben, Impffristen oder Notfallaktionen belohnen | Privater 'Tierfreund' |
| Parkplatz-Merker | Parkvorgang erfolgreich gespeichert | Keine GPS-Übertragung; nicht mehrmals pro Sitzung | 'Orientierung' |
| Verliehene Dinge | Verliehenen Gegenstand bestätigt erfasst; echte Rückgabe später | Keine Kontakt-/Gegenstandsnamen, keine künstlichen Wiederholungen | 'Zuverlässig' |
| Zählerstände | Zählerstand mit gültigem Datum gespeichert; sinnvoller zweiter Messpunkt | Keine Verbrauchswerte oder -höhen nach außen | 'Im Blick' |
| Backform-Rechner | Fachlich valide erste Berechnung mit sichtbarem Rezept-Ergebnis | Kein XP für Reload oder unveränderte Inputs | 'Präzise' |

Alle zwölf Werkzeugtypen zählen zum Fortschrittsangebot, aber keine Handlung mit Sicherheits-/Privacy-Risiko darf ein XP-Zwang werden.

## 6. Die Erwachsenen-Mystery-Miniserie „Das letzte Signal“

### 6.1 Produktion und Ton

- **10 Folgen × ca. 60–90 Sekunden** = ca. 10–15 Minuten Gesamtfilm.
- Bildformat: bevorzugt 16:9 filmisch, responsiver Player, optional vertikale Teaser nur wenn wirtschaftlich sinnvoll; konstante Figurenidentität, glaubwürdige Lichtsetzung/Bewegungen.
- Ästhetik: monochromer/kalter Technologie-Thriller mit gezielten türkis-lila Farbakzenten; düstere atmosphärische Kulissen, subtiler Sound, keine Kindercartoons. **Bestehende zwei Originalfiguren** werden als visuelle Protagonisten stiltreu wiedergegeben, unveränderte Original-PNG-Dateien.
- Handlungsschwerpunkt: Geheimnis, Vertrauen, Zeitwahrnehmung, Verantwortung, falsche Erinnerungen und eine rationale, überraschende Auflösung. Die Maskottchen dürfen süß aussehen, handeln aber als intelligente erwachsene Figuren.
- Erstes Kapitel beginnt **ohne Einleitung** mit dringender Handlungsgefahr (Countdown/Signal), konkreter Frage, klarem Cliffhanger. Bereits **Episode 1 soll frei/sofort sehbar** sein als Qualitäts- und Spannungstest, ohne Veröffentlichung privater Daten.
- Jede Episode muss **eine Frage beantworten und eine neue, stärkere aufwerfen**, statt ausschließlich hinauszuzögern. Keine willkürliche Irreführung ohne späteren Payoff. Finale löst Hauptmysterium vollständig.
- Musik, Stimmen, Effekte und Bildrechte nachweislich geklärt; keine unautorisierten Stimmenklone, keine fremden Film-/Serienfiguren, nur lizenzierte oder eigene Assets. Deutsche Fassung zuerst, englische Untertitel optional nach Qualitätstest.
- Videoproduktion muss die Produktionsmöglichkeiten von ChatGPT Work/verbundenen Generatoren real prüfen. Keine Behauptung, das gesamte Material sei bereits renderbar. Bestandsassets können als **Referenz** dienen, ohne sie zu verändern.

### 6.2 Story-Bible – zehn Beat-Spezifikationen

**Arbeitstitel:** *Das letzte Signal*. Die genaue Story wird im Writers' Room logisch durchgearbeitet, aber das **Spannungsgerüst** ist verbindlich.

1. **Das letzte Signal.** Black Screen, warnende fremde Stimme und ein Countdown vor einem beschädigten Gerät. Ein Protagonist sieht seinen Partner auf einer flackernden Nachricht, die ihn vor einem Schlüssel warnt. **Hook bei Sekunde 1**, Ende: eine dritte Stimme im Raum.
2. **Der unmögliche Schlüssel.** Die seltsame Stimme erweist sich zunächst als zeitversetzter Rest einer Aufnahme. Ein Schlüssel reagiert auf eine Maschine, zu der er nicht gehören kann. **Antwort:** Gerät zeichnet nicht nur Daten auf; **neue Frage:** warum kennt es ein noch nicht geschehenes Ereignis?
3. **Der Beobachter.** Beide entdecken eine unabhängige Überwachungssequenz aus ihrer Zukunft, aber die Aufzeichnung enthält eine dritte Silhouette. **Antwort:** Jemand hat bewusst ein Signal ausgelöst; **Frage:** wessen Zeitlinie?
4. **Die Nachricht von morgen.** Eine Nachricht eines Protagonisten scheint den anderen zu verraten. Bild-/Zeitcode-Manipulation und die Frage nach Erinnerungszuverlässigkeit werden eingeführt. **Antwort:** Die Nachricht stammt tatsächlich von ihnen; **Frage:** welche Entscheidung ist dazwischen geschehen?
5. **Die falsche Entscheidung.** Sie versuchen die aufgezeichnete Zukunft zu vermeiden, lösen damit ausgerechnet die beobachtete Störung aus. **Midseason-Twist:** ihre Gegenwart verursacht die früheren Spuren. Keine beliebige Zeitreise ohne Regeln.
6. **Das zweite Gesicht.** Aufdecken, dass die fremde Silhouette eine fehlerhafte Echtzeitprojektion ist, nicht automatisch der Bösewicht. **Antwort:** Ein Schutzmechanismus erschafft die Beobachtung; **Frage:** wovor schützt er?
7. **Protokoll Null.** Archivdatei legt fest: Das Signal war für den sicheren Stillstand des Systems bestimmt, wurde aber als Rettungsruf missverstanden. **Antwort:** Das vermeintliche Monster ist ein automatisches Schutzprogramm; **Frage:** wer änderte dessen Ziel?
8. **Die verlorene Minute.** Eine 74-Sekunden-Lücke erklärt die widersprüchlichen Erinnerungen. Konkrete, zuvor sichtbare Details (Schlüsselsymbol, Monitor-Zeitcode, Hintergrundgeräusch) erhalten neue Bedeutung. **Antwort:** Eine selektive Aufzeichnung wurde gelöscht; **Frage:** aus Schutz oder Vertuschung?
9. **Noch eine Entscheidung.** Beide müssen entscheiden, ob sie das Originalsignal freigeben oder einen unvollständigen, verifizierten Datensatz senden. **Reveal:** Nicht der vermeintliche Verfolger, sondern das unkontrollierte Kopieren des Signals bedroht ihr System.
10. **Was wirklich geschah.** Ihre früheren Handlungen, Aufnahme, Schlüssel und 74-Sekunden-Lücke werden in einer kausal konsistenten Rekonstruktion erklärt. Sie unterbrechen die automatische Kopierkette und bewahren den sicheren Kern; die Hauptgefahr ist **tatsächlich beseitigt**. Letztes Detail (außerhalb des geschlossenen Haupträtsels) kann Staffel 2 andeuten.

**Konsistenzpflicht:** Vor Produktion Storydiagramm mit festen Sci-Fi-Regeln schreiben; Zeitleiste, „wer weiß wann was“, Ursache/Wirkung, Setup/Payoff für jeden Hinweis und Endauflösung. Die jetzigen Beats sind **Pitch-/Strukturfassung, nicht das fertige Drehbuch**. Keine logischen Widersprüche oder „es war alles ein Traum“-Ende.

### 6.3 Medien-Pipeline und fertige Dateien

| Stufe | Konkrete Lieferobjekte | Abnahme |
|---|---|---|
| Writers' Room | Serienbibel, Figurenpsychologie, Konflikte, 10 Dialogdrehbücher (je 60–90 s), Logikprüfung | glaubwürdige Erwachsenensprache, Episode 1 ab Sekunde 1 packend |
| Art Direction | Film-Styleguide, vorhandene Maskottchen-Referenzen, Umgebung-/Licht-/Farbtests, 10 Key Art Motive | beide Figuren immer eindeutig wiedererkennbar |
| Storyboard / Animatic | Shotlists pro Folge, Beats in Sekunden, Kameraführung, Übergänge, 10 timed Animatics | jede Folge verständlich mit eindeutiger Pointe und Cliffhanger |
| Bild-/Videoerstellung | Filmszenen, konsistente Figuren, visuelle Übergänge, 10 Folgen als finaler Video-Export | keine Flackeridentitäten, beschädigten Hände/Details, Textartefakte |
| Ton / Schnitt | dialogischer Ton, passende Soundeffekte, lizenzierte Musik, Master-Mix | verständliche Stimmen, ausgewogener Pegel, keine Fremdrechte |
| Zugänglichkeit | DE-Untertitel `.vtt`, Transkript, optional EN-Untertitel, Abspielsteuerung | Tastatur, Screenreader, reduzierte Bewegung, kein Autoplay |
| Webbereitstellung | poster thumbnails, transcodierte Videos, private episodenspezifische Delivery, Cache-/Bandbreitenstrategie | stabile Wiedergabe mobil, kein unautorisierter Zugriff auf gesperrte Episoden |
| Endkontrolle | 10 Episoden gegengeprüft, vollständige Storyauflösung, rechtliche und technische Assetliste | keine unvollständige Staffelfreigabe |

**Speicher-Sicherheit:** Ist das Repo öffentlich, sind Videos im Repo **nicht wirklich XP-gesperrt**. Für echte Entitlements vor Freigabe private Storage-Buckets mit kurzlebigen signierten Auslieferungslinks/geschützter Streaminglösung und serverseitigem Entitlement prüfen, einschließlich Kosten/Bandbreite/Caching. Alternativ klar deklarieren, dass XP nur UI-Freischaltung ist und die Medien technisch öffentlich zugänglich sind; **keine falschen Schutzversprechen**.

## 7. Technische Architektur – Entwurf für Codex / Work

**Vor Implementierung tatsächliches Supabase-Schema (Projekt aus README/AGENTS), Website-Architektur, Auth-Seiten und Cloud-Adapter lesen.** Keine Tabellen ohne Schema-Diff und Migrationsplan anlegen.

- Auth / Profile: bestehende Supabase-UID, Pflichtnamen, optionale Länder-/Avatar-URL, Privatsphäre-Einstellungen, Ranglisten-Pseudonym, Profil bearbeiten, Bestandskonten-Migration ohne Datenverlust. Klarnamenpflicht rechtlich prüfen; niemals echte Namen ungefragt auf Ranglisten.
- Achievements-Ledger: minimale fachliche `event_type`-Codes, idempotente serverautorisierte Grants, durchgängige RLS, Rate Limits, schreibgeschützte Client-Ansicht und revisionssichere technische Fehlerzustände. Nie sensible Tooldaten kopieren.
- Total-XP: sicheres Konto-Aggregat, fair gemischte Tool- und Ko-fi-Quellen, dokumentierte Schwellen und Nicht-Spenden-Pfade.
- Badges: Definitionen und Zuordnungen serverseitig, optional public-visibility separate Flag, empfindliche Labels standardmäßig privat.
- Leaderboards: nur opt-in, vom Backend gefilterte öffentliche Felder, zeitliche Kategorien, Konsistenz bei Refund, Anzeigemoderation, vollständiger Opt-out.
- Donations: serverseitige Zuordnung verifizierter Ko-fi-Transaktions-ID, konsistentes doppelsicheres Ledger, keine Zahlungspflicht und kein preisabhängiges XP-Farming.
- Video-Entitlements: `episode_id`/Schwellwerte, nur Auth-UID/XP-berechtigte Auslieferung, sichere Medienlinks, Videos optional erneutes Anschauen ohne erneute XP-Vergabe. Beim Rückgang durch Betrugsbereinigung bereits legitim freigeschaltete Story nicht überraschend sperren; Regel explizit festlegen.
- Frontend: stark entkoppelte Rewards-Komponenten, kein unverhältnismäßiger Bundle-Zuwachs bei bestehenden Tools; Lazy Loading von Player und Medien; Performance-Budget fürs Tool.
- Sicherheit: CSP, Bild-URL-SSRF-/Tracking-Schutz, XSS bei Anzeigenamen, kontrollierte Lese-/Schreibrechte, Kontolöschung/Export; Privacy-Datenflüsse mit technischer Review.
- Monitoring: nur zulässige anonyme/aggregierte Baselines, keine fiktiven Verkäufe, keine Aufnahme privater Toolinhalte.

## 8. Entwicklungsphasen, Abhängigkeiten und Done-Kriterien

| Phase | Ziel und konkrete Arbeiten | Nachweis / Definition of Done | Reihenfolge |
|---|---|---|---|
| **R0 – Re-Audit und Clean Slate** | `main` lesen; sicherstellen, dass alter Universe-Branch weg ist; vorhandene zwölf Tools, Mascots, Ko-fi, Amazon, Login und Supabase inventarisieren. Neue Planung nicht mit altem Fantasy-Prototyp vermengen. | aktueller technischer Bestand; Abweichungs-/Risikoliste, keine Produktionsänderung | 1 |
| **R1 – Product / UX / XP Design** | fertiger Rewards-Featurebrief, kompletter Registrierungs-/Profil-/Ranglisten-/Badge-Flow, 12 fachlich sichere Erfolgskriterien, Ko-fi-Bonus-Vertrag, frühe Episodengates und Fairnesssimulation | abgestimmte Spezifikation, Wireframes, Event-Matrix und überprüfbare Akzeptanzkriterien; Prototypen nur im Dev-Kontext | 2 |
| **R2 – Film-Dramaturgie und Bildsprache** | Serienbibel, Zeitleiste und Geheimnisauflösung, 10 Skripte/Beat-Boards, Film-Lookdev mit originalgetreuen Maskottchen, Video-/Tonkosten und Asset-Lizenzstrategie | 10 fertige Drehbücher + Animatics/Looktests, dokumentiertes Setup/Payoff, Erwachsenenton geprüft | 2 (parallel) |
| **R3 – Auth / Profile / Basis-UI** | gemeinsame kontobezogene Profil-API, private Daten, Registrierung/Bestandsmigration, Profilbearbeitung, Ranglisten-Sichtbarkeit; mögliche Pflichtanmeldung gesondert und rückwärtskompatibel prüfen | Staging-Migrationen, RLS-/Auth-/Privacy-Tests, keine realen Nutzerdaten in Tests | 3 |
| **R4 – Rewards Engine** | idempotente XP-Events, 12 Tool-Adapter, sensible neutrale Events, Level, Badges, Ranking, Opt-out und Anti-Farming | echte Save-/Compute- und Fail-Pfade im isolierten Test; kein XP durch Reload/Manipulation; alle 12 Tools funktionsfähig | 4 |
| **R5 – Ko-fi-XP & Werbung** | Existierende Ko-fi-/Amazon-Funktionen auditieren; verifizierte, gedeckelte Supporter-XP; Hinweise rechtlich/UX prüfen; kein Pay-to-win | erlaubte verifizierte Ereignisse, Refund-/Dublettenfälle, Rankingfairness; keine Testzahlung mit echten Nutzern | 5 |
| **R6 – Filmproduktion** | alle 10 Folgen produzieren, schneiden, vertonen, untertiteln, lizenzieren, transcodieren | komplette Staffel 10/10 in geprüfter Qualität; kein Rest „kommt später“ | parallel ab R2 |
| **R7 – Serienplayer/Entitlements** | Player, Kapitelkarten, serverseitiger XP-Zugang, privater Video-Storage, mobile Bild-/Ton-Performance, Barrierefreiheit | jede Episode zur richtigen Schwelle; keine öffentliche Spoiler-API; keine Autoplay-/Bewegungspflicht | nach R4 + Medien |
| **R8 – Qualität und Sicherheit** | Desktop/mobile E2E für alle 12 Tools, Profile, Leaderboards, Ko-fi, Film; GDPR, RLS, CSP, Lizenz-, Kosten-, SEO- und Accessibility-Prüfung; Defekte beheben | nachvollziehbares QA-Protokoll, offene Risiken dokumentiert, reversible Migrationen, Tests ohne Produktivdaten | nach Integration |
| **R9 – Gesamt-Abnahme-Kandidat** | vollständige Demo im nicht produktiven Kontext, Screenshots und alle 10 Filme; Nutzerführung und Rollout-/Rollbackplan; finale Checkliste | Nutzer kann Gesamtprodukt ansehen und absegnen; keine Einzel-Feature-Teilveröffentlichungen | vor Go-live |
| **R10 – Veröffentlichung** | erst **nach ausdrücklicher Freigabe** kontrollierter Merge, Migration und Live-Check | Produktions- und Sicherheitsprüfungen dokumentiert; final bestätigter Release | gesperrt |

### 8.1 Kritischer Pfad

`R0 → R1 → R3 → R4 → R7 → R8 → R9`. Parallel `R2 → R6 → R7`. Ko-fi-Verifikation `R5` hängt von zuverlässiger Rewards Engine und aktuellen Drittanbieter-Funktionen ab. Story-Player erst dann final, wenn **alle zehn** Folgen fertig sind.

### 8.2 Grobe Aufwandseinordnung – reine Planannahme

Keine belastbare Stunden-/Kostenprognose ohne Work-Tool-Inventar. Videoerstellung, Vertonung und sichere Episoden-Auslieferung sind voraussichtlich die größte Kosten-/Qualitätsunsicherheit. Vor Umsetzung Kostenbudget für Renderdurchläufe, Grafik-/Video-Generatoren, private Medienablage, Transcoding und Bandbreite dokumentieren; Plus/Work-Quoten bedeuten **keine** garantierte Endlos-Hintergrundbearbeitung.

## 9. Review- und Testmatrix

**Sicherheit:** Test Auth-/RLS-Eskalation, Angriffsversuche auf Rewards Events, Replay, Doppelzahlungsbestätigungen, Rückbuchungen, überschreibbare Ranglisten-/Profilfelder, Videolink-/Bucket-Exposition, Kontowechsel, Login-Ausfall und Berechtigungslöschung.

**Fachliches Verhalten:** Kein XP bei fehlgeschlagener Speicherung, unveränderter Rezeptberechnung, Duplikaten, sensibler Alarm-/Medikationsaktion oder fiktiver Ko-fi-Meldung. Die zwölf Tools dürfen nicht langsamer/instabiler werden.

**UX/A11y:** Textkontrast, Tastatur/Screenreader, sichtbare Fokusmarkierung, Untertitel/Transkript, keine erzwungene Animation, mobile Datenübertragung, Dark-Mode-Kontrast und keine manipulative Ko-fi-Platzierung.

**Content:** Die erste Folge zeigt in Sekunden einen echten Hook; die zehnteilige Zeitleiste ist logisch; die Figuren bleiben konsistent; die Zuschauer erfahren je Folge Neues; Finale erklärt das zentrale Rätsel; Ton für Erwachsene.

**Vergleich:** Vorher/nachher sichere Kennzahlen (nicht erfundene) für Task Completion, Nutzerzufriedenheit, Ladezeiten, Opt-in/Opt-out, legitime XP-Vergaben, Episode-Fertigstellungen, Ko-fi-Beitrag soweit überhaupt messbar. No pay-to-win-Fairness zwischen zahlenden und nichtzahlenden Nutzern.

## 10. Vorlage für spätere autonome Work-/Codex-Ausführung

**Konkreter Startauftrag:**

> Setze `docs/TOOLYA-REWARDS-ENTWICKLUNGSROADMAP.md` aus Branch `planning/toolya-rewards-mystery-v1` im Repository `duhrrom11/toolya` vollständig um. Verstehe zuerst die zwölf Toolseiten, bestehende Mascots, Ko-fi/Amazon, Auth und Supabase. Bewahre die kostenlose Kernfunktion und Bestandsdaten. Schaffe ein erwachsenes, fokussiertes XP-/Badge-/Ranking-System ohne Fantasy-Welt, Quests oder Hideout, und produziere eine vollständige hochwertige zehnteilige Mystery-Thriller-Serie. XP für freiwillige verifizierte Ko-fi-Spenden innerhalb fairer Limits sind vorgesehen. Eigene Grafik- und Video-Arbeit und geeignet lizenzierte Open-Source-Komponenten sind erlaubt. Dokumentiere alle Entscheidungen, Tests und Blocker eigenständig. Arbeite auf einem **neuen nicht produktiven Entwicklungsbranch**, nutze verfügbare verbundene Dienste, aber führe **keinen Merge nach `main`, keine Live-Veröffentlichung oder riskante produktive Supabase-Änderung ohne ausdrückliche finale Nutzerfreigabe** durch. Liefere einen in sich fertigen Release-Kandidaten mit zehn Videos, Demo, Testreport, Lizenzliste, dokumentierten Migrationsschritten und Abschluss-Checkliste.

**Keine Hintergrundzusage:** Ein tatsächlicher Work-/Codex-Lauf muss durch die Produktoberfläche gestartet werden. Plugininstallationen, OAuth-Freigaben und Plattformrechte erfordern gegebenenfalls Nutzereingriff. Die Existenz dieser Roadmap startet keine autonome Dauerarbeit. **Keine erfundenen Implementierungsnachweise.**

## 11. Übergabe / Status für neue Chats

- **Altprojekt:** Toolya Universe mit Abenteuerland und „Nebelinseln“ verworfen. Alter Branch `feature/gamification-mascot-levels-v1` laut aktueller GitHub-Branch-Suche nicht mehr vorhanden. PR #312 war geschlossen und nicht gemergt. **Nicht neu aufbauen.**
- **Neu:** Toolya Rewards; 12 Tools, gemeinsames Profil, XP, Badges, opt-in Ranking, verifizierte begrenzte Ko-fi-XP, 10 Mystery-Videos `Das letzte Signal`, Erwachsene.
- **Heute erledigt:** Nur diese Roadmap im separaten Planungsbranch angelegt. Keine Spielfunktionen, keine Filme, keine Supabase-Migrationen implementiert.
- **Zuletzt beim Start lesen:** `AGENTS.md` aus `main` als historische Betriebs-/Sicherheitsinfos, dann **diese neuere Roadmap** als Vorgabe für Rewards. Alte Universe-Roadmaps nur als technische Historie, **nicht** als Produktanforderung übernehmen.
- **Nächster Schritt:** R0 + R1 + R2 gemäß Auftrag, anschließend Implementierung nach gesonderter Beauftragung, unabhängig von früheren Universespiel-Entscheidungen.
- **Go-live:** nicht freigegeben.
