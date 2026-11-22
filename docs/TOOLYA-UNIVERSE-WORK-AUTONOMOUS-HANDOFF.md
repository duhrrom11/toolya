# TOOLYA UNIVERSE – Autonomer Produktionsauftrag für ChatGPT Work / Codex

**Nutzerentscheidung:** 22.11.2026 · **Status:** Verbindlicher Umsetzungsauftrag für einen später explizit gestarteten Work-/Codex-Lauf. **Dieser Commit startet keine Hintergrundausführung.**  
**Repository:** `duhrrom11/toolya` · **Arbeitsbranch:** `feature/gamification-mascot-levels-v1` · **Livesystem:** `https://toolya.app` aus `main`.  
**Hauptauftrag:** Konzipiere, gestalte und entwickle **Toolya Universe** bis zu einem **vollständig prüfbaren, integrierten Release-Kandidaten im Entwicklungsbranch**, bevor du den Nutzer wieder mit einem Gesamtpaket zur Abnahme befasst. **Nicht eigenmächtig veröffentlichen**. Vor dem finalen Absegnen weder Merge nach `main`, GitHub-Pages-Live-Release noch produktive Schema-/Dateneingriffe, die das Livesystem gefährden.

## 1. Arbeitsautonomie und Freigabe

Der Nutzer wünscht **keine laufenden Zwischenentscheidungen oder kleinteiligen Rückfragen**. ChatGPT Work (alternativ Codex) darf für die Entwicklung innerhalb seiner tatsächlichen technischen Rechte und Laufzeit:
- die gesamte kreative und technische Planung selbstständig vervollständigen und begründete Produktentscheidungen treffen;
- bestehende Dokumentation prüfen und neue Architektur-, UX-, Story-, Quest-, XP-, Badge-, Ranglisten-, Sicherheits-, Datenschutz- und Monetarisierungskonzepte vollständig entwickeln;
- Code, Tests, CI, Design, Grafiken, neue Bilder, Illustrationen, Sprite-Atlanten, Animationen und kurze Videos/Clips erstellen, soweit die jeweiligen Werkzeuge vorhanden und erlaubt sind;
- in GitHub nach passenden offenen Repositories und Beispielen recherchieren, geeignete Komponenten wiederverwenden **nach Prüfung von Lizenz, Attribution, Wartbarkeit, Sicherheit und Lieferkette**; keine ungeprüften Fremdabhängigkeiten;
- die bereits verbundenen GitHub-, Supabase-, Figma-, Analytics-, Ahrefs-, OpenSEO- und anderen hilfreichen Tools **nach tatsächlicher Verfügbarkeit** nutzen;
- eigene nicht-produktive Branches, Commits und Draft-PRs anlegen und die Arbeit wiederholt prüfen/verbessern;
- den Release-Kandidaten selbst intern fertigstellen, mit verständlicher Demo, visueller Abnahme, Dokumentation, Testnachweisen und klarer Rest-Risikoliste;
- **bei fehlendem Tool, fehlenden Credentials, erforderlicher Drittanbieter-Bestätigung, Plugininstallation, Produktivfreigabe oder unüberwindlicher Sicherheitsgrenze** nicht so tun, als sei die Aktion erfolgt. Solche Fälle dokumentieren und weiterarbeiten, soweit möglich.

**WICHTIG:** Eine Zustimmung des Nutzers zu Plugin-Nutzung ist keine technische Installation oder Verbindung. Neue Plugins/Connectoren, Account-Berechtigungen und externe Autorisierungsdialoge können eine **explizite Aktion des Nutzers** erfordern und dürfen nicht als automatisch installiert bezeichnet werden. Bereits verbundene Plugins sinnvoll verwenden. Eine reguläre Chat-Antwort startet nicht automatisch Work, einen Dauerdienst oder Hintergrundausführung. Ein Work-Lauf muss tatsächlich durch die Produktoberfläche gestartet werden und unterliegt deren Laufzeit-/Berechtigungsgrenzen.

## 2. Bevorzugte Projektentscheidung und letzte Instruktionen

Die hier aufgeführten jüngeren Entscheidungen haben Vorrang vor abweichenden älteren Konzeptnotizen:
1. **Name:** Arbeitstitel `Toolya Universe`; die Welt **DARF NICHT „Werkstätten“ heißen**. Auch „Die zwölf Werkstätten“ ist verworfen. Fantasievolle Welt-/Regionen-/Ortsnamen autonom entwickeln.
2. **Weltstruktur:** Tool-inspirierte fantastische Orte statt eines nach Tools verkleideten Menüs; 12 bestehende Tools bilden die anfänglichen thematischen Inspirationspunkte, die Welt bleibt für künftige Tools erweiterbar. Reiz: Erwachsene, Cozy Fantasy, Geheimnisse, Humor, optional leichte Uhrwerk-/Erfinder-Ästhetik. Namen, Story und Design für einen unverwechselbaren Gesamtstil professionell finalisieren.
3. **Bestehende Maskottchen:** exakt die zwei festgelegten Charakteridentitäten, türkis-weiß und lila-creme, Benutzer wählt. Original-PNGs nie verändern; Auswahl auf Header/Footer/Tools/Hideout konsistent. Gleiche Toolya-Wortmarke in Header und Footer. Bestehende Header/Footer/Hauptseite so weit wie möglich erhalten.
4. **Spielwelt:** Lebendiger Begleiter mit Persönlichkeit und Reaktionen, persönliches Hideout, dekorativer Ausbau, Weltkarte, Abenteuer, Storykapitel, Überraschungen, seltene Animationsmomente, Geheimnisse, Sammlungen und langfristige Motivation – **ohne** Streak-Zwang, Lootboxen, pay-to-win oder emotionalen Druck.
5. **Tools:** Weiterhin zwölf bestehende kostenlose Alltagstools mit vollem Nutzen; sie sind das Herz der Plattform. Fortschritt aus bestätigten sinnvollen Erfolgen, nicht aus Klicks, Käufen oder Spenden. Auch sensible Tools (Digitaler Nachlass, Tiergesundheit) **dürfen respektvolle, datensparsame Meilenstein-Belohnungen** vergeben; keine Intim-/Gesundheitsdaten oder kritischen Notfall-/Sicherheitsaktionen zur Gamification heranziehen.
6. **Konto:** Später für **alle Tools verpflichtende Registrierung/Anmeldung**. Bei Kontoerstellung **Vorname und Nachname Pflicht**, **Land und Profilbild-Link optional**. Profil später vollständig editierbar; XP, Badges, Level und Fortschritt gehören zum Konto und sind geräteübergreifend verfügbar. Öffentliche Rangliste nur **freiwilliges Opt-in**, öffentlich Anzeigename/Avatar getrennt von privatem echten Namen. Die Pflicht echter Namen rechtlich/datenschutzseitig prüfen.
7. **Amazon-Wunschlisten:** **Bei öffentlich eingetragenen Listen für Privatpersonen Vor- UND Nachname Pflicht; für Organisation/Verein stattdessen Organisationsname Pflicht; Land für diese Wunschlisten weiterhin Pflicht.** Private Kontonamen nicht ungefragt veröffentlichen. Bestehende Wishlist-Suche, veröffentlichte URLs, Amazon-Importer und Partnerlinks schützen. Den Widerspruch „alle Tools hinter Login“ vs. bisher öffentliches Wishlist-Verzeichnis bewusst UX-/SEO-/Privacy-sicher lösen, ohne funktionierende Features heimlich zu zerstören.
8. **Einnahmeziel:** kleines nachhaltiges Nebeneinkommen für Betreiber durch **Amazon PartnerNet** und **Ko-fi**, später eventuell freiwillige Mitgliedschaft, digitale Downloads, klar gekennzeichnete Partnerschaften. Keine Werbung als XP-Auslöser; kein Pay-to-win, keine gekauften Vorteile; freies Tool-Ergebnis zuerst. Partnerbedingungen und rechtliche Kennzeichnung prüfen, keine Umsätze versprechen oder simulieren.
9. **Toolya-Nachlass/Supabase:** Bestehende Sicherheitsgrenzen, RLS, Notfall-E-Mail-Fail-Closed, echte Nutzer-/Produktionsdaten schützen. Keine Testdatensätze in Produktion. Für notwendige neue Daten-/Auth-Strukturen Staging/Migrationen mit Sicherheitsreview vorbereiten und testen; vor produktivem Ausführen und vor dem finalen Release ausdrücklich absegnen lassen.
10. **Freigabe-Gate:** Nutzer will fertiges Produkt **erst am Ende prüfen und absegnen**. Das ist keine Freigabe, vorab live zu stellen. Arbeit im Entwicklungsbranch, Release-Kandidat + Demo + Testreport zur Entscheidung. Ein später ausdrücklich freigegebener Merge/Deploy kann dann separat erfolgen.

## 3. Zwingend zuerst lesen (exakte Quellen)

1. `AGENTS.md` (jüngere Hinweise priorisieren)
2. `docs/TOOLYA-UNIVERSE-GAMIFICATION-MONETIZATION-ROADMAP.md`
3. `docs/TOOLYA-UNIVERSE-P0-TOOL-MATRIX.md`
4. `docs/TOOLYA-UNIVERSE-ACCOUNT-PROFILES-REWARDS-LEADERBOARDS.md`
5. `docs/TOOLYA-MASCOT-UNIVERSE-WORK-ROADMAP.md` + `docs/TOOLYA-RELEASE-STATUS.md` **nur als historische Bestands- und technische Referenz** – alte Freigaben für frühere Releases gelten nicht für Universe.
6. `README.md`, aktuelle Branches/Commits/CI, alle 12 realen Toolrouten, aktuelle Supabase-/Auth-Implementierung und Bild-/Lizenzbestände.

Dokumentiere den tatsächlichen Ist-Zustand und gehe nicht davon aus, dass ältere Roadmap-Mockups bereits umgesetzt wurden. Der vorhandene Gamification-V1-Prototyp vergibt Browser-Klick-XP; **nicht sicher oder produktionsreif**. Zukunft: vertrauenswürdige kontobezogene Eventvergabe.

## 4. Zu erstellende Endlieferungen – nicht nur ein Plan

**A. Kreativer World Bible:** finales Weltthema und Weltname (ohne „Werkstätten“), Story, Charakterrollen/Dialogstimmen beider Original-Maskottchen, 12 Tool-inspirierte Orte mit zusammenhängender geografischer und erzählerischer Logik, Navigation, 1–3 vollständige Kapitel inklusive Quests und Rätsel, spätere Erweiterbarkeit.

**B. Designsystem & Medien:** Moodboards, Stilrichtlinien, Farb-/Typography-/Asset-Tokens mit konsistenter Wortmarke; finalisierte responsive UI-/UX-Flows für Website, Tool-Hero, Registrierung, Profile, Ranglisten, Badge-Vitrine, Hideout, Landkarte, Aufgaben, Ko-fi/Affiliate; neue lizenzkonforme Original-Assets beider Maskottchen (nicht die genehmigten Original-PNGs überschreiben), auf Mobilgeräten performant, reduzierte Bewegung und keine zwingende Audio-/Videoausgabe. Kleine Videos nur dort, wo sie tatsächlich etwas verbessern; Alternativen für Stille/Bewegungsreduktion.

**C. Konten/Profil:** Migrationssichere einheitliche Registrierung auf allen vorhandenen Oberflächen, Pflichtnamen, optionale Länder-/Avatar-URL, E-Mail-Validierung, Profilbearbeitung, Verifizierung, Privacy-Optionen, sichere Auth für alle Toolrouten, vorhandene Konten/Deep-Links erhalten; öffentliches Wishlist-Verzeichnis separat prüfen.

**D. Spielkern:** account-basiertes idempotentes XP-/Achievement-Ledger, verlässlich an echte 12 Toolaktionen gekoppelt, vertrauliche sensible Meilensteine, fünf oder sinnvoll ausbalancierte Level, Badges, Leaderboard opt-in, Mascot-Persönlichkeit, Hideout und Welt/Story mit persistentem, privatem Zustand und sinnvoller Anti-Farming-Logik; kein Pay-to-win.

**E. Monetarisierung:** auditierte bestehende Amazon- und Ko-fi-Module erhalten; kontextbezogene, klar gekennzeichnete Angebote nach kostenfreiem Tool-Ergebnis; keine Datenverwertung sensibler Eingaben, keine Belohnung für Kauf/Spende/Ads; realistische Daten-/KPI-Strategie für freiwillige Unterstützung ohne Dark Patterns.

**F. Qualität & Abnahme:** Security-/RLS-/GDPR-/CSP-/Privacy-/Accessibility-Review, saubere Lizenzliste fremder Komponenten, reproduzierbare Tests, Desktop-/Mobile-Browserprüfungen, Performance/SEO, wiederholbar importierbare Datenmigrationen und Rückrollkonzept, Demo in geeigneter **nicht öffentlicher** Vorschau, Screenshots/GIFs/kurze Clips soweit sinnvoll; keine Behauptung von Tests, die nicht gelaufen sind.

**G. Dokumentation/Übergabe:** aktualisierte Master-Roadmap, Architekturentscheidungsliste, verifizierte Dateipfade/Commits, Installations-/Build-/Entwicklungsanweisungen, Featurematrix und Akzeptanzkriterien, Migrations- und Release-Checkliste, Status „fertig / offen / blockiert“, abschließende Nutzer-Abnahmeübersicht.

## 5. Operativer selbstständiger Arbeitsplan

**W0 – Audit:** GitHub-/Datei-/Teststatus, tatsächliche Login-Gates und Bestand, Security, externe Richtlinien, Bild- und Markenassets, Plugins prüfen. Lücken dokumentieren, ohne den Nutzer mit Routinefragen aufzuhalten.

**W1 – Vollständige Produktkonzeption:** World Bible und tragfähige Bildsprache festlegen, 12 Orte mit Tools verknüpfen, Mobile-/Desktop-Journeys, Story-Pacing, Monetarisierung, Privacy, XP/Ranglisten final entscheiden.

**W2 – Design-/Assetproduktion:** Designsystem, UI-Komponenten, Originalbildvarianten, Bewegungen, optionale kurze Medien, Prototyp-Screens; keine Änderung der acht Original-PNGs.

**W3 – Implementierung im nicht produktiven Branch:** Konto/Profile/RLS-Migrationen als **reviewbare Skripte/Staging** und UI, sicherer Fortschritt, Badges, Leaderboard, Hideout, Karte, Story, Tool-Integrationen, Affiliate/Ko-fi, responsive und zugänglich.

**W4 – Integration/QA:** 12 Toolflows, private sensible Aktionen, Gast-/Login-Redirect, Profildatenmigration, Zahlungsempfehlungen, Browser, Mobil, Fail-Closed, Security, Privacy, Tests, visuelle QA, Defekte autonom beheben.

**W5 – Fertiger Release-Kandidat:** alle Komponenten im Entwicklungsbranch, Draft-PR ohne Merge nach `main`, private Demo oder lokal reproduzierbare Vorschau, dokumentierter Teststatus, nötige einmalige externe Freigaben/Secrets/Produktiv-Migrationen als klar formulierte **Abnahme-Gates**.

**W6 – Nur nach Nutzer-Absegnung:** finaler Releaseplan und separater von Nutzer freigegebener Publish-Schritt. Sonst keine Live-Änderung.

## 6. Akzeptanz- und Betriebsgrenzen

- **Keine Rückfragen für alltägliche Design-, Story-, Code- oder Buildentscheidungen**; selbst begründet entscheiden. Nutzer soll idealerweise nur den finalen Release-Kandidaten prüfen.
- Nicht vorgeben, in einer nicht laufenden Session, ohne gestartetes Work oder ohne Autorisierung weitergearbeitet zu haben. Bei Tool-/Runtimelimits transparent echten Status im Repo halten.
- Benötigt ein Plugin eine User-Autorisierung oder neue Installation, diese nicht umgehen. Schon verbundene Integrationen nach Berechtigungen benutzen.
- Nur minimale Tests, aber alle kritischen Risiken gezielt prüfen; niemals reale Nutzer- oder Notfallaktionen zu Testzwecken auslösen.
- Bei unvermeidlichen Blockern fertige nicht blockierte Komponenten trotzdem liefern; keine Fantasie-Abnahme.
- **Letzter Schritt vor Nutzerkontakt:** selbstständige Konsistenzprüfung der gesamten Website, aller 12 Tools, Accounts, Maskottchen, Ranklist/Badges, Lore, Assetlizenzen, Monetarisierungsdisclosures und Release-Beschränkungen.

## 7. Wichtig für jeden neuen Chat / Work-Run

**Neue, übergreifende Priorität:** Dieser Work-Auftrag ersetzt den bisherigen Zustand „nur Konzeptarbeit, noch keine Implementierung“ **für einen tatsächlich gestarteten Work-/Codex-Entwicklungslauf**. Er erlaubt eigenständige Entwicklungsarbeit, aber **keine Live-Freigabe oder riskante Produktionsdatenänderungen**. Der Nutzer wünscht selbstständige Fertigstellung bis zum finalen Review und möglichst keine laufende Beteiligung. Der Name „Werkstätten“ ist ausgeschlossen.

Beim Start aktualisiere zuerst eine fortlaufende Projektstatusdatei mit überprüfbaren Fakten, anschließend Plane/Entwickle/Teste/Verbessere bis zum fertigen RC. Nach jeder Etappe Commit und Statusnachweis, ohne die Arbeit nur als immer neue Pläne enden zu lassen. Kein Merge nach `main` bis zur Schlussabnahme.

**Endabgabe an Nutzer:** „Toolya Universe – komplett prüfbarer Release-Kandidat“ mit Branch-/PR-Links, Demo, kurzer Produktführung, Visuals, Tests, Lizenz-/Privacy-Checkliste, notwendigen endgültigen Freigaben. **Nur tatsächliche Ergebnisse behaupten.**
