-- V3.4.C — Smart Visit Scheduling : accès sécurisé aux conflits de créneaux
-- (RPC SECURITY DEFINER dédiée) + protection base de données anti-double-
-- réservation (index unique partiel).
--
-- À exécuter une seule fois dans le SQL editor du dashboard Supabase (TEST
-- d'abord — jamais en production sans validation explicite).
--
-- Contexte (constat V3.4.B, confirmé par audit avant cette migration) :
-- public.visit_requests n'a AUCUNE policy SELECT publique (seules
-- "visit_requests: select own" et "visit_requests: admin select all",
-- migration 0001, toutes deux réservées à authenticated) — un visiteur
-- anonyme lisant les créneaux disponibles d'un bien avant même de se
-- connecter obtient donc systématiquement 0 ligne, quelle que soit la
-- réalité des réservations existantes. Le moteur de disponibilité
-- (lib/scheduling/availability.ts) ne pouvait donc pas détecter de conflit
-- réel pour un visiteur non connecté.
--
-- Solution retenue : une fonction PostgreSQL SECURITY DEFINER strictement
-- spécialisée, ne retournant QUE les 5 colonnes nécessaires au calcul de
-- disponibilité (property_id, visit_date, visit_time, duration_minutes,
-- status) — jamais client_name/phone/email/message/admin_notes/user_id.
-- Explicitement écarté : une policy SELECT publique générale sur
-- visit_requests (exposerait toutes les colonnes, y compris les données
-- personnelles) et une VIEW publique (même problème de surface d'exposition,
-- moins précise qu'une fonction dédiée à paramètres typés).
--
-- Les policies RLS existantes de visit_requests (0001) ne sont PAS
-- modifiées : cette migration ajoute un mécanisme d'accès supplémentaire et
-- strictement borné, elle ne remplace rien de l'espace client/admin actuel.
--
-- Nom de fonction vérifié en lecture seule (PostgREST, clé anon, projet
-- TEST) avant d'écrire cette migration : aucune fonction
-- public.get_blocking_visit_slots ni variante proche
-- (blocking_visit_slots/get_visit_availability/get_available_visit_slots)
-- n'existe — création sans risque d'écrasement, "create or replace" utilisé
-- par prudence/cohérence avec le reste du projet (ex. handle_new_user,
-- migration 0001), pas parce qu'une version antérieure était attendue.

-- ---------------------------------------------------------------------------
-- 0. Garde-fou anti-doublons — DOIT s'exécuter avant la création de l'index
-- unique plus bas. Si des doublons actifs existent déjà (même bien, même
-- date, même heure, tous deux pending/confirmed), la migration s'arrête ici
-- avec une erreur explicite : AUCUNE donnée n'est supprimée ou modifiée
-- automatiquement, et — dans la mesure où ce script est exécuté comme un
-- seul bloc dans l'éditeur SQL Supabase (transaction implicite unique) — la
-- fonction RPC et l'index plus bas ne sont pas créés non plus tant que ce
-- doublon n'a pas été résolu manuellement.
-- ---------------------------------------------------------------------------
do $$
declare
  dup_count integer;
begin
  select count(*) into dup_count
  from (
    select property_id, visit_date, visit_time
    from public.visit_requests
    where visit_time is not null
      and status in ('pending', 'confirmed')
    group by property_id, visit_date, visit_time
    having count(*) > 1
  ) duplicates;

  if dup_count > 0 then
    raise exception
      'V3.4.C : % groupe(s) de doublons actifs (property_id, visit_date, visit_time, status pending/confirmed) détecté(s) sur public.visit_requests. Migration interrompue volontairement — AUCUNE donnée modifiée. Résous ces doublons manuellement (ex. annuler l''une des demandes en conflit) avant de relancer cette migration.',
      dup_count;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. RPC de disponibilité — SECURITY DEFINER, périmètre strictement borné.
--
-- Paramètres typés (bigint, date) uniquement : aucun nom de table/colonne,
-- aucun SQL arbitraire, aucun user_id, aucun statut arbitraire ne peuvent
-- être injectés par l'appelant — "language sql" (pas plpgsql), sans SQL
-- dynamique, avec p_property_id/p_visit_date utilisés uniquement comme
-- valeurs liées dans une clause WHERE fixe.
--
-- "set search_path = ''" (recommandation Postgres/Supabase pour toute
-- fonction SECURITY DEFINER) : pg_catalog reste implicitement résolu même
-- avec un search_path vide, donc les opérateurs standards (=, is not null,
-- in) restent disponibles ; public.visit_requests est référencée en toutes
-- lettres, jamais via une résolution de schéma ambiguë détournable.
--
-- "stable" (pas "volatile") : lecture pure, cohérente sur la durée d'une
-- même requête — comportement correct pour une fonction consultée plusieurs
-- fois dans un même calcul de disponibilité.
--
-- Statuts bloquants ("pending", "confirmed") figés en dur dans le corps de
-- la fonction : l'appelant ne peut pas demander un autre statut.
-- ---------------------------------------------------------------------------
create or replace function public.get_blocking_visit_slots(
  p_property_id bigint,
  p_visit_date date
)
returns table (
  property_id bigint,
  visit_date date,
  visit_time time,
  duration_minutes integer,
  status text
)
language sql
security definer
stable
set search_path = ''
as $$
  select
    vr.property_id,
    vr.visit_date,
    vr.visit_time,
    vr.duration_minutes,
    vr.status
  from public.visit_requests vr
  where vr.property_id = p_property_id
    and vr.visit_date = p_visit_date
    and vr.visit_time is not null
    and vr.status in ('pending', 'confirmed');
$$;

-- Droits d'exécution : jamais service_role côté client (aucune clé de ce
-- type n'existe dans ce projet — seule la clé anon publique est utilisée,
-- y compris côté serveur). Révoque d'abord le privilège EXECUTE accordé par
-- défaut à PUBLIC à la création d'une fonction, puis accorde explicitement
-- uniquement à anon et authenticated (le formulaire "Demander une visite"
-- est utilisable aussi bien par un visiteur anonyme qu'un client connecté).
revoke all on function public.get_blocking_visit_slots(bigint, date) from public;
grant execute on function public.get_blocking_visit_slots(bigint, date) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Anti-double-réservation — index unique partiel.
--
-- Protège uniquement (property_id, visit_date, visit_time) identiques, tous
-- deux pending/confirmed — deux biens différents à la même heure restent
-- autorisés (pas de conflit global, uniquement par bien). "visit_time is not
-- null" exclut explicitement les lignes legacy (jamais concernées par cette
-- contrainte, jamais modifiées, jamais bloquantes). "status in
-- ('pending','confirmed')" exclut cancelled/completed : un créneau annulé ou
-- déjà honoré libère la place pour une nouvelle demande identique.
--
-- Dernière ligne de défense contre une race condition (deux clients
-- vérifient la disponibilité au même instant, voient tous deux le créneau
-- libre, insèrent tous les deux) — l'engine de disponibilité (V3.4.B)
-- pré-filtre, mais seule une contrainte DB peut arbitrer deux INSERT
-- concurrents de façon atomique.
-- ---------------------------------------------------------------------------
create unique index if not exists visit_requests_active_slot_unique_idx
  on public.visit_requests (property_id, visit_date, visit_time)
  where visit_time is not null
    and status in ('pending', 'confirmed');
