# API Documentation

## Close.io CRM

- **Base URL**: `https://api.close.com/api/v1/`
- **Auth**: API Key via HTTP Header (`Authorization: Basic <base64(api_key:)>`)
- **n8n config**: HTTP Request node, Authentication = "None", auth via header:
  - Header: `Authorization`
  - Value: `Basic YXBpXzJKd0JqaHMwYmZCUmJ5d3dHeXA0blUuMWlWV0NZVUUyRzE3NWh6NjJmNEJMRzo=`
  - Base64 must be pre-encoded BEFORE putting into n8n (NOT computed at runtime)
  - Format: `Basic <base64(CLOSE_API_KEY + ':')>` — encode once, paste as static string
  - NEVER use n8n Credentials/predefinedCredentialType for Close
  - NEVER use expressions like `Buffer.from()` for auth encoding
- **Rate Limits**: 100 requests/minute (burst), back off on 429
- **Key Endpoints**:
  - `GET /activity/custom/` -- Custom activities (paginated, `_skip` / `_limit`)
  - `GET /opportunity/` -- Opportunities
  - `GET /lead/` -- Leads
  - `GET /user/` -- Users
  - `GET /activity/call/` -- Call activities (with recording URLs)
  - `GET /custom_activity_type/` -- Activity type definitions

## Airtable

- **Base ID**: `appvsBWZlKAJC1VPY`
- **Auth**: Bearer token via credential
- **n8n node**: `n8n-nodes-base.airtable` (dedicated node)
- **Rate Limit**: 5 requests/second per base
- **Operations used**: Upsert (match on ID field), Search, Create
- **Note**: API token lacks `schema.bases:read` scope. Schema documented in `schemas/airtable-schema.json`.

## OpenAI Whisper

- **Endpoint**: `https://api.openai.com/v1/audio/transcriptions`
- **Auth**: Bearer token
- **Model**: `whisper-1`
- **Input**: Audio file (mp3/wav from Close call recordings)
- **Output**: Transcribed text
- **Usage**: Transcribe Settingsgespraeche recordings for quality analysis

## Demodesk

- **Base URL**: `https://demodesk.com/api/v1/`
- **Auth**: API Key via header (`api-key: <COMPANY_ADMIN_USER_API_KEY>`)
- **n8n config**: HTTP Request node, header `api-key` = `{{ $env.DEMODESK_API_KEY }}`
- **n8n node**: None — uses HTTP Request
- **Pagination**: `page` Parameter (ab 1), `meta.hasNextPage` pruefen, Seitengroesse 25
- **Key Endpoints**:
  - `GET /demos` — Meetings auflisten (Filter: `recordings_present`, `schedule_eq`, `start_date_gteq`)
  - `GET /recordings/<token>` — Recording-Details (Video-URL, customerUrl, status, audioOnly)
  - `GET /recordings/<token>/transcript` — Transkript als `text/plain` (Accept: text/plain)
- **Webhooks** (Aktivierung via support@demodesk.com):
  - `recording.uploaded` — Aufnahme hochgeladen
  - `recording.transcription_postprocessed` — Transkript + AI-Summary fertig
- **Webhook-Payload** enthaelt: token, demoId, url, temporaryVideoUrl, hostEmail, AI-Summaries
- **Output**: Video-Dateien, Transkripte, AI-Summaries, Meeting-Metadaten
- **Vollstaendige Doku**: siehe `knowledge/apis/demodesk.md`
