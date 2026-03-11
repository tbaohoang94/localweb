# Security — [PROJECT_NAME]

---

## Secrets Management

**Regel:** Kein Secret im Code. Nie. Nicht mal in Kommentaren.

| Secret | Wo gespeichert | Wer hat Zugriff |
|---|---|---|
| Supabase Service Key | Vercel Env + n8n Credentials | Backend only, nie Client |
| Supabase Anon Key | Vercel Env (public ok) | Frontend |
| [API Key Name] | n8n Credentials | n8n Workflows |
| [OFFEN] | | |

---

## Umgebungsvariablen

```bash
# .env.local (Frontend) — NIEMALS committen
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # nur Server, nie NEXT_PUBLIC_
[WEITERE — OFFEN]
```

---

## Auth

- **Provider:** Supabase Auth
- **Session:** SSR via `@supabase/ssr`, kein localStorage
- **Middleware:** schützt alle `/dashboard/*` Routen
- **Token-Refresh:** automatisch via Supabase SDK

---

## RLS

- Auf allen Tabellen aktiviert (Details in `docs/supabase.md`)
- Service Role für n8n-Zugriff (voller Zugriff, nur server-side)
- Anon Role: kein Datenzugriff außer explizit erlaubt

---

## DSGVO

- Daten liegen in EU (Supabase Frankfurt / Hetzner Frankfurt)
- [OFFEN: Datenschutzerklärung URL]
- [OFFEN: Cookie-Consent Lösung]
- Logs: keine persönlichen Daten in Logs außer User-ID

---

## Offene Punkte [OFFEN]

- [ ] [OFFEN]
