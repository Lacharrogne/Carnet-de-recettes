-- ============================================================================
--  SÉCURITÉ — Row Level Security (RLS) pour Carnet de recettes
-- ----------------------------------------------------------------------------
--  À exécuter UNE FOIS dans Supabase → SQL Editor.
--
--  Sans ces politiques, l'API REST Supabase laisse n'importe quel client
--  (avec la clé publique) modifier/supprimer les données d'autrui ou se
--  promouvoir administrateur. Le code applique déjà des garde-fous, mais la
--  vraie protection est ICI, côté base.
--
--  Idempotent : on peut le relancer sans risque (drop policy if exists).
--  ⚠️ Active RLS : on fournit donc AUSSI les politiques de lecture, sinon
--     l'app ne pourrait plus rien lire.
-- ============================================================================

-- Helper : l'appelant est-il administrateur ? (SECURITY DEFINER => contourne
-- la RLS pour lire le rôle, sans récursion sur les politiques de profiles).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- recipes  (colonnes : id, user_id, …)  — lecture publique, écriture au
-- propriétaire (ou admin pour la modération).
-- ----------------------------------------------------------------------------
alter table public.recipes enable row level security;

drop policy if exists recipes_select on public.recipes;
create policy recipes_select on public.recipes
  for select using (true);

drop policy if exists recipes_insert on public.recipes;
create policy recipes_insert on public.recipes
  for insert with check (auth.uid() = user_id);

drop policy if exists recipes_update on public.recipes;
create policy recipes_update on public.recipes
  for update using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists recipes_delete on public.recipes;
create policy recipes_delete on public.recipes
  for delete using (auth.uid() = user_id or public.is_admin());

-- ----------------------------------------------------------------------------
-- profiles  (colonnes : user_id, username, bio, avatar_url, role)
-- Lecture publique (profils publics) ; chacun ne modifie QUE son profil ;
-- et SURTOUT personne ne peut changer son propre rôle (anti-escalade).
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (true);

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Empêche l'escalade de privilèges : la colonne `role` n'est pas modifiable
-- par les clients (seul le service_role / dashboard peut nommer un admin).
revoke update (role) on public.profiles from anon, authenticated;

-- ----------------------------------------------------------------------------
-- favorites  (user_id, recipe_id) — privé : chacun ses favoris.
-- ----------------------------------------------------------------------------
alter table public.favorites enable row level security;

drop policy if exists favorites_select on public.favorites;
create policy favorites_select on public.favorites
  for select using (auth.uid() = user_id);

drop policy if exists favorites_insert on public.favorites;
create policy favorites_insert on public.favorites
  for insert with check (auth.uid() = user_id);

drop policy if exists favorites_delete on public.favorites;
create policy favorites_delete on public.favorites
  for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- recipe_reviews (user_id) — lecture publique ; écriture au propriétaire ;
-- suppression propriétaire ou admin (modération).
-- ----------------------------------------------------------------------------
alter table public.recipe_reviews enable row level security;

drop policy if exists recipe_reviews_select on public.recipe_reviews;
create policy recipe_reviews_select on public.recipe_reviews
  for select using (true);

drop policy if exists recipe_reviews_insert on public.recipe_reviews;
create policy recipe_reviews_insert on public.recipe_reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists recipe_reviews_update on public.recipe_reviews;
create policy recipe_reviews_update on public.recipe_reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists recipe_reviews_delete on public.recipe_reviews;
create policy recipe_reviews_delete on public.recipe_reviews
  for delete using (auth.uid() = user_id or public.is_admin());

-- ----------------------------------------------------------------------------
-- recipe_review_likes (review_id, user_id) — lecture publique ; un like = le
-- sien.
-- ----------------------------------------------------------------------------
alter table public.recipe_review_likes enable row level security;

drop policy if exists recipe_review_likes_select on public.recipe_review_likes;
create policy recipe_review_likes_select on public.recipe_review_likes
  for select using (true);

drop policy if exists recipe_review_likes_insert on public.recipe_review_likes;
create policy recipe_review_likes_insert on public.recipe_review_likes
  for insert with check (auth.uid() = user_id);

drop policy if exists recipe_review_likes_delete on public.recipe_review_likes;
create policy recipe_review_likes_delete on public.recipe_review_likes
  for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- recipe_review_replies (review_id, user_id, content) — lecture publique ;
-- écriture au propriétaire ; suppression propriétaire ou admin.
-- ----------------------------------------------------------------------------
alter table public.recipe_review_replies enable row level security;

drop policy if exists recipe_review_replies_select on public.recipe_review_replies;
create policy recipe_review_replies_select on public.recipe_review_replies
  for select using (true);

drop policy if exists recipe_review_replies_insert on public.recipe_review_replies;
create policy recipe_review_replies_insert on public.recipe_review_replies
  for insert with check (auth.uid() = user_id);

drop policy if exists recipe_review_replies_update on public.recipe_review_replies;
create policy recipe_review_replies_update on public.recipe_review_replies
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists recipe_review_replies_delete on public.recipe_review_replies;
create policy recipe_review_replies_delete on public.recipe_review_replies
  for delete using (auth.uid() = user_id or public.is_admin());

-- ----------------------------------------------------------------------------
-- shopping_list_items (user_id, recipe_id, checked) — privé.
-- ----------------------------------------------------------------------------
alter table public.shopping_list_items enable row level security;

drop policy if exists shopping_list_items_all on public.shopping_list_items;
create policy shopping_list_items_all on public.shopping_list_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- user_follows (follower_id, following_id) — lecture publique ; on ne crée /
-- supprime QUE ses propres relations de suivi.
-- ----------------------------------------------------------------------------
alter table public.user_follows enable row level security;

drop policy if exists user_follows_select on public.user_follows;
create policy user_follows_select on public.user_follows
  for select using (true);

drop policy if exists user_follows_insert on public.user_follows;
create policy user_follows_insert on public.user_follows
  for insert with check (auth.uid() = follower_id);

drop policy if exists user_follows_delete on public.user_follows;
create policy user_follows_delete on public.user_follows
  for delete using (auth.uid() = follower_id);

-- ----------------------------------------------------------------------------
-- site_ideas (user_id) — idées / signalements : privé au créateur + admin.
-- ----------------------------------------------------------------------------
alter table public.site_ideas enable row level security;

drop policy if exists site_ideas_select on public.site_ideas;
create policy site_ideas_select on public.site_ideas
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists site_ideas_insert on public.site_ideas;
create policy site_ideas_insert on public.site_ideas
  for insert with check (auth.uid() = user_id);

drop policy if exists site_ideas_delete on public.site_ideas;
create policy site_ideas_delete on public.site_ideas
  for delete using (auth.uid() = user_id or public.is_admin());

-- ----------------------------------------------------------------------------
-- ⚠️ À COMPLÉTER : table `avatars` (colonnes non confirmées lors de l'audit).
-- Vérifiez ses colonnes puis appliquez le même schéma (lecture publique si
-- les avatars sont publics, écriture au propriétaire). Idem pour le bucket
-- Storage `recipe-images` : restreindre l'upload/suppression au propriétaire
-- via les Storage Policies.
-- ============================================================================
