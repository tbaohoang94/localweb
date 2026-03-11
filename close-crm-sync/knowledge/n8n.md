# n8n — Close CRM Sync

> Projektspezifische n8n-Konventionen, Workflow-Übersicht und Credential-Namen.

---

## Instanz

| | |
|---|---|
| URL | https://n8n.hoba-consulting.com (Cloudflare Tunnel) |
| Version | 1.97.1 (lokal) / 2.4.8 (Hetzner Docker) |
| Hosting | Hetzner (Docker + Cloudflare Tunnel) |
| Queue Mode | Nein |

> **n8n.hoba-consulting.com ist ein Cloudflare Tunnel** zur Docker-Instanz auf Hetzner — kein Cloud-Service.
> Entwicklung und Tests erfolgen IMMER lokal. Deployment auf Hetzner nur auf expliziten Befehl.

---

## Credential-Namen

> Exakte Namen wie sie in n8n hinterlegt sind. Niemals Credentials im Code — immer über n8n Credential Store.

| Service | Credential-Name in n8n | Typ |
|---|---|---|
| Supabase | `Supabase [PROJECT_NAME]` | HTTP Header Auth |
| [Close.io] | `Close.io [PROJECT_NAME]` | API Key |
| [Stripe] | `Stripe [PROJECT_NAME]` | API Key |
| [OFFEN] | | |

---

## Workflow-Übersicht

> Alle Workflows im Ordner `n8n/workflows/close-crm-sync/`

### Orchestratoren (00)

| Datei | Name | Trigger |
|---|---|---|
| `00-full-sync.json` | 00 - Close CRM Sync - Full Sync | Manual |
| `00-first-import-resume.json` | 00 - Close CRM Sync - First Import Resume | Manual |
| `01-orchestrator.json` | 01 - Close CRM Sync - Orchestrator | Manual |

### Sync-Workers (01-19)

| Datei | Name | Trigger |
|---|---|---|
| `01-sync-users.json` | 01 - Close CRM Sync - Sync Users | Sub-Workflow |
| `02-sync-leads.json` | 02 - Close CRM Sync - Sync Leads | Sub-Workflow |
| `02-add-new-user.json` | 02 - Close CRM Sync - Add New User | Sub-Workflow |
| `03-sync-activity-types.json` | 03 - Close CRM Sync - Sync Activity Types | Sub-Workflow |
| `03-get-custom-activities.json` | 03 - Close CRM Sync - Get Custom Activities | Sub-Workflow |
| `04-sync-opportunities.json` | 04 - Close CRM Sync - Sync Opportunities | Sub-Workflow |
| `04-get-opportunitys.json` | 04 - Close CRM Sync - Get Opportunities | Sub-Workflow |
| `05-sync-calls.json` | 05 - Close CRM Sync - Sync Calls | Sub-Workflow |
| `05-get-settingcalls.json` | 05 - Close CRM Sync - Get Setting Calls | Sub-Workflow |
| `06-sync-meetings.json` | 06 - Close CRM Sync - Sync Meetings | Sub-Workflow |
| `06-get-closingcalls.json` | 06 - Close CRM Sync - Get Closing Calls | Sub-Workflow |
| `07-sync-custom-activities.json` | 07 - Close CRM Sync - Sync Custom Activities | Sub-Workflow |
| `09-sync-custom-fields.json` | 09 - Close CRM Sync - Sync Custom Fields | Sub-Workflow |
| `10-sync-demodesk-transcripts.json` | 10 - Close CRM Sync - Sync Demodesk Transcripts | Sub-Workflow |
| `11-classify-and-transcribe.json` | 11 - Close CRM Sync - Classify and Transcribe | Webhook |
| `12-demodesk-recording-webhook.json` | 12 - Close CRM Sync - Demodesk Recording Webhook | Webhook |

### Webhook-Handlers (20-29)

| Datei | Name | Trigger |
|---|---|---|
| `20-webhook-dispatcher.json` | 20 - Close CRM Sync - Webhook Dispatcher | Webhook |
| `21-eg-vereinbart.json` | 21 - Close CRM Sync - EG Vereinbart | Sub-Workflow |
| `22-eg-noshow.json` | 22 - Close CRM Sync - EG NoShow | Sub-Workflow |
| `23-eg-stattgefunden.json` | 23 - Close CRM Sync - EG Stattgefunden | Sub-Workflow |
| `24-sg-stattgefunden.json` | 24 - Close CRM Sync - SG Stattgefunden | Sub-Workflow |
| `25-sg-noshow.json` | 25 - Close CRM Sync - SG NoShow | Sub-Workflow |
| `26-angebot-erstellen.json` | 26 - Close CRM Sync - Angebot Erstellen | Sub-Workflow |
| `27-kunde-gewonnen.json` | 27 - Close CRM Sync - Kunde Gewonnen | Sub-Workflow |
| `28-kunde-verloren.json` | 28 - Close CRM Sync - Kunde Verloren | Sub-Workflow |
| `29-soft-delete-custom-activity.json` | 29 - Close CRM Sync - Soft Delete Custom Activity | Webhook |

### Error Handling & Utilities (08, 90-98)

| Datei | Name | Trigger |
|---|---|---|
| `08-error-logger.json` | 08 - Close CRM Sync - Error Logger | Error Trigger |

### Tests (99)

| Datei | Name | Trigger |
|---|---|---|
| `98-test-close-leads.json` | 98 - Close CRM Sync - Test Close Leads | Manual |
| `99-test-sync.json` | 99 - Close CRM Sync - Test Sync | Manual |

### Legacy (nicht mehr aktiv)

| Datei | Name |
|---|---|
| `error-logger.json` | 08 - Close CRM Sync - Error Logger (Legacy) |
| `sync-activity-types-supabase.json` | 07 - Close CRM Sync - Sync Activity Types Supabase (Legacy) |
| `07-sync-activity-types.json` | 07 - Close CRM Sync - Sync Activity Types (Legacy) |

---

## Workflow-Konventionen

### Naming
- **Format:** `Index - Projektname - Workflow Name`
- Beispiel: `01 - Close CRM Sync - Sync Users`
- Index: zweistellig mit führender Null (`00`, `01`, …, `99`)
- Projektname: konstant pro Pipeline (hier: `Close CRM Sync`)
- Workflow Name: beschreibender englischer Name in Title Case
- **Nummerierung:** `00` = Orchestrator/Full Sync, `01-19` = Sync-Workers, `20-29` = Webhook-Handlers, `90-98` = Utilities, `99` = Tests
- Node-Namen: beschreibend, keine Standardnamen (`HTTP Request` → `GET Leads from Close`)

### Idempotenz
Jeder Sync-Workflow muss idempotent sein:
- Upsert statt Insert (unique key: externe ID)
- `processed_at` Marker für Jobs
- Doppeltes Ausführen darf keine Duplikate erzeugen

### Error Handling
Jeder Workflow hat einen Error-Trigger der den `error-logger.json` aufruft:
```
Error Trigger → HTTP Request → error-logger Webhook
```

### Chunking & Pagination
Bei mehr als 100 Datensätzen:
- Pagination Loop mit `offset` / `cursor`
- Max 50-100 Items pro Batch
- Sleep Node zwischen Batches wenn Rate Limits nötig

---

## Sync-Job Tracking

```sql
-- Tabelle in Supabase für Job-Tracking
CREATE TABLE sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name text NOT NULL,
  status text NOT NULL, -- 'running' | 'success' | 'error'
  items_processed int,
  error_message text,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz
);
```

**Pattern in n8n:**
1. Job-Eintrag anlegen (status: 'running')
2. Verarbeitung
3. Job-Eintrag updaten (status: 'success' / 'error')

---

## Rate Limits

| API | Limit | Unser Handling |
|---|---|---|
| [Close.io] | 120 req/min | Sleep Node nach je 100 Requests |
| [OFFEN] | | |

---

## Lokale Entwicklung

> **Wichtig:** Immer zuerst lokal testen. Erst nach erfolgreichem End-to-End Test auf Hetzner deployen — nur auf expliziten Befehl.

```bash
# n8n lokal starten (npx, nicht Docker — Docker hat body-parser Probleme)
export N8N_USER_FOLDER=/tmp/n8n-local-dev/.n8n
export N8N_PORT=5679
npx n8n start

# Alle Workflows importieren (active-Flag muss im JSON vorhanden sein)
npx n8n import:workflow --input=workflows/23-eg-stattgefunden.json

# Workflow aktivieren (danach n8n Neustart noetig)
npx n8n update:workflow --id=Vk7mEgStattgef23 --active=true

# Workflow exportieren
npx n8n export:workflow --id=[ID] --output=workflows/[name].json
```

### Deploy auf Hetzner (nur auf expliziten Befehl)
```bash
# Via n8n API (Cloudflare Tunnel)
curl -X PUT https://n8n.hoba-consulting.com/rest/workflows/[ID] \
  -H "Content-Type: application/json" \
  -d @workflows/[name].json

# Oder via SSH + Docker
ssh hetzner "cd /opt/n8n && docker compose exec n8n n8n import:workflow --input=/data/workflows/[name].json"
```

---

## Offene Punkte

- [ ] Hetzner-Server IP in infra/hetzner.md dokumentieren
- [ ] n8n Docker-Image auf aktuelle Version updaten (1.97.1 → 2.x)
- [ ] Task Runner aktivieren (N8N_RUNNERS_ENABLED=true)
