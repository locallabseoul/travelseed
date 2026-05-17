alter table public.booking_vouchers
  add column if not exists room_offer_id uuid references public.resort_services(id) on delete set null;

create index if not exists booking_vouchers_room_offer_id_idx
  on public.booking_vouchers (room_offer_id);
