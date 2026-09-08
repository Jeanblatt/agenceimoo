/**
 * Miroir documenté des tokens de design définis dans `app/globals.css`
 * (bloc `@theme inline`, lignes 3-27).
 *
 * IMPORTANT : ce fichier ne pilote PAS le rendu. Tailwind v4 est
 * "CSS-first" — les classes utilitaires (`bg-accent`, `text-ink`, etc.)
 * sont générées directement depuis les variables CSS de `globals.css`,
 * qui reste la seule source d'exécution. Construire un pont automatique
 * TypeScript → CSS demanderait soit une étape de build supplémentaire,
 * soit une nouvelle dépendance — hors périmètre "pas de sur-abstraction"
 * de la V3.1.
 *
 * Ce fichier sert de référence unique et lisible pour un rebranding
 * visuel : en changeant une valeur ici, reporter le même changement dans
 * `app/globals.css` (lignes 3-27) pour qu'il s'applique réellement au
 * rendu. Les deux fichiers doivent rester synchronisés manuellement.
 *
 * `config/agency.ts` (`agency.branding.accentColor`) tient un troisième
 * miroir purement informatif de `colors.accent` ci-dessous, en attendant
 * qu'un futur système de branding (V3.3.J+, voir la feuille de route
 * figée en V3.3.H) pilote réellement ce fichier et globals.css depuis
 * une seule valeur.
 */
export const theme = {
  colors: {
    /** Couleur d'accent de marque (boutons, liens, badges). */
    accent: "var(--color-amber-500)",
    accentStrong: "var(--color-amber-600)",
    accentInk: "var(--color-stone-950)",
    ink: "var(--color-stone-950)",
    charcoal: "var(--color-stone-900)",
    surface: "var(--color-white)",
    surfaceMuted: "var(--color-stone-50)",
    border: "var(--color-stone-200)",
    borderSubtle: "var(--color-stone-100)",
  },
  radius: {
    card: "1rem",
    field: "0.75rem",
  },
} as const;
