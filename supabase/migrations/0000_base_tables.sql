-- V3.3.X.1 — Portabilité base de données : crée les 4 tables qui, jusqu'ici,
-- n'existaient dans AUCUNE migration trackée (créées manuellement/via
-- Supabase Studio avant l'instauration de ce dossier), alors que plusieurs
-- migrations ultérieures les ALTER comme si elles existaient déjà :
--
--   annonces          → référencée dès 0001 (FK favorites.property_id) et
--                        0007 (FK annonce_images.annonce_id), puis modifiée
--                        par 0012/0013/0014 — jamais créée
--   visit_requests    → modifiée dès 0001 (add column user_id, RLS) — jamais créée
--   contact_messages  → modifiée dès 0001 (add column user_id, RLS) — jamais créée
--   reviews           → modifiée dès 0002 (add column user_id/updated_at, RLS) — jamais créée
--
-- Conséquence concrète (audit V3.3.X.1) : sur un Supabase strictement vierge,
-- l'exécution de 0001 → 0015 dans l'ordre échouerait dès 0001, ligne 72
-- ("relation public.visit_requests does not exist"), bien avant même
-- d'atteindre la référence à `annonces`.
--
-- Numérotée 0000 (avant 0001) plutôt que d'ajouter les CREATE TABLE dans un
-- fichier historique déjà potentiellement exécuté sur des environnements
-- existants — décision figée en V3.3.X.1, jamais modifier 0001 → 0015.
--
-- `create table if not exists` partout : sur le déploiement actuel, les 4
-- tables existent déjà (créées hors migration) — cette migration est donc un
-- NO-OP total ici, aucune donnée touchée. Elle ne sert qu'à rendre un
-- Supabase vierge capable d'exécuter la suite de la chaîne (0001 → 0015)
-- sans erreur.
--
-- Portée strictement limitée à la structure de base (V3.3.X.1 §6) : les
-- colonnes ajoutées plus tard par 0001/0002/0014 (user_id, updated_at,
-- bathrooms/features/featured/city/address/latitude/longitude/transaction/
-- slug...), les policies RLS et les contraintes détaillées restent
-- exclusivement dans leurs migrations historiques respectives, qui
-- s'appliquent normalement juste après. Aucune policy, aucune RLS, aucune
-- contrainte CHECK n'est posée ici : uniquement les colonnes que le code
-- actuel exige déjà avant même que 0001 ne s'exécute.

-- ---------------------------------------------------------------------------
-- annonces — colonnes de base uniquement ; bathrooms/features/featured/city/
-- address/latitude/longitude/transaction/slug restent ajoutées par 0014.
-- "Title"/"Description" : casse capitale IMPÉRATIVE (guillemetée), exigée
-- telle quelle par AnnonceRow.Title/.Description (lib/supabase/annonces.ts) —
-- un identifiant non quoté serait replié en minuscules par PostgreSQL et
-- casserait silencieusement le mapping.
-- ---------------------------------------------------------------------------
create table if not exists public.annonces (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  "Title" text,
  "Description" text,
  localisation text,
  type text,
  prix numeric,
  surface numeric,
  chambres integer,
  statut text,
  image_principale text
);

grant select on public.annonces to anon, authenticated;
grant insert, update, delete on public.annonces to authenticated;

-- ---------------------------------------------------------------------------
-- visit_requests — colonnes de base ; `user_id` reste ajoutée par 0001.
-- Aucune contrainte de clé étrangère sur `property_id` : n'existe pas dans
-- le schéma historique connu, décision V3.3.X.1 de ne pas l'inventer.
-- `visit_date` en `date` (pas timestamptz) : le formulaire (VisitRequestForm)
-- utilise un <input type="date">, sans composante horaire.
-- ---------------------------------------------------------------------------
create table if not exists public.visit_requests (
  id bigint generated always as identity primary key,
  property_id bigint not null,
  client_name text not null,
  phone text not null,
  email text not null,
  visit_date date not null,
  message text,
  status text not null,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Formulaire public "Demander une visite" : anon doit pouvoir insérer, mais
-- jamais relire (aucune policy SELECT anon dans 0001) — grant miroir exact
-- de ce que permettent réellement les policies RLS de 0001.
grant insert on public.visit_requests to anon;
grant select, insert, update, delete on public.visit_requests to authenticated;

-- ---------------------------------------------------------------------------
-- contact_messages — colonnes de base ; `user_id` reste ajoutée par 0001.
-- Aucune colonne `updated_at` : absente de ContactMessageRow
-- (lib/supabase/contactMessages.ts), jamais ajoutée par aucune migration.
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  phone text not null,
  subject text not null,
  message text not null,
  status text not null,
  created_at timestamptz not null default now()
);

-- Même raisonnement que visit_requests : formulaire de contact public,
-- anon insère mais ne relit jamais (0001 n'a pas de policy SELECT anon).
grant insert on public.contact_messages to anon;
grant select, insert, update, delete on public.contact_messages to authenticated;

-- ---------------------------------------------------------------------------
-- reviews — colonnes de base ; `user_id` et `updated_at` restent ajoutées
-- par 0002. Contrairement à visit_requests/contact_messages, la création
-- d'un avis (createReview, lib/supabase/reviews.ts) exige un utilisateur
-- connecté : pas de grant INSERT pour anon ici.
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  client_name text not null,
  client_photo text,
  rating integer not null,
  comment text not null,
  status text not null,
  created_at timestamptz not null default now()
);

-- Avis approuvés affichés publiquement (page d'accueil) : anon lit, mais
-- n'insère/ne modifie jamais directement (policy "reviews: anon select
-- approved" de 0002, pas de policy d'écriture anon).
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;
