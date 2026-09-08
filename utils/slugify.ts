/**
 * Convertit un titre en slug URL-safe (ex. "Villa Moderne a Hammamet" ->
 * "villa-moderne-a-hammamet") -- V3.3.V. Purement une suggestion cote
 * formulaire admin (voir PropertyForm.tsx) : le champ reste editable, et
 * l'unicite reelle est garantie par l'index unique partiel `slug` en base
 * (migration 0014), pas par cette fonction -- une collision est simplement
 * remontee comme erreur d'enregistrement, sans suffixe automatique.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
