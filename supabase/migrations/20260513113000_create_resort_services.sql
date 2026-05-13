create table if not exists public.resort_services (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  kind text not null default 'room',
  title text not null,
  description text,
  price_label text,
  capacity integer,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resort_services_resort_id_idx on public.resort_services (resort_id);
create index if not exists resort_services_sort_order_idx on public.resort_services (resort_id, sort_order);

alter table public.resort_services enable row level security;

drop policy if exists "Public can read active resort services" on public.resort_services;
create policy "Public can read active resort services"
  on public.resort_services
  for select
  using (
    is_active = true
    and exists (
      select 1
      from public.resorts
      where resorts.id = resort_services.resort_id
        and resorts.is_active = true
    )
  );

