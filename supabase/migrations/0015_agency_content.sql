-- Contenu marketing éditorial de l'agence (V3.3.W.2, suite de l'audit
-- V3.3.W.1) — table singleton, même convention exacte que
-- "agency_settings" (migration 0009) : "1 déploiement = 1 agence = 1 ligne".
--
-- À exécuter une seule fois dans le SQL editor du dashboard Supabase.
--
-- Séparée de "agency_settings" (identité/coordonnées/réseaux/branding) :
-- cette table ne porte que le texte marketing des sections Hero/Why Us/
-- Services/CTA final, structuré en JSONB par section plutôt qu'en colonnes
-- plates (Why Us et Services contiennent des tableaux de 3/4 éléments —
-- voir le rapport d'audit V3.3.W.1, section 7, pour la comparaison des
-- options retenue).
--
-- IMPORTANT (portée de cette migration, V3.3.W.2 uniquement) : aucune
-- fonction de résolution (`resolveAgencyContent()`), aucun repli applicatif,
-- aucun composant frontend ni formulaire admin n'est créé ici — seulement la
-- table et ses policies. config/content.ts reste, pour l'instant, la seule
-- source réellement utilisée par le site ; le data layer qui lira cette
-- table est prévu pour V3.3.W.3.
--
-- Le nombre d'éléments par section (3 features Why Us, 4 services) reste
-- fixe par convention applicative, pas par contrainte SQL : cette table
-- reste une simple zone de stockage de texte pour des emplacements de
-- template déjà fixés dans le code, pas un système de blocs arbitraires
-- (page builder) — voir l'audit V3.3.W.1, section 3.

create table if not exists public.agency_content (
  id integer primary key default 1 check (id = 1),
  hero jsonb,
  why_us jsonb,
  services jsonb,
  cta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pas de trigger de maintenance de `updated_at` : aucune table existante du
-- projet n'en a (voir reviews.ts, updateMyReview, qui pose `updated_at`
-- explicitement côté application) — même principe prévu pour
-- updateAgencyContent() en V3.3.W.3, pas de mécanisme SQL inventé ici.

alter table public.agency_content enable row level security;

-- Grants de base : comme pour "agency_settings"/"annonce_images"/
-- "notifications", une table fraîchement créée n'hérite pas toujours des
-- privilèges par défaut sur ce projet ; posés explicitement.
grant select on public.agency_content to anon, authenticated;
grant insert, update, delete on public.agency_content to authenticated;

-- Lecture publique : le contenu marketing doit s'afficher à tout visiteur
-- du site (Hero, Why Us, Services, CTA sont tous publics), pas seulement
-- aux comptes connectés.
drop policy if exists "agency_content: public select" on public.agency_content;
create policy "agency_content: public select"
  on public.agency_content for select
  to anon, authenticated
  using (true);

-- Écriture réservée aux admins — même motif que toutes les tables de
-- configuration du projet (agency_settings, annonce_images, annonces...) :
-- un compte client authentifié non-admin n'a ici aucun droit d'écriture.
drop policy if exists "agency_content: admin insert" on public.agency_content;
create policy "agency_content: admin insert"
  on public.agency_content for insert
  to authenticated
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

drop policy if exists "agency_content: admin update" on public.agency_content;
create policy "agency_content: admin update"
  on public.agency_content for update
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

drop policy if exists "agency_content: admin delete" on public.agency_content;
create policy "agency_content: admin delete"
  on public.agency_content for delete
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- Ligne singleton initiale : les quatre colonnes JSONB restent NULL
-- délibérément — même choix que la ligne seed de "agency_settings" (0009,
-- social_facebook/instagram/linkedin = null) : config/content.ts reste le
-- repli tant qu'aucun contenu n'est explicitement saisi par un admin, pas de
-- recopie automatique du contenu Horizon actuel dans cette table.
insert into public.agency_content (id, hero, why_us, services, cta)
values (1, null, null, null, null)
on conflict (id) do nothing;
