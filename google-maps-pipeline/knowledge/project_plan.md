# Projektplan — Google Maps Lead Pipeline

> Zuletzt aktualisiert: 2026-03-03

---

## Phase 1: Datenbank & State Machine [ERLEDIGT]

- [x] pipeline_stage Spalte auf locations + businesses
- [x] retry_count + last_error Spalten
- [x] pipeline_runs Monitoring-Tabelle
- [x] Bestehende Daten migrieren (alte Status → pipeline_stage)
- [x] PostgreSQL ENUMs fuer Typsicherheit
- [x] Legacy-Spalten entfernt (scrape_status, enrichment_status, qualification_status, close_export_status, etc.)
- [x] Unbenutzte Apify-Spalten entfernt (price, state, categories, etc.)
- [x] View search_query_stats auf pipeline_stage umgebaut

## Phase 2: Workflow-Umbau [ERLEDIGT]

- [x] WF 01 — Schedule Trigger, pipeline_stage nutzen
- [x] WF 01b — pipeline_stage statt scrape_status
- [x] WF 02 — Schedule Trigger, pipeline_stage, Reduce-to-One Fix
- [x] WF 03 — Schedule Trigger + Webhook, pipeline_stage
- [x] WF 04a — Schedule Trigger + Webhook, pipeline_stage
- [x] WF 04b — pipeline_stage statt enrichment_status
- [x] WF 05 — Schedule Trigger + Webhook, pipeline_stage, SMTP konfiguriert
- [x] WF 07 — Error Logger mit korrekter SMTP Credential
- [x] WF 00 — Orchestrator deaktiviert
- [x] Alle errorWorkflow IDs korrigiert
- [x] WF 04a workflowId Referenz korrigiert
- [x] Alle Legacy-Status-Spalten aus PATCH-Bodies entfernt

## Phase 3: Testing [ERLEDIGT]

- [x] End-to-End Test: Location "Geigenbauer Passau" → 3 Businesses
- [x] WF 01 → 01b → 02 → 03 → 04a/04b → 05 komplett durchlaufen
- [x] 2/3 Businesses bis exported, 1 failed_enrich (Website-Problem)
- [x] Error Logger funktioniert
- [x] SMTP Email-Versand konfiguriert (Hetzner Mail)

## Phase 4: Hetzner Bereinigung [ERLEDIGT]

- [x] Alle alten Close-CRM Workflows auf Hetzner geloescht
- [x] Sauberer Zustand fuer spaeteres Production-Deployment

## Phase 5: Dokumentation [ERLEDIGT]

- [x] Knowledge-Files aktualisiert (Blueprint, Architektur, Datenmodell, etc.)
- [x] supabase-schema.sql aktualisiert

## Phase 6: Offen

- [ ] Frontend: Pipeline-Status Dashboard
- [ ] Frontend: Manueller Retry Button
- [ ] Automatischer Pipeline-Level Retry (SQL am Anfang jedes WF)
- [ ] Close.io Integration (WF 06)
- [ ] Production-Deployment auf Hetzner
