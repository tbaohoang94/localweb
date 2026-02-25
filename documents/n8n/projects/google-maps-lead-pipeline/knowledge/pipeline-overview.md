# Google Maps Lead Pipeline - Workflow Documentation

## Pipeline Overview

```
  [WF 00] Orchestrator (Manual / Daily)
         |
         ├──→ [WF 01] Start Apify Scrape (wait=true)
         │         └──→ [WF 01b] internal polling → [WF 02] Import Results
         │
         ├──→ [WF 03] Category Qualification (wait=true)
         │
         ├──→ [WF 04a] Enrich Dispatcher (wait=true)
         │         └──→ [WF 04b] Enrich Worker (fire-and-forget, parallel)
         │
         ├──→ Polling Loop: wait until enrichment_status=pending count = 0
         │         └──→ Timeout 45min → stopAndError → WF 07
         │
         └──→ [WF 05] CSV Export & Email (wait=true)

  [WF 06] Export to Close.io (manual fallback, not in orchestrator)

  All Workflows ──→ [WF 07] Error Logger (errorWorkflow)
```

## Database (Supabase)

Schema: `knowledge/supabase-schema.sql`

| Table | Purpose |
|-------|---------|
| `cities` | Static city list |
| `locations` | city x keyword combinations + scrape tracking (apify_run_id, scrape_status, scraped_at, scrape_finished_at, scrape_total_results) |
| `businesses` | Core business data + enrichment fields |
| `custom_fields` | Close.io custom field ID mappings |
| `workflow_logs` | Execution logging per workflow |

### Key `businesses` columns for enrichment

| Column | Type | Values |
|--------|------|--------|
| `enrichment_status` | text | `null` (unenriched), `pending`, `enriched`, `failed` |
| `website_summary` | text | AI-generated company description |
| `im_contact_name` | text | Geschaeftsfuehrer/CEO from Impressum |
| `im_email` | text | Email from Impressum |
| `im_tel` | text | Phone from Impressum |
| `enriched_at` | timestamptz | Timestamp of enrichment |
| `qualification_status` | text | `null` (new), `qualified`, `unqualified` |
| `qualification_reason` | text | AI-generated reason for qualification decision |
| `qualified_at` | timestamptz | Timestamp of qualification |

---

## WF 00 - Orchestrator

**ID**: `nkvX4mOjOpHqIGY2` | **Trigger**: Manual
**File**: `workflows/00-orchestrator.json`

Single entry point for the complete pipeline. Executes all steps sequentially with enrichment polling.

### Flow

```
Manual Trigger
  → Log Start (POST workflow_logs: status=started)
  → Build Search Filter (Code: extract unique queries)
  → Has Locations? (IF: searchFilter not empty)
    ├─ TRUE: Execute pipeline (WF 01 → 03 → 04a → polling → WF 05)
    └─ FALSE: Log No Locations → end
  → Execute WF 01 - Scrape (wait=true, can take 30+ min)
  → Execute WF 03 - Qualify (wait=true)
  → Execute WF 04a - Dispatch (wait=true, returns quickly)
  → Record Dispatch Time (Code: save timestamp + 45min timeout)
  → Polling Loop:
      Wait 30s (Code: sleep)
      → Check Pending (GET businesses?enrichment_status=eq.pending&select=id&limit=1)
      → Evaluate Poll (Code: hasPending, isTimedOut, elapsedMinutes)
      → Enrichment Complete? (IF: hasPending=false)
        ├─ TRUE:  Execute WF 05 - CSV Export (wait=true) → Log Completion
        └─ FALSE: Timeout? (IF: isTimedOut=true)
          ├─ TRUE:  Enrichment Timeout (stopAndError → WF 07)
          └─ FALSE: Wait 30s (loop back)
```

### Key Design Decisions

- **`waitForSubWorkflow: true`** on all Execute Workflow nodes: Orchestrator waits for each step to finish before proceeding.
- **Enrichment Polling**: WF 04a dispatches workers with `waitForSubWorkflow: false`. Workers run in background. Orchestrator polls Supabase every 30s until no `pending` items remain.
- **Timeout 45min**: 3000 items take ~12min. 45min = 3.75x safety margin. Timeout triggers `stopAndError` → caught by WF 07.
- **`executionTimeout: -1`**: Unlimited execution time (WF 01 Apify polling can take 30+ minutes alone).
- **Check Pending retries**: `retryOnFail: true`, `maxTries: 3`, `waitBetweenTries: 5000ms` for transient Supabase errors.

### Child Workflow Changes

Each child workflow has an `executeWorkflowTrigger` node alongside its original trigger:
- **WF 01**: `executeWorkflowTrigger` → "Get Unscraped Locations"
- **WF 03**: `executeWorkflowTrigger` → "Get Categories"
- **WF 04a**: `executeWorkflowTrigger` → "Reset Stuck Items" (Schedule Trigger disabled)
- **WF 05**: `executeWorkflowTrigger` → "Get Businesses" (replaces WF 06 in orchestrator)
- **WF 06**: `executeWorkflowTrigger` → "Get Qualified Businesses" (Schedule Trigger disabled, manual fallback)

### Logging

- **Start**: `workflow_logs` entry with `status=started`, `execution_id`, `run_date`
- **Completion**: `workflow_logs` entry with `status=completed`, `execution_id`, `elapsedMinutes`
- **Error**: Caught by WF 07 (configured as `errorWorkflow`)

---

## WF 01 - Start Apify Scrape

**ID**: `lbyXKgVpYP6jryDu` | **Trigger**: Execute Workflow Trigger (called by WF 00) / Manual

Fetches unscraped locations (`scrape_status IS NULL`) directly from `locations` table, then starts Apify Google Maps Scraper actor runs for each. Marks locations as `scrape_status=running` with `apify_run_id`.

## WF 01b - Check Running Scrapes

Polls locations with `scrape_status=running`, checks Apify run status, calls WF 02 for completed runs or marks locations as `scrape_status=failed`.

## WF 02 - Import Apify Results

**ID**: `59tTad4B9Ryv2O67` | **Trigger**: Execute Workflow Trigger / Chat Trigger

Takes `apify_run_id`, fetches results from Apify API, deduplicates by `place_id`, upserts into `businesses` table. Marks location as `scrape_status=finished` or `failed`.

## WF 03 - Category Qualification

**ID**: `4sjQWkilSRCgdQQa` | **Trigger**: Execute Workflow Trigger (called by WF 00) / Manual
**File**: `workflows/03-category-qualification.json`

Pre-enrichment filter: checks if Google Maps `category` matches `search_string` using OpenAI. Irrelevant businesses (e.g. "Steuerberater" from "Umzugsunternehmen" search) are marked `unqualified` and skipped by WF 04 + WF 06.

### Efficiency

Batches by unique (keyword, category) pairs. Example: 1605 businesses with 45 unique categories = 45 OpenAI calls instead of 1605.

### Flow

```
Manual Trigger
  → Get Categories (GET: qualification_status IS NULL, category NOT NULL, paginated)
  → Extract Unique Pairs (Code: deduplicate by keyword + category)
  → Loop Over Pairs (SplitInBatches, batchSize=1)
    → OpenAI Category Check (gpt-4o-mini, JSON response)
    → Parse Result (Code: extract relevant boolean)
    → Is Relevant? (IF)
      ├─ TRUE:  Mark Qualified (PATCH: qualification_status=qualified, bulk by category+keyword)
      └─ FALSE: Mark Unqualified (PATCH: qualification_status=unqualified, bulk by category+keyword)
    → Rate Limit 200ms
    → Loop (back)
```

### Keyword Extraction

`search_string` = "Umzugsunternehmen Magdeburg Deutschland" → keyword = first word = "Umzugsunternehmen". Bulk PATCH uses `search_string=like.keyword*` to match all cities.

### Impact on Other Workflows

- **WF 04a**: `Mark All Pending` filter includes `qualification_status=neq.unqualified` → unqualified businesses are not enriched
- **WF 05**: `Get Businesses` filter includes `qualification_status=neq.unqualified` → unqualified businesses are not exported
- **WF 06**: `Get Qualified Businesses` filter includes `qualification_status=neq.unqualified` → unqualified businesses are not exported (manual fallback)

---

## WF 04a - Enrich Dispatcher

**ID**: `qFqHqkg2nsX3jP59` | **Trigger**: Execute Workflow Trigger (called by WF 00) / Schedule (disabled)
**File**: `workflows/04a-enrich-dispatcher.json`

Fetches unenriched businesses and dispatches them to parallel worker sub-workflows.

### Flow

```
Schedule Trigger (5min)
  → Reset Stuck Items (PATCH: pending > 30min → null)
  → Mark All Pending (PATCH: enrichment_status IS NULL → pending, filter-based)
  → Get Pending (GET: enrichment_status=pending, paginated offset/limit=1000)
  → Has Items? (IF length > 0)
  → Loop (SplitInBatches, batchSize=1)
    → Fire Worker (Execute Workflow 04b, waitForSubWorkflow=false)
    → Rate Limit 250ms (Code: sleep 250ms)
    → Loop (back)
```

### Key Design Decisions

- **`waitForSubWorkflow: false`**: Fire-and-forget. Dispatcher doesn't wait for workers. Workers execute in parallel via n8n's execution queue.
- **Mark All Pending (filter-based)**: Single PATCH with filter `website=not.is.null&enrichment_status=is.null&qualification_status=neq.unqualified&permanently_closed=neq.true` marks all unenriched items as `pending`. Skips businesses marked `unqualified` by WF 03 and permanently closed businesses. No ID collection needed. Prevents duplicate processing if dispatcher runs again before workers finish.
- **Offset-based pagination**: Supabase PostgREST `max-rows` caps at 1000. HTTP node's built-in pagination (`updateAParameterInEachRequest` with `offset` query param, `limit=1000`) fetches all pending items across multiple pages.
- **Reset Stuck Items**: If items stay `pending` for >30 minutes (crashed worker), they get reset to `null` for re-processing.
- **Rate Limit 250ms**: ~240 dispatches/min. Prevents overwhelming n8n execution queue and OpenAI API (gpt-4o-mini RPM limit).

### Node Configuration Notes

- Execute Workflow v1.2 requires `workflowId` as object: `{ "value": "<id>" }`
- Rate Limit Code must re-wrap items: `$input.all().map(item => ({ json: item.json }))` (Execute Workflow adds metadata that conflicts with Code node output validation)
- IF node: use `looseTypeValidation: true` (expression `$input.all().length` returns string in some contexts)

---

## WF 04b - Enrich Worker

**ID**: `4CacfauoGzrNDHhp` | **Trigger**: Execute Workflow Trigger (called by 04a)
**File**: `workflows/04b-enrich-worker.json`
**Must be active** (`active: true`) for fire-and-forget execution.

Processes a single business: fetches website + impressum, extracts data via OpenAI, saves to Supabase.

### Flow

```
Execute Workflow Trigger (receives {id, name, website, place_id})
  → Fetch Website (HTTP GET, onError: continueRegularOutput)
  → Check Success (IF: no error)
    ├─ TRUE:
    │   → Clean Homepage HTML (Code: strip tags, extract text, find impressum link)
    │   → Create Impressum URL (Code: use detected link or fallback to baseUrl + '/impressum')
    │   → Fetch Impressum (HTTP GET, onError: continueRegularOutput)
    │   → Combine Homepage and Impressum (Code: IMPRESSUM first, then HOMEPAGE, max 12000 chars)
    │   → OpenAI Extract (HTTP POST gpt-4o-mini, JSON response format)
    │   → Parse Enrichment (Code: extract fields from OpenAI response)
    │   → Check Parse (IF: success=true)
    │     ├─ TRUE:  Save Full Enrichment (PATCH: enrichment_status=enriched + data)
    │     └─ FALSE: Mark Failed (PATCH: enrichment_status=failed)
    └─ FALSE:
        → Mark Failed (PATCH: enrichment_status=failed)
```

### OpenAI Prompt (gpt-4o-mini)

Extracts from German business websites:
- `website_summary`: 1-2 sentences about what the company offers
- `geschaeftsfuehrer`: Array of CEO/owner names (from Impressum section only)
- `email`: Business email (only if actually found, never invented)
- `phone`: Business phone (only if actually found, never invented)

### Error Handling

- `onError: continueRegularOutput` on Fetch Website, Fetch Impressum, OpenAI Extract
- `onError: continueErrorOutput` on Check Success (routes errors to Mark Failed)
- OpenAI Extract: `retryOnFail: true`, `maxTries: 3`, `waitBetweenTries: 5000ms` (handles 429/5xx)
- Cloudflare-protected pages are detected and treated as empty
- Parse failures (invalid JSON from OpenAI) → Mark Failed
- Email validation: TLD must be at least 2 chars (`/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/`)

---

## WF 05 - CSV Export & Email

**ID**: `j9OWBXm1AMH54Ieq` | **Trigger**: Execute Workflow Trigger (called by WF 00) / Manual
**File**: `workflows/05-csv-export-email.json`

Replaces WF 06 in the orchestrator. Creates a CSV with all export-ready businesses, sends it via Gmail, and marks businesses as exported. CSV can be manually imported into Close.io.

### Flow

```
Execute Workflow Trigger / Manual Trigger
  → Get Businesses (GET Supabase, paginated, same filter as WF 06)
  → Build CSV (Code: 23 columns, binary attachment)
  → Has Items? (IF count > 0)
    ├─ TRUE:
    │   → Send Email (Gmail: CSV attachment + summary)
    │   → Chunk IDs (Code: split into chunks of 500)
    │   → Loop Chunks (SplitInBatches)
    │     → Mark Exported (PATCH: close_export_status=csv_sent, bulk by ID chunk)
    │     → Loop (back)
    └─ FALSE: (end)
```

### Supabase Filter

Same filter as WF 06: `close_export_status IS NULL AND qualification_status != unqualified AND (website IS NULL OR enrichment_status = enriched) AND (im_tel IS NOT NULL OR phone IS NOT NULL)`.

### CSV Columns (23)

Company, Contact Name, Contact Email, Contact Phone, URL, Website, Description, Street, City, Zip, Country, Website Summary, Rating, Reviews, Neighborhood, Search Keyword, Rank, Images, Claimed, Opening Hours, Place ID, FID, Qualification Reason.

### Mark Exported

Bulk PATCH using PostgREST `in` operator: `?id=in.(uuid1,uuid2,...)`. Chunked at 500 IDs per request to stay within URL length limits. Sets `close_export_status=csv_sent` and `close_exported_at`.

### Prerequisites

- SMTP credentials configured in n8n UI (Settings → Credentials → SMTP)
- `NOTIFICATION_EMAIL` environment variable set in n8n (used as from + to address)

---

## WF 06 - Export to Close.io (Manual Fallback)

**ID**: `M1iq7GgNfM3S118h` | **Trigger**: Execute Workflow Trigger / Manual

Manual fallback for direct Close.io API export (slow, per-lead POST). Replaced by WF 05 in orchestrator. Filters: `close_export_status IS NULL AND qualification_status != unqualified AND (website IS NULL OR enrichment_status = enriched) AND (im_tel IS NOT NULL OR phone IS NOT NULL)`.

Maps 20+ fields including 12 custom fields from `custom_fields` table.

---

## WF 07 - Error Logger

**ID**: `5Twy03WAFur7CZcD` | **Trigger**: Error Trigger
**File**: `workflows/07-error-logger.json`
**Must be active** (`active: true`) for error catching.

Central error logging workflow. Configured as `errorWorkflow` on all other workflows (WF 01, 02, 03, 04a, 04b, 06). Automatically triggered by n8n when any workflow fails.

### Flow

```
Error Trigger (receives execution error context)
  → Write Error Log (POST → workflow_logs)
  → Send Error Alert (Email via SMTP, onError: continueRegularOutput)
```

### Logged Fields

| Field | Source |
|-------|--------|
| `workflow_name` | `$json.workflow.name` |
| `execution_id` | `$json.execution.id` |
| `status` | `"error"` |
| `error_node` | `$json.execution.error.node.name` |
| `error_message` | `$json.execution.error.message` (max 500 chars) |
| `details` | `{ workflowId, executionUrl }` |

### Success Logging

WF 06 has dedicated success logging (`Aggregate Log` → `Write Log`) that writes `status=completed` with `execution_id` and `items_count` to `workflow_logs` after the loop completes.

---

## Performance

| Metric | Old (WF 04 sequential) | New (WF 04a+04b parallel) |
|--------|----------------------|--------------------------|
| 44 items | ~5.5 min | ~35 sec |
| 200 items | ~25 min | ~2.5 min |
| 3000 items | ~6.25 hours | ~12 min |

## Environment Variables (n8n)

| Variable | Used by |
|----------|---------|
| `SUPABASE_GOOGLE_URL` | All workflows (Supabase REST API) |
| `SUPABASE_GOOGLE_KEY` | All workflows (service_role key) |
| `OPENAI_API_KEY` | WF 03 (qualification), WF 04b (enrichment) |
| `APIFY_API_TOKEN` | WF 01, 02, 03 |
| `CLOSE_API_KEY` | WF 06 |
| `NOTIFICATION_EMAIL` | WF 05 (CSV email), WF 07 (error alerts) |

## Workflow IDs

| Workflow | n8n ID | Status |
|----------|--------|--------|
| 00 - Orchestrator | `nkvX4mOjOpHqIGY2` | inactive (manual trigger) |
| 01 - Start Apify Scrape | `lbyXKgVpYP6jryDu` | active |
| 02 - Import Apify Results | `59tTad4B9Ryv2O67` | inactive |
| 03 - Category Qualification | `4sjQWkilSRCgdQQa` | inactive |
| 04a - Enrich Dispatcher | `qFqHqkg2nsX3jP59` | inactive (Schedule disabled, called by WF 00) |
| 04b - Enrich Worker | `4CacfauoGzrNDHhp` | **active** (required) |
| 05 - CSV Export & Email | `j9OWBXm1AMH54Ieq` | inactive (called by WF 00) |
| 06 - Export to Close | `M1iq7GgNfM3S118h` | inactive (manual fallback) |
| 07 - Error Logger | `5Twy03WAFur7CZcD` | **active** (required) |
