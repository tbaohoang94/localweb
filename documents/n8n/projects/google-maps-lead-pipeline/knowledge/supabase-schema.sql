-- Static list of cities (no inserts from frontend)
create table cities (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  country text not null
);

-- Locations = city × keyword combinations (auto-generated)
create table locations (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  city text not null,
  query text not null,
  latitude numeric,
  longitude numeric,
  created_at timestamptz default now(),

  -- Scrape tracking (merged from former scrape_runs table)
  apify_run_id text,
  scrape_status text,            -- null=unscraped, running, finished, failed
  scraped_at timestamptz,
  scrape_finished_at timestamptz,
  scrape_total_results integer,

  unique (country, city, query)
);

create table businesses (
  id uuid primary key default gen_random_uuid(),
  place_id text unique not null,
  name text not null,
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
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Additional Apify fields
  price text,
  neighborhood text,
  street text,
  state text,
  phone_unformatted text,
  temporarily_closed boolean default false,
  categories jsonb,

  -- Google identifiers
  fid text,
  cid text,
  kgmid text,

  -- Media
  images_count integer,
  image_categories jsonb,

  -- Structured data
  opening_hours jsonb,
  additional_info jsonb,
  people_also_search jsonb,
  places_tags jsonb,
  reviews_tags jsonb,
  hotel_ads jsonb,
  gas_prices jsonb,

  -- URLs
  google_maps_url text,
  google_food_url text,

  -- Scrape metadata
  search_string text,
  search_page_url text,
  language text,
  rank integer,
  is_advertisement boolean default false,
  scraped_at timestamptz,

  -- Enrichment fields (Workflow 04)
  website_summary text,
  impressum_url text,
  impressum_contacts jsonb,
  im_contact_name text,
  im_email text,
  im_tel text,
  enrichment_status text default null,  -- null=new, pending=in-progress, enriched=done, failed=error
  enriched_at timestamptz,

  -- Qualification fields (Workflow 03)
  qualification_status text default null,  -- null=new, qualified, unqualified
  qualification_reason text,               -- OpenAI reasoning
  qualified_at timestamptz,

  -- Close.io export fields (Workflow 05/06)
  close_export_status text default null,   -- null=new, csv_sent, exported, duplicate, skipped, failed
  close_exported_at timestamptz,
  close_lead_id text                       -- Close.io lead ID (from WF 06 direct export)
);

-- Close.io custom field mappings (used by WF 06 Close import)
create table custom_fields (
  id uuid primary key default gen_random_uuid(),
  close_field_id text unique not null,
  name text not null,
  entity_type text not null check (entity_type in ('lead', 'opportunity')),
  field_type text,
  created_at timestamptz default now(),
  synced_at timestamptz
);

-- Workflow execution logs (used by all WFs via error workflow 07)
create table workflow_logs (
  id uuid primary key default gen_random_uuid(),
  workflow_name text not null,
  run_date date not null default current_date,
  items_count integer default 0,
  status text not null,               -- completed, error
  details jsonb,
  execution_id text,                  -- n8n execution ID for linking
  error_node text,                    -- node name that failed
  error_message text,                 -- error description
  duration_ms integer,                -- execution duration
  created_at timestamptz default now()
);

-- Indexes for workflow filter queries
create index idx_businesses_enrichment_status on businesses (enrichment_status);
create index idx_businesses_qualification_status on businesses (qualification_status);
create index idx_businesses_search_string on businesses (search_string);
create index idx_businesses_close_export_status on businesses (close_export_status);
create index idx_locations_scrape_status on locations (scrape_status);

-- RLS policies
alter table cities enable row level security;
alter table locations enable row level security;
alter table businesses enable row level security;

create policy "Allow authenticated read" on cities for select to authenticated using (true);
create policy "Allow authenticated read" on locations for select to authenticated using (true);
create policy "Allow authenticated insert" on locations for insert to authenticated with check (true);
create policy "Allow authenticated delete" on locations for delete to authenticated using (true);
create policy "Allow authenticated read" on businesses for select to authenticated using (true);
alter table custom_fields enable row level security;
create policy "Allow service role full access" on custom_fields for all to service_role using (true) with check (true);
create policy "Allow authenticated read" on custom_fields for select to authenticated using (true);
alter table workflow_logs enable row level security;
create policy "Allow service role full access" on workflow_logs for all to service_role using (true) with check (true);
create policy "Allow authenticated read" on workflow_logs for select to authenticated using (true);
