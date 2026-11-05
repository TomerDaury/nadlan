-- Client requests, their matches and the public form rate limit (PRD F1–F3, ARCHITECTURE §2.4).
-- No RLS policies: these tables are reachable only from the server with the secret key.

create type public.match_source as enum ('initial', 'notification');

create table public.client_requests (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique,
  name text not null check (length(btrim(name)) > 0),
  email text not null check (length(btrim(email)) > 0),
  phone text,
  city text not null check (length(btrim(city)) > 0),
  neighborhoods text[] not null check (cardinality(neighborhoods) > 0),
  max_budget integer not null check (max_budget > 0),
  rooms_min numeric(3,1) not null check (rooms_min > 0),
  rooms_max numeric(3,1) not null check (rooms_max > 0),
  preferences_text text not null,
  access_token_hash text not null unique,
  notifications_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (rooms_min <= rooms_max)
);

create index client_requests_created_at_idx on public.client_requests (created_at desc);

create trigger client_requests_set_updated_at
before update on public.client_requests
for each row execute function public.set_updated_at();

create table public.request_matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.client_requests (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  property_title_snapshot text not null,
  source public.match_source not null,
  rank smallint check (rank between 1 and 3),
  reason text,
  is_current boolean not null default true,
  created_at timestamptz not null default now()
);

create index request_matches_request_idx on public.request_matches (request_id, source, is_current);
create index request_matches_property_idx on public.request_matches (property_id);
-- The same property is never sent twice to the same request as an update (PRD F6).
create unique index request_matches_one_notification_idx
  on public.request_matches (request_id, property_id) where source = 'notification';

-- Rate limiting for the public form: one row per accepted submission.
create table public.submission_log (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index submission_log_ip_idx on public.submission_log (ip_hash, created_at);

alter table public.client_requests enable row level security;
alter table public.request_matches enable row level security;
alter table public.submission_log enable row level security;
