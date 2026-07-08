// Domaine fictif en attendant le vrai nom de domaine du client.
export const SITE_URL = "https://www.horizon-immobilier.tn";
export const SITE_NAME = "Horizon Immobilier";

export const DEFAULT_TITLE =
  "Horizon Immobilier | Agence Immobilière Premium en Tunisie | Villas et Appartements";

export const DEFAULT_DESCRIPTION =
  "Découvrez nos biens immobiliers d'exception en Tunisie : villas, appartements, penthouses et propriétés premium à Tunis, La Marsa, Gammarth, Hammamet et Sousse, sélectionnés par Horizon Immobilier.";

export const DEFAULT_KEYWORDS = [
  "agence immobilière Tunisie",
  "immobilier Tunis",
  "villa luxe Tunisie",
  "appartement La Marsa",
  "propriété Gammarth",
  "achat maison Hammamet",
  "immobilier de prestige Tunisie",
];

export const AGENCY = {
  name: SITE_NAME,
  telephone: "+21671234567",
  /** Format lisible pour l'affichage (le format wa.me utilise `telephone` tel quel). */
  telephoneDisplay: "+216 71 234 567",
  email: "contact@horizon-immo.tn",
  address: {
    streetAddress: "15 Avenue Habib Bourguiba",
    addressLocality: "Tunis",
    postalCode: "1001",
    addressCountry: "TN",
  },
};
