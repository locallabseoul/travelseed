create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid references public.resorts(id) on delete cascade,
  event_type text not null,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists site_events_resort_id_idx on public.site_events (resort_id);
create index if not exists site_events_event_type_idx on public.site_events (event_type);
create index if not exists site_events_created_at_idx on public.site_events (created_at desc);

alter table public.site_events enable row level security;

drop policy if exists "Public can insert site events" on public.site_events;
create policy "Public can insert site events"
  on public.site_events
  for insert
  with check (event_type in ('whatsapp_click'));
