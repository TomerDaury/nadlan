-- Row Level Security for agent-only tables (ARCHITECTURE §2.7).
-- No policies for anon: direct browser access without sign-in returns nothing.

alter table public.properties enable row level security;
alter table public.property_images enable row level security;

create policy "admin full access to properties"
  on public.properties
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "admin full access to property_images"
  on public.property_images
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
