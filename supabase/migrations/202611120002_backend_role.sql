-- Dedicated server login. Its password is provisioned separately, never committed.
create role studioradar_app login nosuperuser nocreatedb nocreaterole noinherit
  noreplication nobypassrls connection limit 10 password null;
grant connect on database postgres to studioradar_app;
grant usage on schema public to studioradar_app;
grant select, insert, update, delete on public.leads, public.pipelines, public.app_settings,
  public.search_runs, public.search_candidates to studioradar_app;
grant usage, select on sequence public.search_candidates_id_seq to studioradar_app;
create policy studioradar_backend on public.leads for all to studioradar_app using (true) with check (true);
create policy studioradar_backend on public.pipelines for all to studioradar_app using (true) with check (true);
create policy studioradar_backend on public.app_settings for all to studioradar_app using (true) with check (true);
create policy studioradar_backend on public.search_runs for all to studioradar_app using (true) with check (true);
create policy studioradar_backend on public.search_candidates for all to studioradar_app using (true) with check (true);
