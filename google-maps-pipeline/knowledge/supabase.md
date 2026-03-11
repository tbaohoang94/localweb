# Supabase — Google Maps Lead Pipeline

> Projektspezifische Supabase-Konfiguration.
> Letzte Aktualisierung: 2026-03-04 (nach Infrastructure Audit)

---

## Projekt

| Feld | Wert |
|---|---|
| Projekt-Ref | wknzyrvcrcdchnysntii |
| Region | eu-central-1 |
| URL | https://wknzyrvcrcdchnysntii.supabase.co |
| Auth | Service Role Key (in n8n Env: SUPABASE_GOOGLE_KEY) |

---

## Tabellen

| Tabelle | RLS | Zeilen | Zweck |
|---|---|---|---|
| cities | Ja | 25 | Statische Staedteliste |
| locations | Ja | ~78 | Stadt x Suchbegriff Kombinationen |
| businesses | Ja | ~7000 | Google Maps Ergebnisse + Enrichment |
| workflow_logs | Ja | ~1000 | Workflow-Run-Logs (Legacy) |
| category_qualifications | Ja | 0 | Kategorie-Qualifizierungs-Cache (WF 03) |
| custom_fields | Ja | 80 | Close.io Mappings (out of scope) |
| system_logs | Ja | — | Zentrales Error- und Event-Logging |
| dead_letter_queue | Ja | — | Fehlgeschlagene Items nach max_retries |

## RLS Policies

Alle Tabellen:
- `authenticated` → SELECT (read-only)
- `service_role` → ALL (n8n nutzt Service Role Key)

Zusaetzlich auf `locations`:
- `authenticated` → INSERT, DELETE

## Custom Types (ENUMs)

```sql
CREATE TYPE location_pipeline_stage AS ENUM (
  'new', 'scraping', 'scraped', 'imported', 'failed_scrape'
);

CREATE TYPE business_pipeline_stage AS ENUM (
  'new', 'qualified', 'unqualified', 'enriching', 'enriched', 'failed_enrich', 'exported'
);
```

## Views

| View | Zweck |
|------|-------|
| search_query_stats | Aggregierte Statistiken pro Suchbegriff |
| pipeline_errors | Fehlerhafte/stuck Pipeline-Items (Locations + Businesses) |
| system_logs_summary | Log-Zusammenfassung letzte 24h (gruppiert nach Source + Severity) |
| location_throughput | Locations-Durchsatz letzte 7 Tage |
| business_throughput | Business-Durchsatz letzte 7 Tage |

Alle Views mit `security_invoker = true` (RLS des aufrufenden Users gilt).

## Indizes

```sql
CREATE INDEX idx_locations_pipeline_stage ON locations(pipeline_stage);
CREATE INDEX idx_businesses_pipeline_stage ON businesses(pipeline_stage);
CREATE INDEX idx_businesses_search_string ON businesses(search_string);
CREATE INDEX idx_system_logs_source_severity ON system_logs(source, severity);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_dlq_status ON dead_letter_queue(status);
CREATE INDEX idx_dlq_created_at ON dead_letter_queue(created_at DESC);
```

## Migrations

| Datei | Inhalt |
|---|---|
| 20260303000000_add_pipeline_stage.sql | pipeline_stage, retry_count, last_error + Datenmigration |
| 20260303100000_pipeline_stage_enums.sql | Text → ENUM Konvertierung |
| 20260303110000_drop_legacy_columns.sql | Alte Status-Spalten + unbenutzte Apify-Felder entfernt |
| 20260304000000_create_system_logs.sql | system_logs Tabelle + RLS + Indizes |
| 20260304100000_create_monitoring_views.sql | pipeline_errors, system_logs_summary, throughput Views |
| 20260304200000_enable_rls_core_tables.sql | RLS auf locations, businesses, cities aktiviert |
| 20260304300000_fix_security_definer_views.sql | Views auf security_invoker, Funktionen search_path |
| 20260304400000_create_dead_letter_queue.sql | dead_letter_queue Tabelle + RLS + Indizes |

## API-Zugriff aus n8n

Alle Workflows nutzen die Supabase REST API (PostgREST):

```
GET  /rest/v1/locations?pipeline_stage=eq.new&limit=8
POST /rest/v1/businesses?on_conflict=place_id  (Upsert)
PATCH /rest/v1/businesses?id=eq.{id}  (Status-Update)
POST /rest/v1/system_logs  (Error/Event Logging)
GET  /rest/v1/pipeline_errors  (Monitoring)
GET  /rest/v1/system_logs_summary  (Daily Digest)
```

Header:
```
apikey: $env.SUPABASE_GOOGLE_KEY
Authorization: Bearer $env.SUPABASE_GOOGLE_KEY
Prefer: return=representation,resolution=merge-duplicates  (bei Upsert)
```
