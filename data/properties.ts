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
  type: PropertyType;
  featured?: boolean;
  /** Caractéristiques supplémentaires affichées sur la fiche détaillée. */
  features?: string[];
}
