import { supabase } from "@/lib/supabase/client";

// Bucket créé par supabase/migrations/0008_agency_branding_storage.sql :
// public en lecture, écriture réservée aux admins (policies RLS). Les
// policies sont posées au niveau du bucket entier (bucket_id =
// 'agency-assets'), pas par nom de fichier — les assets ajoutés en V3.3.U
// (hero, og) sont donc déjà couverts, sans nouvelle policy ni migration.
const BUCKET = "agency-assets";

/**
 * Assets de branding gérés par ce module — un chemin fixe et unique par
 * type (décision figée en V3.3.M.1 pour le logo, étendue à l'identique en
 * V3.3.U) : un seul fichier actif à la fois, remplacé via upsert plutôt que
 * versionné. Jamais de storage.list() nécessaire pour les retrouver.
 */
export type AgencyAssetKind = "logo" | "hero" | "og" | "heroVideo" | "cta" | "stats" | "whyUs";

interface AssetPolicy {
  path: string;
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  /** Libellé humain des formats acceptés, pour les messages d'erreur. */
  allowedFormatsLabel: string;
}

const ASSET_POLICIES: Record<AgencyAssetKind, AssetPolicy> = {
  // Politique logo strictement inchangée depuis V3.3.M.1 (2 Mo, WebP/PNG
  // uniquement) : ne pas relâcher une contrainte déjà en production.
  logo: {
    path: "logo.webp",
    maxSizeBytes: 2 * 1024 * 1024,
    allowedMimeTypes: ["image/webp", "image/png"],
    allowedFormatsLabel: "WebP, PNG",
  },
  // Image de fond plein écran : limite plus généreuse que le logo, mais
  // bornée pour rester raisonnable sur Vercel/Supabase et pour la
  // performance de chargement (voir Hero.tsx, déjà en `fill` + `object-cover`).
  hero: {
    path: "hero.webp",
    maxSizeBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
    allowedFormatsLabel: "WebP, PNG, JPEG",
  },
  // Image de partage (Open Graph/Twitter) : gabarit habituel ~1200x630,
  // n'a pas besoin d'être aussi lourde qu'un fond de Hero plein écran.
  og: {
    path: "og.webp",
    maxSizeBytes: 3 * 1024 * 1024,
    allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
    allowedFormatsLabel: "WebP, PNG, JPEG",
  },
  // Vidéo de fond du Hero principal — optionnelle (V3.3.V.1). MP4 (H.264)
  // uniquement pour une compatibilité universelle sans multiplier les
  // formats à maintenir (WebM resterait une amélioration future, pas un
  // prérequis — voir le rapport d'audit V3.3.V). Aucune colonne
  // agency_settings associée : la seule présence du fichier à ce chemin fixe
  // détermine si la vidéo est active (voir Hero.tsx, cascade onError).
  heroVideo: {
    path: "hero.mp4",
    maxSizeBytes: 15 * 1024 * 1024,
    allowedMimeTypes: ["video/mp4"],
    allowedFormatsLabel: "MP4",
  },
  // Image de fond du bandeau CTA final — indépendante du Hero depuis
  // V3.3.V.2 (auparavant partagée avec la slide 1 du Hero, voir le rapport
  // d'audit V3.3.V.2 pour la justification de la séparation).
  cta: {
    path: "cta.webp",
    maxSizeBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
    allowedFormatsLabel: "WebP, PNG, JPEG",
  },
  // Image de fond optionnelle de la section Stats (V3.3.V.2) — purement
  // décorative, jamais de repli statique dédié : en son absence, le fond
  // sombre uni existant reste utilisé tel quel (voir components/Stats.tsx).
  stats: {
    path: "stats.webp",
    maxSizeBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
    allowedFormatsLabel: "WebP, PNG, JPEG",
  },
  // Image de fond optionnelle de la section "Pourquoi {agence}" (V3.3.V.3)
  // — même principe que stats ci-dessus : purement décorative, aucun repli
  // vers un autre asset (hero/cta/stats/og) en cas d'échec, uniquement le
  // design actuel de la section (voir components/HomeProperties.tsx).
  whyUs: {
    path: "why-us.webp",
    maxSizeBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
    allowedFormatsLabel: "WebP, PNG, JPEG",
  },
};

// Fenêtre de cache volontairement courte (Cache-Control: max-age=60, à la
// fois navigateur et CDN Supabase) : un remplacement d'asset redevient donc
// visible pour tout visiteur en au plus 60s, sans nécessiter de nom de
// fichier versionné ni de paramètre cacheNonce sur le rendu public (voir
// V3.3.M.1, section Cache — même principe étendu à hero/og).
const ASSET_CACHE_CONTROL_SECONDS = "60";

/**
 * URL publique déterministe d'un asset — calcul synchrone (concaténation de
 * chaîne, aucune requête réseau), peut donc être appelée directement dans un
 * composant au rendu, y compris dans les métadonnées statiques de
 * app/layout.tsx (voir V3.3.U). Renvoie toujours une URL, même si l'asset
 * n'a jamais été uploadé : c'est au consommateur de gérer l'échec de
 * chargement (404) — via `onError` pour un <img>/<Image> (voir BrandMark.tsx,
 * Hero.tsx), ou via une liste de candidats pour une balise <meta> qui ne
 * peut pas réagir à une erreur de chargement (voir app/layout.tsx).
 *
 * `cacheNonce` n'est PAS utilisé par le rendu public : il reste disponible
 * ici uniquement pour un aperçu instantané côté dashboard admin juste après
 * un upload, ex. `getAgencyAssetPublicUrl("hero", { cacheNonce: String(Date.now()) })`,
 * afin de contourner le cache le temps de la session d'édition, sans jamais
 * changer l'URL utilisée par les visiteurs du site.
 */
export function getAgencyAssetPublicUrl(
  kind: AgencyAssetKind,
  options?: { cacheNonce?: string }
): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(ASSET_POLICIES[kind].path, options);
  return publicUrl;
}

function validateAssetFile(kind: AgencyAssetKind, file: File): string | null {
  const policy = ASSET_POLICIES[kind];
  if (!policy.allowedMimeTypes.includes(file.type)) {
    return `Format non supporté (${file.type || "inconnu"}). Formats acceptés : ${policy.allowedFormatsLabel}.`;
  }
  if (file.size > policy.maxSizeBytes) {
    return `Fichier trop volumineux (max ${policy.maxSizeBytes / (1024 * 1024)} Mo).`;
  }
  return null;
}

/**
 * Upload/remplace un asset de l'agence. Chemin fixe + `upsert: true` : pas
 * de nouveau fichier créé à chaque remplacement, donc aucun fichier orphelin
 * à nettoyer (contrairement à property-images/annonceImages.ts, qui gère
 * plusieurs fichiers par annonce).
 */
export async function uploadAgencyAsset(
  kind: AgencyAssetKind,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const validationError = validateAssetFile(kind, file);
  if (validationError) {
    return { url: null, error: validationError };
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(ASSET_POLICIES[kind].path, file, {
      upsert: true,
      cacheControl: ASSET_CACHE_CONTROL_SECONDS,
      contentType: file.type,
    });

  if (uploadError) {
    console.error(`Erreur Supabase (uploadAgencyAsset:${kind}):`, uploadError);
    return { url: null, error: uploadError.message };
  }

  return { url: getAgencyAssetPublicUrl(kind), error: null };
}

/** Supprime l'asset actif, s'il existe. */
export async function deleteAgencyAsset(kind: AgencyAssetKind): Promise<{ error: string | null }> {
  const { error } = await supabase.storage.from(BUCKET).remove([ASSET_POLICIES[kind].path]);
  if (error) {
    console.error(`Erreur Supabase (deleteAgencyAsset:${kind}):`, error);
    return { error: error.message };
  }
  return { error: null };
}

// --- Compatibilité logo (V3.3.M/N/M.1) ---------------------------------
// Signatures et comportement strictement inchangés : BrandMark.tsx et
// AgencySettingsForm.tsx continuent de fonctionner sans aucune modification.

export const LOGO_STORAGE_PATH = ASSET_POLICIES.logo.path;

export function getLogoPublicUrl(options?: { cacheNonce?: string }): string {
  return getAgencyAssetPublicUrl("logo", options);
}

export async function uploadLogo(file: File): Promise<{ url: string | null; error: string | null }> {
  return uploadAgencyAsset("logo", file);
}

export async function deleteLogo(): Promise<{ error: string | null }> {
  return deleteAgencyAsset("logo");
}
