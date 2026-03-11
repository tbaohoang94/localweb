# Close-Airtable Sync

**Status**: Maintenance

Syncs Close.io CRM data into Airtable for sales analytics, including custom activities, opportunities, leads, users, call transcriptions (Whisper), and Demodesk meeting transcripts.

## Workflows

| n8n ID | Name | Status | Purpose |
|--------|------|--------|---------|
| `dyTx5AbwsNO5WGaL` | 1. Orchestrator | inactive | Master controller, triggers sub-workflows |
| `NAo1zIkjNwYMbHmv` | 2. Get Custom Activities | active | Close activities -> Airtable |
| `cQDTdw5U0TRY28Nl` | 2. Get Opportunities | active | Close opportunities -> Airtable |
| `LxpJz2z2pBYBhBhy` | Demodesk Transcriptions | active | Demodesk transcripts -> Airtable |
| `RIziEv7wAifHBU47` | GET Settingsgespraeche | active | Close calls -> Whisper -> Airtable |
| `yg2xtQQAUaiLkLXi` | Add new Users | active | Close users -> Airtable |
| `OrTCUp8ufHjtmIcm` | Error Logger | inactive | Error Trigger -> Airtable Error Log |

## Services

- **Close.io** -- CRM (HTTP Request, API key auth)
- **Airtable** -- Data warehouse (dedicated n8n node)
- **OpenAI Whisper** -- Call transcription
- **Demodesk** -- Meeting transcripts (HTTP Request)

## Directory Structure

```
close-airtable-sync/
  .context/       -- Goals, constraints, architecture decisions
  knowledge/      -- API docs, Airtable schema, n8n patterns
  workflows/      -- Exported n8n workflow JSON files
  payloads/       -- Test payloads for development
  scripts/        -- Export/import/setup scripts
```
