-- Audit V3.3.Q.1.13 / correctif V3.3.Q.1.14 : verrouille les policies
-- d'écriture de public.annonces, jusqu'ici ouvertes à tout compte
-- authentifié (client compris), pas seulement aux admins.
--
-- Policies actuellement en place (constatées via le dashboard Supabase,
-- confirmées par l'utilisateur) :
--   "Enable read access for all users"      SELECT  public         USING true   -- conservée telle quelle
--   "Authenticated insert access on annonces" INSERT  authenticated  WITH CHECK true  -- trop permissive
--   "Authenticated update access on annonces" UPDATE  authenticated  USING true, WITH CHECK true -- trop permissive
--   "Authenticated delete access on annonces" DELETE  authenticated  USING true  -- trop permissive
--
-- Mécanisme admin utilisé : identique à toutes les autres tables du projet
-- (annonce_images, agency_settings, reviews, visit_requests,
-- contact_messages, notifications — voir migrations 0001/0002/0006/0007/
-- 0008/0009) : exists (select 1 from public.profiles where id = auth.uid()
-- and role = 'admin'). Aucun autre mécanisme (is_admin, user_metadata,
-- app_metadata) n'est utilisé nulle part ailleurs dans ce projet — celui-ci
-- reste la seule source de vérité pour ne pas introduire une deuxième
-- logique d'autorisation.
--
-- Ne touche ni aux données de public.annonces, ni à aucune autre table,
-- policy, bucket ou colonne. Idempotente (drop if exists / create) comme le
-- reste des migrations de ce projet.

alter table public.annonces enable row level security;

drop policy if exists "Authenticated insert access on annonces" on public.annonces;
create policy "annonces: admin insert"
  on public.annonces for insert
  to authenticated
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

drop policy if exists "Authenticated update access on annonces" on public.annonces;
create policy "annonces: admin update"
  on public.annonces for update
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

drop policy if exists "Authenticated delete access on annonces" on public.annonces;
create policy "annonces: admin delete"
  on public.annonces for delete
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- "Enable read access for all users" (SELECT, public, USING true) n'est ni
-- supprimée ni recréée : elle reste exactement telle quelle, la lecture
-- publique des annonces doit continuer de fonctionner sans changement.
