# Error Handling — Google Maps Lead Pipeline

> Letzte Aktualisierung: 2026-03-04 (nach Infrastructure Audit)

---

## Prinzipien

1. **Kein stiller Fehler** — Jeder Workflow hat `errorWorkflow: "75nGTzEeTlBQmlys"` (WF 07)
2. **Granularer Retry** — Fehlgeschlagene Items werden einzeln retried, nicht der ganze Batch
3. **Fehler-Status statt Abbruch** — `failed_*` Status statt Pipeline-Stopp
4. **Max 3 Retries** — Danach bleibt das Item im failed Status
5. **Zentrales Logging** — Alle Fehler in `system_logs` Tabelle (Severity-basiert)
6. **Dead Letter Queue** — Items nach max_retries landen in DLQ

---

## Error-Tracking Stack

| Komponente | Tool | Details |
|------------|------|---------|
| Frontend | Sentry (@sentry/nextjs) | Exceptions, Error Boundaries, Source Maps |
| Frontend | Pino (lib/logger.ts) | Strukturiertes Logging, JSON, DSGVO-Redact |
| n8n | WF 07 Error Logger | Error Trigger → system_logs + workflow_logs + Email |
| Supabase | Monitoring Views | pipeline_errors, system_logs_summary |
| Operations | WF 08 Health Check | 5min: Supabase + n8n Erreichbarkeit |
| Operations | WF 09 Daily Digest | 08:00: Zusammenfassung aller Logs/Fehler |
| Operations | WF 11 Integrity Check | 6h: Pipeline-Konsistenz, DLQ-Status |

---

## Error-Klassifizierung

| Typ | Beispiel | Handling |
|---|---|---|
| Transient | ECONNREFUSED, Timeout, 503 | Automatischer Retry (n8n retryOnFail) |
| Business Logic | Ungueltige Kategorie | `unqualified` Status (kein Retry) |
| Data | Kein placeId, leere Response | Item wird gefiltert/uebersprungen |
| External | Apify Run FAILED, Website 404 | `failed_*` Status + Retry nach Wartezeit |
| Configuration | Fehlende Credentials, falsche URL | WF 07 Alert-Email, manueller Fix noetig |

---

## Retry-Strategie

### Automatischer Retry (n8n Built-in)

Auf kritischen HTTP-Nodes:
```json
"retryOnFail": true,
"maxTries": 3,
"waitBetweenTries": 3000
```

### Pipeline-Level Retry

Am Anfang jedes Workflows (geplant):
```sql
-- WF 01: Scraping-Retries
UPDATE locations
SET pipeline_stage = 'new', last_error = NULL
WHERE pipeline_stage = 'failed_scrape'
AND retry_count < 3
AND updated_at < now() - interval '1 hour';

-- WF 04a: Enrichment-Retries
UPDATE businesses
SET pipeline_stage = 'qualified', last_error = NULL
WHERE pipeline_stage = 'failed_enrich'
AND retry_count < 3
AND updated_at < now() - interval '30 minutes';
```

### Stuck-Detection (WF 04a)

Items die zu lange in `enriching` stehen:
```sql
UPDATE businesses
SET pipeline_stage = 'failed_enrich',
    last_error = 'Timeout nach 30 Min'
WHERE pipeline_stage = 'enriching'
AND updated_at < now() - interval '30 minutes';
```

---

## Error Logger (WF 07)

- Trigger: n8n Error Trigger (feuert bei jedem Workflow-Fehler)
- Aktionen (parallel):
  1. Schreibt in `workflow_logs` (Legacy-Tabelle, Abwaertskompatibel)
  2. Schreibt in `system_logs` (neues zentrales Logging mit Severity)
  3. Sendet Email an NOTIFICATION_EMAIL
- SMTP: Hetzner Mail (mail.your-server.de)
- Credential: SMTP account (ID: iBtNZwUPeBcnCSwj)
- `onError: continueRegularOutput` — Error Logger selbst darf nicht fehlschlagen

---

## Fehler-Felder in der Datenbank

| Spalte | Tabelle | Beschreibung |
|---|---|---|
| pipeline_stage | locations, businesses | `failed_scrape` oder `failed_enrich` |
| retry_count | locations, businesses | Zaehlt hoch bei jedem Fehlversuch |
| last_error | locations, businesses | Letzte Fehlermeldung (Freitext) |

### system_logs (zentrales Logging)

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| source | text | n8n, nextjs, supabase, close |
| severity | text | info, warning, error, critical |
| workflow_name | text | Name des fehlerhaften Workflows |
| error_message | text | Fehlermeldung (max 1000 Zeichen) |
| error_stack | text | Stack Trace (max 2000 Zeichen) |
| metadata | jsonb | Zusaetzliche Daten (executionId, errorNode, etc.) |

### dead_letter_queue

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| source_workflow | text | Workflow der das Item erzeugt hat |
| payload | jsonb | Originaldaten des fehlgeschlagenen Items |
| retry_count / max_retries | int | Retry-Zaehler (Standard: max 3) |
| status | text | pending, retrying, failed, resolved |
