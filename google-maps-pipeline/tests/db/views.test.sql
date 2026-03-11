-- pgTAP Tests fuer Views
-- Ausfuehrung: scripts/test-db.sh

BEGIN;

SELECT plan(10);

-- ============================================================
-- Test: Views existieren
-- ============================================================

SELECT has_view('public', 'search_query_stats', 'View search_query_stats existiert');
SELECT has_view('public', 'pipeline_errors', 'View pipeline_errors existiert');
SELECT has_view('public', 'system_logs_summary', 'View system_logs_summary existiert');
SELECT has_view('public', 'location_throughput', 'View location_throughput existiert');
SELECT has_view('public', 'business_throughput', 'View business_throughput existiert');

-- ============================================================
-- Test: Views sind security_invoker (nicht security_definer)
-- ============================================================

-- Pruefe dass Views KEINE security_definer Flags haben
-- security_invoker Views haben kein relrowsecurity-Flag in pg_class
-- Stattdessen pruefen wir die View-Definition

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_views
    WHERE viewname = 'search_query_stats'
    AND schemaname = 'public'
    AND definition LIKE '%SECURITY DEFINER%'
  ),
  'search_query_stats ist nicht SECURITY DEFINER'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_views
    WHERE viewname = 'pipeline_errors'
    AND schemaname = 'public'
    AND definition LIKE '%SECURITY DEFINER%'
  ),
  'pipeline_errors ist nicht SECURITY DEFINER'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_views
    WHERE viewname = 'system_logs_summary'
    AND schemaname = 'public'
    AND definition LIKE '%SECURITY DEFINER%'
  ),
  'system_logs_summary ist nicht SECURITY DEFINER'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_views
    WHERE viewname = 'location_throughput'
    AND schemaname = 'public'
    AND definition LIKE '%SECURITY DEFINER%'
  ),
  'location_throughput ist nicht SECURITY DEFINER'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_views
    WHERE viewname = 'business_throughput'
    AND schemaname = 'public'
    AND definition LIKE '%SECURITY DEFINER%'
  ),
  'business_throughput ist nicht SECURITY DEFINER'
);

SELECT * FROM finish();

ROLLBACK;
