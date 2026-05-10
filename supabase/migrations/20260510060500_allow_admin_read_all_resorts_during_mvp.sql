drop policy if exists "Public can read active resorts" on public.resorts;
drop policy if exists "Anon can read resorts during MVP" on public.resorts;

create policy "Anon can read resorts during MVP"
  on public.resorts
  for select
  using (true);
