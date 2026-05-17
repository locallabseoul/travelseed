create table if not exists public.booking_vouchers (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  inquiry_id uuid references public.booking_inquiries(id) on delete set null,
  voucher_code text not null,
  public_token text not null,
  guest_name text not null,
  guest_contact text,
  check_in date,
  check_out date,
  guests integer,
  offer_title text,
  room_label text,
  amount_note text,
  included_notes text,
  policy_notes text,
  status text not null default 'draft',
  issued_at timestamptz,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (voucher_code),
  unique (public_token)
);

create index if not exists booking_vouchers_resort_id_idx on public.booking_vouchers (resort_id);
create index if not exists booking_vouchers_inquiry_id_idx on public.booking_vouchers (inquiry_id);
create index if not exists booking_vouchers_status_idx on public.booking_vouchers (resort_id, status);
create index if not exists booking_vouchers_public_token_idx on public.booking_vouchers (public_token);

alter table public.booking_vouchers enable row level security;

drop policy if exists "Public can read issued booking vouchers" on public.booking_vouchers;
create policy "Public can read issued booking vouchers"
  on public.booking_vouchers
  for select
  using (
    status = 'issued'
    and exists (
      select 1
      from public.resorts
      where resorts.id = booking_vouchers.resort_id
        and resorts.is_active = true
    )
  );
