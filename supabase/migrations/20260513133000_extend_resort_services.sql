alter table public.resort_services
  add column if not exists highlight text,
  add column if not exists duration text,
  add column if not exists included text[] not null default '{}',
  add column if not exists cta_label text;
