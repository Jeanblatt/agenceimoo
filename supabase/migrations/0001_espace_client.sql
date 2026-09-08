-- Espace client : rôles (profiles), rattachement des demandes de visite et
-- messages de contact à un compte, et favoris.
--
-- À exécuter une seule fois dans le SQL editor du dashboard Supabase.
-- Pas de CLI Supabase dans ce repo : ce fichier est la trace versionnée de
-- ce qui a été exécuté à la main.
--
-- IMPORTANT : après exécution, promouvoir le compte admin existant :
--   update profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'REMPLACER_PAR_EMAIL_ADMIN');

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('admin', 'client')),
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: select own" on public.profiles;
create policy "profiles: select own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Empêche un client de changer son propre "role" via l'API : le rôle
-- envoyé (ou omis, auquel cas il reprend la valeur actuelle) doit rester
-- égal à ce qui est déjà stocké.
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- Création automatique du profil (role "client" par défaut) à l'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. visit_requests : rattachement à un compte + policies par rôle
-- ---------------------------------------------------------------------------

alter table public.visit_requests
  add column if not exists user_id uuid references auth.users(id);

-- Repart d'un état propre : les anciennes policies ("authenticated can
-- select visit requests", etc.) supposaient que tout authenticated = admin,
-- ce qui n'est plus vrai dès qu'un client peut se connecter.
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'visit_requests'
  loop
    execute format('drop policy %I on public.visit_requests', pol.policyname);
  end loop;
end $$;

alter table public.visit_requests enable row level security;

-- Formulaire public "Demander une visite" : visiteur anonyme ou client
-- connecté. Le user_id envoyé doit être le sien (ou nul).
create policy "visit_requests: insert"
  on public.visit_requests for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

create policy "visit_requests: select own"
  on public.visit_requests for select
  to authenticated
  using (user_id = auth.uid());

create policy "visit_requests: admin select all"
  on public.visit_requests for select
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy "visit_requests: admin update"
  on public.visit_requests for update
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy "visit_requests: admin delete"
  on public.visit_requests for delete
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- ---------------------------------------------------------------------------
-- 3. contact_messages : même traitement
-- ---------------------------------------------------------------------------

alter table public.contact_messages
  add column if not exists user_id uuid references auth.users(id);

do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'contact_messages'
  loop
    execute format('drop policy %I on public.contact_messages', pol.policyname);
  end loop;
end $$;

alter table public.contact_messages enable row level security;

create policy "contact_messages: insert"
  on public.contact_messages for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

create policy "contact_messages: select own"
  on public.contact_messages for select
  to authenticated
  using (user_id = auth.uid());

create policy "contact_messages: admin select all"
  on public.contact_messages for select
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy "contact_messages: admin update"
  on public.contact_messages for update
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy "contact_messages: admin delete"
  on public.contact_messages for delete
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- ---------------------------------------------------------------------------
-- 4. favorites
-- ---------------------------------------------------------------------------

create table if not exists public.favorites (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id bigint not null references public.annonces(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

alter table public.favorites enable row level security;

drop policy if exists "favorites: select own" on public.favorites;
create policy "favorites: select own"
  on public.favorites for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "favorites: insert own" on public.favorites;
create policy "favorites: insert own"
  on public.favorites for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "favorites: delete own" on public.favorites;
create policy "favorites: delete own"
  on public.favorites for delete
  to authenticated
  using (user_id = auth.uid());
