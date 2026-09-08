export type PropertyType =
  | "Villa"
  | "Appartement"
  | "Penthouse"
  | "Terrain"
  | "Maison traditionnelle"
  | "Local commercial";

/**
 * Identifiant technique stable d'un statut de bien — jamais affiché tel
 * quel (voir `config/catalog.ts` pour le label correspondant, configurable
 * par agence). Ne pas confondre avec le libellé stocké côté Supabase
 * (colonne `statut`, ex. "Disponible") : la conversion label ↔ id se fait
 * exclusivement dans lib/supabase/annonces.ts.
 */
export type PropertyStatus = "available" | "reserved" | "sold";

export interface PropertyStatusOption {
  id: PropertyStatus;
  label: string;
}

/**
 * Identifiant technique stable du type de transaction — même principe que
 * PropertyStatus : jamais affiché tel quel (voir config/catalog.ts pour le
 * label). Le libellé stocké côté Supabase (colonne `transaction`, ex.
 * "Vente") est converti exclusivement dans lib/supabase/annonces.ts (V3.3.V).
 */
export type TransactionType = "sale" | "rent";

export interface TransactionTypeOption {
  id: TransactionType;
  label: string;
}

export interface PropertyImage {
  id: string;
  /** URL publique (Supabase Storage) ou chemin relatif (legacy image_principale). */
  url: string;
  alt?: string;
  position: number;
  isCover: boolean;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  /** Images du bien, triées par position. Laisser vide en attendant les visuels. */
  images?: PropertyImage[];
  location: string;
  price: number;
  area: number;
  bedrooms: number;
  /** Renseigné côté Supabase depuis V3.3.V (colonne bathrooms, nullable). */
  bathrooms?: number;
  type: PropertyType;
  /** Renseigné côté Supabase depuis V3.3.V (colonne featured, false par défaut). */
  featured?: boolean;
  /** Identifiant technique stable (ex. "available") — voir PropertyStatus. */
  status?: PropertyStatus;
  /** Caractéristiques supplémentaires affichées sur la fiche détaillée. Renseigné côté Supabase depuis V3.3.V (colonne features, nullable). */
  features?: string[];
  /** Renseignés côté Supabase depuis V3.3.V (colonnes city/address/latitude/longitude, toutes nullables). */
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  /** Identifiant technique stable (ex. "sale") — voir TransactionType. Renseigné côté Supabase depuis V3.3.V (colonne transaction, nullable : absent pour les annonces créées avant cette phase). */
  transaction?: TransactionType;
  /**
   * URL-safe, unique quand renseigné (colonne `slug`, V3.3.V) — préparé pour
   * une future route /properties/<slug>, mais /properties/[id] reste l'URL
   * canonique tant que cette migration de routage n'a pas été traitée dans
   * une phase dédiée (voir le rapport V3.3.V, section Slug).
   */
  slug?: string;
}
