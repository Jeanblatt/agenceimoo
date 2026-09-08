import { agency } from "@/config/agency";

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
// encore de conseiller assigné individuellement (modèle multi-conseillers
// prévu pour une phase ultérieure). En attendant, on affiche les
// coordonnées réelles de l'agence, lues depuis config/agency.ts, plutôt
// que d'inventer un profil fictif ou de les recopier ici.
export const defaultAgent: Agent = {
  id: "agence",
  name: `Équipe ${agency.name}`,
  phone: agency.phone,
  email: agency.email,
  role: "Conseiller immobilier",
};
