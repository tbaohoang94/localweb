-- Monitoring Views fuer Pipeline-Fehler und Durchsatz

-- View: Fehlerhafte Pipeline-Items (stuck oder failed)
create or replace view pipeline_errors as
select
  'location' as entity_type,
  id,
  city,
  query as name,
  pipeline_stage::text as stage,
  retry_count,
  last_error,
  updated_at
from locations
where pipeline_stage = 'failed_scrape'
   or (pipeline_stage = 'scraping' and updated_at < now() - interval '1 hour')

union all

select
  'business' as entity_type,
  id,
  city,
  name,
  pipeline_stage::text as stage,
  retry_count,
  last_error,
  updated_at
from businesses
where pipeline_stage = 'failed_enrich'
   or (pipeline_stage = 'enriching' and updated_at < now() - interval '30 minutes');

-- View: system_logs Zusammenfassung (letzte 24h)
create or replace view system_logs_summary as
select
  source,
  severity,
  count(*) as log_count,
  max(created_at) as last_occurrence
from system_logs
where created_at > now() - interval '24 hours'
group by source, severity
order by
  case severity
    when 'critical' then 1
    when 'error' then 2
    when 'warning' then 3
    when 'info' then 4
  end;

-- View: Pipeline-Durchsatz Locations (letzte 7 Tage)
create or replace view location_throughput as
select
  date_trunc('day', created_at) as day,
  count(*) as total,
  count(*) filter (where pipeline_stage = 'scraped') as scraped,
  count(*) filter (where pipeline_stage = 'imported') as imported,
  count(*) filter (where pipeline_stage = 'failed_scrape') as failed
from locations
where created_at > now() - interval '7 days'
group by date_trunc('day', created_at)
order by day desc;

-- View: Pipeline-Durchsatz Businesses (letzte 7 Tage)
create or replace view business_throughput as
select
  date_trunc('day', created_at) as day,
  count(*) as total,
  count(*) filter (where pipeline_stage in ('qualified', 'enriching', 'enriched', 'exported')) as qualified,
  count(*) filter (where pipeline_stage = 'enriched') as enriched,
  count(*) filter (where pipeline_stage = 'exported') as exported,
  count(*) filter (where pipeline_stage = 'unqualified') as unqualified,
  count(*) filter (where pipeline_stage = 'failed_enrich') as failed
from businesses
where created_at > now() - interval '7 days'
group by date_trunc('day', created_at)
order by day desc;
