-- MVP-only delete policies for the unauthenticated admin page.
-- Replace these with Supabase Auth role checks before production.
drop policy if exists "Anon can delete resorts during MVP" on public.resorts;
create policy "Anon can delete resorts during MVP"
  on public.resorts
  for delete
  using (true);

drop policy if exists "Anon can delete resort images during MVP" on storage.objects;
create policy "Anon can delete resort images during MVP"
  on storage.objects
  for delete
  using (bucket_id = 'resort-images');
