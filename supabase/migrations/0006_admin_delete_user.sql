-- ============================================================================
--  Suppression complète d'un compte (y compris l'authentification).
-- ----------------------------------------------------------------------------
--  `admin_delete_user` supprime tout le contenu applicatif d'un utilisateur
--  PUIS sa ligne dans `auth.users` (le compte de connexion lui-même) — ce que
--  le client ne peut pas faire directement. Réservé aux admins, et interdit
--  sur son propre compte.
--
--  SECURITY DEFINER : la fonction s'exécute avec les droits de son
--  propriétaire (postgres), qui peut écrire dans le schéma `auth`.
-- ============================================================================

create or replace function public.admin_delete_user(target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Réservé aux administrateurs';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Vous ne pouvez pas supprimer votre propre compte';
  end if;

  -- Contenu direct de l'utilisateur.
  delete from public.recipe_review_likes where user_id = target_user_id;
  delete from public.recipe_review_replies where user_id = target_user_id;
  delete from public.recipe_reviews where user_id = target_user_id;
  delete from public.favorites where user_id = target_user_id;
  delete from public.shopping_list_items where user_id = target_user_id;
  delete from public.user_follows
    where follower_id = target_user_id or following_id = target_user_id;
  delete from public.site_ideas where user_id = target_user_id;
  delete from public.subscriptions where user_id = target_user_id;

  -- Éléments liés aux recettes de l'utilisateur (avis/likes/réponses/favoris
  -- laissés par d'AUTRES personnes sur ses recettes).
  delete from public.recipe_review_likes
    where review_id in (
      select rr.id
      from public.recipe_reviews rr
      join public.recipes r on r.id = rr.recipe_id
      where r.user_id = target_user_id
    );
  delete from public.recipe_review_replies
    where review_id in (
      select rr.id
      from public.recipe_reviews rr
      join public.recipes r on r.id = rr.recipe_id
      where r.user_id = target_user_id
    );
  delete from public.recipe_reviews
    where recipe_id in (
      select id from public.recipes where user_id = target_user_id
    );
  delete from public.favorites
    where recipe_id in (
      select id from public.recipes where user_id = target_user_id
    );
  delete from public.shopping_list_items
    where recipe_id in (
      select id from public.recipes where user_id = target_user_id
    );

  delete from public.recipes where user_id = target_user_id;
  delete from public.profiles where user_id = target_user_id;

  -- Le compte d'authentification (cascade sur auth.identities / sessions).
  delete from auth.users where id = target_user_id;

  return 'ok';
end;
$$;

grant execute on function public.admin_delete_user(uuid) to authenticated;
