# n8n Workflow Testing Pattern

## Overview

Standardized testing framework for n8n workflows using webhook triggers, assertions, and Supabase persistence.

## Architecture

```
curl POST /webhook/test/<name>
  → test-<nn>-<name> (Test Wrapper)
    → Webhook Trigger
    → Init Test (timestamp, params)
    → Execute Workflow (calls production workflow)
    → Assertions (Code Node)
    → Report to Supabase (calls 99-test-reporter)
    → Respond to Webhook (JSON result)
```

## Components

### 1. Supabase `test_runs` Table

Project: `vgdamdwglsqsmkiojtif` (close.io)

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| workflow_id | text | n8n workflow ID |
| workflow_name | text | Human-readable name |
| triggered_at | timestamptz | Test start |
| finished_at | timestamptz | Test end |
| status | text | `running`, `success`, `error` |
| items_processed | int | Record count |
| duration_ms | int | Execution time |
| assertions | jsonb | Array of `{name, passed}` |
| sample_data | jsonb | First result / sync_log |
| error_message | text | Failed assertion names |
| triggered_by | text | Default: `claude-mcp` |

### 2. Test Reporter Sub-Workflow

- **ID**: `1KzHZZYibHsoSkpr`
- **Name**: `99-test-reporter`
- **Trigger**: `executeWorkflowTrigger` (called by test wrappers)
- **Flow**: Start → Build Report (Code) → Save to Supabase (HTTP POST)
- **Input**: Pass the full assertions JSON object from the test wrapper
- **Supabase Auth**: Uses `$env.SUPABASE_LEADS_URL` and `$env.SUPABASE_LEADS_KEY`

### 3. Test Wrapper Pattern

Each production workflow gets a test wrapper:

| Production | Test Wrapper | Webhook Path |
|---|---|---|
| `02-sync-leads` (LuuTFS5EC1mOcdb1) | `test-02-sync-leads` (ortU6TkRrYOKt4Ok) | `/test/sync-leads` |

#### Wrapper Nodes

1. **Webhook** — `POST /test/<name>`, responseMode: `responseNode`
2. **Init Test** — Captures `triggered_at`, extracts params from `$json.body`
3. **Execute Workflow** — Calls production workflow by ID
4. **Assertions** — Code Node evaluating test conditions
5. **Report to Supabase** — Execute Workflow calling `99-test-reporter`
6. **Respond** — Returns assertions JSON to curl caller

### 4. Assertions Code Pattern

```javascript
const execResult = $input.first().json;
const initData = $('Init Test').first().json;
const startTime = new Date(initData.triggered_at).getTime();
const duration = Date.now() - startTime;

const itemsProcessed = execResult.records_synced || 0;
const syncStatus = execResult.status || 'unknown';

const assertions = [
  { name: 'workflow_completed', passed: true },
  { name: 'sync_status_success', passed: syncStatus === 'success' },
  { name: 'items_processed >= 0', passed: itemsProcessed >= 0 },
  { name: 'duration < 5min', passed: duration < 300000 }
];

const allPassed = assertions.every(a => a.passed);

return [{ json: {
  workflow_id: '<WORKFLOW_ID>',
  workflow_name: '<WORKFLOW_NAME>',
  triggered_at: initData.triggered_at,
  status: allPassed ? 'success' : 'error',
  items_processed: itemsProcessed,
  duration_ms: duration,
  assertions,
  sample_data: { sync_log: execResult },
  error_message: allPassed ? null : assertions.filter(a => !a.passed).map(a => a.name).join(', ')
} }];
```

## Triggering Tests

### Via curl (from Claude or CLI)

```bash
# Basic test (uses defaults from Init Test)
curl -X POST https://n8n.hoba-consulting.com/webhook/test/sync-leads

# With parameters
curl -X POST https://n8n.hoba-consulting.com/webhook/test/sync-leads \
  -H 'Content-Type: application/json' \
  -d '{"since": "2026-02-18T00:00:00.000Z", "until": "2026-02-19T00:00:00.000Z"}'
```

### Response Format

```json
{
  "workflow_id": "LuuTFS5EC1mOcdb1",
  "workflow_name": "02-sync-leads",
  "status": "success",
  "items_processed": 1382,
  "duration_ms": 19096,
  "assertions": [
    {"name": "workflow_completed", "passed": true},
    {"name": "sync_status_success", "passed": true}
  ]
}
```

## Querying Test Results

```bash
# Latest runs
curl 'https://vgdamdwglsqsmkiojtif.supabase.co/rest/v1/test_runs?select=*&order=triggered_at.desc&limit=5' \
  -H 'apikey: <SUPABASE_ANON_KEY>'

# Filter by workflow
curl 'https://...supabase.co/rest/v1/test_runs?workflow_id=eq.LuuTFS5EC1mOcdb1&order=triggered_at.desc&limit=5' \
  -H 'apikey: <SUPABASE_ANON_KEY>'

# Only errors
curl 'https://...supabase.co/rest/v1/test_runs?status=eq.error&order=triggered_at.desc' \
  -H 'apikey: <SUPABASE_ANON_KEY>'
```

## Webhook Path Convention

| Type | Pattern | Example |
|---|---|---|
| Test | `/test/<workflow-name>` | `/test/sync-leads` |
| Production | `/webhook/<workflow-name>` | `/webhook/sync-leads` |

## Adding a New Test Wrapper

1. Create workflow `test-<nn>-<name>` with the 6-node pattern above
2. Set Webhook path to `/test/<name>`
3. Set Execute Workflow to call the production workflow ID
4. Adapt Assertions to the production workflow's output format
5. Keep Report to Supabase calling `1KzHZZYibHsoSkpr`
6. Activate sub-workflows first, then the test wrapper

## Constraints

- **SSRF**: MCP `n8n_test_workflow` cannot trigger webhooks (localhost + tunnel blocked). Use `curl` instead.
- **Sub-workflow activation order**: Referenced sub-workflows must be active before the parent can be activated.
- **Webhook responseMode**: When using `responseNode`, the Webhook node needs `onError: "continueRegularOutput"`.
