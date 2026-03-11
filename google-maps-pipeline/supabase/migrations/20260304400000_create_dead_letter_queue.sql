-- Dead Letter Queue fuer fehlgeschlagene Pipeline-Items
create table if not exists dead_letter_queue (
  id uuid default gen_random_uuid() primary key,
  source_workflow text not null,
  payload jsonb not null,
  error_message text,
  retry_count int default 0,
  max_retries int default 3,
  status text default 'pending' check (status in ('pending', 'retrying', 'failed', 'resolved')),
  created_at timestamptz default now(),
  last_retry_at timestamptz
);

alter table dead_letter_queue enable row level security;

create policy "authenticated_select_dlq"
  on dead_letter_queue for select to authenticated using (true);

create policy "service_role_all_dlq"
  on dead_letter_queue for all to service_role using (true) with check (true);

create index idx_dlq_status on dead_letter_queue(status);
create index idx_dlq_created_at on dead_letter_queue(created_at desc);

comment on table dead_letter_queue is 'Dead Letter Queue fuer fehlgeschlagene Pipeline-Items nach max_retries';
