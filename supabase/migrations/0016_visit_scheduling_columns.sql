-- V3.4.A — Smart Visit Scheduling : fondation base de données (colonnes
-- créneau sur visit_requests).
--
-- À exécuter une seule fois dans le SQL editor du dashboard Supabase.
--
-- visit_time : nullable, DÉLIBÉRÉMENT, pas seulement "temporairement en
-- attendant mieux". La clé anon (seul accès disponible pendant cette phase)
-- ne peut pas compter les lignes existantes de visit_requests : la policy
-- "visit_requests: select own" (migration 0001) bloque toute lecture anon,
-- et aucune policy SELECT publique n'existe sur cette table — vérifié en
-- lecture seule avant d'écrire cette migration (0 ligne visible côté anon,
-- sur TEST comme en production, ce qui ne prouve PAS que la table est vide,
-- seulement que rien n'y est lisible sans session admin). Sans accès SQL
-- direct/service_role, impossible de garantir qu'aucune ligne existante ne
-- serait affectée par un NOT NULL — et de toute façon, inventer une heure
-- pour d'anciennes demandes est explicitement interdit.
--
-- Au-delà de cette limite d'accès, NULL a aussi un sens métier permanent,
-- pas seulement transitoire : il distingue nativement les anciennes
-- demandes "legacy" (créées avant Smart Scheduling, jamais rattachées à un
-- créneau précis) des nouvelles demandes Smart Scheduling (toujours créées
-- avec une heure). Le futur moteur de disponibilité pourra donc simplement
-- ignorer les lignes où visit_time is null plutôt que de devoir gérer une
-- valeur sentinelle inventée.
--
-- duration_minutes : durée réellement bloquée par CETTE demande précise —
-- distincte de la future config globale agency_settings.
-- visit_duration_minutes (migration 0017) : celle-ci reste la durée
-- standard actuelle, celle-là la durée réellement appliquée à une ligne au
-- moment de sa création (reste correcte même si la config globale change
-- plus tard). NOT NULL DEFAULT 60 : sûr même sur des lignes déjà
-- existantes, Postgres applique la valeur par défaut automatiquement lors
-- d'un ADD COLUMN, aucune donnée n'est "inventée" au sens où l'entend cette
-- consigne (c'est une durée technique de blocage, pas une information
-- métier comme une heure de visite).
--
-- confirmed_at / cancelled_at : nullable, aucune valeur par défaut, jamais
-- écrits par cette migration — aucun trigger ajouté (cohérent avec le reste
-- du projet : aucune table n'a de trigger sur une colonne d'horodatage,
-- toujours posé explicitement par le code applicatif). Prévus pour être
-- renseignés lors de la transition de statut correspondante, hors périmètre
-- de cette étape (base de données uniquement).

alter table public.visit_requests
  add column if not exists visit_time time,
  add column if not exists duration_minutes integer not null default 60,
  add column if not exists confirmed_at timestamptz,
  add column if not exists cancelled_at timestamptz;

-- Empêche une durée nulle, négative ou absurde (ex. 0 minute) — pas de
-- borne haute arbitraire imposée ici, une éventuelle limite "raisonnable"
-- (ex. 480 min) relève d'une décision produit, pas d'une contrainte
-- technique de cette fondation.
alter table public.visit_requests
  drop constraint if exists visit_requests_duration_minutes_check;
alter table public.visit_requests
  add constraint visit_requests_duration_minutes_check
  check (duration_minutes > 0);
