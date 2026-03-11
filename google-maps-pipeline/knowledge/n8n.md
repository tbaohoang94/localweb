# n8n — Google Maps Lead Pipeline

> Workflow-Uebersicht, Credentials und Konventionen.

---

## Instanz

| Feld | Wert |
|---|---|
| Lokal | http://localhost:5678 |
| Oeffentlich | https://n8n.hoba-consulting.com (Cloudflare Tunnel) |
| Docker | clients/localweb/n8n/docker/ |
| Start | `cd clients/localweb/n8n/docker && docker compose up -d` |

## Credentials (n8n Credential Store)

| Name | Typ | Genutzt von |
|---|---|---|
| Apify | httpBearerAuth (ID: H7EaKB5yYzqhBgZ8) | WF 01, 01b, 02 |
| OpenAI | openAiApi | WF 03, 04b |
| SMTP account | smtp (ID: iBtNZwUPeBcnCSwj) | WF 05, 07, 08, 09, 11 |

## Environment Variables (docker-compose.yml)

| Variable | Genutzt von |
|---|---|
| SUPABASE_GOOGLE_URL | Alle Workflows |
| SUPABASE_GOOGLE_KEY | Alle Workflows |
| NOTIFICATION_EMAIL | WF 05 (CSV), WF 07 (Alerts) |
| OPENAI_API_KEY | WF 03, 04b |
| APIFY_API_TOKEN | WF 01 (nur als Env-Backup) |

## Workflows

| # | Name | n8n ID | Schedule | Picks | Status |
|---|---|---|---|---|---|
| 01 | Start Apify Scrape | F3srgLPW6bSR6Zz8 | 5min | locations: new | aktiv |
| 01b | Check Running Scrapes | vhHeUPkWhf3ytVQQ | 15min | locations: scraping | aktiv |
| 02 | Import Apify Results | 2fULkCGYnqSao0Pj | 5min | locations: scraped | aktiv |
| 03 | Category Qualification | ovaC9LDlCyKoCUQf | 10min | businesses: new | aktiv |
| 04a | Enrich Dispatcher | rFiqpelsSpVA9Vdf | 10min | businesses: qualified | aktiv |
| 04b | Enrich Worker | heraaLvlLKybMM63 | (sub-workflow) | (von 04a aufgerufen) | aktiv |
| 05 | CSV Export Email | 4zpyukFmVU2SGIcd | taeglich 18:00 | businesses: enriched | aktiv |
| 07 | Error Logger | 75nGTzEeTlBQmlys | (error trigger) | (alle WFs) | aktiv |
| 08 | Health Check | — | 5min | Supabase + n8n | **neu (inaktiv)** |
| 09 | Daily Digest | — | taeglich 08:00 | system_logs + pipeline_errors | **neu (inaktiv)** |
| 10 | Workflow Backup | — | taeglich 02:00 | Alle Workflows | **neu (inaktiv)** |
| 11 | Pipeline Integrity Check | — | 6h | pipeline_errors + DLQ | **neu (inaktiv)** |
| 00 | Orchestrator | nqjp292XCUkdiGNC | — | — | **deaktiviert** |

## Webhook-Trigger (fuer Tests)

| Workflow | Pfad | URL |
|---|---|---|
| WF 03 | test-wf03 | https://n8n.hoba-consulting.com/webhook/test-wf03 |
| WF 04a | test-wf04a | https://n8n.hoba-consulting.com/webhook/test-wf04a |
| WF 05 | test-wf05 | https://n8n.hoba-consulting.com/webhook/test-wf05 |

## Workflow-Muster

Jeder Workflow folgt demselben Pattern:

```
Schedule Trigger (Cron) / Webhook Trigger (Test)
  → SELECT items WHERE pipeline_stage = '{expected}' LIMIT {batch}
  → Has Items?
    → Ja: Verarbeite jedes Item
      → Erfolg: SET pipeline_stage = '{next}'
      → Fehler: SET pipeline_stage = '{failed}', last_error, retry_count++
    → Nein: Ende
```

## Konventionen

- Alle Workflows nutzen `errorWorkflow: "75nGTzEeTlBQmlys"` (WF 07)
- HTTP-Requests an Supabase: retryOnFail mit maxTries: 3
- Node IDs: kebab-case (z.B. `mark-imported`, `check-apify`)
- JSON Body: Nur pipeline_stage + relevante Datenfelder (keine Legacy-Spalten)
