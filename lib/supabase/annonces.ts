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
