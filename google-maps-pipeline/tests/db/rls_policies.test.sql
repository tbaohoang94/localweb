-- pgTAP Tests fuer RLS Policies
-- Ausfuehrung: scripts/test-db.sh
-- Voraussetzung: pgTAP Extension aktiviert (20260304500000_enable_pgtap.sql)

BEGIN;

SELECT plan(18);

-- ============================================================
-- Test: RLS ist auf allen Kerntabellen aktiviert
-- ============================================================

SELECT has_table('public', 'locations', 'Tabelle locations existiert');
SELECT has_table('public', 'businesses', 'Tabelle businesses existiert');
SELECT has_table('public', 'cities', 'Tabelle cities existiert');
SELECT has_table('public', 'system_logs', 'Tabelle system_logs existiert');
SELECT has_table('public', 'dead_letter_queue', 'Tabelle dead_letter_queue existiert');
SELECT has_table('public', 'workflow_logs', 'Tabelle workflow_logs existiert');

SELECT row_security_active('locations', 'RLS aktiv auf locations');
SELECT row_security_active('businesses', 'RLS aktiv auf businesses');
SELECT row_security_active('cities', 'RLS aktiv auf cities');
SELECT row_security_active('system_logs', 'RLS aktiv auf system_logs');
SELECT row_security_active('dead_letter_queue', 'RLS aktiv auf dead_letter_queue');
SELECT row_security_active('workflow_logs', 'RLS aktiv auf workflow_logs');

-- ============================================================
-- Test: Anon-Rolle hat keinen Zugriff auf Kerntabellen
-- ============================================================

SET ROLE anon;

SELECT is(
  (SELECT count(*) FROM locations)::integer,
  0,
  'Anon kann keine locations lesen'
);

SELECT is(
  (SELECT count(*) FROM businesses)::integer,
  0,
  'Anon kann keine businesses lesen'
);

SELECT is(
  (SELECT count(*) FROM cities)::integer,
  0,
  'Anon kann keine cities lesen'
);

SELECT is(
  (SELECT count(*) FROM system_logs)::integer,
  0,
  'Anon kann keine system_logs lesen'
);

SELECT is(
  (SELECT count(*) FROM dead_letter_queue)::integer,
  0,
  'Anon kann keine dead_letter_queue lesen'
);

SELECT is(
  (SELECT count(*) FROM workflow_logs)::integer,
  0,
  'Anon kann keine workflow_logs lesen'
);

RESET ROLE;

SELECT * FROM finish();

ROLLBACK;
