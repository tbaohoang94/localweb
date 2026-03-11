# Payloads

Test payloads for workflow development and debugging.

Place JSON files here that represent sample API responses from Close.io, Airtable, Demodesk, etc.
These can be used with n8n's manual execution or pinned data feature for testing without hitting live APIs.

## Naming Convention

```
<source>-<endpoint>-<variant>.json
```

Examples:
- `close-activities-page1.json`
- `close-lead-single.json`
- `airtable-users-list.json`
- `demodesk-session-with-transcript.json`
