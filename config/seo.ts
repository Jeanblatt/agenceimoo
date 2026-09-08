/**
 * Valeurs SEO globales, indépendantes de l'identité runtime de l'agence
 * (V3.3.U). `defaultTitle`/`titleTemplate`/`defaultDescription` ne sont plus
 * ici : ils dépendaient de `config/agency.ts` de façon statique, ce qui
 * figeait le SEO sur les valeurs par défaut du template même quand une
 * agence personnalisait son identité via `agency_settings` (Supabase). Ils
 * sont désormais calculés à la demande dans `app/layout.tsx` via
 * `buildDefaultMetadata()` ci-dessous, à partir de `resolveAgencySettings()`
 * — seule source de vérité pour le nom/la description runtime (voir
 * lib/supabase/agencySettings.ts). `config/agency.ts` reste le repli utilisé
 * par `resolveAgencySettings()` elle-même quand Supabase n'a pas la donnée.
 */
export const seo = {
  /** Domaine fictif en attendant le vrai nom de domaine du client. */
  siteUrl: "https://www.horizon-immobilier.tn",
  /** Code langue pour l'attribut HTML `<html lang="...">` (app/layout.tsx). */
  language: "fr",
  /**
   * Locale complète pour la meta OpenGraph `og:locale` (app/layout.tsx).
   * Format à sous-tirets (`fr_TN`, pas `fr-TN`) : c'est le format attendu par
   * la spec OpenGraph, indépendant du format BCP 47 utilisé par `language`.
   */
  locale: "fr_TN",
  /**
   * Complète le nom d'agence (runtime) pour former le titre par défaut —
   * voir buildDefaultMetadata. Reste une chaîne de configuration, pas une
   * donnée d'identité agence : à adapter au marché ciblé par le déploiement,
   * indépendamment du nom de l'agence lui-même.
   */
  titleSuffix: "Agence Immobilière Premium en Tunisie | Villas et Appartements",
  keywords: [
    "agence immobilière Tunisie",
    "immobilier Tunis",
    "villa luxe Tunisie",
    "appartement La Marsa",
    "propriété Gammarth",
    "achat maison Hammamet",
    "immobilier de prestige Tunisie",
  ],
  /** Zone géographique ciblée par les mots-clés par défaut ci-dessus. */
  region: "Tunisie",
};

/**
 * Construit le titre/la description par défaut à partir du nom/de la
 * description runtime de l'agence (V3.3.U) — seul point qui varie d'une
 * agence à l'autre ; `titleSuffix` ci-dessus reste la seule partie figée en
 * config. Utilisé par `app/layout.tsx` (`generateMetadata`), jamais appelé
 * directement avec des valeurs statiques ailleurs, pour ne pas dupliquer
 * cette construction.
 */
export function buildDefaultMetadata(name: string, description: string) {
  return {
    defaultTitle: `${name} | ${seo.titleSuffix}`,
    titleTemplate: `%s | ${name}`,
    defaultDescription: description,
  };
}
