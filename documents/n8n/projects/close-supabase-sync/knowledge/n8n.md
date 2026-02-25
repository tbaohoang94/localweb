# n8n Knowledge

## Architecture Patterns Used

### Orchestrator Pattern
Master workflow triggers sub-workflows via Execute Workflow nodes.
- Workflow: `1. Orchestrator` (dyTx5AbwsNO5WGaL)
- Controls date windowing via Airtable Dates table
- Triggers: Get Custom Activities, Get Opportunities

### Pagination Loop
```
HTTP Request -> Process Page -> More Pages? -> Wait (rate limit) -> Loop Back
```
Used for Close.io API calls that return paginated results.

### Enrich Pipeline
```
Fetch data -> Extract IDs -> Get related records -> Merge -> Map -> Upsert
```
Activities/Opportunities enriched with Lead and User data before Airtable upsert.

### Date Windowing
```
Init Date Window -> Set Today -> Query with date_created >= start AND date_created <= end
```
Used by Orchestrator to process data day-by-day.

### Lead Matching
Search Close by email/name, match to Airtable lead record by `lead_id`.

## Known Issues & Fixes

### IF Node: Boolean type mismatch
- IF node with `typeValidation: "strict"` fails when comparing JS booleans from Code nodes
- **Fix**: Set `typeValidation: "loose"` on IF nodes that receive data from Code nodes
- Error: `Wrong type: 'true' is a string but was expecting a boolean`

### HTTP Request: Batch execution
- HTTP Request node runs ONCE PER INPUT ITEM by default
- For batch upserts: aggregate all items into ONE item first (Code node), then send
- Otherwise N items × N rows = N² results

### Count Records after Upsert
- Supabase returns upserted rows as individual items, not as array
- Use `$input.all().length` not `Array.isArray($input.first().json)`

## Known Limitations

- **Webhook activation**: In n8n 2.x, webhooks must be activated through the editor UI. API-based activation sets the flag but doesn't register the listener.
- **Close.io**: No dedicated n8n node. All calls use HTTP Request with header auth.
- **Airtable Meta API**: Token lacks `schema.bases:read` scope.
- **Apify nodes**: `@apify/n8n-nodes-apify` must be installed in Docker image. Causes activation errors if missing.
- **Code node external modules**: Only allowed: `apify-client`, `cheerio`, `puppeteer`, `puppeteer-core`.
