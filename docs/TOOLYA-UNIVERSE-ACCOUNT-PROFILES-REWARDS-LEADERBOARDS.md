# Toolya Universe – P0 Änderungsentscheidung: Konten, Profile, XP für alle Tools, Badges und Ranglisten

**Datum:** 22.11.2026 · **Gültigkeit:** aktuelle Nutzervorgabe; **Konzept/Spezifikation, noch keine Implementierung**  
**Repository/Branch:** `duhrrom11/toolya` / `feature/gamification-mascot-levels-v1`  
**Release:** STRIKT GESPERRT – keinerlei Merge nach `main`, keine Live-Veröffentlichung, keine produktiven Supabase-Änderungen ohne neue ausdrückliche Freigabe.  
**Hierarchie:** Diese neuere Entscheidung ersetzt die widersprechenden Teile aus [Master-Roadmap](TOOLYA-UNIVERSE-GAMIFICATION-MONETIZATION-ROADMAP.md) und [P0-Tool-Matrix](TOOLYA-UNIVERSE-P0-TOOL-MATRIX.md), insbesondere bisheriges Gastkonzept und dortiges XP-Verbot für Nachlass/Tiergesundheit. Andere bestehende Leitplanken – kostenlos, kein Pay-to-win, Datenschutz, vorsichtige Monetarisierung – bleiben verbindlich.

## 1. Neue verbindliche Produktentscheidungen

1. **Jedes Tool soll künftig nur nach Registrierung/Anmeldung verwendbar sein.** Technisch bereits teilweise so im Bestand, aber die Vollständigkeit inklusive öffentlicher Wunschlistenroute und Gamification-Route vor Implementierung prüfen. Öffentliche Marketing-, rechtliche und Hilfeseiten dürfen zugänglich bleiben, sofern nicht gesondert entschieden. Verlinkte veröffentlichte Wunschlisten und öffentliche Suchseiten besitzen derzeit ausdrücklich öffentliche Funktionen: diese sind ein **separater Migrations-/SEO-/Deep-Link-Prüfpunkt**, nicht kommentarlos sperren.
2. **Pflichtfelder bei Registrierung:** Vorname und Nachname; die üblichen Auth-Daten (E-Mail/Passwort oder künftig anderer genehmigter Loginweg) bleiben nötig. **Optional:** Land, Profilbild-URL. Nichts anderes als Pflichtfeld erfinden.
3. **Nach Registrierung automatisch ein kleines privates Benutzerprofil** mit stabiler Auth-UID erstellen. Editierbar: Vorname, Nachname, Land und Profilbild-Link; öffentliche Sichtbarkeit separat einstellbar. Änderungen am Login (E-Mail/Passwort) bleiben eigenes auth-sicheres Verfahren.
4. **XP/Level/Badges und Hideout-Zustand kontogebunden** und geräteübergreifend synchronisierbar designen; keine alleinige `localStorage`-Quelle und kein trust in clientseitige XP-Werte. Bereits erzeugte lokale Prototyp-XP nicht blind ins Konto übernehmen.
5. **Belohnungen ausdrücklich auch für sensible Tools** wie Digitaler Nachlass und Tiergesundheit vorsehen. Belohnt wird eine allgemein bestätigte, freiwillige, sichere Nutzung oder Meilensteinhandlung – **niemals Umfang, Inhalt oder Art privater Dokumente, medizinische Details, Alarmaktionen oder Datenveröffentlichung**.
6. **Badges im persönlichen Profil anzeigen** und spätere Ranglisten anbieten. **Ranglistenbeitritt und öffentliche Profildaten opt-in; standardmäßig privat**, voller Name nie automatisch öffentlich. Keine Anzeige des Nutzungszwecks sensibler Tools auf öffentlichen Badges/Rankings.
7. **Kein Pay-to-win:** keine käuflichen XP/Plätze/Badges, keine Belohnung für Werbung, Ko-fi oder Amazon-Käufe, keine erzwungenen Tages-Streaks.

### 1.1 Spezielle Pflichtangaben für öffentliche Amazon-Wunschlisten (neu bestätigt)

**Verbindliche Nutzerentscheidung:** Beim **Veröffentlichen/Eintragen einer Amazon-Wunschliste** ist bei einer Privatperson **Vorname UND Nachname Pflicht**; bei Organisation/Verein stattdessen **der vollständige Organisations-/Vereinsname Pflicht**. Das sind Angaben für den **öffentlich auffindbaren Wunschlisten-Eintrag**, nicht dieselben Felder wie im **privaten Toolya-Benutzerkonto**. Eine Organisation benötigt bei der Toolya-Kontoanmeldung weiterhin einen persönlich registrierten Kontoinhaber nach dem allgemeinen Profilmodell; der veröffentlichte Listeninhaber darf als Organisation/Verein angezeigt werden. Niemals automatisch den privaten Konto-Vor-/Nachnamen in einen öffentlichen Wunschlisten-Eintrag übernehmen oder auf Ranglisten offenlegen. Vor dem Veröffentlichen ausdrücklich anzeigen, welche Angaben öffentlich sichtbar und ggf. suchmaschinenauffindbar sind. Änderungen/Berichtigungen müssen später möglich bleiben.

**Aus dem Code überprüft:** In `tools/wishes/public.html` gibt es bereits den Umschalter `profileKind` (person/organization), `firstName` und `lastName` mit required für Privatpersonen sowie `organizationName` für Organisationen. Die tatsächlich bedingte Validierung der Felder ist bei späterer Umsetzung in der zugehörigen Formularlogik nachzuprüfen. Das Wunschlistenformular weist derzeit **Land ebenfalls als Pflichtfeld** aus; dies widerspricht **nicht** der neuen Regel **'Land optional im Toolya-Kontoprofil'**, weil es ein separates öffentliches Wunschlistenprofil ist. Der Nutzer hat die Land-Pflicht der Wunschliste hier nicht geändert – nicht stillschweigend entfernen.

## 2. Ergebnis der Bestandsprüfung – nach Code-Lesung im Entwicklungsbranch

- `index.html` prüft beim Klick auf `.ty-tool-link` bereits `supabaseClient.auth.getUser()` und öffnet bei fehlender registrierter Sitzung das Anmeldemodal statt der Tool-Seite. `registerUser()` verwendet derzeit `signUp({ email, password })`, **ohne Vor-/Nachname, Land, Profilbild-Link**.
- `shared/toolya/auth-page-gate.js` prüft für eingebundene Toolseiten vor Freigabe eine echte angemeldete Nicht-Anonym-Session; konkrete Abdeckung aller Tools muss separat geprüft werden.
- `dashboard/account-settings.js` nutzt ebenfalls `signUp(values)` mit E-Mail/Passwort und keinem Profilformular. **Mindestens zwei Registrierungsoberflächen** synchron zu berücksichtigen (Startseite und Dashboard); weitere Formulare/englische UI prüfen.
- `dashboard/index.html` bietet bisher die Konto- und Auth-Einstellungen im Modal, aber kein dediziertes editierbares Benutzerprofil.
- `tools/wishes/public.html` ist laut bestehendem Aufbau eine öffentlich nutzbare Wishlist-Discovery; der Wunsch 'jedes Tool hinter Login' braucht eine **bewusste Migrationsentscheidung** für öffentliche Listen, Profil-URLs, Amazon-Verlinkung, Suchmaschinen und Nutzererwartung.
- `tools/gamification/index.html` besitzt nur einen lokalen XP-Prototyp mit browserseitigem State; nicht als sichere XP-Quelle behandeln.
- Die bestehenden Tool-Funktionen dürfen nicht durch Anmelde-/Profiländerungen beschädigt werden. **Diese Prüfung war nur lesend und kein vollständiges Audit von Supabase-Schema/RLS oder allen UI-Routen.** Kein Schema/Live-Datensatz wurde verändert.

## 3. Registrierung und Profil – UX-Vertrag

### 3.1 Registrierung (Konzept, Pflichtfelder explizit)
Formular: `Vorname *`, `Nachname *`, `E-Mail *`, `Passwort *`, `Land (optional)`, `Profilbild-Link (optional)`. Datenschutzinfos und passende Hinweise, **keine** voreingestellte Zustimmung zu Ranglisten, Marketing oder personalisierter Werbung. Verifizieren und validieren auf Client **und Server**: nicht-leere, angemessene Länge, Unicode-Namen (keine unzulässige Einschränkung auf ASCII), Ländercodes aus standardisierter Liste statt unfreier Herkunftsangaben, URL nur https und nach Sicherheits-/Privatsphäreprüfung. Der Profilbild-Link ist optional, fehlende Bilder erhalten Maskottchen-/neutrales Default-Avatar; Nutzer kann URL später ändern/entfernen.
**Wichtig:** Ob das Verpflichten zu Klarnamen für die Plattformfunktion verhältnismäßig und rechtlich tragfähig ist, vor Freigabe prüfen (DSGVO Datenminimierung Art. 5, Datenschutz durch Voreinstellung Art. 25). **Nicht** behaupten, dass Vor-/Nachname technisch zwingend für jedes Tool erforderlich sind. Die Anforderung ist eine Produktentscheidung, keine belegte gesetzliche Notwendigkeit.

### 3.2 Registrierung technisch robust
- Supabase Auth ist Identitätssystem; Profilzeile referenziert Auth-UID eindeutig.
- Bei Registrierung ohne bestätigte E-Mail/Session Profilanlage erst unter vertrauenswürdigen Bedingungen; kein unsicheres öffentlich ausführbares `SECURITY DEFINER`-API. Falls später DB-Trigger nötig: minimal privilegiert, RLS und Rollback prüfen.
- Keine unvollständigen Profile als fertig melden. Bestehende Konten nach späterer Migration freundlich zu **Vor-/Nachname-Ergänzung** führen; keine bestehenden User löschen/zwangsweise neue Konten erstellen. Priorität: keine Aussperrung, bevor der Übergang funktionsfähig ist.
- Bei E-Mail-Bestätigung, Passwortreset, Sperre und Sessionablauf sichere Fehler- und Wiederaufnahmepfade; bei unterbrochener Profilanlage nachträglich vervollständigen können.
- Startseite, Dashboard, mobile Ansicht und Sprachversionen verwenden **eine** gemeinsame Validierungs-/Profil-API, keine getrennten, widersprüchlichen Formulare.
- Bei nicht angemeldeten Nutzern aus Tool-Deep-Link Rückkehrziel nach Login erhalten, offenen Auth-Fehler verständlich anzeigen.

### 3.3 Editierbare Profilseite (später)
Private Profilübersicht: ausgewähltes Maskottchen, Level/XP, Badge-Vitrine, Welt-/Hideout-Fortschritt; darunter Bearbeitungsbereich für Vorname, Nachname, optionales Land und Profilbild-URL; öffentliche Anzeigenamen-/Sichtbarkeitseinstellungen getrennt. Separate Einstellungen: 'Auf Ranglisten erscheinen' **aus**; 'Öffentliches Profil sichtbar' **aus**; Avatar und Land öffentlich anzeigen **aus**. Alle Profile können privat sämtliche Badges sehen, ohne Leaderboard. Persönliche Daten lassen sich korrigieren/exportieren/löschen entsprechend rechtlicher Aufbewahrungspflichten. Die öffentlich sichtbare Anzeige sollte standardmäßig ein zufälliger/gewählter neutraler Nickname sein; kein echter Name per Default.

### 3.4 Profilbild-Links: Sicherheit
Ungeprüft eingebundene externe URLs erlauben Tracking der Besucher-IP/Referrer durch Bildhost. Vor Nutzung sichere Strategie auswählen: nur datenschutzfreundlich erlaubte Hosts, geprüfter Proxy/Cache nach Einwilligung oder bevorzugt später Upload in kontrollierten Storage; keine internen Netzwerkzugriffe bei serverseitigem URL-Fetch (SSRF), Größen-/Typ-/Redirect-Prüfung, keine schädlichen SVGs, Fallback bei Fehler. Ohne sichere Lösung zunächst nur als **gespeichertes optionales Feld** spezifizieren, nicht ungefiltert auf öffentlichen Ranglisten nachladen.

## 4. Belohnungen für sensible Tools – faire, diskrete Gestaltung

**Neue Nutzervorgabe hebt das alte vollständige XP-Verbot auf**, aber nicht das Schutzprinzip. Kein Freischalten sicherheitsrelevanter Fähigkeiten über XP.

| Tool | Neuer möglicher Meilenstein | XP-Vorschlag | Was ausdrücklich NICHT erfasst oder gezeigt wird | Maskottchen und Hideout | Rangliste |
|---|---|---|---|---|---|
| **Digitaler Nachlass** | Ein freiwillig initiierter Sicherheits-/Vorsorge-Einrichtungsschritt, der durch das zuständige System erfolgreich bestätigt wurde. Der konkret geeignete Schritt ist erst nach Sicherheitsreview auszuwählen; **nicht** Testament, Alarm, Vollmacht, Todesfall, Vertrauensperson, Dokumentinhalt oder eine Anzahl solcher Einträge als Anreiz verwenden. | einmal **40 XP** maximal, wie andere Tool-Ersterfolge; nur **generisches** `tool_milestone_completed`-Signal, ohne Tool-Identität in public/aggregierten Ranglisten; Review auf Risiko von unbeabsichtigten sensiblen Metadaten | Keine Dokumenttitel/Anzahl, Empfänger, Status, Zugangsdaten, Zeitpunkte sicherheitskritischer Aktionen oder Nachlassbezugs-Badges nach außen. Kein Kauf- oder Ko-fi-Prompt. | Ruhiges, respektvolles „Ein Schritt ist abgeschlossen.“; kosmetische neutrale Archivleuchte im **privaten** Hideout, keine grotesken Jubelanimationen. | Nur generischer Gesamt-XP-Wert, keine Information „Nachlass verwendet“. |
| **Tiergesundheit** | Erste erfolgreich angelegte **neutrale Organisationsstruktur** (z. B. Haustierprofil) nach freiwilligem Opt-in und technischer Erfolgsbestätigung; alternativ ein reiner Tool-Erkundungsmeilenstein, falls Metadatenrisiko zu hoch. Keine Belohnung für Behandlung, Impfungen oder Medikamentengabe. | einmal **40 XP** maximal; keine XP pro Krankheitsereignis/Termin/Medikation | Keine Tiernamen, Art/Rasse, Diagnosen, Medikationsdetails, Allergien, Tierarztkontakte, Tierfotos oder Gründe der Nutzung. | Dezente, freundliche Geste; kosmetisches Pfoten-Ornament **privat**, auf Wunsch neutraler Ersatz. | Nur Gesamt-XP; keine Kennzeichnung tiermedizinischer Nutzung. |

**Zusätzlich:** Allgemeines privates Profil darf gesonderte sensible badges standardmäßig nicht öffentlich zeigen. Sensible Metadaten auch nicht über Badge-IDs, öffentliche Sammlungsposition, Echtzeitaktivität, Ranglistenfilter, Verlauf/Feed oder API-Antwort ableiten lassen. Nicht mehr XP für riskantere oder besonders intime Schritte. Im Idealfall nur privacy-preserving achievement grant mit minimaler Datenmenge; vor Umsetzung Threat Modeling und Prüfung, ob überhaupt eine serverseitige Zuordnung zum sensiblen Tool nötig ist. Bei tatsächlichen Sicherheitsbedenken XP nur für eine **neutrale Onboarding-/Sicherheitsfunktion** und nie für private Inhalte. **Keine Spendenaufforderung während sensibler Abläufe.**

## 5. Globale XP, Badges und Ranglisten

### 5.1 XP-Regeln (konzeptionell, keine reale Vergabe)
- **40 XP** für ersten bestätigten, sinnvollen, freiwilligen Meilenstein eines jeden der 12 Tools, *auch* sensible Tools mit obigen Grenzen. **15 XP** für wenige zugelassene zusätzliche Aktionen, falls unbedenklich und nicht farmbar. Keine Pflicht, sensible Tools zu öffnen, um das höchste Level oder die Hauptgeschichte zu erreichen.
- Einmaligkeit über serverseitig erzeugten eindeutigen Schlüssel; Autorisierung anhand bestehender Sitzung; keine Frontend-Punkteberechnung als Kontowahrheit. Ein erfasstes Werkzeug darf weder durch beliebige Klicks noch durch Löschen/Neuanlegen XP vervielfachen.
- Fairer Ausgleich: für alle Story-/Level-Grenzen mehrere alternative **nicht-sensitive** Fortschrittswege bieten. **Wichtig:** Wegen verpflichtender Anmeldung keine anonymen dauerhaften XP-Konten; nur optionaler öffentlicher Marketing-Preview ohne Tool-Nutzung.
- Der vorhandene lokale 50-XP-Entdeckungsprototyp ist **nicht vertrauenswürdig** und wird erst nach gesonderter Migration/Neuspezifikation abgelöst; keine automatische Übertragung.
- Spenden, Affiliate-Käufe, Werbeklicks, finanzielle oder gesundheitliche Lage beeinflussen niemals Punkte oder Spielfortschritt.

### 5.2 Badges
- **Private, toolnahe Badges**: 'Ordnungshüter' (Umzug), 'Grüner Daumen' (Pflanzen), 'Rezept-Tüftler' (Backen), 'Vorausschauend' (neutrale Vorsorge) und 'Tierfreund' (Organisation) – die beiden letzten nur im **privaten** Profil und nur nach aktiver Anzeigeentscheidung öffentlich; besser für öffentliche Ansichten durch generische Erfolge ersetzen.
- **Öffentlich sichere Badges**: 'Entdecker', 'Tüftler', 'Sammler', 'Toolya-Legende' aus aggregiertem Fortschritt ohne Rückschluss auf konkrete sensible Tools. Kein 'erkrankt', 'Nachlass abgeschlossen' oder vergleichbare intime Aussagen.
- Benutzer entscheidet pro Badge (soweit freigabefähig) ob es auf öffentlichem Profil erscheint; sensiblere Badges nie in standardmäßigen Shared-Assets/OG-Bildern, Suchmaschinen oder öffentlichen Datenendpunkten.

### 5.3 Ranglisten, freiwillige Teilnahme
- Entwurfsansichten: Gesamt-XP, Monatserfolge, reine Entdecker-Badges; keine 'wer hat mehr Geld eingetragen', 'wer hat Medikamente dokumentiert' oder 'wer hat den Nachlass vervollständigt'.
- Standard: **nicht teilnehmen**, privates Profil, neutraler Anzeigename. Aktivierung ausdrücklich, granular und rückgängig machbar; öffentliche Profile nicht für Nutzer ohne Anmeldung indexieren, je nach Sichtbarkeitsentscheidung.
- Bei Teilnahme: Nickname/neutraler Avatar; niemals standardmäßig Vor-/Nachname, E-Mail, Land oder externe Bild-URL. Land für Länderranglisten nur mit **separater** aktivierter Sichtbarkeit, ansonsten keinerlei Herkunftsfilter.
- Ranglisten sollten eher wöchentlich/monatlich freiwillige gleichberechtigte Kategorien und persönliche Fortschritte als globalen reinen XP-Wettkampf anbieten; keine unbegrenzten Frequenzbelohnungen. Fairness-/Missbrauchsfilter und Anzeigemoderation notwendig.
- Opt-out entfernt öffentliche Zeile/Bild ohne den privaten XP-Kontostand zu löschen; Nutzer kann Profil und Sichtbarkeit später bearbeiten.

## 6. Datenmodell / Rechte (Entwurf, keinerlei SQL angewendet)

**Vor Erstellung tatsächlichen Supabase-Schema-Inventar prüfen, bestehende User/Tabellen/Policies wiederverwenden.** Einzigartigkeit, RLS, Datensparsamkeit und Server-Autorität sind wichtiger als Tabellennamen:

- `profiles` / `player_profiles`: `user_id uuid PK auth.users(id)`, `first_name` Pflicht, `last_name` Pflicht, `country_code` nullable, `avatar_url` nullable, `public_handle` nullable/unique, `leaderboard_opt_in boolean default false`, `public_profile_opt_in boolean default false`, `show_country boolean default false`, `created_at`, `updated_at`. PII und öffentliche Felder besser **in getrennten Tabellen/Views mit `security_invoker`** bzw. expliziten sicherheitsgeprüften Endpunkten halten, damit Auth-Nutzer nicht alles lesen.
- `xp_events` / `achievement_ledger`: `id`, `user_id`, `event_code`, `source_idempotency_key`, `points`, `created_at`; bei sensiblen Tools nur minimal zulässige generische Ereignisse, ideal ohne öffentlich erkennbare Tool-Referenz. Clients dürfen nicht selber XP-Gutschriften schreiben.
- `badges` (Katalog), `user_badges` (Besitz, Sichtbarkeit, Zeitpunkt); optional `world_progress`, `hideout_layouts`; getrennte Anzeige-API für Ranglisten.
- `public_leaderboard`: nur opt-in Mitglieder, bereits validierte öffentliche Felder und aggregierte XP, **ohne** sensitive Event-/Badge-Daten. Zugriffe streng begrenzen, RLS sowie `GRANT`/Views und Daten-API-Exposition gesondert prüfen; keine automatisch öffentliche `profiles`-Tabelle.
- Nur zulässige Auth- und Identitätsprüfungen; niemals `user_metadata` für Berechtigungen verwenden. Profiländerung kontrolliert durch owner-only update; ledger append durch geschützten serverseitigen Prozess.
- `avatar_url` nicht unkontrolliert auf beliebigen öffentlichen Seiten einbinden. Account-Löschung, Datenexport, Aufbewahrung, Einwilligungswiderruf und Moderation spezifizieren.

## 7. Iterative Reihenfolge, neue Abhängigkeiten

**P0-A – Kontoprofil / Registrierungs-UX-Spezifikation** (diese Datei): Pflichtfelder und Übergang bestehender Accounts, URLs/Privatsphäre, editierbarer Profilbereich, Leaderboard-Konzept dokumentiert. **Status Konzept erfasst; keine funktionierende Umsetzung.**

**P0-B – Einmalig notwendiges Audit vor späterem Code:** Gesamtinventar Auth-Flows auf Startseite, Dashboard, englischer Oberfläche, allen zwölf Tool-Routen und insbesondere öffentlicher Wunschlisten-Suche; tatsächliches Supabase-Profil-/RLS-Schema **read-only** prüfen; Datenschutz-/Impressums-/Einwilligungsabläufe und Pflichtnamen rechtlich prüfen; Profilbildhost-Sicherheit klären.

**P1 – Konsistente Anmeldung und Profil-Migration (Entwicklung, noch nicht beauftragt):** Zuerst gemeinsames Validierungs-/Backend-Profilmodell; dann alle Registrierungsformulare; bestehende Nutzer durch sichere Profilergänzung; editierbare Profilseite; registrierte Sessions und Deeplinks. Kein abruptes Aussperren von Bestandsnutzern, keine Änderung an `main`.

**P2 – Konto-gestützte XP + sensible Safe-Events (Entwicklung):** Server-Autorität, idempotente Grants, sichere Badges, opt-in Hideout, sichere Nachlass-/Tiergesundheitseinbindung. Detaillierte Events erst nach Sensitivitäts-Review final.

**P3 – Profile/Ranglisten (Entwicklung):** private Badge-Vitrine, opt-in öffentlichen Nickname, gefilterte Aggregate, Sperr-/Moderationsoptionen, Pseudonyme, Null-PII-Leaks, Opt-out.

**P4 – Universe-/Affiliate-/Ko-fi-Piloten:** weiterhin keine gekauften Punkte, keine Werbung im sensiblen Flow. Ausgangspunkt P0-Tool-Matrix.

**P5 – Qualität, Recht, Security, Migration, Tests:** DSGVO Datenminimierung (Art. 5), Datenschutz durch Voreinstellungen (Art. 25), vollständiger RLS-Audit, Migrations-/Rollbackproben mit synthetischen Testdaten außerhalb Produktion; Nutzerdaten unverändert.

**Release-Gate:** ausschließlich neue ausdrückliche Freigabe. Kein Merge/Deploy/Prod-DB ohne Freigabe.

## 8. Entscheidungen vs. offene Prüfungen

**Vom Nutzer festgelegt:** Pflichtanmeldung für alle Tools, Vor-/Nachname Pflicht bei Registrierung, Land/Profilbild-Link optional, editierbare Profile, XP/Badges in Profilen, Ranglisten, Belohnungen auch für sensible Tools.

**Als sicherer Vorschlag, noch zu genehmigen/prüfen:** Public Rankings opt-in und mit Nickname statt Klarnamen; konkret 40/15 XP; sensible toolneutrale Events; Sichtbarkeit pro Badge; Datenschutz/Serverarchitektur; Länder-Ranglisten; Migration der bisherigen öffentlich zugänglichen Wishlist.

**Offen:** tatsächliche bestehende Profile/Supabase-Tabellen; genaue Erfolgshandlung der Nachlass-App; Rechtsprüfung der Pflicht-Klarnamen; externe Avatar-URL-Sicherheit; genaue Abdeckung aller Tool-Auth-Gates; öffentliche Wunschlisten bleiben weiterhin öffentlich suchbar oder künftig nur für eingeloggte Besucher? Vor Umsetzung sorgfältig entscheiden, ohne bestehenden öffentlichen Link- und SEO-Nutzen still zu zerstören.

## 9. Übergabe für neue Chats

1. `AGENTS.md` und **Master-Roadmap**, danach **dieses Dokument** und die **P0-Tool-Matrix** lesen. **Neueres Dokument ersetzt alte Regeln:** Anmeldung künftig Pflicht, sensible Tools belohnbar.
2. Entwicklungsbranch lesen; aktuelle Auth- und RLS-Möglichkeiten auf Ist-Zustand überprüfen; keine Schlussfolgerung aus einem alten Chat ohne Code-Abgleich.
3. Nur beauftragte Konzept-/Feature-Arbeit und ausschließlich nicht-produktive Branches. **Keine Main-Merges, Deployments oder Produktiv-DB-Änderungen ohne ausdrückliche Freigabe**.
4. Bericht mit Datum, commit/branch, Dokument- oder Codeänderungen, Tests, noch offenen Risiken, Live-Status.
5. Nicht einfach `0 XP` für Nachlass/Tiergesundheit aus alter P0-Matrix übernehmen; ab jetzt sichere, generische, bestätigte Meilensteine **vorgesehen**. Keine Privatinhalte/gesicherten alarmbezogenen Schritte für XP auswerten.

## 10. Quellen und rechtliche Notiz

EU-Datenschutz-Grundsätze: Verordnung (EU) 2016/679, Artikel 5 und Artikel 25; amtlicher Gesetzestext: https://eur-lex.europa.eu/eli/reg/2016/679. Diese Notiz ist eine technische/produktseitige Risikoplanung, keine verbindliche Rechtsberatung.
