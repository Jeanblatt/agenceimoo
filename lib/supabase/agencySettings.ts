import { cache } from "react";
import { supabase } from "@/lib/supabase/client";
import { agency } from "@/config/agency";

// Ligne singleton créée par supabase/migrations/0009_agency_settings.sql :
// "1 déploiement = 1 agence" → une seule ligne, id fixe.
const SETTINGS_ROW_ID = 1;

// Toutes les colonnes runtime existantes (0009 réseaux sociaux + 0010
// identité/contact). Une seule requête pour tout résoudre en un appel —
// voir resolveAgencySettings — plutôt qu'une requête par catégorie.
interface AgencySettingsRow {
  social_facebook: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  name: string | null;
  short_name: string | null;
  tagline: string | null;
  description: string | null;
  phone: string | null;
  phone_display: string | null;
  whatsapp: string | null;
  email: string | null;
  address_street: string | null;
  address_postal_code: string | null;
  address_city: string | null;
  address_country: string | null;
  hours: string | null;
  founded_year: number | null;
  hero_media_type: string | null;
}

const SETTINGS_COLUMNS =
  "social_facebook, social_instagram, social_linkedin, name, short_name, tagline, description, phone, phone_display, whatsapp, email, address_street, address_postal_code, address_city, address_country, hours, founded_year, hero_media_type";

/** Même forme que agency.socials (config/agency.ts) — voir resolveAgencySocials. */
export interface AgencySocials {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
}

/**
 * Identité + coordonnées + réseaux résolus — même forme que les champs
 * correspondants de AgencyConfig (config/agency.ts), pour que les
 * composants consommateurs n'aient pas à distinguer valeur runtime et
 * valeur de repli.
 */
export interface AgencySettings {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  phone: string;
  phoneDisplay: string;
  whatsapp: string;
  email: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  hours: string;
  foundedYear: number;
  socials: AgencySocials;
  /**
   * Type de média actif pour le Hero principal (V3.3.V.2) — pas de repli
   * config/agency.ts pour ce champ (il n'a pas d'équivalent statique) :
   * NULL ou toute valeur invalide en base normalisent silencieusement sur
   * "image", voir toAgencySettings ci-dessous.
   */
  heroMediaType: "image" | "video";
}

function toHeroMediaType(value: string | null | undefined): "image" | "video" {
  return value === "video" ? "video" : "image";
}

function toAgencySocials(row: AgencySettingsRow | null): AgencySocials {
  return {
    facebook: row?.social_facebook || agency.socials.facebook,
    instagram: row?.social_instagram || agency.socials.instagram,
    linkedin: row?.social_linkedin || agency.socials.linkedin,
  };
}

function toAgencySettings(row: AgencySettingsRow | null): AgencySettings {
  return {
    name: row?.name || agency.name,
    shortName: row?.short_name || agency.shortName,
    tagline: row?.tagline || agency.tagline,
    description: row?.description || agency.description,
    phone: row?.phone || agency.phone,
    phoneDisplay: row?.phone_display || agency.phoneDisplay,
    whatsapp: row?.whatsapp || agency.whatsapp,
    email: row?.email || agency.email,
    address: {
      street: row?.address_street || agency.address.street,
      postalCode: row?.address_postal_code || agency.address.postalCode,
      city: row?.address_city || agency.address.city,
      country: row?.address_country || agency.address.country,
    },
    hours: row?.hours || agency.hours,
    foundedYear: row?.founded_year ?? agency.foundedYear,
    socials: toAgencySocials(row),
    heroMediaType: toHeroMediaType(row?.hero_media_type),
  };
}

/**
 * Requête brute + mapping, partagée par resolveAgencySettings (site public,
 * mémoïsée) et getAgencySettings (admin, non mémoïsée — voir plus bas
 * pourquoi les deux ne peuvent pas partager le même wrapper `cache()`).
 * Tolérant par construction : ligne absente, champ NULL/vide, table pas
 * encore migrée ou erreur réseau retombent tous silencieusement sur
 * config/agency.ts côté `settings` — mais l'erreur brute est renvoyée en
 * plus, pour les appelants qui doivent la distinguer (admin).
 */
async function fetchAgencySettings(): Promise<{ settings: AgencySettings; error: string | null }> {
  const { data, error } = await supabase
    .from("agency_settings")
    .select(SETTINGS_COLUMNS)
    .eq("id", SETTINGS_ROW_ID)
    .maybeSingle();

  if (error) {
    return { settings: toAgencySettings(null), error: error.message };
  }

  return { settings: toAgencySettings(data as AgencySettingsRow | null), error: null };
}

/**
 * Résout l'identité, les coordonnées et les réseaux sociaux de l'agence :
 * valeur runtime (table agency_settings) si renseignée champ par champ,
 * sinon repli sur config/agency.ts — jamais les deux sources actives pour
 * un même champ (décision figée en V3.3.P, étendue en V3.3.R aux colonnes
 * identité/contact ajoutées par la migration 0010).
 *
 * Une seule requête Supabase pour l'ensemble des champs : à utiliser dès
 * qu'un composant a besoin de plus d'une catégorie (ex. Footer), plutôt que
 * d'empiler plusieurs résolutions.
 *
 * Tolérant par construction : ligne absente, champ NULL/vide, table pas
 * encore migrée ou erreur réseau retombent tous silencieusement sur
 * config/agency.ts plutôt que de propager une erreur — un problème Supabase
 * ne doit jamais casser l'affichage du Footer/Contact.
 *
 * Enveloppé dans React `cache()` (V3.3.R.1) : plusieurs Server Components
 * indépendants d'une même page (ex. NavbarServer + Footer) appellent chacun
 * cette fonction sans se connaître, `cache()` déduplique automatiquement en
 * une seule requête réseau par rendu — pas de prop-drilling nécessaire entre
 * composants non liés, et pas de risque de multiplier les appels Supabase.
 *
 * Réservé aux Server Components (site public) : `cache()` n'est défini que
 * pour ce contexte (mémoïsation par rendu serveur). Le dashboard admin
 * (V3.3.S), entièrement Client Component comme le reste de /admin, utilise
 * getAgencySettings ci-dessous plutôt que cette fonction.
 */
export const resolveAgencySettings = cache(async (): Promise<AgencySettings> => {
  const { settings, error } = await fetchAgencySettings();
  if (error) {
    console.error("Erreur Supabase (resolveAgencySettings) — repli sur config/agency.ts:", error);
  }
  return settings;
});

/**
 * Sous-ensemble socials de resolveAgencySettings, pour un appelant qui n'a
 * besoin que des réseaux sociaux (comportement inchangé depuis V3.3.Q).
 */
export async function resolveAgencySocials(): Promise<AgencySocials> {
  const settings = await resolveAgencySettings();
  return settings.socials;
}

/**
 * Lecture pour le dashboard admin (V3.3.S) : même mapping et même repli que
 * resolveAgencySettings, mais SANS `cache()` (non applicable hors Server
 * Component — /admin est un Client Component, comme PropertyTable/
 * ReviewsTable/etc.) et en renvoyant l'erreur brute plutôt que de
 * seulement la logger. Le formulaire s'en sert pour distinguer « aucune
 * valeur runtime saisie, valeurs de config/agency.ts affichées » (normal,
 * error === null) de « la table agency_settings est inaccessible »
 * (error renseigné) — dans les deux cas `settings` reste utilisable pour
 * pré-remplir le formulaire.
 */
export async function getAgencySettings(): Promise<{ settings: AgencySettings; error: string | null }> {
  return fetchAgencySettings();
}

export interface AgencySettingsPayload {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  phone: string;
  phoneDisplay: string;
  whatsapp: string;
  email: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  hours: string;
  /** `null` = champ laissé vide dans le formulaire, repli sur config/agency.ts à la lecture. */
  foundedYear: number | null;
  socials: AgencySocials;
  heroMediaType: "image" | "video";
}

function blank(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Écrit la ligne singleton (id fixe, voir SETTINGS_ROW_ID) — upsert plutôt
 * qu'update : fonctionne aussi bien si la ligne insérée par la migration
 * 0009 existe déjà (cas normal) que si elle a été supprimée entre-temps,
 * sans distinguer les deux cas côté appelant (option A du rapport V3.3.S :
 * la première sauvegarde crée la ligne si nécessaire). Un champ vide est
 * stocké NULL, pas `""` — cohérent avec le repli `row?.field || agency.field`
 * de toAgencySettings, et avec la ligne seed de la migration 0009.
 *
 * Protégée uniquement par les policies RLS existantes (migration 0009,
 * "agency_settings: admin insert/update" — profiles.role = 'admin') :
 * aucune vérification de rôle dupliquée ici, comme le reste des mutations
 * admin du projet (voir updateAnnonce, approveReview...).
 */
export async function updateAgencySettings(
  payload: AgencySettingsPayload
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("agency_settings")
    .upsert(
      {
        id: SETTINGS_ROW_ID,
        name: blank(payload.name),
        short_name: blank(payload.shortName),
        tagline: blank(payload.tagline),
        description: blank(payload.description),
        phone: blank(payload.phone),
        phone_display: blank(payload.phoneDisplay),
        whatsapp: blank(payload.whatsapp),
        email: blank(payload.email),
        address_street: blank(payload.address.street),
        address_postal_code: blank(payload.address.postalCode),
        address_city: blank(payload.address.city),
        address_country: blank(payload.address.country),
        hours: blank(payload.hours),
        founded_year: payload.foundedYear,
        hero_media_type: payload.heroMediaType,
        social_facebook: payload.socials.facebook ? blank(payload.socials.facebook) : null,
        social_instagram: payload.socials.instagram ? blank(payload.socials.instagram) : null,
        social_linkedin: payload.socials.linkedin ? blank(payload.socials.linkedin) : null,
      },
      { onConflict: "id" }
    );

  if (error) {
    console.error("Erreur Supabase (updateAgencySettings):", error);
    return { error: error.message };
  }

  return { error: null };
}
