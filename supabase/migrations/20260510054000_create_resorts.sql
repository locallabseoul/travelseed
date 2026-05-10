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
create policy "Public can read active resorts"
  on public.resorts
  for select
  using (is_active = true);

drop policy if exists "Anon can insert resorts during MVP" on public.resorts;
create policy "Anon can insert resorts during MVP"
  on public.resorts
  for insert
  with check (true);

drop policy if exists "Anon can update resorts during MVP" on public.resorts;
create policy "Anon can update resorts during MVP"
  on public.resorts
  for update
  using (true)
  with check (true);

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
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=2200&q=85',
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
  array[
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1529290130-4ca3753253ae?auto=format&fit=crop&w=1200&q=85'
  ],
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
  hero_image_url = excluded.hero_image_url,
  whatsapp_number = excluded.whatsapp_number,
  capacity = excluded.capacity,
  bedrooms = excluded.bedrooms,
  bathrooms = excluded.bathrooms,
  features = excluded.features,
  gallery = excluded.gallery,
  experiences = excluded.experiences,
  booking_message_template = excluded.booking_message_template,
  is_active = excluded.is_active,
  updated_at = now();
