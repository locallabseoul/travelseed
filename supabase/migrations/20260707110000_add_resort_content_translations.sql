alter table public.resorts
  add column if not exists content_translations jsonb not null default '{}'::jsonb;
