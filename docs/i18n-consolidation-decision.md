# Toolya – konsolidierte Übersetzungsarchitektur (22.11.2026)

## Entscheidung
Der bereits umfangreich übersetzte Branch `feature/i18n-de-en-foundation-20261121` ist die maßgebliche Quelle für bestehende DE/EN-Übersetzungen. Kein Neubeginn und kein zweites paralleles Übersetzungssystem. Der experimentelle PR #309 wurde geschlossen, weil er eine konkurrierende i18next-Instanz auf der Startseite eingeführt hätte.

## Übernahme und Zielbild
- Vorhandene EN-Texte aus `shared/toolya/i18n/interface.mjs`, `*-copy.mjs`, dynamischen Übersetzungsmodulen und den öffentlichen `en/`-Seiten unverändert als geprüfte Übersetzungsgrundlage übernehmen.
- Die bestehende `locale.mjs`-Sprachentscheidung, URL-Auflösung, Sprachumschalter und explizite UI-Übersetzungsregeln erhalten; schrittweise in eine zentrale i18next-Ressourcenstruktur migrieren, ohne zwei aktive Runtime-Übersetzer gleichzeitig auf denselben DOM-Bereich anzuwenden.
- Ressourcen nach Namespace und Sprachcode aufbauen; `de` ist Fallback, `en` zuerst vollständig übernehmen. Weitere Sprachen erst nach gesicherter DE/EN-Abdeckung hinzufügen.
- Alle neuen sichtbaren Oberflächentexte ausschließlich über die zentrale i18n-Schicht; keine parallelen manuellen EN-HTML-Kopien für neue UI-Texte. Statische lokalisierte URLs dürfen als SEO-Einstiegspunkte bestehen bleiben.
- Nutzerfreitext, CloudOnly-Daten, persistierte Codes, Auth-/Recovery-Flows, Markenschrift und Maskottchen nicht übersetzen bzw. verändern.
- Vor einer produktiven Freigabe vollständige Sprachabdeckung, Browser-/A11y-/Export-Regressionen und SEO-Indexierungsregeln prüfen.

## Stilllegung des bisherigen Übersetzungsbranches
Erst nach vollständiger Übernahme, grünen Release-Gates, erfolgreichem Merge und bestätigter Veröffentlichung darf der bisherige Übersetzungsbranch gelöscht werden. Vorher bleibt er als Quelle und Rückfallmöglichkeit bestehen.

## Aktueller Status
Bestehende DE/EN-Arbeit ist umfangreich, aber laut `docs/i18n-release-report.md` noch nicht vollständig abgenommen (34 teilweise lokalisierte Ansichten). Dieser Architekturentscheid ist **keine** Behauptung einer vollständigen Übersetzung oder Freigabe.
