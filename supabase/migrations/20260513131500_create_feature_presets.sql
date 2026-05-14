create table if not exists public.feature_presets (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  category text not null default 'General',
  icon text not null default 'sparkle',
  property_types text[] not null default '{}',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feature_presets_active_sort_idx
  on public.feature_presets (is_active, sort_order, label);

alter table public.feature_presets enable row level security;

drop policy if exists "Public can read active feature presets" on public.feature_presets;
create policy "Public can read active feature presets"
  on public.feature_presets
  for select
  using (is_active = true);

insert into public.feature_presets (
  label,
  category,
  icon,
  property_types,
  sort_order,
  is_active
) values
  ('Private Pool', 'Stay Comfort', 'waves', array['villa', 'resort'], 10, true),
  ('Fast Wi-Fi', 'Stay Comfort', 'wifi', array['villa', 'resort', 'surf-camp', 'local-business'], 20, true),
  ('Air Conditioning', 'Stay Comfort', 'snowflake', array['villa', 'resort', 'local-business'], 30, true),
  ('Fully Equipped Kitchen', 'Stay Comfort', 'utensils', array['villa'], 40, true),
  ('Breakfast Included', 'Food & Service', 'coffee', array['villa', 'resort', 'surf-camp'], 50, true),
  ('Airport Pickup', 'Food & Service', 'car', array['villa', 'resort', 'surf-camp'], 60, true),
  ('Daily Housekeeping', 'Food & Service', 'sparkle', array['villa', 'resort'], 70, true),
  ('Family Friendly', 'Guest Fit', 'users', array['villa', 'resort'], 80, true),
  ('Pet Friendly', 'Guest Fit', 'heart', array['villa', 'local-business'], 90, true),
  ('Remote Work Friendly', 'Guest Fit', 'laptop', array['villa', 'resort'], 100, true),
  ('Surf Lessons', 'Activities', 'waves', array['surf-camp', 'resort'], 110, true),
  ('Scooter Rental', 'Activities', 'bike', array['villa', 'resort', 'surf-camp'], 120, true),
  ('Yoga Deck', 'Activities', 'sun', array['villa', 'resort', 'surf-camp'], 130, true),
  ('Ocean View', 'Location', 'mountain', array['villa', 'resort', 'surf-camp'], 140, true),
  ('Beach Access', 'Location', 'map-pin', array['villa', 'resort', 'surf-camp'], 150, true),
  ('Parking', 'Location', 'parking', array['villa', 'resort', 'local-business'], 160, true)
on conflict (label) do update set
  category = excluded.category,
  icon = excluded.icon,
  property_types = excluded.property_types,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();
