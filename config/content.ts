import { agency } from "@/config/agency";

export interface StatEntry {
  value: number;
  suffix: string;
  label: string;
}

export interface FeatureEntry {
  title: string;
  description: string;
}

export interface ServiceEntry {
  /** Clé d'icône résolue par components/Services.tsx (lucide-react n'est pas importé ici pour garder ce fichier indépendant du rendu). */
  icon: "home" | "key" | "trending-up" | "building";
  title: string;
  description: string;
}

/**
 * Contenus marketing propres à l'agence — pas les libellés génériques de
 * l'interface (ceux-ci restent dans les composants, voir
 * components/ui/*). Toutes les valeurs ci-dessous reproduisent le texte
 * actuel d'Horizon Immobilier : les déplacer ici ne change rien au rendu,
 * ça les rend simplement modifiables depuis un seul endroit.
 */
export const content = {
  hero: {
    eyebrow: "Maison Premium Immobilier",
    title: "Trouvez le bien immobilier qui correspond à votre avenir",
    subtitle:
      "Nous vous accompagnons dans l'achat, la vente et la location de biens d'exception en Tunisie.",
    ctaLabel: "Découvrir nos biens",
  },
  /** Bandeau en tête de la page /biens (components/properties/PropertyHero.tsx). */
  propertiesHero: {
    eyebrow: "Nos biens",
    title: "Découvrez nos biens immobiliers",
    subtitle:
      "Villas, appartements, maisons et locaux d'exception à l'achat comme à la location, sélectionnés partout en Tunisie.",
    imageAlt: "Intérieur design d'une propriété premium en Tunisie",
  },
  home: {
    /**
     * Fonction plutôt que chaîne figée (V3.3.U) : dépendait littéralement de
     * "Horizon" avant cette phase (identifié en V3.3.T), maintenant dérivée
     * de `agency_settings.short_name` — voir components/HomeProperties.tsx.
     * Même principe que footer.tagline/contact.intro ci-dessous.
     */
    whyUsEyebrow: (shortName: string = agency.shortName) => `Pourquoi ${shortName}`,
    whyUsTitle: "Une approche sur mesure de l'immobilier de prestige",
    features: [
      {
        title: "Expertise locale",
        description:
          "Une connaissance fine des marchés les plus prisés de Tunisie, du Grand Tunis à la côte de Hammamet et Sousse.",
      },
      {
        title: "Accompagnement sur mesure",
        description:
          "Un conseiller dédié à chaque étape, de la première visite jusqu'à la signature chez le notaire.",
      },
      {
        title: "Réseau international",
        description:
          "Une visibilité auprès d'une clientèle exigeante, en Tunisie comme à l'international.",
      },
    ] satisfies FeatureEntry[],
    propertiesEyebrow: "Sélection",
    propertiesTitle: "Nos biens d'exception",
  },
  /** Section "Nos services immobiliers" (components/Services.tsx). Déplacé ici depuis Services.tsx en V3.3.G — identifié en V3.3.F comme seul bloc de contenu marketing resté hors de config/content.ts. */
  services: {
    eyebrow: "Ce que nous proposons",
    title: "Nos services immobiliers",
    description:
      "Un accompagnement sur mesure à chaque étape de votre projet, de la première visite à la gestion long terme de votre patrimoine.",
    items: [
      {
        icon: "home",
        title: "Achat immobilier",
        description:
          "Nous vous accompagnons dans la recherche et l'acquisition de votre bien idéal.",
      },
      {
        icon: "key",
        title: "Location immobilière",
        description:
          "Des solutions adaptées pour trouver rapidement un logement ou un local.",
      },
      {
        icon: "trending-up",
        title: "Investissement immobilier",
        description:
          "Des conseils personnalisés pour optimiser vos projets d'investissement.",
      },
      {
        icon: "building",
        title: "Gestion immobilière",
        description:
          "Une gestion complète de vos biens avec un suivi professionnel.",
      },
    ] satisfies ServiceEntry[],
  },
  /** Exemples de saisie affichés en placeholder — pas de la logique métier. */
  placeholders: {
    /** Champ "Localisation" du formulaire admin (components/admin/PropertyForm.tsx). */
    propertyLocation: "Tunis, Tunisie",
    /** Champ "Localisation" du formulaire de recherche (components/PropertySearch.tsx). */
    searchLocation: "Tunis, Sousse, Hammamet...",
  },
  callToAction: {
    title: "Votre projet immobilier commence maintenant",
    subtitle:
      "Notre équipe d'experts est disponible pour vous accompagner dans toutes vos démarches.",
  },
  footer: {
    /**
     * Fonction plutôt que chaîne figée : `foundedYear` peut venir de
     * agency_settings (Supabase, runtime) via resolveAgencySettings — voir
     * components/Footer.tsx. Le paramètre par défaut couvre les appelants
     * qui n'ont pas encore résolu de valeur runtime.
     */
    tagline: (foundedYear: number = agency.foundedYear) =>
      `Agence immobilière premium, dédiée à la recherche de biens d'exception depuis ${foundedYear}.`,
  },
  contact: {
    /** Même principe que footer.tagline ci-dessus — voir app/contact/page.tsx. */
    intro: (name: string = agency.name, foundedYear: number = agency.foundedYear) =>
      `Depuis ${foundedYear}, ${name} accompagne une clientèle exigeante dans l'achat, la vente et l'estimation de biens d'exception partout en Tunisie. Chaque demande est suivie par un conseiller dédié, du premier échange jusqu'à la signature.`,
    /**
     * Reste une chaîne figée (pas une fonction) : consommée par
     * `export const metadata` dans app/contact/page.tsx, évaluée au chargement
     * du module — donc toujours depuis config/agency.ts, jamais depuis
     * agency_settings. Rendre le <head> runtime forcerait next/metadata à
     * rendre dynamiquement toutes les routes du layout racine ; décision
     * documentée dans le rapport V3.3.R plutôt qu'appliquée à l'aveugle.
     */
    metaDescription: `Contactez ${agency.name} pour organiser une visite, demander une estimation ou obtenir des renseignements sur nos biens d'exception.`,
  },
  /**
   * Statistiques de confiance affichées sur l'accueil, EN PLUS des
   * statistiques calculées automatiquement (années d'expérience, biens
   * disponibles — voir components/Stats.tsx). Tableau vide accepté : la
   * section s'adapte au nombre d'entrées réellement fournies.
   *
   * Ne pas remplir avec des chiffres non vérifiables : un client peut
   * ajouter ici ses propres statistiques (ex. "clients satisfaits") s'il
   * peut les justifier, mais aucune valeur par défaut n'est fournie tant
   * qu'aucune source réelle n'existe.
   */
  stats: [] satisfies StatEntry[],
};
