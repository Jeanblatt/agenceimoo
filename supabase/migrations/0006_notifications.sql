-- Notifications internes (espace client) : table + policies RLS.
--
-- À exécuter une seule fois dans le SQL editor du dashboard Supabase.

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- Grants de base : comme constaté sur "profiles" (voir 0004), une table
-- fraîchement créée n'hérite pas toujours des privilèges par défaut sur ce
-- projet ; on les pose explicitement plutôt que de découvrir l'erreur
-- "permission denied" plus tard.
grant select, insert on public.notifications to authenticated;

-- Grant *colonne* : un client ne peut modifier que "is_read" sur ses propres
-- notifications (jamais le titre, le message ou le type). Combiné à la
-- policy RLS "notifications: update own" ci-dessous, toute tentative de
-- modifier une autre colonne échoue avec "permission denied for column ...".
grant update (is_read) on public.notifications to authenticated;

drop policy if exists "notifications: select own" on public.notifications;
create policy "notifications: select own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications: update own" on public.notifications;
create policy "notifications: update own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Seul un admin peut créer une notification (déclenché par les actions
-- admin : confirmation/annulation de visite, validation d'avis).
drop policy if exists "notifications: admin insert" on public.notifications;
create policy "notifications: admin insert"
  on public.notifications for insert
  to authenticated
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));
