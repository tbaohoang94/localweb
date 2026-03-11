-- Pipeline Stage Enums: Typ-Sicherheit fuer die State Machine
-- Verhindert Tippfehler und macht gueltige Werte explizit

-- Enum fuer locations.pipeline_stage
CREATE TYPE location_pipeline_stage AS ENUM (
  'new',
  'scraping',
  'scraped',
  'imported',
  'failed_scrape'
);

-- Enum fuer businesses.pipeline_stage
CREATE TYPE business_pipeline_stage AS ENUM (
  'new',
  'qualified',
  'unqualified',
  'enriching',
  'enriched',
  'failed_enrich',
  'exported'
);

-- locations: text -> enum konvertieren
ALTER TABLE locations
  ALTER COLUMN pipeline_stage DROP DEFAULT,
  ALTER COLUMN pipeline_stage TYPE location_pipeline_stage
    USING pipeline_stage::location_pipeline_stage,
  ALTER COLUMN pipeline_stage SET DEFAULT 'new';

-- businesses: text -> enum konvertieren
ALTER TABLE businesses
  ALTER COLUMN pipeline_stage DROP DEFAULT,
  ALTER COLUMN pipeline_stage TYPE business_pipeline_stage
    USING pipeline_stage::business_pipeline_stage,
  ALTER COLUMN pipeline_stage SET DEFAULT 'new';
