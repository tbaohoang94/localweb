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
