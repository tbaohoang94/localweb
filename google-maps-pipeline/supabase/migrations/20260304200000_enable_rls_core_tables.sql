-- RLS auf Kerntabellen aktivieren (waren faelschlicherweise deaktiviert)
-- Service Role (n8n) umgeht RLS automatisch.

-- locations: authenticated kann SELECT, INSERT, DELETE
alter table locations enable row level security;

create policy "authenticated_select_locations"
  on locations for select to authenticated using (true);

create policy "authenticated_insert_locations"
  on locations for insert to authenticated with check (true);

create policy "authenticated_delete_locations"
  on locations for delete to authenticated using (true);

create policy "service_role_all_locations"
  on locations for all to service_role using (true) with check (true);

-- businesses: authenticated kann nur SELECT
alter table businesses enable row level security;

create policy "authenticated_select_businesses"
  on businesses for select to authenticated using (true);

create policy "service_role_all_businesses"
  on businesses for all to service_role using (true) with check (true);

-- cities: authenticated kann nur SELECT
alter table cities enable row level security;

create policy "authenticated_select_cities"
  on cities for select to authenticated using (true);

create policy "service_role_all_cities"
  on cities for all to service_role using (true) with check (true);
