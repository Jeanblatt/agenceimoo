import type {
  PropertyStatus,
  PropertyStatusOption,
  PropertyType,
  TransactionType,
  TransactionTypeOption,
} from "@/data/properties";

/**
 * Paramètres du catalogue immobilier qui peuvent varier selon le client
 * (devise, types de biens proposés, statuts). Les biens eux-mêmes restent
 * des données Supabase — ceci ne couvre que les listes de référence
 * utilisées par les formulaires et les filtres.
 *
 * `propertyStatuses` sépare `id` (identifiant technique stable, jamais
 * modifié) de `label` (texte affiché, personnalisable par agence — voir
 * V3.3.D/E). La conversion avec la colonne Supabase `statut` (qui stocke le
 * label, ex. "Vendu") se fait exclusivement dans lib/supabase/annonces.ts.
 */
export const catalog = {
  /** Code ISO 4217, pour un usage programmatique éventuel (ex. Intl.NumberFormat). */
  currency: "TND",
  /** Abréviation réellement affichée dans les prix (ex. "850 000 DT") — voir utils/formatPrice.ts. */
  currencyDisplay: "DT",
  propertyTypes: [
    "Villa",
    "Appartement",
    "Penthouse",
    "Terrain",
    "Maison traditionnelle",
    "Local commercial",
  ] satisfies PropertyType[],
  propertyStatuses: [
    { id: "available", label: "Disponible" },
    { id: "reserved", label: "Réservé" },
    { id: "sold", label: "Vendu" },
  ] satisfies PropertyStatusOption[],
  /**
   * Vente/Location (V3.3.V) — même principe que propertyStatuses : `id`
   * technique stable, `label` affiché et personnalisable. La colonne
   * Supabase `transaction` stocke le label (ex. "Vente"), converti
   * exclusivement dans lib/supabase/annonces.ts.
   */
  transactionTypes: [
    { id: "sale", label: "Vente" },
    { id: "rent", label: "Location" },
  ] satisfies TransactionTypeOption[],
};

/** Résout le label affiché pour un statut technique (ex. "available" -> "Disponible"). */
export function getPropertyStatusLabel(id: PropertyStatus | undefined): string | undefined {
  return catalog.propertyStatuses.find((status) => status.id === id)?.label;
}

/** Résout le label affiché pour un type de transaction technique (ex. "sale" -> "Vente"). */
export function getTransactionLabel(id: TransactionType | undefined): string | undefined {
  return catalog.transactionTypes.find((transaction) => transaction.id === id)?.label;
}
