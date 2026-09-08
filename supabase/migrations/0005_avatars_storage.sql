-- Upload réel de la photo de profil : bucket Supabase Storage "avatars".
--
-- À exécuter une seule fois dans le SQL editor du dashboard Supabase.

-- Bucket public : les photos de profil ne sont pas des données sensibles,
-- servir une URL publique directe évite de gérer des URLs signées côté app.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Chaque utilisateur ne peut écrire (upload/remplacement/suppression) que
-- dans son propre dossier ("<user_id>/...") au sein du bucket "avatars".
drop policy if exists "avatars: insert own" on storage.objects;
create policy "avatars: insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars: update own" on storage.objects;
create policy "avatars: update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars: delete own" on storage.objects;
create policy "avatars: delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lecture : le bucket "public" ci-dessus sert déjà les fichiers via une URL
-- publique sans passer par cette policy, mais on la documente explicitement
-- pour tout accès passant par l'API authentifiée (storage.list, etc.).
drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');
