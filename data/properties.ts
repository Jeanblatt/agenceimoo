export type PropertyType =
  | "Villa"
  | "Appartement"
  | "Penthouse"
  | "Terrain"
  | "Maison traditionnelle"
  | "Local commercial";

export interface Property {
  id: string;
  title: string;
  description: string;
  /** URLs des images du bien. Laisser vide en attendant les visuels IA. */
  images?: string[];
  location: string;
  price: number;
  area: number;
  bedrooms: number;
  /** Non encore renseigné côté Supabase : à câbler quand la colonne existera. */
  bathrooms?: number;
  type: PropertyType;
  featured?: boolean;
  /** Correspond à la colonne "statut" de la table annonces (ex. "Disponible"). */
  status?: string;
  /** Caractéristiques supplémentaires affichées sur la fiche détaillée. */
  features?: string[];
  /** Non encore renseignés côté Supabase : à câbler quand ces colonnes existeront. */
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}
