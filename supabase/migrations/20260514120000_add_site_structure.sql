alter table public.resorts
  add column if not exists plan_type text not null default 'tree'
    check (plan_type in ('freeTrial', 'seed', 'tree', 'forest')),
  add column if not exists site_type text not null default 'multipage'
    check (site_type in ('landing', 'multipage', 'custom'));

update public.resorts
set
  plan_type = case plan
    when 'Seed Trial' then 'freeTrial'
    when 'Seed' then 'seed'
    when 'Forest' then 'forest'
    else 'tree'
  end,
  site_type = case plan
    when 'Seed Trial' then 'landing'
    when 'Seed' then 'landing'
    when 'Forest' then 'custom'
    else 'multipage'
  end
where plan_type is null
  or site_type is null
  or plan_type = 'tree'
  or site_type = 'multipage';

create index if not exists resorts_plan_type_idx on public.resorts (plan_type);
create index if not exists resorts_site_type_idx on public.resorts (site_type);

create table if not exists public.site_sections (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  section_key text not null,
  label text not null,
  is_enabled boolean not null default true,
  is_locked boolean not null default false,
  sort_order integer not null default 0,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (resort_id, section_key)
);

create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  title text not null,
  slug text not null,
  page_type text not null default 'Standard'
    check (page_type in ('Standard', 'Landing', 'Event', 'Wedding', 'Tour', 'Membership')),
  is_published boolean not null default true,
  seo_title text,
  seo_description text,
  sort_order integer not null default 0,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (resort_id, slug)
);

create table if not exists public.site_navigation_items (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  label text not null,
  href text not null,
  page_id uuid references public.site_pages(id) on delete set null,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_sections_resort_id_idx on public.site_sections (resort_id, sort_order);
create index if not exists site_pages_resort_id_idx on public.site_pages (resort_id, sort_order);
create index if not exists site_pages_slug_idx on public.site_pages (resort_id, slug);
create index if not exists site_navigation_items_resort_id_idx on public.site_navigation_items (resort_id, sort_order);

alter table public.site_sections enable row level security;
alter table public.site_pages enable row level security;
alter table public.site_navigation_items enable row level security;

drop policy if exists "Public can read active site sections" on public.site_sections;
create policy "Public can read active site sections"
  on public.site_sections
  for select
  using (
    exists (
      select 1
      from public.resorts
      where resorts.id = site_sections.resort_id
        and resorts.is_active = true
    )
  );

drop policy if exists "Public can read published site pages" on public.site_pages;
create policy "Public can read published site pages"
  on public.site_pages
  for select
  using (
    is_published = true
    and exists (
      select 1
      from public.resorts
      where resorts.id = site_pages.resort_id
        and resorts.is_active = true
    )
  );

drop policy if exists "Public can read active navigation items" on public.site_navigation_items;
create policy "Public can read active navigation items"
  on public.site_navigation_items
  for select
  using (
    is_enabled = true
    and exists (
      select 1
      from public.resorts
      where resorts.id = site_navigation_items.resort_id
        and resorts.is_active = true
    )
  );
