# n8n Version Standards

## Pinned Version

| Component | Version | Image |
|---|---|---|
| n8n | **2.9.4** | `n8nio/n8n:2.9.4` (custom Dockerfile mit Chromium) |
| Task Runner | **2.9.4** | `n8nio/runners:2.9.4` |
| Postgres | **15** | `postgres:15-alpine` |

**Wichtig:** n8n-Version und Runner-Version MUESSEN identisch sein.

Neueste verfuegbare Version: 2.12.1 (Stand 2026-03-13). Upgrade nur nach Test.

---

## Node Type Versions (Standard)

Beim Erstellen neuer Nodes diese Versionen verwenden:

| Node Type | typeVersion | Anmerkung |
|---|---|---|
| `n8n-nodes-base.code` | **2** | Einzige Version, immer 2 |
| `n8n-nodes-base.httpRequest` | **4.2** | Einzige Version, immer 4.2 |
| `n8n-nodes-base.if` | **2** | Standard. 2.2 nur im Orchestrator |
| `n8n-nodes-base.executeWorkflow` | **1.1** | NICHT 1.2 verwenden (siehe Pitfall) |
| `n8n-nodes-base.executeWorkflowTrigger` | **1.1** | Standard fuer Sub-Workflows |
| `n8n-nodes-base.webhook` | **2** | |
| `n8n-nodes-base.wait` | **1.1** | |
| `n8n-nodes-base.set` | **3.4** | |
| `n8n-nodes-base.supabase` | **1** | |
| `n8n-nodes-base.googleDrive` | **3** | |
| `n8n-nodes-base.manualTrigger` | **1** | |
| `n8n-nodes-base.errorTrigger` | **1** | |
| `n8n-nodes-base.splitInBatches` | **3** | |
| `n8n-nodes-base.splitOut` | **1** | |
| `n8n-nodes-base.switch` | **3.2** | |
| `n8n-nodes-base.formTrigger` | **2.5** | |
| `n8n-nodes-base.emailSend` | **2.1** | |
| `@n8n/n8n-nodes-langchain.chatTrigger` | **1.1** | |

---

## Pitfalls

### Execute Workflow Node — NICHT v1.2 verwenden

Version 1.2 verwendet ein anderes Parameter-Format (`source: "database"`, flaches `workflowId`).
Das fuehrt zu: `Cannot destructure property 'value' of 'this.getNodeParameter(...)' as it is undefined.`

**Richtig (v1.1):**
```json
{
  "type": "n8n-nodes-base.executeWorkflow",
  "typeVersion": 1.1,
  "parameters": {
    "workflowId": {
      "__rl": true,
      "value": "={{ $env.WF_ID }}",
      "mode": "id"
    },
    "options": {
      "waitForSubWorkflow": false
    }
  }
}
```

**Falsch (v1.2):**
```json
{
  "type": "n8n-nodes-base.executeWorkflow",
  "typeVersion": 1.2,
  "parameters": {
    "source": "database",
    "workflowId": "={{ $env.WF_ID }}"
  }
}
```

### IF Node — typeValidation

- Code Nodes liefern JS Booleans (`true`/`false`)
- IF Node mit `typeValidation: "strict"` erwartet n8n-typisierte Werte
- **Fix:** `typeValidation: "loose"` verwenden wenn Daten aus Code Nodes kommen

### HTTP Request Body — trailing Slash

- Close API PUT-Requests erfordern trailing Slash auf der URL
- Ohne Slash: 308 Redirect → Request schlaegt fehl
- **Richtig:** `https://api.close.com/api/v1/opportunity/{id}/`

### Task Runner Einschraenkungen (External Mode)

- Kein `fetch()` — nur `this.helpers.httpRequest()`
- Kein `require()` — nur explizit erlaubte Module
- Kein `getWorkflowStaticData()` — Static Data nicht verfuegbar
- Kein `$env` direkt — nur ueber `$env.VARIABLE_NAME` in Expressions

### N8N_BLOCK_ENV_ACCESS_IN_NODE

Muss auf `"false"` gesetzt sein damit `$env` in Expressions funktioniert.
Konfiguriert in `docker-compose.yml`.

---

## Docker Setup

### Externe Module (Code Nodes)

Erlaubt via `NODE_FUNCTION_ALLOW_EXTERNAL`:
- `apify-client`
- `cheerio`
- `puppeteer`
- `puppeteer-core`

Im Dockerfile installiert mit gepinnten Versionen.

### Task Runner — External Mode (PFLICHT)

- `N8N_RUNNERS_MODE=external` — Internal Mode hat 403-Auth-Race → CPU-Spike
- Separater Container: `n8nio/runners:2.9.4` mit `command: ["javascript"]`
- Shared Auth Token via `N8N_RUNNERS_AUTH_TOKEN`
- Broker lauscht auf `0.0.0.0` (`N8N_RUNNERS_BROKER_LISTEN_ADDRESS`)

### Upgrade-Checkliste

Bei Version-Upgrade (z.B. 2.9.4 → 2.12.x):

1. Dockerfile: `FROM n8nio/n8n:<neue-version>`
2. docker-compose.yml: Runner-Image `n8nio/runners:<neue-version>`
3. Lokal testen: `make down && make up-build`
4. Alle Workflows manuell testen (besonders Execute Workflow Nodes)
5. Erst nach erfolgreichem Test auf Hetzner deployen
