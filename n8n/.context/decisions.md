# Architecture Decisions

## ADR-001: Orchestrator Pattern
**Decision**: Use a master Orchestrator workflow that triggers sub-workflows via Execute Workflow nodes.
**Reason**: Keeps each sync task isolated, allows independent scheduling, and simplifies error handling per sub-workflow.

## ADR-002: Airtable as Data Warehouse
**Decision**: Use Airtable as the reporting/dashboard backend instead of a traditional database.
**Reason**: Non-technical stakeholders need direct access to data for dashboards and filtering. Airtable provides a low-code UI on top of structured data.

## ADR-003: Date Windowing for Sync
**Decision**: Process data day-by-day using a Dates table in Airtable to track which dates have been synced.
**Reason**: Prevents re-processing all historical data on each run. Allows recovery from failures by re-processing specific dates.

## ADR-004: Upsert Strategy
**Decision**: Use Airtable upsert (match on Close ID fields) instead of create/update logic.
**Reason**: Simplifies the sync pipeline -- no need to check if a record exists before writing. Idempotent operations.

## ADR-005: Enrich Before Write
**Decision**: Enrich activities/opportunities with lead and user data before upserting to Airtable.
**Reason**: Airtable linked record fields require the Airtable record ID, not the Close ID. Enrichment resolves Close IDs to Airtable record IDs.

## ADR-006: Whisper for Call Transcription
**Decision**: Download Close.io call recordings and transcribe with OpenAI Whisper.
**Reason**: Close.io does not provide transcription. Whisper offers accurate German/English transcription at reasonable cost.

## ADR-007: HEAD Request fuer Whisper 25 MB Limit
**Decision**: Vor dem Download einer Call-Recording wird ein HEAD Request gesendet um die Dateigroesse zu pruefen. Recordings ueber 25 MB werden uebersprungen und geloggt.
**Reason**: OpenAI Whisper hat ein festes 25 MB Upload-Limit. ffmpeg zur Komprimierung ist im Docker-Image nicht vorhanden. Der HEAD-Check ist eine pragmatische Loesung: ~90% der EG-Calls sind unter 45 Min (~21 MB) und passen. Groessere Calls werden sauber uebersprungen statt mit einem kryptischen API-Fehler abzubrechen. Falls regelmaessig Calls uebersprungen werden, kann spaeter ffmpeg nachgeruestet werden.
**Alternatives considered**: ffmpeg-Komprimierung (erfordert Docker-Image-Aenderung), Audio-Splitting in Chunks (komplex, fehleranfaellig), alternative Transkriptions-APIs mit hoeherem Limit (AssemblyAI, Deepgram).

## ADR-008: 2-Step-Download fuer Close Recording-URLs
**Decision**: Close Recording-URLs werden in zwei Schritten heruntergeladen: (1) HEAD mit disableFollowRedirect → Location-Header extrahieren, (2) GET von der S3-URL ohne Authorization-Header.
**Reason**: Close gibt 302 Redirect zu einer pre-signed S3-URL zurueck. n8n httpRequest leitet den Authorization-Header an S3 weiter, was S3 mit 400 ablehnt (zwei Auth-Methoden). disableFollowRedirect verhindert den automatischen Redirect und erlaubt manuelles Handling. HEAD statt GET, da GET mit disableFollowRedirect den n8n-Prozess crashen kann (Response-Body ohne Consumer).
**Alternatives considered**: fetch() (nicht verfuegbar im Task Runner), maxRedirects: 0 (wird von httpRequest ignoriert), GET mit disableFollowRedirect (crasht n8n).

## ADR-009: Lokale Entwicklung vor Deployment
**Decision**: Alle Workflows werden zuerst lokal auf einer n8n-Instanz entwickelt und end-to-end getestet. Deployment auf Hetzner erfolgt nur auf expliziten Befehl.
**Reason**: Direktes Deployment auf die Remote-Instanz fuehrt zu schwer debugbaren Problemen (z.B. Server-Crashes, unklare Fehlermeldungen). Lokales Testen erlaubt schnelle Iteration, SQLite-Inspektion der Execution-Daten und risikofreies Experimentieren. n8n.hoba-consulting.com ist ein Cloudflare-Tunnel zur Hetzner-Instanz, kein Cloud-Service.
**Setup**: `npx n8n start` auf Port 5679, Daten in /tmp/n8n-local-dev/.n8n/, Workflow-Import via CLI.
