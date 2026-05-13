alter table public.resorts
  add column if not exists domain_status text not null default 'not_connected',
  add column if not exists ssl_status text not null default 'pending',
  add column if not exists domain_verified_at timestamptz;

create index if not exists resorts_domain_status_idx on public.resorts (domain_status);

