create or replace function public.get_debt_summary()
returns table (owed_to_me bigint, i_owe bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(sum(amount) filter (where type = 'owed_to_me'), 0)::bigint,
    coalesce(sum(amount) filter (where type = 'i_owe'), 0)::bigint
  from public.debts
  where settled_at is null;
$$;

revoke execute on function public.get_debt_summary() from public, anon;
grant execute on function public.get_debt_summary() to authenticated;
