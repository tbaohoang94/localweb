# Google Maps Lead Pipeline — Workflow Documentation

## Pipeline Overview

```
Architektur: Event-driven State Machine (kein zentraler Orchestrator)
Jeder Workflow laeuft unabhaengig auf eigenem Cron-Schedule.

  [WF 01] Start Apify Scrape (Cron: 5min)
         → locations WHERE pipeline_stage = 'new'
         → Startet Apify Run, setzt pipeline_stage = 'scraping'

  [WF 01b] Check Running Scrapes (Cron: 15min)
         → locations WHERE pipeline_stage = 'scraping'
         → Prueft Apify Status → 'scraped' oder 'failed_scrape'

  [WF 02] Import Apify Results (Cron: 5min)
         → locations WHERE pipeline_stage = 'scraped'
         → Importiert Dataset → Businesses (pipeline_stage = 'new')
         → Location → 'imported'

  [WF 03] Category Qualification (Cron: 10min + Webhook)
         → businesses WHERE pipeline_stage = 'new'
         → OpenAI Kategorie-Check → 'qualified' oder 'unqualified'

  [WF 04a] Enrich Dispatcher (Cron: 10min + Webhook)
         → businesses WHERE pipeline_stage = 'qualified'
         → Setzt 'enriching', feuert WF 04b pro Business

  [WF 04b] Enrich Worker (Sub-Workflow, fire-and-forget)
         → Puppeteer + OpenAI → 'enriched' oder 'failed_enrich'

  [WF 05] CSV Export & Email (Cron: taeglich 18:00 + Webhook)
         → businesses WHERE pipeline_stage = 'enriched'
         → CSV bauen, Email senden → 'exported'

  [WF 07] Error Logger (Error Trigger)
         → Faengt Fehler aller Workflows, sendet Alert-Email

  [WF 00] Orchestrator — DEAKTIVIERT (ersetzt durch unabhaengige Cron-Schedules)
```

## Database (Supabase)

Schema: `knowledge/supabase-schema.sql`
Projekt: wknzyrvcrcdchnysntii

| Table | Purpose |
|---|---|
| `cities` | Statische Staedteliste |
| `locations` | Stadt × Suchbegriff + Scrape-Tracking |
| `businesses` | Google Maps Ergebnisse + Enrichment + Kontaktdaten |
| `pipeline_runs` | Workflow-Monitoring |
| `workflow_logs` | Error-Logs (WF 07) |
| `custom_fields` | Close.io Mappings (out of scope) |

### Pipeline Stage (zentrale Steuerung)

**locations** — PostgreSQL ENUM `location_pipeline_stage`:

| Stage | Bedeutung | Gesetzt von |
|---|---|---|
| `new` | Bereit zum Scrapen | Frontend / manuell |
| `scraping` | Apify Run laeuft | WF 01 |
| `scraped` | Apify fertig, Import steht aus | WF 01b |
| `imported` | Businesses importiert | WF 02 |
| `failed_scrape` | Scraping fehlgeschlagen | WF 01b / WF 02 |

**businesses** — PostgreSQL ENUM `business_pipeline_stage`:

| Stage | Bedeutung | Gesetzt von |
|---|---|---|
| `new` | Frisch importiert | WF 02 |
| `qualified` | Kategorie passt | WF 03 |
| `unqualified` | Kategorie passt nicht (Endstatus) | WF 03 |
| `enriching` | Website wird gescraped | WF 04a |
| `enriched` | Kontaktdaten extrahiert | WF 04b |
| `failed_enrich` | Enrichment fehlgeschlagen | WF 04b |
| `exported` | CSV exportiert (Endstatus) | WF 05 |

### Key businesses columns

| Column | Type | Description |
|---|---|---|
| `pipeline_stage` | business_pipeline_stage | Zentraler Status (ENUM) |
| `website_summary` | text | AI-generierte Firmenbeschreibung |
| `im_contact_name` | text | Kontaktname aus Impressum |
| `im_email` | text | Email aus Impressum |
| `im_tel` | text | Telefon aus Impressum |
| `enriched_at` | timestamptz | Enrichment-Zeitpunkt |
| `qualification_reason` | text | OpenAI-Begruendung |
| `qualified_at` | timestamptz | Qualifizierungs-Zeitpunkt |
| `retry_count` | integer | Anzahl Retry-Versuche |
| `last_error` | text | Letzte Fehlermeldung |

---

## WF 01 — Start Apify Scrape

**n8n ID**: `F3srgLPW6bSR6Zz8` | **Trigger**: Schedule (5min) + Manual
**File**: `workflows/google-maps-pipeline/01-start-apify-scrape.json`

```
Schedule Trigger (5min) / Manual Trigger
  → GET locations WHERE pipeline_stage = 'new' LIMIT 8
  → Has Items?
    → Loop: Start Apify Run pro Location
      → PATCH: pipeline_stage = 'scraping', apify_run_id = ...
    → Wait 2s zwischen Locations
```

## WF 01b — Check Running Scrapes

**n8n ID**: `vhHeUPkWhf3ytVQQ` | **Trigger**: Schedule (15min)
**File**: `workflows/google-maps-pipeline/01b-check-running-scrapes.json`

```
Schedule Trigger (15min)
  → GET locations WHERE pipeline_stage = 'scraping'
  → Loop: Check Apify Run Status
    → SUCCEEDED: pipeline_stage = 'scraped'
    → FAILED/andere: pipeline_stage = 'failed_scrape', retry_count++
    → RUNNING: nichts tun (naechster Cron prueft erneut)
```

## WF 02 — Import Apify Results

**n8n ID**: `2fULkCGYnqSao0Pj` | **Trigger**: Schedule (5min) + Manual
**File**: `workflows/google-maps-pipeline/02-import-apify-results.json`

```
Schedule Trigger (5min)
  → GET locations WHERE pipeline_stage = 'scraped' LIMIT 5
  → Loop Locations:
    → Check Apify Run Status
    → SUCCEEDED:
      → Get Dataset Items
      → Normalize Data (deduplizieren, Felder mappen)
      → Batch Items (SplitInBatches, 1000 pro Batch)
        → Prepare Batch → Upsert Business (POST, on_conflict=place_id)
      → Reduce to One (verhindert N-faches PATCH)
      → Mark Location Imported (pipeline_stage = 'imported')
    → Andere: Mark Import Failed (pipeline_stage = 'failed_scrape')
    → Wait 2s
```

**Wichtig:** Der "Reduce to One" Node zwischen Batch Items (done) und Mark Location Imported
verhindert, dass der PATCH N-mal ausgefuehrt wird (SplitInBatches gibt alle Items auf Output 0 weiter).

## WF 03 — Category Qualification

**n8n ID**: `ovaC9LDlCyKoCUQf` | **Trigger**: Schedule (10min) + Webhook (test-wf03)
**File**: `workflows/google-maps-pipeline/03-category-qualification.json`

```
Schedule/Webhook Trigger
  → GET businesses: DISTINCT keyword+category WHERE pipeline_stage = 'new'
  → Loop (keyword, category) Paare:
    → OpenAI: "Passt Kategorie X zum Suchbegriff Y?"
    → Relevant?
      → Ja: Bulk PATCH pipeline_stage = 'qualified' (alle mit dieser Kombination)
      → Nein: Bulk PATCH pipeline_stage = 'unqualified'
    → Rate Limit 200ms
```

Effizienz: 1605 Businesses mit 45 Kategorien = 45 OpenAI-Calls statt 1605.

## WF 04a — Enrich Dispatcher

**n8n ID**: `rFiqpelsSpVA9Vdf` | **Trigger**: Schedule (10min) + Webhook (test-wf04a)
**File**: `workflows/google-maps-pipeline/04a-enrich-dispatcher.json`

```
Schedule/Webhook Trigger
  → Reset Stuck Items (>30min in 'enriching' → 'failed_enrich')
  → Bulk PATCH: pipeline_stage = 'enriching' (qualified + website != null)
  → GET businesses WHERE pipeline_stage = 'enriching' (paginated, max 200)
  → Loop: Fire WF 04b pro Business (waitForSubWorkflow=false)
  → Rate Limit 250ms
```

## WF 04b — Enrich Worker

**n8n ID**: `heraaLvlLKybMM63` | **Trigger**: Execute Workflow Trigger (von 04a)
**File**: `workflows/google-maps-pipeline/04b-enrich-worker.json`
**Muss aktiv sein** fuer fire-and-forget Execution.

```
Execute Workflow Trigger (receives {id, name, website, place_id})
  → Fetch Website (Puppeteer/HTTP)
  → Clean HTML, find Impressum Link
  → Fetch Impressum
  → OpenAI Extract (gpt-4o-mini): website_summary, contact_name, email, phone
  → Erfolg: pipeline_stage = 'enriched'
  → Fehler: pipeline_stage = 'failed_enrich', last_error
```

## WF 05 — CSV Export & Email

**n8n ID**: `4zpyukFmVU2SGIcd` | **Trigger**: Schedule (taeglich 18:00) + Webhook (test-wf05)
**File**: `workflows/google-maps-pipeline/05-csv-export-email.json`

```
Schedule/Webhook Trigger
  → GET businesses WHERE pipeline_stage = 'enriched' AND (im_tel OR phone NOT NULL)
  → Build CSV (23 Spalten)
  → Has Items?
    → Chunk IDs (500er Batches)
    → Loop: Bulk PATCH pipeline_stage = 'exported'
    → Prepare Email (CSV als Attachment)
    → Send Email (SMTP, Hetzner Mail)
```

## WF 07 — Error Logger

**n8n ID**: `75nGTzEeTlBQmlys` | **Trigger**: Error Trigger
**File**: `workflows/google-maps-pipeline/07-error-logger.json`
**Muss aktiv sein** — konfiguriert als `errorWorkflow` auf allen Workflows.

```
Error Trigger
  → Write Error Log (POST → workflow_logs)
  → Send Error Alert (Email via SMTP, onError: continueRegularOutput)
```

---

## Credentials (n8n Credential Store)

| Name | Typ | ID | Genutzt von |
|---|---|---|---|
| Apify | httpBearerAuth | H7EaKB5yYzqhBgZ8 | WF 01, 01b, 02 |
| OpenAI | openAiApi | — | WF 03, 04b |
| SMTP account | smtp | iBtNZwUPeBcnCSwj | WF 05, 07 |

## Environment Variables

| Variable | Genutzt von |
|---|---|
| `SUPABASE_GOOGLE_URL` | Alle Workflows |
| `SUPABASE_GOOGLE_KEY` | Alle Workflows |
| `NOTIFICATION_EMAIL` | WF 05, WF 07 |
| `OPENAI_API_KEY` | WF 03, 04b |

## Workflow IDs

| Workflow | n8n ID | Status |
|---|---|---|
| 00 - Orchestrator | `nqjp292XCUkdiGNC` | **deaktiviert** |
| 01 - Start Apify Scrape | `F3srgLPW6bSR6Zz8` | aktiv |
| 01b - Check Running Scrapes | `vhHeUPkWhf3ytVQQ` | aktiv |
| 02 - Import Apify Results | `2fULkCGYnqSao0Pj` | aktiv |
| 03 - Category Qualification | `ovaC9LDlCyKoCUQf` | aktiv |
| 04a - Enrich Dispatcher | `rFiqpelsSpVA9Vdf` | aktiv |
| 04b - Enrich Worker | `heraaLvlLKybMM63` | aktiv |
| 05 - CSV Export Email | `4zpyukFmVU2SGIcd` | aktiv |
| 07 - Error Logger | `75nGTzEeTlBQmlys` | aktiv |

## Webhook-Trigger (fuer Tests)

| Workflow | Pfad | URL |
|---|---|---|
| WF 03 | test-wf03 | https://n8n.hoba-consulting.com/webhook/test-wf03 |
| WF 04a | test-wf04a | https://n8n.hoba-consulting.com/webhook/test-wf04a |
| WF 05 | test-wf05 | https://n8n.hoba-consulting.com/webhook/test-wf05 |
