export interface Agent {
  id: string;
  name: string;
  /** URL de la photo. Laisser vide pour afficher un avatar avec initiales. */
  photo?: string;
  phone: string;
  email: string;
  role: string;
  /** Note sur 5. Laisser vide tant qu'aucune vraie note n'est disponible. */
  rating?: number;
}

// Pas de table "agents" côté Supabase pour l'instant : chaque bien n'a pas
// encore de conseiller assigné individuellement. En attendant, on affiche
// les coordonnées réelles de l'agence (déjà utilisées ailleurs sur le site,
// via lib/site.ts) plutôt que d'inventer un profil fictif.
export const defaultAgent: Agent = {
  id: "agence-horizon",
  name: "Équipe Horizon Immobilier",
  phone: "+21671234567",
  email: "contact@horizon-immo.tn",
  role: "Conseiller immobilier",
};
