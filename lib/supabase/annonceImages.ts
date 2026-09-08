import { supabase } from "@/lib/supabase/client";
import type { PropertyImage } from "@/data/properties";

// Bucket créé par supabase/migrations/0007_property_images_storage.sql :
// public en lecture, écriture réservée aux admins (policies RLS).
const BUCKET = "property-images";

export interface AnnonceImageRow {
  id: number;
  annonce_id: number;
  storage_path: string;
  alt: string | null;
  position: number;
  is_cover: boolean;
  created_at: string;
}

// Construit l'URL publique à partir du chemin stocké — jamais stockée en
// base directement (voir audit V3.2.A) pour ne pas se désynchroniser si le
// projet Supabase change un jour de domaine/région.
export function getPublicImageUrl(storagePath: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return publicUrl;
}

export function mapAnnonceImageToPropertyImage(row: AnnonceImageRow): PropertyImage {
  return {
    id: String(row.id),
    url: getPublicImageUrl(row.storage_path),
    alt: row.alt ?? undefined,
    position: row.position,
    isCover: row.is_cover,
  };
}

async function removeStorageFile(storagePath: string): Promise<{ error: string | null }> {
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  return { error: error?.message ?? null };
}

// Désactive la couverture actuelle d'une annonce, s'il y en a une. Étape
// préalable indispensable avant d'en activer une nouvelle : la contrainte
// DB (index unique partiel "au plus une is_cover=true par annonce_id")
// rejetterait sinon l'écriture avec une violation d'unicité.
async function clearCover(annonceId: number): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("annonce_images")
    .update({ is_cover: false })
    .eq("annonce_id", annonceId)
    .eq("is_cover", true);
  return { error: error?.message ?? null };
}

export async function getAnnonceImages(annonceId: string): Promise<{
  images: PropertyImage[];
  error: string | null;
}> {
  const numericId = Number(annonceId);
  if (!Number.isFinite(numericId)) {
    return { images: [], error: "Identifiant de bien invalide." };
  }

  const { data, error } = await supabase
    .from("annonce_images")
    .select("*")
    .eq("annonce_id", numericId)
    .order("position", { ascending: true });

  if (error) {
    console.error("Erreur Supabase (getAnnonceImages):", error);
    return { images: [], error: error.message };
  }

  return { images: (data as AnnonceImageRow[]).map(mapAnnonceImageToPropertyImage), error: null };
}

export interface UploadAnnonceImageOptions {
  alt?: string;
  isCover?: boolean;
  /** Par défaut : ajoutée en fin de liste (position = nombre d'images existantes). */
  position?: number;
}

// Upload réel dans property-images/{annonceId}/{nom-unique}.{extension} puis
// création de la ligne annonce_images correspondante. Le nom est unique par
// construction (horodatage + suffixe aléatoire) : jamais de collision, donc
// jamais besoin d'écraser un fichier existant.
export async function uploadAnnonceImage(
  annonceId: string,
  file: File,
  options: UploadAnnonceImageOptions = {}
): Promise<{ image: PropertyImage | null; error: string | null }> {
  const numericAnnonceId = Number(annonceId);
  if (!Number.isFinite(numericAnnonceId)) {
    return { image: null, error: "Identifiant de bien invalide." };
  }

  let position = options.position;
  if (position === undefined) {
    const { images, error } = await getAnnonceImages(annonceId);
    if (error) {
      return { image: null, error };
    }
    position = images.length;
  }

  const extension = file.name.split(".").pop() || "jpg";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const storagePath = `${numericAnnonceId}/${uniqueName}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file);

  if (uploadError) {
    console.error("Erreur Supabase (uploadAnnonceImage — upload Storage):", uploadError);
    return { image: null, error: uploadError.message };
  }

  if (options.isCover) {
    const { error: clearCoverError } = await clearCover(numericAnnonceId);
    if (clearCoverError) {
      // Le fichier est déjà sur Storage mais la ligne DB ne sera pas créée :
      // on le retire pour ne pas laisser d'orphelin.
      await removeStorageFile(storagePath);
      return { image: null, error: clearCoverError };
    }
  }

  const { data, error: insertError } = await supabase
    .from("annonce_images")
    .insert({
      annonce_id: numericAnnonceId,
      storage_path: storagePath,
      alt: options.alt || null,
      position,
      is_cover: options.isCover ?? false,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Erreur Supabase (uploadAnnonceImage — insertion DB):", insertError);
    // Upload Storage réussi mais insertion DB échouée : on nettoie le
    // fichier fraîchement uploadé pour ne pas laisser d'état incohérent.
    const { error: cleanupError } = await removeStorageFile(storagePath);
    if (cleanupError) {
      console.error(
        `Fichier orphelin dans le bucket "${BUCKET}" après échec d'insertion DB :`,
        cleanupError
      );
      return {
        image: null,
        error: `${insertError.message} (le fichier "${storagePath}" est resté orphelin dans le stockage : ${cleanupError})`,
      };
    }
    return { image: null, error: insertError.message };
  }

  return { image: mapAnnonceImageToPropertyImage(data as AnnonceImageRow), error: null };
}

// Supprime la ligne DB puis le fichier Storage correspondant. Si le fichier
// ne peut pas être retiré après coup, la ligne est déjà supprimée (l'image
// n'apparaît donc plus nulle part côté app) : le fichier devient orphelin
// dans le bucket, ce qui est documenté et signalé explicitement à l'appelant
// plutôt que masqué — aucune tâche de réconciliation automatique n'existe à
// ce stade (hors scope V3.2.C).
export async function deleteAnnonceImage(imageId: string): Promise<{ error: string | null }> {
  const numericId = Number(imageId);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant d'image invalide." };
  }

  const { data: row, error: fetchError } = await supabase
    .from("annonce_images")
    .select("storage_path")
    .eq("id", numericId)
    .maybeSingle();

  if (fetchError) {
    console.error("Erreur Supabase (deleteAnnonceImage — lecture):", fetchError);
    return { error: fetchError.message };
  }
  if (!row) {
    return { error: "Image introuvable." };
  }

  const { error: deleteError } = await supabase.from("annonce_images").delete().eq("id", numericId);

  if (deleteError) {
    console.error("Erreur Supabase (deleteAnnonceImage — suppression DB):", deleteError);
    return { error: deleteError.message };
  }

  const { error: storageError } = await removeStorageFile((row as { storage_path: string }).storage_path);
  if (storageError) {
    console.error(
      `Fichier orphelin dans le bucket "${BUCKET}" après suppression DB réussie :`,
      storageError
    );
    return {
      error: `L'image a été supprimée mais le fichier "${row.storage_path}" n'a pas pu être retiré du stockage : ${storageError}.`,
    };
  }

  return { error: null };
}

// Supprime tous les fichiers Storage d'une annonce (pas les lignes
// annonce_images elles-mêmes : laissées à la cascade SQL déclenchée par la
// suppression de la ligne annonces, voir deleteAnnonce dans annonces.ts).
// remove() accepte 0 à N chemins en un seul appel et ne renvoie pas d'erreur
// pour un chemin déjà absent — couvre nativement les cas annonce sans
// image, avec une seule, ou avec plusieurs.
export async function deleteAnnonceImageFiles(annonceId: string): Promise<{ error: string | null }> {
  const numericId = Number(annonceId);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant de bien invalide." };
  }

  const { data, error: fetchError } = await supabase
    .from("annonce_images")
    .select("storage_path")
    .eq("annonce_id", numericId);

  if (fetchError) {
    console.error("Erreur Supabase (deleteAnnonceImageFiles — lecture):", fetchError);
    return { error: fetchError.message };
  }

  const paths = ((data as { storage_path: string }[] | null) ?? []).map((row) => row.storage_path);
  if (paths.length === 0) {
    return { error: null };
  }

  const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
  if (removeError) {
    console.error(
      `Erreur Supabase (deleteAnnonceImageFiles — suppression Storage, annonce ${numericId}):`,
      removeError
    );
    return { error: removeError.message };
  }

  return { error: null };
}

// Définit une image comme couverture : désactive l'ancienne couverture puis
// active la nouvelle. Deux écritures séquentielles (PostgREST ne permet pas
// de transaction depuis le client) : si la seconde échoue après la
// première, l'annonce se retrouve temporairement sans couverture plutôt
// qu'avec deux couvertures à la fois — la contrainte DB (au plus une
// is_cover=true par annonce) reste respectée à chaque étape intermédiaire.
export async function setCoverImage(
  annonceId: string,
  imageId: string
): Promise<{ error: string | null }> {
  const numericAnnonceId = Number(annonceId);
  const numericImageId = Number(imageId);
  if (!Number.isFinite(numericAnnonceId) || !Number.isFinite(numericImageId)) {
    return { error: "Identifiant invalide." };
  }

  const { error: clearError } = await supabase
    .from("annonce_images")
    .update({ is_cover: false })
    .eq("annonce_id", numericAnnonceId)
    .neq("id", numericImageId);

  if (clearError) {
    console.error("Erreur Supabase (setCoverImage — désactivation ancienne couverture):", clearError);
    return { error: clearError.message };
  }

  const { error: setError } = await supabase
    .from("annonce_images")
    .update({ is_cover: true })
    .eq("id", numericImageId)
    .eq("annonce_id", numericAnnonceId);

  if (setError) {
    console.error("Erreur Supabase (setCoverImage — activation nouvelle couverture):", setError);
    return { error: setError.message };
  }

  return { error: null };
}

// Réordonne les images d'une annonce : position = index dans le tableau
// fourni. Les écritures sont indépendantes (pas de contrainte d'unicité sur
// position, contrairement à is_cover), donc peuvent être parallélisées.
export async function reorderAnnonceImages(
  annonceId: string,
  orderedImageIds: string[]
): Promise<{ error: string | null }> {
  const numericAnnonceId = Number(annonceId);
  if (!Number.isFinite(numericAnnonceId)) {
    return { error: "Identifiant de bien invalide." };
  }

  const results = await Promise.all(
    orderedImageIds.map((imageId, position) =>
      supabase
        .from("annonce_images")
        .update({ position })
        .eq("id", Number(imageId))
        .eq("annonce_id", numericAnnonceId)
    )
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    console.error("Erreur Supabase (reorderAnnonceImages):", failed.error);
    return { error: failed.error.message };
  }

  return { error: null };
}

export interface AnnonceImageMetadataPatch {
  alt?: string;
  position?: number;
  isCover?: boolean;
}

export async function updateAnnonceImageMetadata(
  imageId: string,
  patch: AnnonceImageMetadataPatch
): Promise<{ error: string | null }> {
  const numericId = Number(imageId);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant d'image invalide." };
  }

  if (patch.isCover) {
    const { data: row, error: fetchError } = await supabase
      .from("annonce_images")
      .select("annonce_id")
      .eq("id", numericId)
      .maybeSingle();

    if (fetchError) {
      console.error("Erreur Supabase (updateAnnonceImageMetadata — lecture):", fetchError);
      return { error: fetchError.message };
    }
    if (!row) {
      return { error: "Image introuvable." };
    }

    const { error: clearError } = await clearCover((row as { annonce_id: number }).annonce_id);
    if (clearError) {
      console.error(
        "Erreur Supabase (updateAnnonceImageMetadata — désactivation ancienne couverture):",
        clearError
      );
      return { error: clearError };
    }
  }

  const payload: Record<string, unknown> = {};
  if (patch.alt !== undefined) payload.alt = patch.alt || null;
  if (patch.position !== undefined) payload.position = patch.position;
  if (patch.isCover !== undefined) payload.is_cover = patch.isCover;

  if (Object.keys(payload).length === 0) {
    return { error: null };
  }

  const { error } = await supabase.from("annonce_images").update(payload).eq("id", numericId);

  if (error) {
    console.error("Erreur Supabase (updateAnnonceImageMetadata):", error);
    return { error: error.message };
  }

  return { error: null };
}
