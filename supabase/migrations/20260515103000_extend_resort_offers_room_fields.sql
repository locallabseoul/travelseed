alter table public.resort_services
  add column if not exists bed_type text,
  add column if not exists room_size text,
  add column if not exists view_type text,
  add column if not exists bathroom_info text,
  add column if not exists max_guests integer,
  add column if not exists room_amenities text[] not null default '{}';
