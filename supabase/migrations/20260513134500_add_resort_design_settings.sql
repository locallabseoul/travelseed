alter table public.resorts
  add column if not exists design_settings jsonb not null default '{}'::jsonb;
