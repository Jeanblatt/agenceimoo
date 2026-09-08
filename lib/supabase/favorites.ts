import { supabase } from "@/lib/supabase/client";
import { mapAnnonceToProperty, type AnnonceRow } from "@/lib/supabase/annonces";
import type { Property } from "@/data/properties";

interface FavoriteRow {
  property_id: number;
}

// Utilisé par FavoriteButton pour savoir si un bien donné est déjà en
// favori, sans avoir à charger les biens complets.
export async function getMyFavoriteIds(): Promise<{
  ids: string[];
  error: string | null;
}> {
  const { data, error } = await supabase.from("favorites").select("property_id");

  if (error) {
    return { ids: [], error: error.message };
  }

  return { ids: (data as FavoriteRow[]).map((row) => String(row.property_id)), error: null };
}

// Utilisé par l'espace client (onglet Favoris) : jointure vers "annonces"
// pour afficher les biens complets via PropertyGrid.
export async function getMyFavoriteProperties(): Promise<{
  properties: Property[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("favorites")
    .select("annonces(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return { properties: [], error: error.message };
  }

  const rows = data as unknown as { annonces: AnnonceRow | null }[];
  const properties = rows
    .map((row) => row.annonces)
    .filter((row): row is AnnonceRow => row !== null)
    .map(mapAnnonceToProperty);

  return { properties, error: null };
}

export async function addFavorite(propertyId: string): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté." };
  }

  const numericPropertyId = Number(propertyId);
  if (!Number.isFinite(numericPropertyId)) {
    return { error: "Bien introuvable." };
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, property_id: numericPropertyId });

  if (error) {
    console.error("Erreur Supabase (addFavorite):", error);
    return { error: error.message };
  }

  return { error: null };
}

export async function removeFavorite(propertyId: string): Promise<{ error: string | null }> {
  const numericPropertyId = Number(propertyId);
  if (!Number.isFinite(numericPropertyId)) {
    return { error: "Bien introuvable." };
  }

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("property_id", numericPropertyId);

  if (error) {
    console.error("Erreur Supabase (removeFavorite):", error);
    return { error: error.message };
  }

  return { error: null };
}
