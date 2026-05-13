drop policy if exists "Public can insert site events" on public.site_events;
create policy "Public can insert site events"
  on public.site_events
  for insert
  with check (event_type in ('whatsapp_click', 'page_view'));

