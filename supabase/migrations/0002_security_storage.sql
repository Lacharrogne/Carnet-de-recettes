-- ============================================================================
--  SÉCURITÉ — Storage (buckets `recipe-images` et `avatars`)
-- ----------------------------------------------------------------------------
--  À exécuter dans Supabase → SQL Editor (après 0001_security_rls.sql).
--
--  Les images sont publiques en LECTURE (buckets publics + URLs publiques),
--  mais l'UPLOAD doit être réservé aux utilisateurs connectés, et la
--  MODIFICATION / SUPPRESSION au seul propriétaire de l'objet
--  (storage.objects.owner = l'uploadeur). Sinon n'importe qui peut, via
--  l'API, supprimer les images des autres ou polluer le stockage.
--
--  storage.objects a déjà la RLS activée par défaut sur Supabase.
--  Idempotent (drop policy if exists).
--
--  ⚠️ Vérifiez aussi dans Storage qu'il ne reste pas une ancienne politique
--     trop permissive (ex. « Allow all ») : les politiques se cumulent (OR).
-- ============================================================================

-- Lecture publique des deux buckets (cohérent avec getPublicUrl()).
drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects
  for select
  using (bucket_id in ('recipe-images', 'avatars'));

-- Upload réservé aux utilisateurs connectés.
drop policy if exists media_authenticated_insert on storage.objects;
create policy media_authenticated_insert on storage.objects
  for insert to authenticated
  with check (bucket_id in ('recipe-images', 'avatars'));

-- Modification réservée au propriétaire de l'objet.
drop policy if exists media_owner_update on storage.objects;
create policy media_owner_update on storage.objects
  for update to authenticated
  using (bucket_id in ('recipe-images', 'avatars') and owner = auth.uid())
  with check (bucket_id in ('recipe-images', 'avatars') and owner = auth.uid());

-- Suppression réservée au propriétaire de l'objet.
drop policy if exists media_owner_delete on storage.objects;
create policy media_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id in ('recipe-images', 'avatars') and owner = auth.uid());
