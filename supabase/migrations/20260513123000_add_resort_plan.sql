alter table public.resorts
  add column if not exists plan text not null default 'Tree';

create index if not exists resorts_plan_idx on public.resorts (plan);

