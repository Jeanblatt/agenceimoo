import { catalog } from "@/config/catalog";

/** Formate un prix avec la devise configurée (ex. "850000" -> "850 000 DT"). */
export function formatPrice(price: number): string {
  return `${price.toLocaleString("fr-FR")} ${catalog.currencyDisplay}`;
}
