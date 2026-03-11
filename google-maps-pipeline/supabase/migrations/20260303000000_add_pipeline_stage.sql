-- Pipeline Stage: Zentrale State Machine fuer die gesamte Pipeline
-- Ersetzt die verteilten Status-Spalten (scrape_status, qualification_status, enrichment_status, close_export_status)
-- Jeder Workflow pickt Items basierend auf pipeline_stage und bewegt sie zum naechsten Status

-- locations: new -> scraping -> scraped -> imported | failed_scrape
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS pipeline_stage text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text;

CREATE INDEX IF NOT EXISTS idx_locations_pipeline_stage ON locations(pipeline_stage);

-- Bestehende Daten migrieren (alte Status-Spalten -> pipeline_stage)
UPDATE locations SET pipeline_stage =
  CASE
    WHEN scrape_status = 'finished' THEN 'imported'
    WHEN scrape_status = 'running' THEN 'scraping'
    WHEN scrape_status = 'failed' THEN 'failed_scrape'
    ELSE 'new'
  END
WHERE pipeline_stage = 'new';

-- businesses: new -> qualifying -> qualified/unqualified -> enriching -> enriched/failed_enrich -> exported
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS pipeline_stage text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text;

CREATE INDEX IF NOT EXISTS idx_businesses_pipeline_stage ON businesses(pipeline_stage);

-- Bestehende Daten migrieren (alte Status-Spalten -> pipeline_stage)
UPDATE businesses SET pipeline_stage =
  CASE
    WHEN close_export_status IN ('exported', 'csv_sent') THEN 'exported'
    WHEN enrichment_status = 'enriched' THEN 'enriched'
    WHEN enrichment_status = 'failed' THEN 'failed_enrich'
    WHEN enrichment_status = 'pending' THEN 'enriching'
    WHEN qualification_status = 'qualified' THEN 'qualified'
    WHEN qualification_status = 'unqualified' THEN 'unqualified'
    ELSE 'new'
  END
WHERE pipeline_stage = 'new';

-- Pipeline Runs: Monitoring-Tabelle fuer Workflow-Laeufe (optional)
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  items_processed integer DEFAULT 0,
  items_failed integer DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access" ON pipeline_runs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read" ON pipeline_runs FOR SELECT TO authenticated USING (true);
