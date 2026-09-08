"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useSession } from "@/lib/supabase/auth";
import { addFavorite, getMyFavoriteIds, removeFavorite } from "@/lib/supabase/favorites";
import IconButton from "@/components/ui/IconButton";

interface FavoriteButtonProps {
  propertyId: string;
  className?: string;
}

// Non connecté : le clic renvoie vers /compte plutôt que d'échouer
// silencieusement (la policy RLS "favorites: insert own" refuserait de
// toute façon l'insertion pour un rôle anon).
export default function FavoriteButton({ propertyId, className }: FavoriteButtonProps) {
  const router = useRouter();
  const session = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!session) {
        if (!cancelled) setIsFavorite(false);
        return;
      }
      const { ids } = await getMyFavoriteIds();
      if (!cancelled) setIsFavorite(ids.includes(propertyId));
    })();

    return () => {
      cancelled = true;
    };
  }, [session, propertyId]);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!session) {
      router.push("/compte");
      return;
    }

    if (pending) return;
    setPending(true);

    const next = !isFavorite;
    setIsFavorite(next);
    const { error } = next ? await addFavorite(propertyId) : await removeFavorite(propertyId);
    if (error) {
      console.error("Erreur favoris :", error);
      setIsFavorite(!next);
    }

    setPending(false);
  };

  return (
    <IconButton
      onClick={handleClick}
      aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={isFavorite}
      className={className}
    >
      <Heart className={`h-4 w-4 ${isFavorite ? "fill-amber-500 text-amber-500" : ""}`} />
    </IconButton>
  );
}
