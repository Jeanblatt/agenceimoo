"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Loader2, Star, Trash2 } from "lucide-react";
import {
  deleteAnnonceImage,
  getAnnonceImages,
  reorderAnnonceImages,
  setCoverImage,
  uploadAnnonceImage,
} from "@/lib/supabase/annonceImages";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

type GalleryItemStatus = "pending" | "uploading" | "persisted" | "error";

interface GalleryItem {
  key: string;
  url: string;
  position: number;
  isCover: boolean;
  status: GalleryItemStatus;
  file?: File;
  errorMessage?: string;
}

let tempKeySeq = 0;
function nextTempKey() {
  tempKeySeq += 1;
  return `pending-${tempKeySeq}`;
}

function revokeIfBlob(url: string) {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}

interface PropertyImageManagerProps {
  /**
   * Absent en création tant que l'annonce n'existe pas encore : les photos
   * sélectionnées restent alors en attente (aperçu local uniquement, aucun
   * appel Supabase). Dès que l'annonce est créée et qu'un id est fourni ici,
   * les photos en attente sont automatiquement uploadées.
   */
  annonceId?: string;
  /** Fallback V3.2.C (image_principale) à afficher tant qu'aucune vraie annonce_images n'existe. */
  legacyImageUrl?: string;
  /** Appelé une fois qu'un lot de photos en attente a été uploadé (succès + échecs cumulés). */
  onUploadSummary?: (summary: { succeeded: number; failed: number }) => void;
}

export default function PropertyImageManager({
  annonceId,
  legacyImageUrl,
  onUploadSummary,
}: PropertyImageManagerProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const syncFromSupabase = async (id: string) => {
    setLoading(true);
    const { images, error } = await getAnnonceImages(id);
    setLoading(false);
    if (error) {
      setListError(error);
      return;
    }
    setListError(null);
    setItems(
      images.map((image) => ({
        key: image.id,
        url: image.url,
        position: image.position,
        isCover: image.isCover,
        status: "persisted" as const,
      }))
    );
  };

  // Dès qu'un annonceId devient disponible : upload des photos encore en
  // attente (flux de création), sinon chargement des images existantes
  // (flux d'édition, dès le montage).
  useEffect(() => {
    if (!annonceId) return;
    let cancelled = false;

    (async () => {
      const pending = itemsRef.current
        .filter((item) => item.status === "pending")
        .sort((a, b) => a.position - b.position);

      if (pending.length === 0) {
        await syncFromSupabase(annonceId);
        onUploadSummary?.({ succeeded: 0, failed: 0 });
        return;
      }

      let succeeded = 0;
      let failed = 0;

      for (const item of pending) {
        if (cancelled) return;
        const alreadyHasCover = itemsRef.current.some(
          (i) => i.key !== item.key && i.isCover && i.status !== "error"
        );
        setItems((current) =>
          current.map((i) => (i.key === item.key ? { ...i, status: "uploading" as const } : i))
        );

        // Le classement d'attente (moveItem, avant que l'annonce n'existe)
        // doit se refléter dans l'ordre réel une fois uploadé : sans le
        // passer explicitement, uploadAnnonceImage recalculerait sa propre
        // position (= ordre d'upload), écrasant silencieusement le
        // classement choisi par l'admin.
        const { image, error } = await uploadAnnonceImage(annonceId, item.file!, {
          isCover: item.isCover && !alreadyHasCover,
          position: item.position,
        });

        if (cancelled) return;

        if (error || !image) {
          failed += 1;
          setItems((current) =>
            current.map((i) =>
              i.key === item.key
                ? { ...i, status: "error" as const, errorMessage: error ?? "Échec de l'upload." }
                : i
            )
          );
          continue;
        }

        succeeded += 1;
        revokeIfBlob(item.url);
        setItems((current) =>
          current.map((i) =>
            i.key === item.key
              ? {
                  key: image.id,
                  url: image.url,
                  position: image.position,
                  isCover: image.isCover,
                  status: "persisted" as const,
                }
              : i
          )
        );
      }

      onUploadSummary?.({ succeeded, failed });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annonceId]);

  // Nettoyage des URLs blob créées pour les aperçus locaux.
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => revokeIfBlob(item.url));
    };
  }, []);

  const addFiles = (fileList: FileList) => {
    const errors: string[] = [];
    const validFiles: File[] = [];

    Array.from(fileList).forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`${file.name} : format non supporté (JPG, PNG ou WEBP uniquement).`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`${file.name} : fichier trop volumineux (5 Mo maximum).`);
        return;
      }
      validFiles.push(file);
    });

    setValidationErrors(errors);
    if (validFiles.length === 0) return;

    if (!annonceId) {
      // Création : pas encore d'annonce_id, les fichiers restent en local
      // (aperçu blob) jusqu'à ce que le formulaire soit soumis.
      setItems((current) => {
        const hasCoverAlready = current.some((i) => i.isCover && i.status !== "error");
        return [
          ...current,
          ...validFiles.map((file, index) => ({
            key: nextTempKey(),
            url: URL.createObjectURL(file),
            position: current.length + index,
            isCover: !hasCoverAlready && current.length + index === 0,
            status: "pending" as const,
            file,
          })),
        ];
      });
      return;
    }

    (async () => {
      for (const file of validFiles) {
        const key = nextTempKey();
        const previewUrl = URL.createObjectURL(file);
        const isCover = !itemsRef.current.some((i) => i.isCover && i.status !== "error");

        setItems((current) => [
          ...current,
          { key, url: previewUrl, position: current.length, isCover, status: "uploading" as const, file },
        ]);

        const { image, error } = await uploadAnnonceImage(annonceId, file, { isCover });

        if (error || !image) {
          setItems((current) =>
            current.map((i) =>
              i.key === key ? { ...i, status: "error" as const, errorMessage: error ?? "Échec de l'upload." } : i
            )
          );
          continue;
        }

        revokeIfBlob(previewUrl);
        setItems((current) =>
          current.map((i) =>
            i.key === key
              ? {
                  key: image.id,
                  url: image.url,
                  position: image.position,
                  isCover: image.isCover,
                  status: "persisted" as const,
                }
              : i
          )
        );
      }
    })();
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) addFiles(files);
    event.target.value = "";
  };

  const removeItem = async (key: string) => {
    const item = items.find((i) => i.key === key);
    if (!item) return;

    if (item.status !== "persisted") {
      revokeIfBlob(item.url);
      setItems((current) => current.filter((i) => i.key !== key));
      return;
    }

    if (!annonceId) return;

    setBusyKey(key);
    const { error } = await deleteAnnonceImage(key);
    setBusyKey(null);

    if (error) {
      setListError(error);
      // La suppression DB peut avoir réussi même si une erreur est
      // retournée (échec du nettoyage Storage) : on recharge depuis
      // Supabase plutôt que de deviner l'état local.
      await syncFromSupabase(annonceId);
      return;
    }

    setListError(null);
    setItems((current) => current.filter((i) => i.key !== key));
  };

  const makeCover = async (key: string) => {
    const item = items.find((i) => i.key === key);
    if (!item || item.isCover) return;

    if (item.status !== "persisted") {
      setItems((current) => current.map((i) => ({ ...i, isCover: i.key === key })));
      return;
    }

    if (!annonceId) return;

    setBusyKey(key);
    const { error } = await setCoverImage(annonceId, key);
    setBusyKey(null);

    if (error) {
      setListError(error);
      await syncFromSupabase(annonceId);
      return;
    }

    setListError(null);
    setItems((current) => current.map((i) => ({ ...i, isCover: i.key === key })));
  };

  const moveItem = async (key: string, direction: -1 | 1) => {
    const target = items.find((i) => i.key === key);
    if (!target) return;

    if (target.status !== "persisted") {
      // Fichier encore local (aperçu ou upload en cours) : réordonnancement
      // purement local, uniquement parmi les autres éléments non persistés
      // (une image déjà enregistrée a sa position gérée côté DB).
      setItems((current) => {
        const localOnly = current.filter((i) => i.status !== "persisted");
        const index = localOnly.findIndex((i) => i.key === key);
        const swapIndex = index + direction;
        if (index < 0 || swapIndex < 0 || swapIndex >= localOnly.length) return current;
        [localOnly[index], localOnly[swapIndex]] = [localOnly[swapIndex], localOnly[index]];
        const positionByKey = new Map(localOnly.map((item, position) => [item.key, position]));
        return current.map((item) =>
          positionByKey.has(item.key) ? { ...item, position: positionByKey.get(item.key)! } : item
        );
      });
      return;
    }

    if (!annonceId) return;

    const ordered = items.filter((i) => i.status === "persisted").sort((a, b) => a.position - b.position);
    const index = ordered.findIndex((i) => i.key === key);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= ordered.length) return;
    [ordered[index], ordered[swapIndex]] = [ordered[swapIndex], ordered[index]];
    const orderedIds = ordered.map((i) => i.key);

    setBusyKey(key);
    const { error } = await reorderAnnonceImages(annonceId, orderedIds);
    setBusyKey(null);

    if (error) {
      setListError(error);
      await syncFromSupabase(annonceId);
      return;
    }

    setListError(null);
    const positionByKey = new Map(orderedIds.map((id, position) => [id, position]));
    setItems((current) =>
      current
        .map((item) => (positionByKey.has(item.key) ? { ...item, position: positionByKey.get(item.key)! } : item))
        .sort((a, b) => a.position - b.position)
    );
  };

  const sortedItems = [...items].sort((a, b) => a.position - b.position);
  const showLegacyCard = !loading && sortedItems.length === 0 && !!legacyImageUrl;

  return (
    <div>
      <span className="text-xs font-medium uppercase tracking-wider text-stone-500">Images</span>

      <label className="mt-1.5 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-stone-300 px-4 py-6 text-sm text-stone-500 transition-colors hover:border-amber-500 hover:text-amber-600">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
        Cliquez pour ajouter des photos (JPG, PNG ou WEBP, 5 Mo max par fichier)
      </label>

      {validationErrors.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-red-600">
          {validationErrors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      {listError && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{listError}</p>
      )}

      {loading && <p className="mt-3 text-xs text-stone-500">Chargement des photos...</p>}

      {showLegacyCard && legacyImageUrl && (
        <div className="mt-3">
          <div className="relative aspect-square w-24 overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200">
            {/* eslint-disable-next-line @next/next/no-img-element -- peut être un chemin relatif legacy, non garanti optimisable par next/image */}
            <img src={legacyImageUrl} alt="" className="h-full w-full object-cover" />
          </div>
          <p className="mt-1.5 text-xs text-stone-500">
            Photo actuelle (ancien système). Ajoutez une photo pour passer à la nouvelle galerie.
          </p>
        </div>
      )}

      {sortedItems.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {sortedItems.map((item, index) => {
            const isBusy = busyKey === item.key;
            return (
              <div
                key={item.key}
                className="relative aspect-square overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200"
              >
                <Image src={item.url} alt="" fill sizes="150px" className="object-cover" />

                {item.status === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-stone-950/50">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}

                {item.status === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-950/80 p-1.5 text-center">
                    <span className="text-[10px] leading-tight text-white">{item.errorMessage}</span>
                  </div>
                )}

                {item.isCover && (
                  <span className="absolute left-1 top-1 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-950">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    Couverture
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-stone-950/70 px-1 py-1">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveItem(item.key, -1)}
                      disabled={isBusy || index === 0}
                      aria-label="Déplacer vers la gauche"
                      className="flex h-6 w-6 items-center justify-center rounded text-white transition-colors hover:bg-white/20 disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5 -rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(item.key, 1)}
                      disabled={isBusy || index === sortedItems.length - 1}
                      aria-label="Déplacer vers la droite"
                      className="flex h-6 w-6 items-center justify-center rounded text-white transition-colors hover:bg-white/20 disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5 -rotate-90" />
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => makeCover(item.key)}
                      disabled={isBusy || item.isCover || item.status === "error"}
                      aria-label="Définir comme couverture"
                      className="flex h-6 w-6 items-center justify-center rounded text-white transition-colors hover:bg-white/20 disabled:opacity-30"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      disabled={isBusy}
                      aria-label="Supprimer l'image"
                      className="flex h-6 w-6 items-center justify-center rounded text-white transition-colors hover:bg-red-500/80 disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
