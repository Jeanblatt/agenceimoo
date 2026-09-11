-- V3.4.A — Smart Visit Scheduling : table des exceptions d'horaires
-- (jours/plages bloqués par l'agence — jours fériés, absences ponctuelles).
--
-- À exécuter une seule fois dans le SQL editor du dashboard Supabase.
--
-- Table dédiée plutôt qu'une colonne JSONB sur agency_settings : c'est une
-- liste non bornée qui grandit dans le temps, pas une configuration
-- singleton — même raisonnement déjà appliqué dans ce projet pour
-- distinguer une ligne de config (agency_settings, une seule ligne) d'une
-- collection (annonce_images, favorites, notifications...).
--
-- Pas de colonne property_id : exceptions globales à l'agence pour cette
-- V2 (aucune gestion par bien, aucune gestion multi-agents prévue à ce
-- stade — décision déjà actée avant cette phase).
--
-- start_time/end_time tous deux NULL = journée entière bloquée ; tous deux
-- renseignés = uniquement une plage bloquée ce jour-là. Toute autre
-- combinaison (un seul des deux renseigné, ou une plage inversée/nulle) est
-- rejetée par la contrainte ci-dessous.

create table if not exists public.visit_schedule_exceptions (
  id bigint generated always as identity primary key,
  date date not null,
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz not null default now()
);

-- Cohérence : soit les deux bornes sont NULL (journée entière), soit les
-- deux sont renseignées avec start_time < end_time (plage valide) — jamais
-- une seule des deux renseignée, jamais une plage nulle ou inversée.
alter table public.visit_schedule_exceptions
  drop constraint if exists visit_schedule_exceptions_time_range_check;
alter table public.visit_schedule_exceptions
  add constraint visit_schedule_exceptions_time_range_check
  check (
    (start_time is null and end_time is null)
    or (start_time is not null and end_time is not null and start_time < end_time)
  );

-- Anti-doublons — en deux index plutôt qu'un seul, volontairement : un
-- index UNIQUE classique sur (date, start_time, end_time) ne bloquerait PAS
-- deux lignes "journée entière" pour la même date, car NULL n'est jamais
-- considéré égal à NULL par une contrainte d'unicité standard (comportement
-- SQL par défaut, indépendant de la version de Postgres — pas d'hypothèse
-- prise sur une fonctionnalité récente comme NULLS NOT DISTINCT). D'où deux
-- index partiels, chacun couvrant un cas sans ambiguïté de NULL :
create unique index if not exists visit_schedule_exceptions_full_day_unique_idx
  on public.visit_schedule_exceptions (date)
  where start_time is null and end_time is null;

create unique index if not exists visit_schedule_exceptions_range_unique_idx
  on public.visit_schedule_exceptions (date, start_time, end_time)
  where start_time is not null;

alter table public.visit_schedule_exceptions enable row level security;

-- Grants de base : comme constaté sur "profiles"/"notifications"/etc.
-- (0004/0006/0007/0009), une table fraîchement créée n'hérite pas toujours
-- des privilèges par défaut sur ce projet ; posés explicitement plutôt que
-- de découvrir l'erreur "permission denied" plus tard.
grant select on public.visit_schedule_exceptions to anon, authenticated;
grant insert, update, delete on public.visit_schedule_exceptions to authenticated;

-- Lecture publique : le futur moteur de disponibilité doit pouvoir lire les
-- exceptions sans session (un visiteur anonyme consultant les créneaux
-- disponibles sur une fiche bien, avant même de se connecter).
drop policy if exists "visit_schedule_exceptions: public select" on public.visit_schedule_exceptions;
create policy "visit_schedule_exceptions: public select"
  on public.visit_schedule_exceptions for select
  to anon, authenticated
  using (true);

-- Écriture réservée aux admins — même mécanisme que toutes les autres
-- tables admin du projet (annonces, agency_settings, agency_content...) :
-- exists (select 1 from public.profiles where id = auth.uid() and
-- role = 'admin'). Aucun autre mécanisme d'autorisation introduit.
drop policy if exists "visit_schedule_exceptions: admin insert" on public.visit_schedule_exceptions;
create policy "visit_schedule_exceptions: admin insert"
  on public.visit_schedule_exceptions for insert
  to authenticated
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

drop policy if exists "visit_schedule_exceptions: admin update" on public.visit_schedule_exceptions;
create policy "visit_schedule_exceptions: admin update"
  on public.visit_schedule_exceptions for update
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

drop policy if exists "visit_schedule_exceptions: admin delete" on public.visit_schedule_exceptions;
create policy "visit_schedule_exceptions: admin delete"
  on public.visit_schedule_exceptions for delete
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));
