-- Public-read bucket for property images (ARCHITECTURE §2.4 Storage, §2.11).
-- The bucket itself enforces file type and size (5MB).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

-- Only the agent may upload, replace or delete files.
create policy "admin uploads property images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'property-images' and (select public.is_admin()));

create policy "admin updates property images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'property-images' and (select public.is_admin()))
  with check (bucket_id = 'property-images' and (select public.is_admin()));

create policy "admin deletes property images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'property-images' and (select public.is_admin()));

-- Storage delete/list goes through select on objects; allow it for the agent only.
create policy "admin reads property image objects"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'property-images' and (select public.is_admin()));
