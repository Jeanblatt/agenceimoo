-- Réseaux sociaux de l'agence configurables à runtime (V3.3.Q) : table
-- singleton "agency_settings" — première donnée de configuration agence à
-- sortir de config/agency.ts vers Supabase (décision figée en V3.3.P).
--
-- À exécuter une seule fois dans le SQL editor du dashboard Supabase.
--
-- Une seule ligne (id = 1, contrainte ci-dessous) : cohérent avec
-- "1 déploiement = 1 agence". config/agency.ts (agency.socials) reste le
-- repli si une colonne est NULL ou si cette table est absente/inaccessible
-- (voir lib/supabase/agencySettings.ts) — jamais une deuxième source active
-- en parallèle pour un même champ.
--
-- Uniquement les réseaux sociaux dans cette migration. Les futures colonnes
-- (identité, contact) s'ajouteront à cette même table le jour où elles
-- deviendront elles aussi runtime — pas de nouvelle table par catégorie.

create table if not exists public.agency_settings (
  id integer primary key default 1 check (id = 1),
  social_facebook text,
  social_instagram text,
  social_linkedin text
);

alter table public.agency_settings enable row level security;

-- Grants de base : comme constaté sur "profiles" (0004), "notifications"
-- (0006) et "annonce_images" (0007), une table fraîchement créée n'hérite
-- pas toujours des privilèges par défaut sur ce projet ; on les pose
-- explicitement plutôt que de découvrir l'erreur "permission denied" plus
-- tard.
grant select on public.agency_settings to anon, authenticated;
grant insert, update, delete on public.agency_settings to authenticated;

-- Lecture publique : les réseaux sociaux de l'agence sont affichés à tout
-- visiteur (Footer), pas seulement aux comptes connectés.
drop policy if exists "agency_settings: public select" on public.agency_settings;
create policy "agency_settings: public select"
  on public.agency_settings for select
  to anon, authenticated
  using (true);

-- Écriture réservée aux admins — même motif que "annonce_images"/
-- "property-images"/"agency-assets" : la configuration de l'agence est
-- administrée globalement, un compte client authentifié non-admin n'a ici
-- aucun droit d'écriture.
drop policy if exists "agency_settings: admin insert" on public.agency_settings;
create policy "agency_settings: admin insert"
  on public.agency_settings for insert
  to authenticated
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

drop policy if exists "agency_settings: admin update" on public.agency_settings;
create policy "agency_settings: admin update"
  on public.agency_settings for update
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

drop policy if exists "agency_settings: admin delete" on public.agency_settings;
create policy "agency_settings: admin delete"
  on public.agency_settings for delete
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- Ligne singleton initiale : les trois champs restent NULL délibérément —
-- config/agency.ts reste le fallback tant qu'aucune valeur n'est saisie
-- explicitement, pas de recopie automatique des valeurs Horizon actuelles.
insert into public.agency_settings (id, social_facebook, social_instagram, social_linkedin)
values (1, null, null, null)
on conflict (id) do nothing;
