# Google Maps Lead Pipeline - Session Learnings & Reference

## 1. n8n MCP Tool Reference

### `n8n_update_partial_workflow` - Common Pitfalls

| Pitfall | Wrong | Correct |
|---------|-------|---------|
| addConnection params | `from` / `to` | `source` / `target` |
| updateNode params | `properties: {...}` | `updates: {...}` |
| Node identifier | `name: "Node Name"` (sometimes fails) | `nodeId: "node-id"` (reliable) |
| IF node branches | `branch: 0` / `branch: 1` | `branch: "true"` / `branch: "false"` |
| Atomic mode | All ops fail if one fails | Use `continueOnError: true` for best-effort |

### addConnection format
```json
{
  "type": "addConnection",
  "source": { "node": "Source Node", "output": 0 },
  "target": { "node": "Target Node", "input": 0 }
}
```

### rewireConnection format
```json
{
  "type": "rewireConnection",
  "source": "Source Node",
  "from": { "node": "Old Target", "output": 0 },
  "to": { "node": "New Target", "input": 0 }
}
```

### updateNode format
```json
{
  "type": "updateNode",
  "nodeId": "node-id",
  "updates": {
    "parameters": { ... }
  }
}
```

### Key Behaviors
- **Atomic by default**: If ANY operation fails, ALL are rolled back
- **Node names with special chars**: Use `nodeId` instead of `name`
- **IF node outputs**: `main[0]` = true branch, `main[1]` = false branch
- **SplitInBatches outputs**: `main[0]` = done, `main[1]` = current item
- **After UI edits**: Partial updates may be lost if user edits workflow in n8n UI (full overwrite). Always verify with `n8n_get_workflow` before assuming state.

### `n8n_create_workflow`
- Returns new workflow ID
- `errorWorkflow` can be set in `settings` during creation
- Workflow is created `active: false` by default
- Connections use node **names** (not IDs)

### `n8n_test_workflow`
- Only works with webhook/form/chat triggers
- **Does NOT work** with Manual Trigger or Schedule Trigger
- SSRF protection blocks localhost webhook calls in some n8n setups

---

## 2. Supabase PostgREST API

### Filter Syntax
```
?column=eq.value           -- equals
?column=neq.value          -- not equals
?column=is.null            -- IS NULL
?column=not.is.null        -- IS NOT NULL
?column=like.pattern*      -- LIKE with wildcard (* = SQL %)
?column=gt.value           -- greater than
?column=lt.value           -- less than
```

### Nested OR/AND Filters
**Problem**: Can't have two `or=` query params in same URL.
**Solution**: Use `and=()` wrapper:
```
?and=(or(col1.is.null,col1.eq.value1),or(col2.not.is.null,col3.not.is.null))
```

### Pagination
PostgREST `max-rows` default caps at 1000. Use n8n HTTP node pagination:
```json
{
  "pagination": {
    "paginationMode": "updateAParameterInEachRequest",
    "paginationCompleteWhen": "responseIsEmpty",
    "parameters": {
      "parameters": [
        { "type": "qs", "name": "offset", "value": "={{ $pageCount * 1000 }}" }
      ]
    }
  }
}
```

### Bulk PATCH with Filters
PATCH affects ALL rows matching the filter - no need for loops:
```
PATCH /rest/v1/businesses?qualification_status=is.null&category=eq.Steuerberater&search_string=like.Umzugsunternehmen*
Body: { "qualification_status": "unqualified" }
```
This updates ALL businesses matching the filter in one request.

### Headers (service_role)
```json
{
  "apikey": "{{ $env.SUPABASE_GOOGLE_KEY }}",
  "Authorization": "Bearer {{ $env.SUPABASE_GOOGLE_KEY }}",
  "Content-Type": "application/json",
  "Prefer": "return=minimal"  // or "return=representation" for response body
}
```

---

## 3. n8n Expression Syntax

### Common Patterns
```
={{ $json.field }}                    -- Current item field
={{ $env.VAR_NAME }}                  -- Environment variable
={{ $now.toISO() }}                   -- Current timestamp ISO
={{ $now.toISODate() }}               -- Current date only
={{ $now.minus({minutes: 30}).toISO() }}  -- 30 min ago
={{ $execution.id }}                  -- Current execution ID
={{ $('Node Name').first().json.field }}  -- Reference other node
={{ $input.all().length }}            -- Count all items
={{ $input.first().json.field }}      -- First item field
={{ $pageCount * 1000 }}              -- Pagination offset
={{ JSON.stringify($json.field) }}    -- JSON-safe string
={{ encodeURIComponent($json.field) }} -- URL-encode value
```

### Expression in JSON Body
n8n expressions in `jsonBody` with `specifyBody: "json"`:
- Prefix entire body with `=` to enable expressions
- Use `{{ }}` for expressions inside the JSON string
- Use `{{ JSON.stringify(...) }}` for values that need proper JSON escaping

Example:
```
"jsonBody": "={\n  \"field\": {{ JSON.stringify($json.value || '') }}\n}"
```

### OpenAI HTTP Request Body
Tricky part: embedding dynamic content in nested JSON messages:
```
"content": {{ JSON.stringify("Prefix: " + $json.field + "\nMore: " + $json.other) }}
```

---

## 4. Phone Number Normalization (German +49)

### Rules
1. Strip all non-digit/non-plus chars: `phone.replace(/[^\d+]/g, '')`
2. Handle trunk prefix `+49(0)xxx` → `+49xxx`: `if (phone.startsWith('+490')) phone = '+49' + phone.substring(4)`
3. Local format `0xxx` → `+49xxx`: `if (phone.startsWith('0') && !phone.startsWith('00')) phone = '+49' + phone.substring(1)`
4. Reject non-German: `if (!phone.startsWith('+49')) phone = null`

### Edge Cases Handled
| Input | Output |
|-------|--------|
| `(0431) 319 160` | `+49431319160` |
| `0431/319-160` | `+49431319160` |
| `+49 (0) 431 319160` | `+49431319160` |
| `+49431319160` | `+49431319160` (unchanged) |
| `0043 1234567` | `null` (Austrian, rejected) |

### Where Normalization Happens
- **WF 04b** (Parse Enrichment): Normalizes `im_tel` from OpenAI extraction
- **WF 04b** (Update Phone Fallback): Copies `im_tel` to `phone` if `phone` is NULL
- **WF 06** (Prepare Close Lead): Re-normalizes before Close.io export
- **SQL migration**: One-time cleanup of existing data in Supabase

---

## 5. Email Validation

Simple regex in WF 04b Parse Enrichment:
```js
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) email = null;
```
Rejects obviously invalid formats. Does not check DNS/MX.

---

## 6. Workflow Architecture

### Pipeline Order
```
WF 01  → Start Apify scrapes (manual)
WF 01b → Poll running scrapes
WF 02  → Import Apify results to Supabase
WF 03  → Category qualification (pre-enrichment filter)
WF 04a → Enrich dispatcher (schedule, fire-and-forget)
WF 04b → Enrich worker (sub-workflow, must be active)
WF 06  → Export to Close.io
WF 07  → Error logger (must be active, errorWorkflow on all WFs)
```

### Workflow IDs
| WF | n8n ID | Must be active? |
|----|--------|-----------------|
| 01 | `lbyXKgVpYP6jryDu` | No |
| 02 | `59tTad4B9Ryv2O67` | No |
| 03 | `4sjQWkilSRCgdQQa` | No |
| 04a | `qFqHqkg2nsX3jP59` | No (activate for production) |
| 04b | `4CacfauoGzrNDHhp` | **Yes** (sub-workflow) |
| 06 | `M1iq7GgNfM3S118h` | No |
| 07 | `5Twy03WAFur7CZcD` | **Yes** (error handler) |

### Error Workflow
All workflows have `"errorWorkflow": "5Twy03WAFur7CZcD"` in settings.
WF 07 uses `errorTrigger` node → writes to `workflow_logs` table.

### Fire-and-Forget Pattern (WF 04a → 04b)
- `waitForSubWorkflow: false` on Execute Workflow node
- Sub-workflow (04b) **must be active** for this to work
- Rate limit between dispatches (120ms) to prevent OpenAI rate limits
- Stuck items reset: items `pending` > 30 min get reset to `null`

### Batch Qualification Pattern (WF 03)
- Fetch all unqualified businesses
- Deduplicate by unique (keyword, category) pairs
- One OpenAI call per pair (not per business)
- Bulk PATCH all matching businesses per pair
- 45 OpenAI calls for 1605 businesses (45 unique categories)

---

## 7. Key Database Fields (`businesses`)

### Lifecycle Status Fields
| Field | Values | Set by |
|-------|--------|--------|
| `qualification_status` | `null`, `qualified`, `unqualified` | WF 03 |
| `enrichment_status` | `null`, `pending`, `enriched`, `failed` | WF 04a/04b |
| `close_export_status` | `null`, `exported`, `duplicate`, `failed`, `skipped` | WF 06 |

### Filter Logic
- **WF 04a picks up**: `website NOT NULL AND enrichment_status IS NULL AND qualification_status != unqualified`
- **WF 06 picks up**: `close_export_status IS NULL AND qualification_status != unqualified AND (website IS NULL OR enrichment_status = enriched) AND (im_tel NOT NULL OR phone NOT NULL)`
- **WF 03 picks up**: `qualification_status IS NULL AND category NOT NULL`

---

## 8. Common Errors & Solutions

### "Task request timed out after 60 seconds"
- **Cause**: n8n task runner overloaded/down (Code nodes use external runner)
- **Fix**: Increase `N8N_RUNNERS_TASK_REQUEST_TIMEOUT=120` in Docker env, or restart n8n
- **Not a code issue** - infrastructure problem

### SSRF Protection Blocking Webhook Tests
- **Cause**: n8n blocks localhost/internal webhook calls
- **Fix**: Use SQL directly in Supabase SQL Editor instead of webhook-based workflows for data manipulation

### Nodes Disappearing After MCP Updates
- **Cause**: User edits workflow in n8n UI after MCP update → full overwrite loses MCP changes
- **Fix**: Always verify with `n8n_get_workflow` before assuming state. Re-apply if needed.

### Expression Errors in JSON Body
- **Cause**: Missing `=` prefix, unescaped quotes, wrong bracket nesting
- **Fix**: Always prefix jsonBody with `=`, use `JSON.stringify()` for dynamic values

### PostgREST 406 or Empty Response
- **Cause**: Missing `Content-Type: application/json` header on PATCH/POST
- **Fix**: Always include all 4 headers (apikey, Authorization, Content-Type, Prefer)

---

## 9. Environment Variables

| Variable | Purpose | Used by |
|----------|---------|---------|
| `SUPABASE_GOOGLE_URL` | Supabase REST API base URL | All WFs |
| `SUPABASE_GOOGLE_KEY` | Supabase service_role key | All WFs |
| `OPENAI_API_KEY` | OpenAI API key | WF 03, 04b |
| `APIFY_API_TOKEN` | Apify API token | WF 01, 02 |
| `CLOSE_API_KEY` | Close.io API key | WF 06 |

---

## 10. Testing Checklist

### WF 03 (Category Qualification)
- [ ] Manual trigger → check unique pairs extracted correctly
- [ ] OpenAI returns valid JSON with `relevant` boolean
- [ ] `qualified` businesses: `qualification_status=qualified` in Supabase
- [ ] `unqualified` businesses: `qualification_status=unqualified` in Supabase
- [ ] Bulk PATCH matches correct businesses (keyword + category filter)

### WF 04a/04b (Enrichment)
- [ ] `Mark All Pending` skips `qualification_status=unqualified`
- [ ] Workers process `null` and `qualified` businesses
- [ ] Email validation rejects invalid formats
- [ ] Phone normalization produces valid +49 E.164
- [ ] `Update Phone Fallback` only updates when `phone IS NULL`
- [ ] Failed enrichments get `enrichment_status=failed`

### WF 06 (Close Export)
- [ ] `Get Qualified Businesses` skips `qualification_status=unqualified`
- [ ] Phone filter: only businesses with `im_tel` or `phone` are fetched
- [ ] `Has German Phone?` IF node correctly routes +49 numbers
- [ ] `Mark No Phone` sets `close_export_status=skipped`
- [ ] Duplicate detection works (Search Close → Is New Lead?)
- [ ] Close.io lead creation succeeds with correct field mapping

### Data Validation SQL
```sql
-- Check qualification distribution
SELECT qualification_status, COUNT(*) FROM businesses GROUP BY qualification_status;

-- Check enrichment distribution
SELECT enrichment_status, COUNT(*) FROM businesses GROUP BY enrichment_status;

-- Find invalid phones
SELECT id, im_tel, phone FROM businesses
WHERE im_tel IS NOT NULL AND im_tel NOT LIKE '+49%';

-- Find invalid emails
SELECT id, im_email FROM businesses
WHERE im_email IS NOT NULL AND im_email NOT LIKE '%@%.%';
```

---

## 11. Close.io API

### Authentication
Basic Auth with API key (base64 encoded `api_key:`):
```
Authorization: Basic <base64(api_key:)>
```

### Lead Creation
```
POST https://api.close.com/api/v1/lead/
```

### Duplicate Search
```
GET https://api.close.com/api/v1/lead/?query=name%3A"Company Name"&_fields=id&_limit=1
```

### Custom Fields
12 custom fields mapped via `custom_fields` table in Supabase. Field IDs are Close-specific (e.g., `custom.cf_WqxzYoicb9iPGEDDGlhDhRGyF0C3hfld7XBTeJWCHYN`).

### Rate Limiting
- 1 second wait between requests (Code node sleep)
- Close.io has rate limits on API calls

---

## 12. OpenAI API (via HTTP Request)

### Endpoint
```
POST https://api.openai.com/v1/chat/completions
```

### Headers
```
Authorization: Bearer {{ $env.OPENAI_API_KEY }}
Content-Type: application/json
```

### Model
`gpt-4o-mini` for both enrichment (WF 04b) and qualification (WF 03).

### JSON Response Format
```json
{ "response_format": { "type": "json_object" } }
```
Forces structured JSON output. System prompt must mention JSON.

### Rate Limits
- gpt-4o-mini: ~500 RPM (requests per minute)
- WF 04a rate limits at 120ms between dispatches (~500/min)
- WF 03 rate limits at 200ms between checks (~300/min)

### Error Handling
- `onError: continueRegularOutput` on HTTP node
- Parse errors default to safe values (relevant=true in WF 03, success=false in WF 04b)

---

## 13. n8n Node Configuration Notes

### Execute Workflow (v1.2)
- `workflowId` must be object: `{ "value": "<id>" }`
- `waitForSubWorkflow: false` for fire-and-forget
- Sub-workflow must be **active** for async execution

### SplitInBatches (v3)
- Default `batchSize: 1`
- Output 0 = done (all items processed)
- Output 1 = current batch item
- Loop back: connect Rate Limit → SplitInBatches input

### IF Node (v2.3)
- `typeValidation: "loose"` needed when expression returns string instead of expected type
- `looseTypeValidation: true` as separate parameter for some edge cases
- Boolean check: `{ "type": "boolean", "operation": "true", "singleValue": true }`

### HTTP Request (v4.2)
- `onError: "continueRegularOutput"` - continues with error in output data
- `onError: "continueErrorOutput"` - routes to error output (IF node false branch)
- `specifyBody: "json"` + `jsonBody: "=..."` for expression-based JSON bodies

### Code Node (v2)
- Uses n8n task runner (external process)
- Can timeout if runner is overloaded
- Must return array of `{ json: {...} }` objects
- Access other nodes: `$('Node Name').first().json.field`
- Sleep: `await new Promise(r => setTimeout(r, ms))`
- Re-wrap items after Execute Workflow: `$input.all().map(item => ({ json: item.json }))`

---

## 14. File Structure

```
documents/n8n/projects/google-maps-lead-pipeline/
├── knowledge/
│   ├── pipeline-overview.md          -- Main documentation
│   ├── supabase-schema.sql           -- Database schema
│   ├── migrate-custom-fields.sql     -- Close.io custom fields migration
│   ├── migrate-workflow-logs.sql     -- Error logging columns migration
│   └── session-learnings.md          -- This file
└── workflows/
    ├── 03-category-qualification.json -- WF 03 (4sjQWkilSRCgdQQa)
    ├── 04a-enrich-dispatcher.json     -- WF 04a (qFqHqkg2nsX3jP59)
    ├── 04b-enrich-worker.json         -- WF 04b (4CacfauoGzrNDHhp)
    ├── 06-export-to-close.json        -- WF 06 (M1iq7GgNfM3S118h)
    └── 07-error-logger.json           -- WF 07 (5Twy03WAFur7CZcD)
```
