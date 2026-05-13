create extension if not exists "pgcrypto";

create table if not exists public.resorts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  domain text unique,
  template_id text not null default 'boutique-villa',
  location text not null,
  type text,
  description text,
  hero_title text not null,
  hero_subtitle text,
  hero_image_url text,
  whatsapp_number text not null,
  capacity integer,
  bedrooms integer,
  bathrooms integer,
  features text[] not null default '{}',
  gallery text[] not null default '{}',
  experiences text[] not null default '{}',
  booking_message_template text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resorts_slug_idx on public.resorts (slug);
create index if not exists resorts_domain_idx on public.resorts (domain);
create index if not exists resorts_is_active_idx on public.resorts (is_active);

alter table public.resorts enable row level security;

drop policy if exists "Public can read active resorts" on public.resorts;
drop policy if exists "Anon can read resorts during MVP" on public.resorts;

create policy "Public can read active resorts"
  on public.resorts
  for select
  using (is_active = true);

drop policy if exists "Anon can delete resorts during MVP" on public.resorts;
drop policy if exists "Anon can insert resorts during MVP" on public.resorts;
drop policy if exists "Anon can update resorts during MVP" on public.resorts;

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
drop policy if exists "Anon can update resort images during MVP" on storage.objects;
drop policy if exists "Anon can delete resort images during MVP" on storage.objects;

insert into public.resorts (
  name,
  slug,
  domain,
  template_id,
  location,
  type,
  description,
  hero_title,
  hero_subtitle,
  hero_image_url,
  whatsapp_number,
  capacity,
  bedrooms,
  bathrooms,
  features,
  gallery,
  experiences,
  booking_message_template,
  is_active
) values (
  'Villa Jeruk',
  'villa-jeruk',
  null,
  'boutique-villa',
  'Selong Belanak, Lombok, Indonesia',
  'Private tropical villa',
  'A private tropical villa for families, surfers, and remote workers looking for a calm base near South Lombok beaches.',
  'Private Tropical Escape in Selong Belanak',
  '3-bedroom villa with private pool near Lombok''s most beautiful beaches',
  null,
  '6281234567890',
  6,
  3,
  2,
  array[
    'Private Pool',
    'Fast WiFi',
    'Fully Equipped Kitchen',
    'Open Living Area',
    'Tropical Garden',
    'Complimentary Bicycles',
    'Family Friendly',
    'Surf Friendly'
  ],
  array[]::text[],
  array[
    'Selong Belanak Beach',
    'Surfing',
    'Sunset Beaches',
    'Local Cafes',
    'Long Stay Remote Work'
  ],
  'Hello, I would like to make a reservation at Villa Jeruk.
Check-in:
Check-out:
Guests:
Airport Pickup:',
  true
) on conflict (slug) do update set
  name = excluded.name,
  template_id = excluded.template_id,
  location = excluded.location,
  type = excluded.type,
  description = excluded.description,
  hero_title = excluded.hero_title,
  hero_subtitle = excluded.hero_subtitle,
  whatsapp_number = excluded.whatsapp_number,
  capacity = excluded.capacity,
  bedrooms = excluded.bedrooms,
  bathrooms = excluded.bathrooms,
  features = excluded.features,
  experiences = excluded.experiences,
  booking_message_template = excluded.booking_message_template,
  is_active = excluded.is_active,
  updated_at = now();
