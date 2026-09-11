-- V3.4.A — Smart Visit Scheduling : configuration horaires (agency_settings).
--
-- À exécuter une seule fois dans le SQL editor du dashboard Supabase.
--
-- visit_hours : NULL par défaut — jamais les horaires réels d'une agence
-- (ni Horizon Immobilier, ni aucune autre) recopiés en dur ici, même
-- principe déjà appliqué à toutes les colonnes agency_settings depuis
-- 0009/0010/0011 (config/agency.ts reste le seul repli statique, jamais une
-- deuxième source active en parallèle). NULL signifie explicitement
-- "configuration des horaires à effectuer par l'administrateur" — le futur
-- moteur de disponibilité devra traiter NULL comme "aucun horaire
-- configuré → aucun créneau disponible", jamais une valeur par défaut
-- inventée à sa place.
--
-- Structure JSONB attendue une fois configurée (documentée ici pour
-- référence, volontairement NON validée par une contrainte SQL à ce stade —
-- cette fondation reste simple, une validation de forme plus stricte
-- pourrait être ajoutée plus tard si le besoin s'en fait sentir) :
--   {
--     "monday":    { "closed": false, "morning": ["09:00","12:00"], "afternoon": ["14:00","18:00"] },
--     "tuesday":   { ... },
--     ...
--     "sunday":    { "closed": true, "morning": null, "afternoon": null }
--   }
-- "morning"/"afternoon" : soit null (pas de session ce jour-là), soit un
-- tuple [début, fin] — la pause déjeuner est représentée implicitement par
-- l'écart entre la fin du matin et le début de l'après-midi.
--
-- visit_duration_minutes / visit_buffer_minutes : valeurs globales par
-- défaut raisonnables (60 min de visite, 15 min de battement) — seules
-- colonnes de cette migration à avoir une vraie valeur par défaut, car ce
-- sont des paramètres techniques de calcul, pas des données d'identité
-- d'agence à ne jamais inventer (même distinction que duration_minutes vs
-- visit_time dans la migration 0016).
--
-- La colonne "hours" (text libre, migration 0010) n'est pas touchée :
-- conservée telle quelle pour l'affichage actuel (footer, page contact),
-- qui ne consomme jamais visit_hours et continue de fonctionner à
-- l'identique.

alter table public.agency_settings
  add column if not exists visit_hours jsonb,
  add column if not exists visit_duration_minutes integer not null default 60,
  add column if not exists visit_buffer_minutes integer not null default 15;

alter table public.agency_settings
  drop constraint if exists agency_settings_visit_duration_minutes_check;
alter table public.agency_settings
  add constraint agency_settings_visit_duration_minutes_check
  check (visit_duration_minutes > 0);

-- >= 0 (pas > 0) : un battement de 0 minute entre deux visites reste une
-- configuration valide (visites consécutives sans marge), contrairement à
-- une durée de visite qui ne peut jamais être nulle.
alter table public.agency_settings
  drop constraint if exists agency_settings_visit_buffer_minutes_check;
alter table public.agency_settings
  add constraint agency_settings_visit_buffer_minutes_check
  check (visit_buffer_minutes >= 0);
