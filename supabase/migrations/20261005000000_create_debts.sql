create type public.debt_type as enum ('owed_to_me', 'i_owe');

create table public.debts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid()
                   references auth.users(id) on delete cascade,
  type             public.debt_type not null,
  counterpart_name text not null
                   check (char_length(btrim(counterpart_name)) between 1 and 100),
  amount           bigint not null check (amount > 0),
  note             text check (note is null or char_length(note) <= 200),
  due_date         date,
  settled_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index debts_user_id_idx on public.debts (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger debts_set_updated_at
before update on public.debts
for each row execute function public.set_updated_at();

alter table public.debts enable row level security;

create policy "debts_select_own" on public.debts
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "debts_insert_own" on public.debts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "debts_update_own" on public.debts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "debts_delete_own" on public.debts
  for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.debts from anon;
