-- system_logs: Zentrales Logging fuer alle Systemkomponenten
-- Genutzt von: n8n Error Workflow, Next.js (spaeter), Supabase Monitoring

create table if not exists system_logs (
  id uuid default gen_random_uuid() primary key,
  source text not null check (source in ('n8n', 'nextjs', 'supabase', 'close')),
  severity text not null check (severity in ('info', 'warning', 'error', 'critical')),
  workflow_name text,
  error_message text,
  error_stack text,
  input_data jsonb,
  metadata jsonb,
  created_at timestamptz default now()
);

-- RLS aktivieren
alter table system_logs enable row level security;

-- Policy: authenticated Users koennen lesen
create policy "authenticated_read_system_logs"
  on system_logs for select
  to authenticated
  using (true);

-- Policy: service_role kann alles (n8n schreibt ueber Service Role Key)
create policy "service_role_all_system_logs"
  on system_logs for all
  to service_role
  using (true)
  with check (true);

-- Indizes fuer schnelle Abfragen
create index idx_system_logs_source_severity on system_logs(source, severity);
create index idx_system_logs_created_at on system_logs(created_at desc);

-- Kommentar
comment on table system_logs is 'Zentrales Error- und Event-Logging fuer n8n, Next.js und Supabase';
