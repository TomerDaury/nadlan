-- Properties and their images (PRD F8, ARCHITECTURE §2.4).

create type public.property_condition as enum ('new', 'renovated', 'needs_renovation');
create type public.property_status as enum ('available', 'unavailable');

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) > 0),
  city text not null check (length(btrim(city)) > 0),
  neighborhood text not null check (length(btrim(neighborhood)) > 0),
  address text,
  price integer not null check (price > 0),
  rooms numeric(3,1) not null check (rooms > 0),
  area_sqm integer check (area_sqm > 0),
  floor integer,
  has_parking boolean not null default false,
  has_elevator boolean not null default false,
  has_balcony boolean not null default false,
  has_safe_room boolean not null default false,
  has_storage boolean not null default false,
  condition public.property_condition,
  description text,
  expected_rent integer check (expected_rent >= 0),
  estimated_yield numeric(4,2) check (estimated_yield >= 0),
  status public.property_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_status_city_idx on public.properties (status, city);
create index properties_price_idx on public.properties (price);

-- Keep updated_at current on every update.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  storage_path text not null unique,
  is_primary boolean not null default false,
  sort_order smallint not null default 0
);

create index property_images_property_idx on public.property_images (property_id, sort_order);
-- At most one primary image per property.
create unique index property_images_one_primary_idx
  on public.property_images (property_id) where is_primary;

-- Closed list of areas for the public form (built from available properties only).
create view public.available_areas
with (security_invoker = true) as
select distinct city, neighborhood
from public.properties
where status = 'available';
