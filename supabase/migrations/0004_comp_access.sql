-- Accès offerts (« comp ») : un administrateur débloque l'accès premium à un
-- compte, sans paiement. Réutilise la table `subscriptions`
-- (status = 'active', source = 'comp') — vu comme premium par le front.
--
-- L'écriture passe par des fonctions SECURITY DEFINER réservées aux admins
-- (le client n'a pas le droit d'écrire dans `subscriptions`).

alter table public.subscriptions
  add column if not exists source text not null default 'lemonsqueezy';

-- Offrir l'accès à un utilisateur (par email).
create or replace function public.grant_comp_access(target_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Réservé aux administrateurs';
  end if;

  select id into target_id
  from auth.users
  where lower(email) = lower(trim(target_email))
  limit 1;

  if target_id is null then
    raise exception 'Aucun compte pour cet email';
  end if;

  insert into public.subscriptions (user_id, status, source, updated_at)
  values (target_id, 'active', 'comp', now())
  on conflict (user_id) do update
    set status = 'active',
        source = 'comp',
        ends_at = null,
        renews_at = null,
        updated_at = now();

  return 'ok';
end;
$$;

-- Retirer un accès offert (ne touche jamais un abonnement payant).
create or replace function public.revoke_comp_access(target_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Réservé aux administrateurs';
  end if;

  select id into target_id
  from auth.users
  where lower(email) = lower(trim(target_email))
  limit 1;

  if target_id is null then
    raise exception 'Aucun compte pour cet email';
  end if;

  delete from public.subscriptions
  where user_id = target_id and source = 'comp';

  return 'ok';
end;
$$;

-- Liste des accès offerts (pour l'interface admin).
create or replace function public.list_comp_access()
returns table (user_id uuid, email text, username text, granted_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select s.user_id, u.email::text, p.username, s.updated_at
  from public.subscriptions s
  join auth.users u on u.id = s.user_id
  left join public.profiles p on p.user_id = s.user_id
  where s.source = 'comp'
    and public.is_admin()
  order by s.updated_at desc;
$$;

grant execute on function public.grant_comp_access(text) to authenticated;
grant execute on function public.revoke_comp_access(text) to authenticated;
grant execute on function public.list_comp_access() to authenticated;
