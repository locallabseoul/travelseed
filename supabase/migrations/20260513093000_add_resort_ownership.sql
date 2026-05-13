alter table public.resorts
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists owner_email text;

create index if not exists resorts_owner_user_id_idx on public.resorts (owner_user_id);
create index if not exists resorts_owner_email_idx on public.resorts (owner_email);
