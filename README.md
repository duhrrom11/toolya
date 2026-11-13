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
