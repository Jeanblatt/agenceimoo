-- Type de média actif pour le Hero principal (V3.3.V.2) : étend la table
-- singleton "agency_settings" (0009/0010) plutôt que de créer une nouvelle
-- table ou un nouveau système — même principe que les colonnes précédentes.
--
-- À exécuter une seule fois dans le SQL editor du dashboard Supabase.
--
-- Contexte : depuis V3.3.V.1, le Hero tente automatiquement hero.mp4 avant
-- hero.webp dès que le fichier vidéo existe dans Storage, sans que
-- l'administrateur puisse choisir explicitement "je garde ma vidéo en
-- réserve mais je veux afficher l'image". Cette colonne permet ce choix
-- explicite, indépendamment de la présence des fichiers dans Storage
-- (voir lib/supabase/agencyBranding.ts pour hero.webp / hero.mp4).
--
-- NULL délibéré (pas de valeur par défaut recopiée) : cohérent avec toutes
-- les colonnes de 0009/0010 — config/agency.ts et le resolver
-- (lib/supabase/agencySettings.ts) traitent NULL, ou toute valeur qui
-- n'est ni "image" ni "video", comme "image" (repli sûr).
--
-- RLS : aucune nouvelle policy nécessaire. Les policies de 0009
-- ("agency_settings: public select" / "admin insert|update|delete")
-- s'appliquent à la ligne entière, donc couvrent automatiquement cette
-- nouvelle colonne.

alter table public.agency_settings
  add column if not exists hero_media_type text
    check (hero_media_type is null or hero_media_type in ('image', 'video'));
