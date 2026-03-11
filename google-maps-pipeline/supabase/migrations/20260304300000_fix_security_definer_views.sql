-- Security Fix: Views auf security_invoker umstellen
-- Damit werden RLS-Policies des aufrufenden Users angewandt

alter view pipeline_errors set (security_invoker = true);
alter view system_logs_summary set (security_invoker = true);
alter view location_throughput set (security_invoker = true);
alter view business_throughput set (security_invoker = true);
alter view search_query_stats set (security_invoker = true);

-- Security Fix: Funktionen search_path setzen
alter function update_updated_at() set search_path = public;
alter function update_updated_at_column() set search_path = public;
