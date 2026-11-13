-- Run against the selected Supabase project, not a local SQLite database.
-- Each former JSON array element becomes an individual row. JSONB retains
-- legacy/custom fields and evidence; generated columns support SQL filtering.
create table if not exists public.leads (
  id text primary key,
  canonical_url text unique,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  company text generated always as (data->>'company') stored,
  industry text generated always as (data->>'industry') stored,
  service text generated always as (data->>'service') stored,
  status text generated always as (data->>'status') stored,
  source_platform text generated always as (data->>'source_platform') stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_filters_idx on public.leads(status, industry, service);
create unique index if not exists leads_company_title_idx
  on public.leads(lower(btrim(data->>'company')), lower(btrim(data->>'title')))
  where btrim(coalesce(data->>'company', '')) <> '' and btrim(coalesce(data->>'title', '')) <> '';

create table if not exists public.pipelines (
  id text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  name text generated always as (data->>'name') stored,
  status text generated always as (data->>'status') stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.app_settings (
  id text primary key check (id = 'global'),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now()
);
create table if not exists public.search_runs (
  id uuid primary key,
  status text not null check (status in ('running', 'completed', 'failed')),
  query text,
  result_limit integer not null check (result_limit between 1 and 20),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  found_count integer not null default 0,
  added_count integer not null default 0,
  diagnostics jsonb not null default '{}'::jsonb,
  error text
);
create index if not exists search_runs_started_idx on public.search_runs(started_at desc);
create table if not exists public.search_candidates (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.search_runs(id) on delete cascade,
  url text not null,
  platform text,
  search_provider text,
  title text,
  evidence_text text,
  accepted boolean not null,
  rejection_reason text,
  evaluation jsonb,
  checked_at timestamptz not null default now(),
  unique (run_id, url)
);
create index if not exists search_candidates_run_idx on public.search_candidates(run_id);

-- Only the server connects to Postgres. No browser access or public policies.
alter table public.leads enable row level security;
alter table public.pipelines enable row level security;
alter table public.app_settings enable row level security;
alter table public.search_runs enable row level security;
alter table public.search_candidates enable row level security;
revoke all on public.leads, public.pipelines, public.app_settings, public.search_runs, public.search_candidates from anon, authenticated;
grant all on public.leads, public.pipelines, public.app_settings, public.search_runs, public.search_candidates to service_role;
grant usage, select on sequence public.search_candidates_id_seq to service_role;
