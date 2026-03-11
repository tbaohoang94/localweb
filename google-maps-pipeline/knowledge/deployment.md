# Deployment — Google Maps Lead Pipeline

---

## Environments

| Umgebung | n8n | Supabase | Zweck |
|---|---|---|---|
| Lokal (Docker) | http://localhost:5678 | wknzyrvcrcdchnysntii (Remote) | Entwicklung + Test |
| Hetzner | 116.203.205.153 | (gleiche DB) | Produktion (spaeter) |

---

## Lokale Entwicklung

### n8n starten

```bash
cd clients/localweb/n8n/docker
docker compose up -d
```

### n8n stoppen

```bash
docker compose down
```

### Env-Variable aendern

1. `.env` editieren
2. `docker compose up -d --force-recreate n8n` (Restart reicht NICHT — Env wird nur bei Create gelesen)

### Webhook-Empfang (Cloudflare Tunnel)

n8n ist ueber `https://n8n.hoba-consulting.com` erreichbar. Konfiguriert in:
- `N8N_HOST=n8n.hoba-consulting.com`
- `WEBHOOK_URL=https://n8n.hoba-consulting.com`

---

## Workflow Deployment

### Lokal (JSON → n8n API)

```bash
# Workflow deployen
cat workflow.json | jq '{name, nodes, connections, settings}' | \
  curl -s -X PUT "http://localhost:5678/api/v1/workflows/{ID}" \
  -H "X-N8N-API-KEY: $N8N_LOCAL_API_KEY" \
  -H "Content-Type: application/json" -d @-

# Aktivieren
curl -s -X POST "http://localhost:5678/api/v1/workflows/{ID}/activate" \
  -H "X-N8N-API-KEY: $N8N_LOCAL_API_KEY"
```

**Wichtig:** `active` Feld ist read-only im PUT — muss per separatem activate/deactivate Endpoint gesetzt werden.

### Hetzner (spaeter)

1. Workflows lokal testen
2. JSON-Dateien committen
3. Auf expliziten Befehl: auf Hetzner deployen
4. **Nie** direkt auf Produktion deployen ohne lokalen Test

---

## Supabase Migrations

### Lokal entwickeln

Migrations liegen in: `supabase/migrations/`

Namenskonvention: `YYYYMMDDHHMMSS_beschreibung.sql`

### Auf Remote ausfuehren

Via Supabase Management API:
```bash
curl -X POST "https://api.supabase.com/v1/projects/{ref}/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SQL_HERE"}'
```

**Niemals** `supabase db push` ohne explizite Freigabe.

---

## Workflow IDs (Referenz)

| Workflow | Lokale n8n ID |
|---|---|
| 01 - Start Apify Scrape | F3srgLPW6bSR6Zz8 |
| 01b - Check Running Scrapes | vhHeUPkWhf3ytVQQ |
| 02 - Import Apify Results | 2fULkCGYnqSao0Pj |
| 03 - Category Qualification | ovaC9LDlCyKoCUQf |
| 04a - Enrich Dispatcher | rFiqpelsSpVA9Vdf |
| 04b - Enrich Worker | heraaLvlLKybMM63 |
| 05 - CSV Export Email | 4zpyukFmVU2SGIcd |
| 07 - Error Logger | 75nGTzEeTlBQmlys |
| 00 - Orchestrator (deaktiviert) | nqjp292XCUkdiGNC |

## Credential IDs (Referenz)

| Credential | n8n ID |
|---|---|
| Apify (Bearer Auth) | H7EaKB5yYzqhBgZ8 |
| SMTP account | iBtNZwUPeBcnCSwj |
