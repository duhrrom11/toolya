# Toolya

Eigenständige GitHub-Pages-Veröffentlichung für `toolya.app`.

## Status
- Separates Repository von `duhrrom11/Helferlein`.
- Aktuell nur eine statische Warteseite, **keine** Migration der produktiven Anwendungen.
- Noch keine Supabase-Integration oder Authentifizierung auf der neuen Domain.
- Die Warteseite ist mit `noindex,nofollow` versehen, bis die vollständige Migration geprüft wurde.

## Vor dem Produktivstart
1. GitHub Pages in diesem Repository aktivieren (Branch `main`, Verzeichnis `/ (root)`).
2. Custom Domain `toolya.app` in GitHub Pages konfigurieren.
3. Sav DNS A-Records auf die vier GitHub-Pages-IP-Adressen setzen und `www` als CNAME auf `duhrrom11.github.io`.
4. DNS-Prüfung und HTTPS-Zertifikat abwarten; HTTPS erzwingen.
5. Vor Übernahme der Anwendungen absolute/relative Pfade, PWA, Canonical-URLs, Supabase-Redirect-URLs, RLS und browserlokale Datenmigration prüfen.

**Nicht** das bestehende Helferlein-Repository umkonfigurieren oder dessen GitHub-Pages-Custom-Domain verändern.

## Wishlist / Amazon-Import
Die Wishlist liegt unter `/tools/wishes/index.html` und verwendet ausschließlich das Toolya-Supabase-Projekt `yheogmeaosuigyaxkwth`. Die übrige Website bleibt in Vorbereitung. Amazon-Abrufe können von Amazon abgelehnt werden; unvollständige Vorschauen werden nicht importiert. Backend- und SQL-Quellcode stehen unter `supabase/`.

Live-Abruf am 14.11.2026: Einzelprodukt mit vollständigem Titel, Hauptbild und Beschreibung; öffentliche Wunschliste über acht Amazon-Seiten mit 75 Produkten, 75 Bildern und 63 verfügbaren Preisen aus der bereitgestellten Toolya-Edge-Function gelesen. Kein Nutzerwunsch angelegt. Atomarer Import, Wiederholungsschutz und Kontotrennung wurden in einer vollständig zurückgerollten SQL-Transaktion geprüft. Fehlende Preise werden nicht erfunden.
