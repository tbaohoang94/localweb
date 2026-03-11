-- pgTAP Tests fuer Migration-Konsistenz
-- Prueft ob alle erwarteten Strukturen nach Migration vorhanden sind
-- Ausfuehrung: scripts/test-db.sh

BEGIN;

SELECT plan(16);

-- ============================================================
-- Test: Alle Tabellen existieren nach Migrations
-- ============================================================

SELECT has_table('public', 'locations', 'Tabelle locations existiert');
SELECT has_table('public', 'businesses', 'Tabelle businesses existiert');
SELECT has_table('public', 'cities', 'Tabelle cities existiert');
SELECT has_table('public', 'workflow_logs', 'Tabelle workflow_logs existiert');
SELECT has_table('public', 'custom_fields', 'Tabelle custom_fields existiert');
SELECT has_table('public', 'category_qualifications', 'Tabelle category_qualifications existiert');
SELECT has_table('public', 'system_logs', 'Tabelle system_logs existiert');
SELECT has_table('public', 'dead_letter_queue', 'Tabelle dead_letter_queue existiert');

-- ============================================================
-- Test: pipeline_stage Spalten haben korrekte Typen (ENUM, nicht Text)
-- ============================================================

SELECT col_type_is('locations', 'pipeline_stage', 'location_pipeline_stage',
  'locations.pipeline_stage ist ENUM Typ');
SELECT col_type_is('businesses', 'pipeline_stage', 'business_pipeline_stage',
  'businesses.pipeline_stage ist ENUM Typ');

-- ============================================================
-- Test: Retry-Spalten existieren
-- ============================================================

SELECT has_column('locations', 'retry_count', 'locations hat retry_count');
SELECT has_column('locations', 'last_error', 'locations hat last_error');
SELECT has_column('businesses', 'retry_count', 'businesses hat retry_count');
SELECT has_column('businesses', 'last_error', 'businesses hat last_error');

-- ============================================================
-- Test: system_logs hat erwartete Spalten
-- ============================================================

SELECT has_column('system_logs', 'source', 'system_logs hat source');
SELECT has_column('system_logs', 'severity', 'system_logs hat severity');

SELECT * FROM finish();

ROLLBACK;
