create table if not exists public.booking_inquiries (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  guest_name text not null,
  guest_contact text,
  check_in date,
  check_out date,
  guests integer,
  status text not null default 'new',
  source text not null default 'manual',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_inquiries_resort_id_idx on public.booking_inquiries (resort_id);
create index if not exists booking_inquiries_status_idx on public.booking_inquiries (resort_id, status);
create index if not exists booking_inquiries_created_at_idx on public.booking_inquiries (created_at desc);

alter table public.booking_inquiries enable row level security;

