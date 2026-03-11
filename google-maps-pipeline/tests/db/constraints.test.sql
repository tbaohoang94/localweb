-- pgTAP Tests fuer Constraints und Datenintegritaet
-- Ausfuehrung: scripts/test-db.sh

BEGIN;

SELECT plan(12);

-- ============================================================
-- ENUMs existieren
-- ============================================================

SELECT has_enum('public', 'location_pipeline_stage', 'ENUM location_pipeline_stage existiert');
SELECT has_enum('public', 'business_pipeline_stage', 'ENUM business_pipeline_stage existiert');

-- ============================================================
-- ENUM-Werte korrekt
-- ============================================================

SELECT enum_has_labels(
  'location_pipeline_stage',
  ARRAY['new', 'scraping', 'scraped', 'imported', 'failed_scrape'],
  'location_pipeline_stage hat alle erwarteten Werte'
);

SELECT enum_has_labels(
  'business_pipeline_stage',
  ARRAY['new', 'qualified', 'unqualified', 'enriching', 'enriched', 'failed_enrich', 'exported'],
  'business_pipeline_stage hat alle erwarteten Werte'
);

-- ============================================================
-- NOT NULL Constraints
-- ============================================================

SELECT col_not_null('locations', 'country', 'locations.country ist NOT NULL');
SELECT col_not_null('locations', 'city', 'locations.city ist NOT NULL');
SELECT col_not_null('locations', 'query', 'locations.query ist NOT NULL');
SELECT col_not_null('businesses', 'place_id', 'businesses.place_id ist NOT NULL');
SELECT col_not_null('businesses', 'name', 'businesses.name ist NOT NULL');

-- ============================================================
-- UNIQUE Constraints
-- ============================================================

SELECT col_is_unique('businesses', 'place_id', 'businesses.place_id ist UNIQUE');

-- ============================================================
-- Indizes existieren
-- ============================================================

SELECT has_index('locations', 'idx_locations_pipeline_stage', 'Index auf locations.pipeline_stage');
SELECT has_index('businesses', 'idx_businesses_pipeline_stage', 'Index auf businesses.pipeline_stage');

SELECT * FROM finish();

ROLLBACK;
