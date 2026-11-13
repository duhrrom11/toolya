# Toolya — Brevo SMTP release preparation

Status: **BLOCKED / not configured**. This file contains no secrets.

## Verified
- Toolya-only Supabase project: `yheogmeaosuigyaxkwth`.
- Auth Site URL: `https://toolya.app`.
- Allowed redirect URLs: `https://toolya.app/**` and `https://www.toolya.app/**`.
- Email provider and confirmation enabled; anonymous sign-ins disabled.
- Supabase custom SMTP disabled; no sender or provider credentials configured.
- Repository root CNAME is `toolya.app` (not proof that DNS, HTTPS or Brevo domain verification works).
- Brevo account/domain status could **not** be inspected: connected browser service was unavailable due to account billing limit.

## Prerequisites (do not guess or invent)
1. An accessible Brevo account with transactional SMTP enabled.
2. Verified sending domain `toolya.app` in Brevo. Add the exact DNS ownership, DKIM and SPF records shown by Brevo in the authoritative DNS provider; check DMARC policy and alignment. Do not overwrite existing SPF; merge mechanisms into the single SPF TXT record if required.
3. A confirmed sender address under `toolya.app` (for example `noreply@toolya.app`, **only if authorized and verified**).
4. Brevo SMTP host, port, login and SMTP key obtained from Brevo account settings; store the SMTP key only in Supabase dashboard secret field. Do not commit or print it.
5. In **Toolya Supabase only**, enable custom SMTP and configure sender, host, port, username, password and conservative rate limits. Verify saved settings without exposing secrets.
6. Send a single authorized transactional test to an approved mailbox. Verify confirmation, sign-in, sign-out, reset-password and redirect flow. No test users in Helferlein.
7. Re-run release preview CI and review production domain HTTPS.

## Stop conditions
Never merge `main` or deploy until verified. Never touch `duhrrom11/Helferlein` or its Supabase instance.


## Approved configuration blueprint (domain verification reported by account owner)

| Supabase Authentication → Emails → SMTP Settings | Value |
| --- | --- |
| Enable custom SMTP | **Leave OFF until real credentials and sender are available** |
| Sender name | `Toolya` |
| Sender email | Exact existing Brevo-authorized sender under `toolya.app` (do not assume `noreply@` exists) |
| Host | `smtp-relay.brevo.com` |
| Port | `587` (STARTTLS) |
| Username | **Exact SMTP login displayed by Brevo** (can differ from account email) |
| Password | **Dedicated Brevo SMTP key**, never account password or API key |
| Minimum interval per user | Keep Supabase default, typically 60 seconds |

Official references:
- https://developers.brevo.com/docs/supabase-smtp-integration
- https://help.brevo.com/hc/de/articles/7924908994450-Transaktions-E-Mails-mit-Brevo-SMTP-senden

### Secret handling
Generate a dedicated SMTP key named `toolya-supabase-auth` in Brevo (Settings → SMTP & API → SMTP). Enter the key **directly into Toolya Supabase's SMTP password field**, never into chat, GitHub, CI variables, static assets or a SQL statement. Do not log, echo, screenshot or commit the key. If the key is exposed, revoke and replace it.

### Completion gate
1. Verify SMTP relay is enabled in Brevo and exact sending address is authorized.
2. Enter the blueprint into **only** `https://supabase.com/dashboard/project/yheogmeaosuigyaxkwth/auth/smtp`, then save and verify configuration (never reveal password).
3. Send a controlled confirmation email to an authorized mailbox, verify delivery and `toolya.app` redirect, test sign-in and password reset.
4. Re-run browser CI, verify DNS/HTTPS, and record evidence before GO decision.

No live SMTP changes were made as of this preparation; credentials and sender are not available to the assistant.
