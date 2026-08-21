-- ============================================================================
--  ADMIN COMPLET — l'administrateur peut TOUT voir, modifier et supprimer.
-- ----------------------------------------------------------------------------
--  Ajoute, table par table, les politiques RLS manquantes pour le rôle admin
--  (lecture des tables privées + modification + suppression), sans retirer
--  les protections existantes des utilisateurs normaux.
--
--  La colonne `profiles.role` reste inaccessible en écriture via l'API (anti
--  escalade) : les changements de rôle passent par la fonction dédiée
--  `admin_set_role` (SECURITY DEFINER, réservée aux admins).
--
--  Idempotent (drop policy if exists). `public.is_admin()` vient de 0001.
-- ============================================================================

-- ---- profiles : l'admin peut modifier (hors rôle) et supprimer -------------
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles
  for delete using (public.is_admin());

-- ---- recipes : admin déjà couvert par 0001 (update/delete). ----------------

-- ---- recipe_reviews : ajout de l'update admin (delete déjà en 0001) --------
drop policy if exists recipe_reviews_update_admin on public.recipe_reviews;
create policy recipe_reviews_update_admin on public.recipe_reviews
  for update using (public.is_admin()) with check (public.is_admin());

-- ---- recipe_review_replies : ajout de l'update admin -----------------------
drop policy if exists recipe_review_replies_update_admin on public.recipe_review_replies;
create policy recipe_review_replies_update_admin on public.recipe_review_replies
  for update using (public.is_admin()) with check (public.is_admin());

-- ---- recipe_review_likes : admin peut supprimer ----------------------------
drop policy if exists recipe_review_likes_delete_admin on public.recipe_review_likes;
create policy recipe_review_likes_delete_admin on public.recipe_review_likes
  for delete using (public.is_admin());

-- ---- favorites : admin peut lire et supprimer (privé par défaut) ------------
drop policy if exists favorites_select_admin on public.favorites;
create policy favorites_select_admin on public.favorites
  for select using (public.is_admin());

drop policy if exists favorites_delete_admin on public.favorites;
create policy favorites_delete_admin on public.favorites
  for delete using (public.is_admin());

-- ---- shopping_list_items : accès complet admin (privé par défaut) -----------
drop policy if exists shopping_list_items_admin on public.shopping_list_items;
create policy shopping_list_items_admin on public.shopping_list_items
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- user_follows : admin peut supprimer (lecture déjà publique) -----------
drop policy if exists user_follows_delete_admin on public.user_follows;
create policy user_follows_delete_admin on public.user_follows
  for delete using (public.is_admin());

-- ---- site_ideas : admin peut modifier (select/delete déjà admin en 0001) ----
drop policy if exists site_ideas_update_admin on public.site_ideas;
create policy site_ideas_update_admin on public.site_ideas
  for update using (public.is_admin()) with check (public.is_admin());

-- ---- subscriptions : accès complet admin (lecture propre déjà en 0003) ------
drop policy if exists subscriptions_select_admin on public.subscriptions;
create policy subscriptions_select_admin on public.subscriptions
  for select using (public.is_admin());

drop policy if exists subscriptions_update_admin on public.subscriptions;
create policy subscriptions_update_admin on public.subscriptions
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists subscriptions_delete_admin on public.subscriptions;
create policy subscriptions_delete_admin on public.subscriptions
  for delete using (public.is_admin());

-- ---- Changement de rôle (admin uniquement) ---------------------------------
-- La colonne `role` est révoquée en écriture pour anon/authenticated (0001) ;
-- cette fonction, exécutée avec les droits du propriétaire, la met à jour.
create or replace function public.admin_set_role(
  target_user_id uuid,
  new_role text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Réservé aux administrateurs';
  end if;

  if new_role not in ('user', 'admin') then
    raise exception 'Rôle invalide (attendu: user ou admin)';
  end if;

  update public.profiles
    set role = new_role
    where user_id = target_user_id;

  return 'ok';
end;
$$;

grant execute on function public.admin_set_role(uuid, text) to authenticated;
