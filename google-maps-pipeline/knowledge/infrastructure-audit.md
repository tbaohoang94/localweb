# Infrastructure Audit — Google Maps Lead Pipeline

> Erstellt: 2026-03-04
> Stack: Next.js 14 (Vercel) + Supabase (eu-central-1) + n8n (Docker lokal) + Close CRM
> Supabase-Projekt: wknzyrvcrcdchnysntii

---

## Phase 0 — Bestandsaufnahme

### Bewertungstabelle

| Bereich | Status | Details |
|---------|--------|---------|
| Uptime Monitoring | TEILWEISE | n8n: Docker healthcheck + Autoheal. Vercel: Analytics + Speed Insights. Kein dedizierter Health-Endpoint, kein externer Uptime-Check. |
| Error Tracking (Frontend) | FEHLT | Kein Sentry. Nur `error.tsx` Error Boundary ohne Reporting. Vercel Analytics trackt keine Exceptions. |
| Error Tracking (n8n) | TEILWEISE | WF 07 Error Logger (Email bei Workflow-Fehler). `workflow_logs` Tabelle (1017 Eintraege). Kein strukturiertes Severity-System. |
| Error Tracking (Supabase) | FEHLT | Keine Monitoring-Views, kein Connection Pool Monitoring, keine Slow-Query-Erkennung. |
| Alerting | TEILWEISE | Nur Email-Alerts via WF 07 (SMTP Hetzner). Kein Severity-Routing, keine De-Duplizierung, kein Daily Digest. |
| Logging (strukturiert) | FEHLT | Kein Pino/Winston. Frontend: `console` (per ESLint-Regel auf warn/error beschraenkt). n8n: Workflow-interne Logs nur. |
| Backup-Strategie | TEILWEISE | Supabase: Managed Backups (Pro-Plan-abhaengig). n8n Workflows: Kein automatischer Export. n8n Credentials: In verschluesselter DB, kein externes Backup. |
| Security (RLS, Secrets, DSGVO) | KRITISCH | **RLS DEAKTIVIERT** auf `locations`, `businesses`, `cities`. Nur `custom_fields`, `workflow_logs`, `category_qualifications` haben RLS. Security Headers in next.config.mjs vorhanden. n8n API Key abgelaufen (2025-11-29). |
| CI/CD Pipeline | TEILWEISE | Vercel: Auto-Deploy auf Push (Preview + Production). Kein Pre-Deploy-Check-Script. Kein TypeScript/ESLint-Check vor Deploy. |
| Staging-Umgebung | FEHLT | Kein Staging-Supabase-Projekt. Kein Staging-n8n. Vercel Preview Deployments nutzen Production-Supabase. |
| Sync-Validierung | FEHLT | Keine automatische Pruefung ob Pipeline-Daten konsistent sind. Keine Stuck-Detection als eigener Workflow. |
| Status Page | FEHLT | Keine interne oder externe Status-Seite. |
| Dokumentation | VORHANDEN | 15 Knowledge-Files, 3 ADRs, Dependencies-Docs. Gut strukturiert. Teilweise veraltet (RLS-Behauptung falsch). |

---

### Detailanalyse

#### Frontend (Next.js 14 / Vercel)

| Aspekt | Status | Details |
|--------|--------|---------|
| Framework | Next.js 14.2.35 | App Router, TypeScript strict |
| Hosting | Vercel | Auto-Deploy, prj_6sfseCAb6JxffDsVAei2ev90j9Wu |
| Security Headers | Vorhanden | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Auth | Supabase Auth | @supabase/ssr, Middleware-basiert |
| Error Handling | Minimal | error.tsx Error Boundary, keine Reporting-Integration |
| Analytics | Vercel | @vercel/analytics + @vercel/speed-insights |
| Sentry | Fehlt | Nicht installiert |
| Structured Logging | Fehlt | Kein Pino |
| API Routes | Keine | Nur Client-side Supabase Queries |

#### n8n (Docker lokal)

| Aspekt | Status | Details |
|--------|--------|---------|
| Version | n8n 2.9.4 (Dockerfile) | Custom Build mit Chromium |
| Datenbank | PostgreSQL 15 Alpine | Docker Volume `pg_data` |
| Container Health | Vorhanden | healthcheck + Autoheal |
| Workflows | 7 aktiv + 1 deaktiviert | WF 01, 01b, 02, 03, 04a, 04b, 05, 07 |
| Error Workflow | WF 07 | Email-Benachrichtigung bei Fehlern |
| Concurrency | 40 | N8N_CONCURRENCY_PRODUCTION_LIMIT=40 |
| Task Runner | 2GB RAM | N8N_RUNNERS_MAX_OLD_SPACE_SIZE=2048 |
| Puppeteer | Chromium integriert | Fuer WF 04b Website-Enrichment |
| Cloudflare Tunnel | Aktiv | n8n.hoba-consulting.com |

#### Supabase

| Aspekt | Status | Details |
|--------|--------|---------|
| Projekt | wknzyrvcrcdchnysntii | Region: eu-central-1 |
| Tabellen | 6 | locations (78), businesses (7070), cities (25), custom_fields (80), workflow_logs (1017), category_qualifications (0) |
| RLS aktiviert | 3/6 | custom_fields, workflow_logs, category_qualifications |
| **RLS deaktiviert** | **3/6** | **locations, businesses, cities — KRITISCH** |
| ENUMs | 2 | location_pipeline_stage, business_pipeline_stage |
| Views | 1 | search_query_stats |
| Indizes | 3 | pipeline_stage + search_string |
| Migrations | 3 | Im Repo unter supabase/migrations/ |

#### Secrets & Credentials

| Secret | Speicherort | Status |
|--------|-------------|--------|
| SUPABASE_GOOGLE_KEY | n8n Docker .env | Service Role Key — korrekt server-side |
| SUPABASE_LEADS_KEY | n8n Docker .env | Weiteres Supabase-Projekt |
| APIFY_API_TOKEN | n8n Docker .env + Credential Store | Doppelt gespeichert |
| OPENAI_API_KEY | n8n Docker .env + Credential Store | Doppelt gespeichert |
| CLOSE_API_KEY | n8n Docker .env | Nur in .env |
| DOCUSEAL_API_KEY | n8n Docker .env | Nur in .env |
| DEMODESK_API_KEY (6x) | n8n Docker .env | 6 personenbezogene Keys |
| N8N_ENCRYPTION_KEY | n8n Docker .env | Verschluesselt Credentials |
| SMTP Passwort | n8n Credential Store | Korrekt im Store |
| .env in .gitignore | Ja | .env wird nicht committet |
| .env.example | Fehlt | Kein Template fuer Onboarding |

---

### Kritische Befunde (Sofort-Massnahmen)

1. **RLS deaktiviert auf Kerntabellen** — `locations`, `businesses`, `cities` sind ueber den Supabase anon Key fuer jeden lesbar/schreibbar. Frontend nutzt anon Key via @supabase/ssr.
2. **n8n API Key abgelaufen** — security.md dokumentiert Ablaufdatum 2025-11-29 (vor 3 Monaten).
3. **Dokumentation falsch** — architecture.md behauptet "RLS aktiviert auf allen Tabellen", Realitaet: nur 3/6.
4. **Keine .env.example** — Onboarding neuer Entwickler erschwert.

### Mittelfristige Befunde

5. **Kein Sentry** — Frontend-Fehler werden nicht getrackt.
6. **Kein strukturiertes Logging** — Debugging nur ueber Vercel Logs + n8n UI.
7. **Keine Staging-Umgebung** — Alle Tests gegen Production-Supabase.
8. **Kein Backup-Automatismus** — n8n Workflows nicht automatisch exportiert.
9. **Keine Sync-Validierung** — Keine Pruefung ob Pipeline-Items steckenbleiben.

---

## Phasen-Status

- [x] Phase 0: Bestandsaufnahme
- [x] Phase 1: Error Handling & Logging — Sentry, Pino, system_logs, WF 07 erweitert, Monitoring Views
- [x] Phase 2: Uptime Monitoring & Alerting — /api/health, WF 08 Health Check, WF 09 Daily Digest, alerting-rules.md
- [x] Phase 3: Security Audit — RLS auf allen Tabellen aktiviert, Security Definer Views gefixt, .env.example, security.md aktualisiert
- [x] Phase 4: Backup & Recovery — WF 10 Workflow Backup, disaster-recovery.md
- [x] Phase 5: CI/CD & Deployment — pre-deploy-check.sh, n8n-deploy.sh
- [x] Phase 6: Sync-Validierung & Data Integrity — dead_letter_queue, WF 11 Pipeline Integrity Check
- [x] Phase 7: Dashboard & Status Page — /dashboard/ops, use-ops-data Hook
- [x] Phase 8: Documentation & Runbooks — Alle Knowledge-Files aktualisiert, 3 Runbooks erstellt

---

## Erstellte/Geaenderte Dateien

### Frontend (neu)
- `sentry.client.config.ts` — Sentry Client-Konfiguration
- `sentry.server.config.ts` — Sentry Server-Konfiguration
- `sentry.edge.config.ts` — Sentry Edge-Konfiguration
- `instrumentation.ts` — Next.js Instrumentation mit Sentry
- `app/global-error.tsx` — Globale Error Boundary mit Sentry
- `app/api/health/route.ts` — Health-Check-Endpoint
- `app/dashboard/ops/page.tsx` — Operations Dashboard
- `lib/logger.ts` — Pino Logger (strukturiert, DSGVO-Redact)
- `lib/hooks/use-ops-data.ts` — Custom Hook fuer Ops-Daten
- `.env.example` — Frontend Environment Template

### Frontend (geaendert)
- `next.config.mjs` — Sentry withSentryConfig hinzugefuegt
- `app/error.tsx` — Sentry.captureException statt console.error
- `components/sidebar.tsx` — Operations-Link hinzugefuegt
- `lib/format.ts` — formatDistanceToNow hinzugefuegt
- `lib/types/database.types.ts` — Regeneriert mit neuen Tabellen/Views
- `package.json` — @sentry/nextjs + pino hinzugefuegt

### Supabase Migrations (neu)
- `20260304000000_create_system_logs.sql`
- `20260304100000_create_monitoring_views.sql`
- `20260304200000_enable_rls_core_tables.sql`
- `20260304300000_fix_security_definer_views.sql`
- `20260304400000_create_dead_letter_queue.sql`

### n8n Workflows (neu/geaendert)
- `07-error-logger.json` — Erweitert: schreibt zusaetzlich in system_logs
- `08-health-check.json` — NEU: 5min Health Check
- `09-daily-digest.json` — NEU: Taeglicher Report
- `10-workflow-backup.json` — NEU: Workflow-Export
- `11-pipeline-integrity-check.json` — NEU: 6h Integritaetspruefung

### Scripts (neu)
- `scripts/pre-deploy-check.sh` — Pre-Deployment Checkliste
- `scripts/n8n-deploy.sh` — n8n Workflow Deployment

### Knowledge (neu/geaendert)
- `knowledge/infrastructure-audit.md` — Dieses Dokument
- `knowledge/alerting-rules.md` — Alerting-Konzept
- `knowledge/disaster-recovery.md` — Recovery-Plan
- `knowledge/security.md` — Komplett ueberarbeitet
- `knowledge/architecture.md` — Aktualisiert mit neuen Komponenten
- `knowledge/error_handling.md` — Aktualisiert mit Sentry/Pino/system_logs
- `knowledge/n8n.md` — Aktualisiert mit neuen Workflows
- `knowledge/supabase.md` — Aktualisiert mit neuen Tabellen/Views/Migrations
- `knowledge/runbooks/incident-response.md` — NEU
- `knowledge/runbooks/common-issues.md` — NEU
- `knowledge/runbooks/onboarding-new-client.md` — NEU
- `n8n/docker/.env.example` — Aktualisiert mit fehlenden Variablen

---

## Offene Punkte (nicht im Scope dieses Audits)

| # | Thema | Prioritaet | Bemerkung |
|---|-------|-----------|-----------|
| 1 | Sentry-Projekt erstellen + DSN konfigurieren | Hoch | Sentry Code ist fertig, braucht nur Projekt + DSN |
| 2 | n8n API Key erneuern | Hoch | Abgelaufen seit 2025-11-29 |
| 3 | Neue WFs deployen (08-11) | Mittel | JSONs bereit, muessen in n8n importiert + aktiviert werden |
| 4 | Staging-Umgebung | Niedrig | Separates Supabase-Projekt + Vercel Branch Previews |
| 5 | DSGVO: AVV pruefen | Niedrig | Datenverarbeitungsvertraege mit Supabase, Vercel, Hetzner |
| 6 | Log-Retention automatisieren | Niedrig | pg_cron oder n8n Workflow: system_logs > 90 Tage loeschen |
| 7 | De-Duplizierung in WF 07 | Niedrig | Gleicher Fehler nicht 50x senden |
