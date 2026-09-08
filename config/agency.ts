/**
 * Identité et coordonnées de l'agence — source de vérité unique.
 *
 * Remplace l'ancien `lib/site.ts` (`AGENCY`, `SITE_NAME`). Pour rebrander
 * le template pour un nouveau client, modifier uniquement ce fichier.
 */
export interface AgencyConfig {
  /** Nom complet, utilisé en SEO, JSON-LD et pied de page. */
  name: string;
  /** Nom court, utilisé dans le logo texte et les messages courts. */
  shortName: string;
  /** Accroche courte d'une phrase. */
  tagline: string;
  /** Description longue, utilisée par défaut pour le SEO. */
  description: string;
  /** Format international, chiffres uniquement après le "+". */
  phone: string;
  /** Format lisible pour l'affichage. */
  phoneDisplay: string;
  /** Numéro WhatsApp (format international) — peut différer du téléphone. */
  whatsapp: string;
  email: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    /** Code pays ISO 3166-1 alpha-2 (ex. "TN"). */
    country: string;
  };
  /** Horaires affichés tels quels, en texte libre. */
  hours: string;
  /** Année de création — sert à calculer les années d'expérience affichées. */
  foundedYear: number;
  socials: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  /**
   * Chemin vers un logo image (SVG/PNG), ex. "/images/brand/logo.svg".
   * `null` tant qu'aucun logo réel n'est fourni : les en-têtes affichent
   * alors `shortName` en texte stylé (voir components/ui/BrandMark.tsx).
   */
  logo: string | null;
  /**
   * Assets et couleur de marque identifiés en V3.3.F. `heroImages` et
   * `ogImage` sont raccordés depuis V3.3.J (Hero.tsx, CallToAction.tsx,
   * PropertyHero.tsx, app/layout.tsx) : modifier ces valeurs change
   * réellement le rendu. `favicon` et `accentColor` restent volontairement
   * de simples références de documentation, non consommées par le code —
   * voir le commentaire de chaque champ ci-dessous pour le détail figé en
   * V3.3.H/V3.3.K. Le logo reste sur `agency.logo` ci-dessus (déjà
   * consommé par BrandMark.tsx) plutôt que d'être dupliqué dans ce bloc.
   */
  branding: {
    /**
     * Chemin du favicon actuel — purement informatif, non lu par le code.
     * `app/favicon.ico` reste géré par la convention de fichier Next.js
     * (App Router) : un favicon personnalisé se remplace en éditant ce
     * fichier directement, pas via cette valeur. Restera un asset statique
     * du template tant qu'aucun mécanisme d'upload n'existe (hors scope
     * actuel, voir V3.3.H).
     */
    favicon: string;
    /**
     * Couleur d'accent de marque — miroir informatif de
     * `config/theme.ts` (`theme.colors.accent`) et `app/globals.css`
     * (`--color-accent`), qui restent la seule source d'exécution réelle
     * du rendu (Tailwind v4 CSS-first, voir le commentaire d'en-tête de
     * theme.ts). Changer cette valeur ici ne change rien au rendu tant
     * que globals.css n'est pas mis à jour en parallèle.
     */
    accentColor: string;
    /**
     * Images de fond des sections hero — 3 emplacements fixes, indexés
     * directement par leurs composants consommateurs (V3.3.J) :
     * [0] accueil, 1re slide (Hero.tsx) + fond du CTA final (CallToAction.tsx)
     * [1] accueil, 2e slide (Hero.tsx) + bandeau /biens (PropertyHero.tsx)
     * [2] accueil, 3e slide uniquement (Hero.tsx)
     */
    heroImages: [string, string, string];
    /** Image par défaut pour les partages Open Graph / Twitter — consommée par app/layout.tsx depuis V3.3.J. */
    ogImage: string;
  };
}

export const agency: AgencyConfig = {
  name: "Horizon Immobilier",
  shortName: "Horizon",
  tagline: "Agence immobilière premium, dédiée à la recherche de biens d'exception.",
  description:
    "Découvrez nos biens immobiliers d'exception en Tunisie : villas, appartements, penthouses et propriétés premium à Tunis, La Marsa, Gammarth, Hammamet et Sousse, sélectionnés par Horizon Immobilier.",
  phone: "+21671234567",
  phoneDisplay: "+216 71 234 567",
  whatsapp: "+21671234567",
  email: "contact@horizon-immo.tn",
  address: {
    street: "15 Avenue Habib Bourguiba",
    postalCode: "1001",
    city: "Tunis",
    country: "TN",
  },
  hours: "Lun–Ven 9h–19h · Sam 10h–17h",
  foundedYear: 2010,
  socials: {},
  logo: null,
  branding: {
    favicon: "/favicon.ico",
    accentColor: "var(--color-amber-500)",
    heroImages: ["/hero1.webp", "/hero2.webp", "/hero3.webp"],
    ogImage: "/og-image.jpg",
  },
};
