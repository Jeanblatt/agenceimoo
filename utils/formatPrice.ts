/** Formate un prix en dinars tunisiens ("850000" -> "850 000 DT"). */
export function formatPrice(price: number): string {
  return `${price.toLocaleString("fr-FR")} DT`;
}
