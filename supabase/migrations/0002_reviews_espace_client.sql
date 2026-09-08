-- Mes avis (espace client) : rattachement des avis à un compte utilisateur,
-- formulaire d'avis côté client (/compte/avis), et policies RLS par rôle.
--
-- À exécuter une seule fois dans le SQL editor du dashboard Supabase.
-- Comme 0001_espace_client.sql, ce fichier documente et recrée à l'identique
-- les policies "reviews" existantes (jamais versionnées jusqu'ici) en plus
-- des nouvelles nécessaires pour /compte/avis.

-- ---------------------------------------------------------------------------
-- 1. reviews : rattachement à un compte + colonne updated_at
-- ---------------------------------------------------------------------------

alter table public.reviews
  add column if not exists user_id uuid references auth.users(id);

alter table public.reviews
  add column if not exists updated_at timestamptz not null default now();

-- Repart d'un état propre, comme pour visit_requests/contact_messages : les
-- anciennes policies (non versionnées) supposaient un accès admin simple ;
-- on les recrée explicitement ci-dessous, rôle par rôle.
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'reviews'
  loop
    execute format('drop policy %I on public.reviews', pol.policyname);
  end loop;
end $$;

alter table public.reviews enable row level security;

-- Page d'accueil publique : uniquement les avis validés.
create policy "reviews: anon select approved"
  on public.reviews for select
  to anon
  using (status = 'approved');

-- Client connecté : ne voit que ses propres avis (page /compte/avis).
create policy "reviews: select own"
  on public.reviews for select
  to authenticated
  using (user_id = auth.uid());

-- Admin : accès complet en lecture (page /admin/reviews).
create policy "reviews: admin select all"
  on public.reviews for select
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- Un client crée un avis rattaché à son compte, toujours en statut "pending"
-- (une validation admin est requise avant publication).
create policy "reviews: insert own"
  on public.reviews for insert
  to authenticated
  with check (user_id = auth.uid() and status = 'pending');

-- Un client modifie uniquement son propre avis ; le statut repasse
-- obligatoirement à "pending" (nouvelle validation requise après modification).
create policy "reviews: update own"
  on public.reviews for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and status = 'pending');

-- Admin : valide (update status) ou supprime n'importe quel avis. Policy
-- distincte de "update own" (OR'd par Postgres) donc le changement de statut
-- vers "approved" par un admin n'est jamais bloqué par le with check ci-dessus.
create policy "reviews: admin update"
  on public.reviews for update
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy "reviews: admin delete"
  on public.reviews for delete
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));
