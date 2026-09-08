-- Photos multiples par annonce (V3.2.B) : table annonce_images + bucket
-- Storage "property-images" + policies RLS.
--
-- À exécuter une seule fois dans le SQL editor du dashboard Supabase.
--
-- Ne touche pas à annonces.image_principale : la colonne reste en place
-- comme fallback temporaire tant que toutes les annonces existantes n'ont
-- pas été migrées vers annonce_images (migration progressive, décidée en
-- V3.2.A/V3.2.B). Sa dépréciation/suppression sera traitée dans une phase
-- ultérieure, séparément.

-- ---------------------------------------------------------------------------
-- 1. annonce_images
-- ---------------------------------------------------------------------------

create table if not exists public.annonce_images (
  id bigint generated always as identity primary key,
  annonce_id bigint not null references public.annonces(id) on delete cascade,
  storage_path text not null,
  alt text,
  position integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists annonce_images_annonce_id_position_idx
  on public.annonce_images (annonce_id, position);

-- Au plus une image de couverture par annonce : index unique partiel, qui ne
-- porte que sur les lignes is_cover = true (les lignes is_cover = false ne
-- sont jamais contraintes entre elles).
create unique index if not exists annonce_images_one_cover_per_annonce_idx
  on public.annonce_images (annonce_id)
  where is_cover;

alter table public.annonce_images enable row level security;

-- Grants de base : comme constaté sur "profiles" (0004) et "notifications"
-- (0006), une table fraîchement créée n'hérite pas toujours des privilèges
-- par défaut sur ce projet ; on les pose explicitement plutôt que de
-- découvrir l'erreur "permission denied" plus tard.
grant select on public.annonce_images to anon, authenticated;
grant insert, update, delete on public.annonce_images to authenticated;

-- Lecture publique : les photos d'une annonce doivent être visibles par tout
-- visiteur (listing /biens, fiche bien, JSON-LD SEO), pas seulement les
-- comptes connectés.
drop policy if exists "annonce_images: public select" on public.annonce_images;
create policy "annonce_images: public select"
  on public.annonce_images for select
  to anon, authenticated
  using (true);

-- Écriture réservée aux admins. Contrairement au bucket "avatars" (chacun
-- gère son propre dossier), les photos d'annonces sont administrées
-- globalement par l'agence : un compte client authentifié n'a ici aucun
-- droit d'écriture, seul profiles.role = 'admin' en a (même motif que
-- visit_requests/contact_messages/reviews/notifications).
drop policy if exists "annonce_images: admin insert" on public.annonce_images;
create policy "annonce_images: admin insert"
  on public.annonce_images for insert
  to authenticated
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

drop policy if exists "annonce_images: admin update" on public.annonce_images;
create policy "annonce_images: admin update"
  on public.annonce_images for update
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

drop policy if exists "annonce_images: admin delete" on public.annonce_images;
create policy "annonce_images: admin delete"
  on public.annonce_images for delete
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- ---------------------------------------------------------------------------
-- 2. Storage : bucket "property-images"
-- ---------------------------------------------------------------------------

-- Bucket public : les photos d'annonces sont publiques par nature (listing,
-- fiche bien, partage, SEO) — comme "avatars" (0005), une URL publique
-- directe évite de gérer des URLs signées côté app.
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

-- Lecture publique de tous les objets du bucket.
drop policy if exists "property-images: public read" on storage.objects;
create policy "property-images: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'property-images');

-- Écriture réservée aux admins. Pas de notion de "propriétaire de dossier"
-- ici contrairement à "avatars" : l'agence (admin) gère les photos de
-- toutes les annonces, un client authentifié non-admin n'a aucun droit
-- d'écriture sur ce bucket.
drop policy if exists "property-images: admin insert" on storage.objects;
create policy "property-images: admin insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'property-images'
    and exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "property-images: admin update" on storage.objects;
create policy "property-images: admin update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'property-images'
    and exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    bucket_id = 'property-images'
    and exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "property-images: admin delete" on storage.objects;
create policy "property-images: admin delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'property-images'
    and exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );
