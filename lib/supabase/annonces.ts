import { supabase } from "@/lib/supabase/client";
import type { Property } from "@/data/properties";

interface AnnonceRow {
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
}

function mapAnnonceToProperty(row: AnnonceRow): Property {
  return {
    id: String(row.id),
    title: row.Title ?? "",
    description: row.Description ?? "",
    location: row.localisation ?? "",
    price: row.prix ?? 0,
    area: row.surface ?? 0,
    bedrooms: row.chambres ?? 0,
    type: (row.type ?? "") as Property["type"],
    images: row.image_principale ? [row.image_principale] : undefined,
    status: row.statut ?? undefined,
  };
}

export interface AnnoncePayload {
  title: string;
  description: string;
  location: string;
  type: string;
  price: number;
  surface: number;
  bedrooms: number;
  status: string;
  image?: string;
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
    statut: payload.status,
    image_principale: payload.image || null,
  };
}

export async function getAnnonces(): Promise<{
  properties: Property[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("annonces")
    .select("*")
    .order("created_at", { ascending: false });

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
}

export async function searchAnnonces(filters: AnnonceSearchFilters): Promise<{
  properties: Property[];
  error: string | null;
}> {
  let query = supabase.from("annonces").select("*");

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

  const { data, error } = await query.order("created_at", { ascending: false });

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
    .select("*")
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
