insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'resort-images',
  'resort-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read resort images" on storage.objects;
create policy "Public can read resort images"
  on storage.objects
  for select
  using (bucket_id = 'resort-images');

drop policy if exists "Anon can upload resort images during MVP" on storage.objects;
create policy "Anon can upload resort images during MVP"
  on storage.objects
  for insert
  with check (bucket_id = 'resort-images');

drop policy if exists "Anon can update resort images during MVP" on storage.objects;
create policy "Anon can update resort images during MVP"
  on storage.objects
  for update
  using (bucket_id = 'resort-images')
  with check (bucket_id = 'resort-images');
