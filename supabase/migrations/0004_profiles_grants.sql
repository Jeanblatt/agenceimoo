-- Correctif : "permission denied for table profiles" lors de la mise à jour
-- du profil côté client (/compte).
--
-- Ce n'est pas un rejet de policy RLS (le message serait alors "new row
-- violates row-level security policy"), mais une absence de privilège
-- PostgreSQL de base : contrairement aux autres tables de l'espace client
-- (reviews, favorites, visit_requests, contact_messages), "profiles" n'a
-- apparemment pas hérité des GRANT par défaut accordés au rôle authenticated
-- (table probablement créée avant la configuration des privilèges par défaut
-- du projet). Les policies RLS de la migration 0001 restent inchangées et
-- s'appliquent normalement une fois ce GRANT en place.
--
-- À exécuter une seule fois dans le SQL editor du dashboard Supabase.

grant select, update on public.profiles to authenticated;
