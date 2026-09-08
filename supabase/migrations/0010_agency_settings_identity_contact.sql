-- Identité et coordonnées de l'agence configurables à runtime (V3.3.R) :
-- étend la table singleton "agency_settings" (créée en 0009 pour les
-- réseaux sociaux) plutôt que de créer une nouvelle table — décision déjà
-- actée dans le commentaire d'en-tête de 0009 ("les futures colonnes
-- s'ajouteront à cette même table").
--
-- À exécuter une seule fois dans le SQL editor du dashboard Supabase.
--
-- Toutes les colonnes restent NULLABLE et sont insérées vides : comme pour
-- social_facebook/instagram/linkedin, config/agency.ts (agency.*) reste le
-- repli tant qu'aucune valeur n'est saisie explicitement (voir
-- lib/supabase/agencySettings.ts). Aucune donnée Horizon Immobilier n'est
-- recopiée ici — pas de deuxième source active en parallèle.
--
-- RLS : aucune nouvelle policy nécessaire. Les policies de 0009
-- ("agency_settings: public select" / "admin insert|update|delete")
-- s'appliquent à la ligne entière, donc couvrent automatiquement ces
-- nouvelles colonnes.
--
-- Volontairement hors scope de cette migration : logo (déjà géré via le
-- bucket Storage "agency-assets", voir 0008 et lib/supabase/agencyBranding.ts
-- — logo_url dupliquerait une source déjà correcte) et latitude/longitude
-- de l'agence (aucun consommateur actuel ; la colonne latitude/longitude
-- existante sur les biens dans data/properties.ts est une donnée différente,
-- par annonce, pas par agence — voir le rapport V3.3.R).

alter table public.agency_settings
  add column if not exists name text,
  add column if not exists short_name text,
  add column if not exists tagline text,
  add column if not exists description text,
  add column if not exists phone text,
  add column if not exists phone_display text,
  add column if not exists whatsapp text,
  add column if not exists email text,
  add column if not exists address_street text,
  add column if not exists address_postal_code text,
  add column if not exists address_city text,
  add column if not exists address_country text,
  add column if not exists hours text,
  add column if not exists founded_year integer;
