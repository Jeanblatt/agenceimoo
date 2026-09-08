-- Mon profil (espace client) : ajout d'un avatar (URL) au profil.
--
-- À exécuter une seule fois dans le SQL editor du dashboard Supabase.
-- Aucune policy RLS ne change ici : "profiles: select own" et
-- "profiles: update own" (migration 0001) couvrent déjà cette nouvelle
-- colonne comme les autres (le "with check" ne restreint que le rôle).

alter table public.profiles
  add column if not exists avatar_url text;
