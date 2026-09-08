import { supabase } from "@/lib/supabase/client";
import type { Property, PropertyImage, PropertyStatus, TransactionType } from "@/data/properties";
import { catalog } from "@/config/catalog";
import {
  type AnnonceImageRow,
  deleteAnnonceImageFiles,
  mapAnnonceImageToPropertyImage,
} from "@/lib/supabase/annonceImages";

// Conversion label <-> id : la colonne Supabase `statut` stocke le label
// affiché (ex. "Vendu"), jamais l'identifiant technique. Migration V3.3.E :
// les IDs deviennent la référence métier dans l'app, mais aucune donnée
// existante n'est modifiée — toute la conversion reste isolée ici.
function labelToStatusId(label: string | null): PropertyStatus | undefined {
  return catalog.propertyStatuses.find((status) => status.label === label)?.id;
}

function statusIdToLabel(id: PropertyStatus): string {
  return catalog.propertyStatuses.find((status) => status.id === id)?.label ?? id;
}

// Même principe que labelToStatusId/statusIdToLabel ci-dessus, pour la
// colonne `transaction` ajoutée en V3.3.V (stocke le label "Vente"/
// "Location", jamais l'id technique "sale"/"rent" — voir la migration
// 0014_annonces_property_model_completion.sql).
function labelToTransactionId(label: string | null): TransactionType | undefined {
  return catalog.transactionTypes.find((transaction) => transaction.label === label)?.id;
}

function transactionIdToLabel(id: TransactionType | undefined): string | null {
  if (!id) return null;
  return catalog.transactionTypes.find((transaction) => transaction.id === id)?.label ?? id;
}

export interface AnnonceRow {
  id: number;
  created_at: string;
  Title: string | null;
  Description: string | null;
  localisation: string | null;
  type: string | null;
  prix: number | null;
  surface: number | null;
  chambres: number | null;
  statut: string | null;
  image_principale: string | null;
  // Colonnes ajoutées en V3.3.V (migration 0014) — toutes nullables sauf
  // `featured` (false par défaut), donc jamais absentes des lignes
  // existantes, seulement à leur valeur de repli tant qu'un admin ne les a
  // pas renseignées.
  bathrooms: number | null;
  features: string[] | null;
  featured: boolean;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  transaction: string | null;
  slug: string | null;
  // Présent uniquement quand la requête embarque la relation (voir
  // ANNONCE_SELECT_WITH_IMAGES ci-dessous) ; absent après insert/update.
  annonce_images?: AnnonceImageRow[];
}

// annonce_images (V3.2.B/C) est la source prioritaire des images ; l'ancienne
// colonne image_principale ne sert plus que de repli tant qu'une annonce n'a
// pas encore de ligne annonce_images (migration progressive, voir V3.2.A).
//
// Tri : la cover (is_cover=true, au plus une par annonce — contrainte SQL de
// 0007_property_images_storage.sql) passe toujours en premier, quelle que
// soit sa position ; les autres suivent par position croissante (V3.2.E).
// C'est ce qui fait de images[0] "la vraie cover" partout où ce tableau est
// consommé (fiche bien, vignettes de listing, JSON-LD) sans dupliquer cette
// règle dans chaque composant.
function buildPropertyImages(row: AnnonceRow): PropertyImage[] | undefined {
  const imageRows = row.annonce_images ?? [];
  if (imageRows.length > 0) {
    return [...imageRows]
      .sort((a, b) => {
        if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
        return a.position - b.position;
      })
      .map(mapAnnonceImageToPropertyImage);
  }

  if (row.image_principale) {
    return [
      {
        id: `legacy-${row.id}`,
        url: row.image_principale,
        position: 0,
        isCover: true,
      },
    ];
  }

  return undefined;
}

export function mapAnnonceToProperty(row: AnnonceRow): Property {
  return {
    id: String(row.id),
    title: row.Title ?? "",
    description: row.Description ?? "",
    location: row.localisation ?? "",
    price: row.prix ?? 0,
    area: row.surface ?? 0,
    bedrooms: row.chambres ?? 0,
    type: (row.type ?? "") as Property["type"],
    images: buildPropertyImages(row),
    status: labelToStatusId(row.statut),
    // V3.3.V — undefined (pas null) quand la colonne est vide, pour
    // correspondre exactement aux champs optionnels déjà attendus par
    // PropertyCard/PropertyInfo/PropertyLocation/PropertyDetailHero.
    bathrooms: row.bathrooms ?? undefined,
    features: row.features ?? undefined,
    featured: row.featured,
    city: row.city ?? undefined,
    address: row.address ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    transaction: labelToTransactionId(row.transaction),
    slug: row.slug ?? undefined,
  };
}

// Embarque les images liées (jointure PostgREST) en une seule requête, pour
// éviter un aller-retour par annonce. Utilisé partout où mapAnnonceToProperty
// doit refléter les vraies images (listing, recherche, fiche bien) — pas
// après insert/update, où l'annonce vient d'être créée/modifiée sans images.
const ANNONCE_SELECT_WITH_IMAGES = "*, annonce_images(*)";

export interface AnnoncePayload {
  title: string;
  description: string;
  location: string;
  type: string;
  price: number;
  surface: number;
  bedrooms: number;
  status: PropertyStatus;
  image?: string;
  // V3.3.V — tous optionnels : un admin peut laisser ces champs vides,
  // notamment lors de la modification d'une annonce créée avant cette phase.
  // `undefined` (champ non touché par le formulaire) est distingué de `null`/
  // valeur vide (champ explicitement vidé) uniquement par le composant
  // appelant ; ici toute valeur absente ou vide est simplement stockée NULL.
  bathrooms?: number;
  features?: string[];
  featured?: boolean;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  transaction?: TransactionType;
  slug?: string;
}

function toAnnonceRow(payload: AnnoncePayload) {
  return {
    Title: payload.title,
    Description: payload.description,
    localisation: payload.location,
    type: payload.type,
    prix: payload.price,
    surface: payload.surface,
    chambres: payload.bedrooms,
    statut: statusIdToLabel(payload.status),
    image_principale: payload.image || null,
    bathrooms: payload.bathrooms ?? null,
    features: payload.features && payload.features.length > 0 ? payload.features : null,
    featured: payload.featured ?? false,
    city: payload.city || null,
    address: payload.address || null,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    transaction: transactionIdToLabel(payload.transaction),
    slug: payload.slug || null,
  };
}

// Les biens "sold" ne doivent plus apparaître dans les listings publics
// (getAnnonces/searchAnnonces) — "reserved" reste visible (affiché avec un
// badge côté UI). Les lignes sans statut renseigné restent visibles aussi :
// `neq` seul les aurait exclues (NULL <> 'Vendu' n'est ni vrai ni faux en
// SQL), d'où le `.or` explicite. Le label comparé est résolu depuis
// catalog.propertyStatuses (pas codé en dur) : la requête cible toujours la
// vraie valeur stockée en base, même si ce label est renommé par un client.
const EXCLUDE_SOLD_FILTER = `statut.neq.${statusIdToLabel("sold")},statut.is.null`;

// Les 5 tris proposés sur /biens (V2.2.3). "recent" est la valeur par
// défaut : elle correspond au tri appliqué historiquement (avant
// l'introduction du sélecteur de tri), donc absente de l'URL.
export type AnnonceSort = "recent" | "prix-asc" | "prix-desc" | "surface-asc" | "surface-desc";

export const ANNONCE_SORT_OPTIONS: AnnonceSort[] = [
  "recent",
  "prix-asc",
  "prix-desc",
  "surface-asc",
  "surface-desc",
];

export function isAnnonceSort(value: string | undefined | null): value is AnnonceSort {
  return !!value && (ANNONCE_SORT_OPTIONS as string[]).includes(value);
}

// nullsFirst: false quel que soit le sens du tri, pour que les biens sans
// prix/surface renseigné restent en fin de liste plutôt que de remonter en
// tête d'un tri décroissant (comportement par défaut de PostgREST).
function resolveSortOrder(sort: AnnonceSort | undefined): {
  column: "created_at" | "prix" | "surface";
  ascending: boolean;
  nullsFirst?: boolean;
} {
  switch (sort) {
    case "prix-asc":
      return { column: "prix", ascending: true, nullsFirst: false };
    case "prix-desc":
      return { column: "prix", ascending: false, nullsFirst: false };
    case "surface-asc":
      return { column: "surface", ascending: true, nullsFirst: false };
    case "surface-desc":
      return { column: "surface", ascending: false, nullsFirst: false };
    case "recent":
    default:
      return { column: "created_at", ascending: false };
  }
}

export async function getAnnonces(sort?: AnnonceSort): Promise<{
  properties: Property[];
  error: string | null;
}> {
  const { column, ascending, nullsFirst } = resolveSortOrder(sort);
  const { data, error } = await supabase
    .from("annonces")
    .select(ANNONCE_SELECT_WITH_IMAGES)
    .or(EXCLUDE_SOLD_FILTER)
    .order(column, { ascending, nullsFirst });

  if (error) {
    return { properties: [], error: error.message };
  }

  return { properties: (data as AnnonceRow[]).map(mapAnnonceToProperty), error: null };
}

export interface AnnonceSearchFilters {
  localisation?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  minSurface?: number;
  minBedrooms?: number;
  sort?: AnnonceSort;
}

export async function searchAnnonces(filters: AnnonceSearchFilters): Promise<{
  properties: Property[];
  error: string | null;
}> {
  let query = supabase.from("annonces").select(ANNONCE_SELECT_WITH_IMAGES).or(EXCLUDE_SOLD_FILTER);

  if (filters.localisation) {
    query = query.ilike("localisation", `%${filters.localisation}%`);
  }
  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  if (filters.minPrice !== undefined) {
    query = query.gte("prix", filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte("prix", filters.maxPrice);
  }
  if (filters.minSurface !== undefined) {
    query = query.gte("surface", filters.minSurface);
  }
  if (filters.minBedrooms !== undefined) {
    query = query.gte("chambres", filters.minBedrooms);
  }

  const { column, ascending, nullsFirst } = resolveSortOrder(filters.sort);
  const { data, error } = await query.order(column, { ascending, nullsFirst });

  if (error) {
    return { properties: [], error: error.message };
  }

  return { properties: (data as AnnonceRow[]).map(mapAnnonceToProperty), error: null };
}

export async function insertAnnonce(payload: AnnoncePayload): Promise<{
  property: Property | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("annonces")
    .insert(toAnnonceRow(payload))
    .select()
    .single();

  if (error) {
    console.error("Erreur Supabase (insertAnnonce):", error);
    return { property: null, error: error.message };
  }

  return { property: mapAnnonceToProperty(data as AnnonceRow), error: null };
}

export async function updateAnnonce(
  id: string,
  payload: AnnoncePayload
): Promise<{ property: Property | null; error: string | null }> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { property: null, error: "Identifiant de bien invalide." };
  }

  const { data, error } = await supabase
    .from("annonces")
    .update(toAnnonceRow(payload))
    .eq("id", numericId)
    .select()
    .single();

  if (error) {
    console.error("Erreur Supabase (updateAnnonce):", error);
    return { property: null, error: error.message };
  }

  return { property: mapAnnonceToProperty(data as AnnonceRow), error: null };
}

export async function deleteAnnonce(id: string): Promise<{ error: string | null }> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant de bien invalide." };
  }

  // Nettoyage Storage avant suppression DB (V3.2.F) : si un fichier ne peut
  // pas être retiré, on s'arrête ici sans toucher à la ligne annonces —
  // mieux vaut une annonce intacte à réessayer qu'une annonce disparue avec
  // des photos orphelines qu'on ne pourra plus jamais relier à rien une
  // fois la ligne (et son storage_path) supprimée par la cascade SQL.
  const { error: storageError } = await deleteAnnonceImageFiles(id);
  if (storageError) {
    console.error("Erreur Supabase (deleteAnnonce — nettoyage Storage):", storageError);
    return {
      error: `Le nettoyage des photos a échoué, l'annonce n'a pas été supprimée : ${storageError}`,
    };
  }

  const { error } = await supabase.from("annonces").delete().eq("id", numericId);

  if (error) {
    console.error("Erreur Supabase (deleteAnnonce):", error);
    return { error: error.message };
  }

  return { error: null };
}

export async function getAnnonceById(id: string): Promise<{
  property: Property | null;
  error: string | null;
}> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { property: null, error: null };
  }

  const { data, error } = await supabase
    .from("annonces")
    .select(ANNONCE_SELECT_WITH_IMAGES)
    .eq("id", numericId)
    .maybeSingle();

  if (error) {
    return { property: null, error: error.message };
  }

  return {
    property: data ? mapAnnonceToProperty(data as AnnonceRow) : null,
    error: null,
  };
}
