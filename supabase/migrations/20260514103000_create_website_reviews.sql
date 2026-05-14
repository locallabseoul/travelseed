create table if not exists public.website_reviews (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  guest_name text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  review_text text not null,
  source_label text not null default 'Manual' check (source_label in ('Manual', 'Google', 'Guest Message')),
  stay_date text,
  status text not null default 'draft' check (status in ('published', 'draft')),
  show_on_website boolean not null default false,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists website_reviews_resort_id_idx on public.website_reviews (resort_id);
create index if not exists website_reviews_status_idx on public.website_reviews (resort_id, status);
create index if not exists website_reviews_website_idx on public.website_reviews (resort_id, show_on_website, featured, sort_order);

alter table public.website_reviews enable row level security;

drop policy if exists "Public can read published website reviews" on public.website_reviews;
create policy "Public can read published website reviews"
  on public.website_reviews
  for select
  using (
    status = 'published'
    and show_on_website = true
    and exists (
      select 1
      from public.resorts
      where resorts.id = website_reviews.resort_id
        and resorts.is_active = true
    )
  );
