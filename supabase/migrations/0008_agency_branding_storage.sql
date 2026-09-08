-- Logo d'agence personnalisable (V3.3.N) : bucket Storage "agency-assets" +
-- policies RLS.
--
-- À exécuter une seule fois dans le SQL editor du dashboard Supabase.
--
-- Chemin fixe et unique (agency-assets/logo.webp, remplacé via upsert à
-- chaque nouvel upload) : décision figée en V3.3.M.1, cohérente avec
-- "1 déploiement = 1 agence" — pas de table de métadonnées, pas de
-- storage.list(), voir lib/supabase/agencyBranding.ts.

-- ---------------------------------------------------------------------------
-- Storage : bucket "agency-assets"
-- ---------------------------------------------------------------------------

-- Bucket public : le logo est par nature un asset public affiché sur toutes
-- les pages, comme "property-images" (0007) et "avatars" (0005) — une URL
-- publique directe évite de gérer des URLs signées côté app.
insert into storage.buckets (id, name, public)
values ('agency-assets', 'agency-assets', true)
on conflict (id) do nothing;

-- Lecture publique de tous les objets du bucket.
drop policy if exists "agency-assets: public read" on storage.objects;
create policy "agency-assets: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'agency-assets');

-- Écriture réservée aux admins — même motif que "property-images" (0007) :
-- le branding de l'agence est administré globalement, un compte client
-- authentifié non-admin n'a ici aucun droit d'écriture.
drop policy if exists "agency-assets: admin insert" on storage.objects;
create policy "agency-assets: admin insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'agency-assets'
    and exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "agency-assets: admin update" on storage.objects;
create policy "agency-assets: admin update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'agency-assets'
    and exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    bucket_id = 'agency-assets'
    and exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "agency-assets: admin delete" on storage.objects;
create policy "agency-assets: admin delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'agency-assets'
    and exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );
