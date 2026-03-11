-- Google Maps Lead Pipeline — Supabase Schema
-- Zuletzt aktualisiert: 2026-03-03

-- ══════════════════════════════════════════════════════════════════════════════
-- Enums
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TYPE location_pipeline_stage AS ENUM (
  'new', 'scraping', 'scraped', 'imported', 'failed_scrape'
);

CREATE TYPE business_pipeline_stage AS ENUM (
  'new', 'qualified', 'unqualified', 'enriching', 'enriched', 'failed_enrich', 'exported'
);

-- ══════════════════════════════════════════════════════════════════════════════
-- Tables
-- ══════════════════════════════════════════════════════════════════════════════

-- Statische Staedteliste
CREATE TABLE cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  country text NOT NULL
);

-- Stadt × Suchbegriff Kombinationen + Scrape-Tracking
CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  city text NOT NULL,
  query text NOT NULL,
  latitude numeric,
  longitude numeric,
  created_at timestamptz DEFAULT now(),

  -- Scrape tracking
  apify_run_id text,
  scraped_at timestamptz,
  scrape_finished_at timestamptz,
  scrape_total_results integer,

  -- Pipeline State Machine
  pipeline_stage location_pipeline_stage NOT NULL DEFAULT 'new',
  retry_count integer NOT NULL DEFAULT 0,
  last_error text,

  UNIQUE (country, city, query)
);

-- Google Maps Ergebnisse + Enrichment + Kontaktdaten
CREATE TABLE businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id text UNIQUE NOT NULL,
  name text NOT NULL,
  category text,
  address text,
  city text,
  postal_code text,
  country text,
  phone text,
  website text,
  rating numeric,
  reviews_count integer,
  latitude numeric,
  longitude numeric,
  claimed boolean,
  permanently_closed boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Zusaetzliche Apify-Felder
  neighborhood text,
  street text,
  phone_unformatted text,
  fid text,
  cid text,
  images_count integer,
  opening_hours jsonb,
  google_maps_url text,
  search_string text,
  rank integer,

  -- Enrichment (WF 04b)
  website_summary text,
  enriched_at timestamptz,
  im_contact_name text,
  im_email text,
  im_tel text,

  -- Qualification (WF 03)
  qualification_reason text,
  qualified_at timestamptz,

  -- Pipeline State Machine
  pipeline_stage business_pipeline_stage NOT NULL DEFAULT 'new',
  retry_count integer NOT NULL DEFAULT 0,
  last_error text
);

-- Close.io Custom Field Mappings (out of scope)
CREATE TABLE custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  close_field_id text UNIQUE NOT NULL,
  name text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('lead', 'opportunity')),
  field_type text,
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz
);

-- Error-Logs (WF 07)
CREATE TABLE workflow_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name text NOT NULL,
  run_date date NOT NULL DEFAULT current_date,
  items_count integer DEFAULT 0,
  status text NOT NULL,
  details jsonb,
  execution_id text,
  error_node text,
  error_message text,
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Workflow-Monitoring
CREATE TABLE pipeline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  items_processed integer DEFAULT 0,
  items_failed integer DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- Indexes
-- ══════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_locations_pipeline_stage ON locations(pipeline_stage);
CREATE INDEX idx_businesses_pipeline_stage ON businesses(pipeline_stage);
CREATE INDEX idx_businesses_search_string ON businesses(search_string);

-- ══════════════════════════════════════════════════════════════════════════════
-- Views
-- ══════════════════════════════════════════════════════════════════════════════

CREATE VIEW search_query_stats AS
SELECT
  search_string,
  count(*) AS total,
  count(*) FILTER (WHERE pipeline_stage != 'unqualified') AS qualified,
  count(*) FILTER (WHERE pipeline_stage = 'unqualified') AS wrong_category,
  count(*) FILTER (WHERE phone IS NULL AND im_tel IS NULL) AS no_phone,
  count(*) FILTER (WHERE website IS NULL) AS no_website,
  count(*) FILTER (WHERE im_contact_name IS NULL) AS no_contact,
  count(*) FILTER (WHERE pipeline_stage IN ('enriched', 'qualified')
    AND (im_tel IS NOT NULL OR phone IS NOT NULL)) AS exportable
FROM businesses
GROUP BY search_string
ORDER BY count(*) DESC;

-- ══════════════════════════════════════════════════════════════════════════════
-- RLS
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;

-- Authenticated: read-only
CREATE POLICY "Allow authenticated read" ON cities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated delete" ON locations FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON businesses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON custom_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON workflow_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON pipeline_runs FOR SELECT TO authenticated USING (true);

-- Service role: full access
CREATE POLICY "Allow service role full access" ON custom_fields FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON workflow_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON pipeline_runs FOR ALL TO service_role USING (true) WITH CHECK (true);
