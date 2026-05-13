-- Lock down MVP-era anonymous admin policies now that writes run through server-side admin APIs.
drop policy if exists "Anon can read resorts during MVP" on public.resorts;
drop policy if exists "Public can read active resorts" on public.resorts;
create policy "Public can read active resorts"
  on public.resorts
  for select
  using (is_active = true);

drop policy if exists "Anon can insert resorts during MVP" on public.resorts;
drop policy if exists "Anon can update resorts during MVP" on public.resorts;
drop policy if exists "Anon can delete resorts during MVP" on public.resorts;

drop policy if exists "Anon can upload resort images during MVP" on storage.objects;
drop policy if exists "Anon can update resort images during MVP" on storage.objects;
drop policy if exists "Anon can delete resort images during MVP" on storage.objects;
