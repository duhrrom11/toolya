# Toolya Rewards V1 – Detailregelwerk, Balancing und Abnahmekriterien

**Stand:** 23.11.2026 · **Status:** belastbare Konzeptspezifikation (noch **keine** Programmierung)  
**Gültig zusammen mit:** [V1-Masterplan](TOOLYA-REWARDS-V1-XP-KOMPETENZEN-BADGES.md). Diese Detailfassung konkretisiert die vorläufigen Werte.  
**Scope:** Ausschließlich **XP, Kompetenzpunkte (KP) und Badges**. Keine Ranglisten, Videos, Minispiele, Ko-fi-XP, zusätzlichen Levelsysteme, Streaks oder Abenteuerwelt in V1. Nutzer hat die erste Ausbaustufe ausdrücklich begrenzt.

## 1. Produktversprechen

Toolya belohnt **nachvollziehbar erledigte, tatsächlich sinnvolle Aufgaben**. Erwachsene erleben kleine Erfolge und sehen ihren persönlichen Fortschritt, ohne Spielpflicht, künstlichen Wettbewerb, Nutzungsdruck oder private Daten preiszugeben.

**Unterschied der drei Elemente:**
- **XP:** persönliche Summe aller anerkannten Tool-Erfolge – ohne zusätzlichen Levelbaum.
- **KP:** persönliche fachliche Teilfortschritte in fünf Kompetenzkategorien; keine echte Qualifizierung, kein benotetes Profil.
- **Badges:** einmalige, dauerhaft sichtbare Meilensteine – kein Echtgeldwert, keine kaufbaren Vorteile.

**Kontogrundsatz:** Rewards erfordert für geräteübergreifende Zuordnung ein vorhandenes Konto; die bestehenden Tools und öffentliche Seiten dürfen durch V1 nicht unbeabsichtigt hinter neue Login-Gates geraten. Wer unangemeldet einen öffentlichen Bereich nutzt, bekommt dort keine XP-Gutschrift, aber weiterhin den bisherigen Toolnutzen. Vor Umsetzung den tatsächlichen Auth-Stand aller zwölf Tools prüfen.

## 2. Vorschlag: Zahlenmodell für eine erste Test-Balance

Dieses Modell ist **explizit ein Design-Ausgangspunkt**, kein bestätigtes, bereits implementiertes Punktekonto.

| Ereignis | XP | KP | Vergabelimit |
|---|---:|---:|---|
| **Erster bestätigter sinnvoller Erfolg je Tool** | **20** | **10** | einmalig pro Konto × Tool |
| **Unabhängiger, sinnvoller Folge-Meilenstein** | **8** | **4** | höchstens zweimal pro gleitenden 7 Tagen **je Tool**, nur wenn überprüfbar |
| Anmeldung, Seitenaufruf, Reload, Fehlversuch, Datenänderung ohne neuen Nutzen | 0 | 0 | immer |
| Amazon-Partnerlink, Werbeklick, Kauf, Spendenseitenaufruf | 0 | 0 | immer |
| Ko-fi-Spende (V1) | 0 | 0 | **für spätere separate Phase zurückgestellt** |

**Wichtige Regel:** Ein wiederkehrender Meilenstein darf **nur** vergeben werden, wenn das Tool ihn zuverlässig belegen kann. Wenn es keinen robusten unabhängigen Folgeschritt gibt, bleibt es für dieses Tool bei einmaligen Erfolgen. Künstliche Zeitabstände oder Reloads allein lösen niemals Punkte aus.

**Beispiel:** Ein Nutzer erfasst seine erste Umzugskiste erfolgreich: +20 XP und +10 KP Organisation. Dieselbe Kiste bearbeiten/nochmals speichern: +0. Eine neue Kiste ist nicht automatisch wieder ein Meilenstein. Erst ein nachweisbar eigenständiger, sinnvoller Fortschritt kann +8/+4 bringen, begrenzt pro Woche. Besonders private oder sicherheitskritische Aktionen dürfen *keine* wiederkehrenden XP-Ketten auslösen.

**Fairness:** 12 verschiedene, validierte Ersterfolge ergeben maximal **240 XP** durch diesen einmaligen Basisweg (nicht 480 XP oder mehr). Das ist ausreichend für erste Badges, aber kein Versprechen einer sofort hohen Gesamtsumme. Jeder Toolerfolg ist freiwillig. XP-Gesamtsumme und KP-Kategorien lassen sich getrennt anzeigen. Keine Strafe für wochenlange Pausen.

## 3. Kompetenzen – Zuordnung und Transparenz

| Kategorie | Tools | Warum |
|---|---|---|
| **Organisation** | Umzugskisten; WG-Organisator; Verliehene Dinge | Überblick, Aufgaben und Zuverlässigkeit |
| **Finanzen** | Haushaltsbuch; Autokosten; Zählerstände | Zahlen und Ressourcen organisieren |
| **Fürsorge** | Pflanzenpflege; Tiergesundheit | Pflegemanagement ohne medizinische Qualitätsbewertung |
| **Planung** | Parkplatz-Merker; Backform-Rechner | praktischer Ablauf und sinnvolle Berechnung |
| **Vorsorge & Wünsche** | Digitaler Nachlass; Amazon-Wunschlisten | organisatorische Vorsorge und Wünsche |

**Zuordnungsregel:** Ein fachliches Event gibt KP **exakt einer Kategorie**, nicht mehreren. Kein Profilstatus und kein Ranglistenlabel darf aus der Nutzung sensibler Tools abgeleitet werden. Kompetenzkarten sind **privat**. Ein KP-Wert ist ein Aktivitätsindikator und wird niemals als Zertifikat oder Kompetenzprüfung bezeichnet.

**Kategoriefortschritt:** Zunächst **absolute KP-Werte** statt Prozentwert ohne definiertes Ziel. Beispiel: „Organisation · 28 KP“. Falls später Balken, dann nur mit ausdrücklich bezeichnetem nächstem Badge-Meilenstein, damit keine irreführende 100-%-Kompetenz vorgetäuscht wird.

## 4. Die ersten neun Badges – erreichbare Regeln

| ID | Angezeigter Name | Freischaltung | Geltungsbereich |
|---|---|---|---|
| `first_success` | **Erster Schritt** | erster bestätigter Einmalerfolg | Konto privat |
| `three_tools` | **Neugierig** | bestätigte Ersterfolge in **3 unterschiedlichen Tools** | Konto privat |
| `five_tools` | **Vielseitig** | bestätigte Ersterfolge in **5 unterschiedlichen Tools** | Konto privat |
| `organization_30` | **Strukturiert** | **30 KP Organisation** | Konto privat |
| `finance_30` | **Mit Überblick** | **30 KP Finanzen** | Konto privat |
| `care_20` | **Achtsam** | **20 KP Fürsorge** | Konto privat, keine Gesundheitsdetails |
| `planning_20` | **Durchdacht** | **20 KP Planung** | Konto privat |
| `prepared_20` | **Vorbereitet** | **20 KP Vorsorge & Wünsche** | **streng privat**, keine Freigabe des zugrunde liegenden Tools |
| `three_days` | **Beständig** | an **3 verschiedenen Kalendertagen** mindestens ein überprüfter Tool-Erfolg, jederzeit ohne Frist | Konto privat |

**Anpassung gegenüber erstem Entwurf:** Für Kategorien mit nur zwei Tools startet die Badge-Schwelle bei **20 KP** statt 30 KP; dadurch ist sie ohne künstliche Wiederholung erreichbar, sofern beide unabhängigen Ersterfolge existieren. **Bei „Vorsorge & Wünsche“ darf weder öffentliches Posten persönlicher Wunschlisten noch die Preisgabe sensibler Nachlassdaten zum einzigen Weg werden.** Wenn bei diesen Tools kein sicherer Ersterfolg ohne problematische Offenlegung belegbar ist, muss der Badge zunächst als **nicht verfügbar / später** markiert oder durch einen neutralen alternativen sicheren Kompetenzschritt erreichbar gemacht werden. Nicht stillschweigend die Nutzer zur Veröffentlichung verleiten.

**Badge-Design:** Dezente, präzise Vektor-/Illustrationssymbole (kein Comic-Spielabzeichen), Wortmarke identisch mit Toolya. Neu freigeschaltete Badges nur auf Zustimmung/Bedienung sichtbar; optionale kurze Toasts, keine Vibrationen oder lauten Sounds. Einmal verliehene Badges nicht wegen Inaktivität entziehen; Fraud-Korrekturfälle getrennt behandeln.

## 5. Ereigniskatalog mit Sicherheit und validierbaren Grenzen

Die konkreten Trigger müssen vor Code-Integration an der aktuellen realen Version der Tools überprüft werden. Wo kein Server eine fachliche Bestätigung liefern kann, ist ein anerkanntes Event erst nach Entwicklung eines sicheren Verifikationswegs zulässig.

| Tool / Route | Einmaliger fachlicher Erfolg | Möglicher valider Folgeschritt (nur falls zuverlässig) | Nicht belohnen |
|---|---|---|---|
| Amazon-Wunschlisten – `tools/wishes/public.html` | **Sicherer privater Fortschritt**, z. B. nutzereigener Entwurf/Favorit, **falls** real vorhanden und rechtlich geeignet; sonst V1 kein Tool-Event und als Abweichung dokumentieren | zunächst keiner | öffentliche Suche, Veröffentlichung persönlicher Daten, Affiliate-Käufe |
| Haushaltsbuch – `tools/budget/index.html` | erster valider und erfolgreich persistierter Eintrag | echte periodische unabhängige Auswertung, sofern vorhanden | Betragshöhe, künstlich gesplittete Einträge |
| Umzugskisten – `tools/moving/index.html` | erste gespeichert beschriftete Kiste | wirklich abgeschlossener, separat belegter Sortiervorgang | Löschen und Neuanlegen derselben Kiste |
| Pflanzenpflege – `tools/plants/index.html` | erster gültiger, gespeicherter Pflegeplan | begrenzte eigenständige, bestätigte Pflegeorganisation ohne negative Gesundheitseffekte | fingierte Gießvorgänge / Tagesstreak |
| WG-Organisator – `tools/housemates/index.html` | real bestätigter Abschluss einer Aufgabe | unabhängiger neuer Aufgabenabschluss mit Cap | Massenanlage/sofortiges Abhaken zum Farming |
| Digitaler Nachlass – `tools/estate/index.html` | neutraler bestätigter **sicherer** Einrichtungsabschluss, ggf. ohne Detaildaten | **keiner in V1** | Dokumente, Todesfalldaten, E-Mail-Alarm, kritische Verfügbarkeits-/Sicherheitsaktionen |
| Autokosten – `tools/car/index.html` | erster sachlich persistierter Wartungs-/Verwaltungsabschluss | unabhängig bestätigter Folgeabschluss | Kennzeichen, Kostenhöhe, künstliche Eintragsmenge |
| Tiergesundheit – `tools/pet-health/index.html` | neutrale erfolgreiche Ersteinrichtung des Tierprofils | **keiner in V1** | Diagnosen, Medikations-/Impfhandlungen, Notfälle |
| Parkplatz-Merker – `tools/parking/index.html` | erster real gespeicherter Merkvorgang | ggf. separater verifizierbarer praktischer Abschluss, **nicht** einfache Wiederholung | Position, Parkfrequenz, GPS-Daten |
| Verliehene Dinge – `tools/loans/index.html` | erster erfolgreich dokumentierter Leihvorgang | tatsächlich bestätigte Rückgabe (einmal je fachlichem Vorgang) | Namen von Personen, Wert des Gegenstands |
| Zählerstände – `tools/meters/index.html` | valider gespeicherter Messpunkt | echter unabhängiger Folgemesspunkt in plausibler Messperiode | Verbrauchshöhe, kopierte Messdaten |
| Backform-Rechner – `tools/baking/index.html` | abgeschlossene gültige Berechnung mit Ergebnis | nur belegbarer neuer Berechnungskontext, sonst keiner | wiederholte gleiche Eingaben, Klicks |

**Zwölf-Tool-Anspruch vs. Sicherheit:** Jedes Tool wird bei UX/Kompetenzen berücksichtigt. Punktevergabe darf jedoch nicht vorschnell für öffentliche Wishlists oder sensible Tools behauptet werden, bevor eine private, risikoarme und überprüfbare Handlung existiert. Bei unmöglichem sicheren Trigger: keine fragwürdigen Workarounds, sondern explizite offene Aufgabe für die Freigabe.

## 6. Schutz gegen Manipulation

1. **Serverautoritative Punkte:** Browser darf nie eine beliebige XP- oder KP-Zahl übermitteln, die direkt gutgeschrieben wird.
2. **Idempotenz:** jeder akzeptierte Erfolg erhält eine eindeutige, durch den Server überprüfbare fachliche Schlüsselkennung. Wiederholter Request = keine zweite Gutschrift.
3. **Konto-Isolation:** Datenbank-RLS und API-Autorisierung verbieten Lesen/Schreiben fremder XP/KP/Badges.
4. **Keine Inhaltskopien:** Keine Haushaltsbeträge, Adressen, Fahrzeugdaten, nachlass- oder gesundheitliche Einträge in Rewards-Logs.
5. **Wiederholungslimits:** maximal zwei neue *fachlich unabhängige* Folge-Meilensteine pro Tool in sieben Tagen; Tool-spezifische Schutzregeln sind strenger möglich.
6. **Keine Punkte für Transaktions- oder Tracking-Klicks:** Affiliate/Ko-fi, Werbung und sonstige Ausleitungen bleiben für V1 ohne Punkte.
7. **Atomare Vergabe:** XP, KP und Badges dürfen bei einem Fehler nicht auseinanderlaufen. Definierter Retry ohne doppeltes Event.
8. **Rückwärtskompatibilität:** vorhandene Tools erfüllen ihren Zweck unabhängig vom Rewards-Dienst; fällt Rewards aus, darf der fachliche Speichervorgang nicht fehlschlagen und der Nutzer erhält kein fälschlich zugesagtes XP.
9. **Datenschutz & Löschung:** Nutzer kann Account/Rewards-Daten nach Richtlinie löschen/exportieren; keine öffentlichen Profile/Ranglisten in V1.
10. **Kein Test an realen Nutzern:** isolierte Staging-Tests und keine Testdaten in produktiven Supabase-Tabellen.

## 7. Präzise Akzeptanztests für den Umsetzungslauf

| Test | Erwartung |
|---|---|
| Erstes valides Tool-Ereignis (Beispiel Umzug) | genau **+20 XP / +10 KP Organisation** und Erster-Schritt-Badge |
| Derselbe Request 2× oder 10× | insgesamt nur eine Gutschrift |
| Neues Konto verwendet drei unterschiedliche Tools erfolgreich | Badge `three_tools` genau einmal |
| Neue Kontoaktivitäten betreffen fünf Tools | Badge `five_tools` genau einmal |
| Ungültige Eingabe, nicht gespeicherter Datensatz | **0 XP / 0 KP / kein Badge** |
| Speichern fachlich erfolgreich, Rewards-Server nicht erreichbar | Tool funktioniert weiterhin; Rewards nicht als vergeben ausgeben; späterer sicherer Retry |
| Gleiche fachliche Berechnung sofort wiederholt | **0 zusätzliche Punkte** |
| Fürsorge: neutrale Ersterfolge in zwei unterschiedlichen Tools | 20 KP Fürsorge, Badge `care_20` |
| Personen mit zwei verschiedenen Auth-Konten | XP/KP/Badges vollständig isoliert |
| Unangemeldeter Besuch einer bisher öffentlichen Wunschlisten-Seite | bestehende öffentliche Funktion bleibt nutzbar, keine Gutschrift ohne verifizierbares Punktekonto |
| Nutzer 30 Tage inaktiv | keine XP-Strafe, Badge bleibt erhalten, kein „Du bist zurückgefallen“ |
| Spendenlink oder Amazon-Link angeklickt | keine XP-/KP-Vergabe in V1 |
| Nachlass-/Tiergesundheit-Ereignis | ggf. neutrales privates Erstspeichersignal, keine intimen Details im Ledger |
| Mobile, Tastatur, Screenreader | alle Kompetenzwerte und Badges ohne Animation erkennbar |
| Zwölf Tool Regressionen | keine verschlechterte Tool-Ergebnislogik oder Login-/Redirect-Schleifen |
| Badges erneut prüfen / Rewards-Seite neu laden | keine erneute Badgevergabe und keine zusätzliche XP |
| Umstellung auf neues Backend | ein klar dokumentierter migrations-/rollbackfähiger Plan ohne Verlust echter Daten |

## 8. Schrittfolge für Codex/Work – nur nach ausdrücklichem Entwicklungsauftrag

1. aktuellen `main`-Stand und alle zwölf echten Tool-Implementierungen untersuchen, aktuelle Auth-/Supabase-RLS-/Migrationsstrukturen feststellen;
2. technische Eventverifikation und Datenschutzdesign für jedes Tool dokumentieren; unlösbare „first success“-Wünsche explizit markieren;
3. minimalen privaten Ledger plus eindeutige KP-Zuordnung und deterministischen Badge-Katalog im **nicht produktiven Entwicklungsbranch** mit isolierter Datenbankumgebung umsetzen;
4. Dashboard mit 3 Elementen: XP-Zahl, fünf KP-Zähler, Badge-Vitrine; diskrete Tool-Erfolgsmeldungen;
5. kontrollierte fachliche Tool-Adapter ergänzen, Regressionen und Sicherheit gezielt prüfen;
6. fertigen V1-Kandidaten samt Screenshot/Demo, Datenschutz-/Abnahmeliste und Releaseplan liefern. **Kein eigenständiges Deployment/Produktivmigration und keine Main-Merges ohne ausdrückliche Freigabe.**

### Entscheidungs- und Abgrenzungshinweis

V1-Konzept ist nun präzisiert, **nicht** im Livesystem eingerichtet. Alle Zahlen und Badge-Titel sind Vorschläge, die zunächst im nicht produktiven Modell getestet werden müssen. Die früher erwogene Mystery-Serie, Ranglisten, Ko-fi-XP oder veränderte Authpflicht bleiben außerhalb dieses V1-Auftrags, bis der Nutzer sie wieder gesondert beauftragt.
