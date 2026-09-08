-- V3.3.V — Complète le modèle de données des biens (annonces), déjà attendu
-- par le frontend (PropertyCard.tsx, PropertyDetailHero.tsx, PropertyInfo.tsx,
-- PropertyLocation.tsx gèrent déjà ces champs de façon conditionnelle depuis
-- plusieurs phases : "property.featured pilote déjà le badge Premium",
-- "tant qu'aucune colonne latitude/longitude n'existe côté Supabase..." —
-- voir les commentaires déjà en place dans ces fichiers). Seule la colonne
-- Supabase manquait : cette migration ne demande donc aucun changement de
-- ces composants.
--
-- Toutes les nouvelles colonnes sont NULLABLE (ou `false` par défaut pour
-- featured, seul cas explicitement demandé) : aucune donnée n'est inventée
-- pour les 5 annonces existantes, qui héritent silencieusement de NULL/false
-- sur chaque nouveau champ. Aucun DROP, aucune suppression de colonne,
-- `location`/`image_principale`/toutes les colonnes existantes restent
-- intactes.
--
-- Ne touche à aucune policy RLS : les policies "annonces: public select" /
-- "annonces: admin insert|update|delete" de 0013 s'appliquent à la ligne
-- entière et couvrent donc automatiquement ces nouvelles colonnes, sans
-- policy supplémentaire nécessaire (même principe que 0010/0011 pour
-- agency_settings).

alter table public.annonces
  add column if not exists bathrooms integer,
  add column if not exists features text[],
  add column if not exists featured boolean not null default false,
  add column if not exists city text,
  add column if not exists address text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  -- Stocke le LABEL affiché ("Vente"/"Location"), pas un id technique — même
  -- convention que la colonne existante `statut` ("Disponible"/"Réservé"/
  -- "Vendu"). La conversion label <-> id ("sale"/"rent") se fait exclusivement
  -- dans lib/supabase/annonces.ts (labelToTransactionId/transactionIdToLabel),
  -- à l'identique du mécanisme déjà en place pour `statut`.
  add column if not exists transaction text,
  add column if not exists slug text;

-- Un bien peut ne connaître aucune caractéristique particulière (bathrooms,
-- features, city, address, latitude, longitude, transaction, slug) : c'est
-- le cas de toutes les annonces existantes tant qu'un admin ne les a pas
-- renseignées. Contrainte de valeur uniquement là où un ensemble fermé de
-- valeurs a du sens (transaction), pour éviter les chaînes libres
-- incohérentes ("vente", "Vente", "SALE"...) mentionnées dans le ticket.
alter table public.annonces
  drop constraint if exists annonces_transaction_check;
alter table public.annonces
  add constraint annonces_transaction_check
  check (transaction is null or transaction in ('Vente', 'Location'));

-- Slug unique quand renseigné — mais plusieurs lignes peuvent rester à NULL
-- (annonce jamais dotée d'un slug) sans jamais entrer en conflit entre elles :
-- un index unique partiel (comme annonce_images_one_cover_per_annonce_idx,
-- migration 0007) ignore les lignes NULL, contrairement à une contrainte
-- UNIQUE classique sur une colonne nullable (qui aurait le même effet ici en
-- PostgreSQL, mais l'index partiel documente l'intention explicitement).
create unique index if not exists annonces_slug_unique_idx
  on public.annonces (slug)
  where slug is not null;
