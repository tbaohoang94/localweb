# Security — Google Maps Lead Pipeline

> Letzte Aktualisierung: 2026-03-04 (nach Infrastructure Audit Phase 3)

---

## Security Audit Ergebnis

| Bereich | Status | Details |
|---------|--------|---------|
| RLS Kerntabellen | BEHOBEN | locations, businesses, cities — RLS aktiviert (Migration 20260304200000) |
| RLS Hilfs-Tabellen | OK | custom_fields, workflow_logs, category_qualifications, system_logs |
| Service Role Key | OK | Nur in n8n Docker .env, nicht NEXT_PUBLIC_ |
| Anon Key | OK | Nur im Frontend fuer Client-Side Auth |
| .env in .gitignore | OK | n8n Docker + Frontend .env werden nicht committet |
| .env.example | OK | Vorhanden fuer n8n Docker + Frontend |
| n8n Credentials | OK | Apify, OpenAI, SMTP im Credential Store (verschluesselt) |
| Security Headers | OK | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| n8n API Key | ABGELAUFEN | Ablaufdatum war 2025-11-29 — neuen Key generieren |
| Sentry DSN | OFFEN | Sentry-Projekt muss erstellt und DSN konfiguriert werden |

---

## RLS Policies (komplett)

### locations
| Policy | Operation | Role |
|--------|-----------|------|
| authenticated_select_locations | SELECT | authenticated |
| authenticated_insert_locations | INSERT | authenticated |
| authenticated_delete_locations | DELETE | authenticated |
| service_role_all_locations | ALL | service_role |

### businesses
| Policy | Operation | Role |
|--------|-----------|------|
| authenticated_select_businesses | SELECT | authenticated |
| service_role_all_businesses | ALL | service_role |

### cities
| Policy | Operation | Role |
|--------|-----------|------|
| authenticated_select_cities | SELECT | authenticated |
| service_role_all_cities | ALL | service_role |

### system_logs
| Policy | Operation | Role |
|--------|-----------|------|
| authenticated_read_system_logs | SELECT | authenticated |
| service_role_all_system_logs | ALL | service_role |

### custom_fields, workflow_logs, category_qualifications
- authenticated: SELECT
- service_role: ALL

---

## Secrets Management

| Secret | Speicherort | Zugriff |
|---|---|---|
| SUPABASE_GOOGLE_KEY | n8n Docker .env | Service Role — nur server-side |
| SUPABASE_LEADS_KEY | n8n Docker .env | Service Role — nur server-side |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Frontend .env.local | Anon Key — sicher fuer Client |
| APIFY_API_TOKEN | n8n Docker .env + Credential Store | Bearer Auth |
| OPENAI_API_KEY | n8n Docker .env + Credential Store | API Key |
| CLOSE_API_KEY | n8n Docker .env | API Key |
| DOCUSEAL_API_KEY | n8n Docker .env | API Key |
| DEMODESK_API_KEY (6x) | n8n Docker .env | API Keys |
| SMTP Passwort | n8n Credential Store | SMTP Auth |
| N8N_ENCRYPTION_KEY | n8n Docker .env | Verschluesselt Credential Store |
| SENTRY_DSN | Frontend .env.local / Vercel | Error Tracking |
| SENTRY_AUTH_TOKEN | Vercel Env | Source Maps Upload |

---

## Regeln

- Service Role Key **niemals** als `NEXT_PUBLIC_` — nur server-side (n8n, API Routes)
- Credentials **immer** ueber n8n Credential Store — nie hardcoded in Workflows
- `.env` Datei in `.gitignore` — wird nicht committet
- `.env.example` mit Platzhaltern fuer Onboarding
- Frontend nutzt **nur anon key** — alle Daten durch RLS geschuetzt

---

## DSGVO

| Aspekt | Status | Details |
|--------|--------|---------|
| Datenstandort | OK | Supabase eu-central-1 (Frankfurt), Hetzner DE |
| Personenbezogene Daten | Minimal | Nur Geschaeftsdaten (oeffentlich: Google Maps, Impressum) |
| Logs | OK | system_logs: keine personenbezogenen Daten. Pino Logger hat Redact-Filter fuer email, password, token |
| Log-Retention | OFFEN | system_logs hat noch kein automatisches Cleanup (geplant: 90 Tage) |
| Datenverarbeitungsvertraege | PRUEFEN | AVV mit Supabase, Vercel, Hetzner benoetigt |
| Loeschkonzept | OFFEN | Kein automatisches Loeschen alter Business-Daten |
| Cookie-Consent | NICHT NOETIG | Nur funktionale Cookies (Supabase Auth), keine Tracking-Cookies |

---

## API-Key Rotation

| Key | Letzte Rotation | Naechste Rotation | Anleitung |
|-----|-----------------|--------------------|-----------|
| Supabase Service Role | Unbekannt | Bei Verdacht auf Kompromittierung | Supabase Dashboard → Settings → API |
| n8n API Key | 2025-11-29 | **SOFORT** (abgelaufen) | n8n UI → Settings → API → Create API Key |
| Apify | Unbekannt | Quartalsweise | apify.com → Settings → Integrations |
| OpenAI | Unbekannt | Quartalsweise | platform.openai.com → API Keys |
| Close CRM | Unbekannt | Bei Bedarf | close.com → Settings → API Keys |

**Bei Rotation:** .env aktualisieren + `docker compose up -d --force-recreate n8n`
