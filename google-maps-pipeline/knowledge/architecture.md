# Architektur — Google Maps Lead Pipeline

> Systemdesign, Datenfluss und technische Entscheidungen.
> Letzte Aktualisierung: 2026-03-04 (nach Infrastructure Audit)

---

## Systemuebersicht

```
Location (Supabase)
  │
  ├─ WF 01 (Cron 5min) ──→ Apify Google Maps Scraper
  │                              │
  ├─ WF 01b (Cron 15min) ◀──────┘ Status pruefen
  │
  ├─ WF 02 (Cron 5min) ──→ Dataset importieren → Businesses (Supabase)
  │
  ├─ WF 03 (Cron 10min) ──→ OpenAI Kategorie-Check
  │
  ├─ WF 04a (Cron 10min) ──→ WF 04b (Worker pro Business) ──→ Puppeteer + OpenAI
  │
  └─ WF 05 (Cron 18:00) ──→ CSV bauen ──→ Email (Hetzner SMTP)

  WF 07 (Error Trigger) ──→ Error-Log + Email bei Workflow-Fehlern
  WF 08 (Cron 5min) ──→ Health Check (Supabase + n8n)
  WF 09 (Cron 08:00) ──→ Daily Digest Email
  WF 10 (Cron 02:00) ──→ Workflow Backup
  WF 11 (Cron 6h) ──→ Pipeline Integrity Check
```

---

## Architektur-Prinzip: Event-driven State Machine

Jeder Workflow laeuft unabhaengig auf eigenem Cron-Schedule und verarbeitet Items basierend auf `pipeline_stage`. Kein zentraler Orchestrator (WF 00 ist deaktiviert).

**Kernprinzip:** Die Datenbank ist die Single Source of Truth. Jeder Workflow fragt: "Gibt es Items im Status X?" und verarbeitet sie.

---

## Komponenten

### Frontend (Next.js 14 / Vercel)
- **Zweck:** Dashboard fuer Pipeline-Monitoring + Location-Management
- **Hosting:** Vercel (Auto-Deploy)
- **Auth:** Supabase Auth via @supabase/ssr
- **Error Tracking:** Sentry (@sentry/nextjs)
- **Logging:** Pino (strukturiert, JSON)
- **Routes:** /dashboard, /dashboard/locations, /dashboard/businesses, /dashboard/runs, /dashboard/ops

### Datenbank (Supabase / PostgreSQL)
- **Zweck:** State Store + REST API fuer alle Workflows
- **Projekt:** wknzyrvcrcdchnysntii (eu-central-1)
- **RLS:** Aktiviert auf allen Tabellen (7/7 + DLQ)
- **Enums:** `location_pipeline_stage`, `business_pipeline_stage`
- **Monitoring Views:** pipeline_errors, system_logs_summary, location_throughput, business_throughput

### Automation (n8n / Docker lokal)
- **Zweck:** 7 Pipeline-Workflows + 4 Ops-Workflows + Error Logger
- **Lokal:** http://localhost:5678
- **Oeffentlich:** https://n8n.hoba-consulting.com (Cloudflare Tunnel)
- **Trigger-Typen:** Schedule (Cron) + Webhook (Test) + Manual + Error Trigger

---

## Technische Entscheidungen

| Entscheidung | Begruendung |
|---|---|
| pipeline_stage als PostgreSQL ENUM | Typsicherheit, verhindert Tippfehler |
| Kein Orchestrator | Jeder WF unabhaengig, ein Fehler bricht nicht die Kette |
| SplitInBatches + Reduce to One (WF 02) | Batch-Upserts fuer Performance, PATCH nur 1x pro Location |
| Webhook Trigger fuer Tests | Manuelle Tests ohne auf Cron warten zu muessen |
| 04a/04b Dispatcher-Worker Pattern | Parallel-Verarbeitung, ein Worker pro Business |
| Hetzner SMTP statt Gmail | Eigene Domain, kein OAuth noetig |
| Custom Hooks als Data Access Layer | Separation of Concerns ohne Overengineering (ADR-003) |
| Client-Side Data Fetching | RLS als Security Layer, keine API Routes noetig (ADR-001) |
| system_logs Tabelle | Zentrales Logging fuer n8n, Next.js, Supabase |
| Dead Letter Queue | Fehlgeschlagene Items nach max_retries nicht verlieren |

---

## Performance & Limits

| System | Limit | Konfiguration |
|---|---|---|
| n8n Concurrency | 40 parallel | N8N_CONCURRENCY_PRODUCTION_LIMIT=40 |
| n8n Task Runner | 2GB RAM | N8N_RUNNERS_MAX_OLD_SPACE_SIZE=2048 |
| Apify | 8 Locations/Batch | WF 01 LIMIT 8 |
| Import Batches | 1000 Businesses/Batch | WF 02 batchSize: 1000 |
| OpenAI Rate Limit | 200ms zwischen Calls | WF 03 Rate Limit Node |
| Enrichment | 200 Businesses/Batch | WF 04a LIMIT 200 |
