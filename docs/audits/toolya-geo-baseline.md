# Toolya GEO-Ausgangsmessung

## R54 – Übersicht und Crawling

[`llms.txt`](https://toolya.app/llms.txt) ist eine freiwillige Leseübersicht der öffentlichen Angebote. Sie listet nur kanonische URLs aus der Sitemap und enthält keine Konto-, Admin- oder Profil-URLs. Bei Umbenennungen und entfallenden Seiten prüfe die Übersicht zusammen mit `sitemap.xml`. Die CI prüft, dass alle eingetragenen URLs eindeutig sind und in der Sitemap stehen.

`robots.txt` erlaubt weiterhin das Abrufen der Seiten, damit Suchcrawler Canonical und `noindex` lesen können. Die Sitemap führt die öffentlichen indexierbaren Ziele. Authentifizierung schützt zugangsbeschränkte Inhalte. Google verlangt für AI Overviews und AI Mode keine solchen Zusatzdateien.

[llms.txt-Formatvorschlag](https://llmstxt.org/) · [Google Search Central](https://developers.google.com/search/docs/appearance/ai-features)

## R55 – Vergleichsbasis

OpenSEO, Deutschland, Deutsch. Manueller Lauf vom 18. November 2026. Uhrzeiten sind UTC. Die Zielseiten dienen zur internen Zuordnung der Frage.

| Feste Frage | Zielseite | System | Erfasst (UTC) | Antwortstatus | Quellen gesamt | Toolya erwähnt | Toolya zitiert |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| Wie rechne ich eine Springform von 26 auf 28 cm um? | [Backform](https://toolya.app/backform-rechner/) | ChatGPT | 22:19:22 | Antwort erfasst | 0 | Nein | Nein |
| Wie rechne ich eine Springform von 26 auf 28 cm um? | [Backform](https://toolya.app/backform-rechner/) | Google AI Overviews | 22:20:01 | Antwort erfasst | 6 | Nein | Nein |
| Wie beschrifte ich Umzugskisten mit QR-Codes? | [Umzugskisten](https://toolya.app/umzugskisten/) | ChatGPT | 22:19:29 | Antwort erfasst | 0 | Nein | Nein |
| Wie beschrifte ich Umzugskisten mit QR-Codes? | [Umzugskisten](https://toolya.app/umzugskisten/) | Google AI Overviews | 22:19:27 | Antwort erfasst | 6 | Nein | Nein |
| Wie dokumentiere ich Strom- und Gaszähler bei einer Wohnungsübergabe? | [Zählerstände](https://toolya.app/zaehlerstaende/) | ChatGPT | 22:19:26 | Antwort erfasst | 0 | Nein | Nein |
| Wie dokumentiere ich Strom- und Gaszähler bei einer Wohnungsübergabe? | [Zählerstände](https://toolya.app/zaehlerstaende/) | Google AI Overviews | 22:19:23 | Antwort erfasst | 5 | Nein | Nein |

Sechs Antworten wurden erfasst. In dieser Stichprobe wurde Toolya weder erwähnt noch zitiert. Für Bing liegen hier keine Messwerte vor.

## Wiederholung

Der bestehende OpenSEO-Tracker prüft die drei Fragen wöchentlich. Der nächste Lauf ist für den 26. November 2026 geplant. Vergleiche jeweils dieselben Fragen, Systeme, Länder und Sprachen. Halte Zeitpunkt, Antwortstatus und jede zitierte Toolya-URL fest. Kennzeichne ausbleibende Antworten und fehlgeschlagene Abrufe separat. Einzelne Stichproben erlauben keine Aussage über allgemeine Sichtbarkeit oder die Wirkung von `llms.txt`.

[OpenSEO-Tracker mit Messlauf](https://app.openseo.so/p/6eddcfc6-d4a2-403b-a689-d02bc761a969/ai-visibility)
