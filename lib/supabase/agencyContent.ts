import { cache } from "react";
import { supabase } from "@/lib/supabase/client";
import { content } from "@/config/content";

// Ligne singleton créée par supabase/migrations/0015_agency_content.sql —
// même convention que agency_settings (lib/supabase/agencySettings.ts) :
// "1 déploiement = 1 agence" → une seule ligne, id fixe.
const CONTENT_ROW_ID = 1;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Formes "résolues" — toujours entièrement utilisables par le frontend une
 * fois passées par resolveAgencyContent() (chaque champ garanti non-vide,
 * soit depuis Supabase, soit depuis le repli config/content.ts). Les champs
 * restent optionnels dans le TYPE (même contrat que demandé pour les formes
 * JSONB brutes) parce que ce sont aussi les types utilisés pour lire le
 * contenu NON validé renvoyé par getAgencyContent() — voir plus bas.
 */
export interface HeroContent {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface WhyUsFeature {
  title?: string;
  description?: string;
}

export interface WhyUsContent {
  eyebrow?: string;
  title?: string;
  features?: WhyUsFeature[];
}

/** Clés d'icône réellement supportées par components/Services.tsx (SERVICE_ICONS) — jamais une icône libre. */
export type ServiceIconKey = "home" | "key" | "trending-up" | "building";

export interface ServiceItem {
  icon?: ServiceIconKey;
  title?: string;
  description?: string;
}

export interface ServicesContent {
  eyebrow?: string;
  title?: string;
  description?: string;
  items?: ServiceItem[];
}

export interface CTAButton {
  label?: string;
  href?: string;
}

export interface CTAContent {
  title?: string;
  subtitle?: string;
  primaryCta?: CTAButton;
  secondaryCta?: CTAButton;
}

/**
 * Formes RÉSOLUES (V3.3.W.5) — contrairement aux formes ci-dessus (qui
 * doivent rester optionnelles pour représenter fidèlement un JSONB brut, pas
 * encore validé), le retour de resolveAgencyContent() garantit chaque champ
 * réellement présent (soit la valeur Supabase, soit le repli
 * config/content.ts — jamais `undefined`). Distinguer les deux évite
 * d'introduire un repli supplémentaire dans les composants publics
 * (Hero.tsx, WhyUs.tsx, Services.tsx, CallToAction.tsx) : ils reçoivent des
 * chaînes garanties, exploitables directement (ex. `<Button href={hero.ctaHref}>`,
 * qui exige un `string`, pas un `string | undefined`).
 */
export interface ResolvedWhyUsFeature {
  title: string;
  description: string;
}

export interface ResolvedServiceItem {
  icon: ServiceIconKey;
  title: string;
  description: string;
}

export interface ResolvedCTAButton {
  label: string;
  href: string;
}

export interface AgencyContent {
  hero: Required<HeroContent>;
  whyUs: { eyebrow: string; title: string; features: ResolvedWhyUsFeature[] };
  services: { eyebrow: string; title: string; description: string; items: ResolvedServiceItem[] };
  cta: { title: string; subtitle: string; primaryCta: ResolvedCTAButton; secondaryCta: ResolvedCTAButton };
}

/** Forme brute de la ligne Supabase — les 4 colonnes JSONB sont `unknown` : Supabase ne garantit rien sur leur contenu, voir la validation ci-dessous. */
interface AgencyContentRow {
  id: number;
  hero: unknown;
  why_us: unknown;
  services: unknown;
  cta: unknown;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Constantes de repli qui n'existent pas dans config/content.ts
// ---------------------------------------------------------------------------
//
// content.ts ne porte que du texte, jamais de liens : le lien du bouton Hero
// (Hero.tsx, `<Button href="#biens">`) et les libellés/liens des 2 boutons du
// CTA final (CallToAction.tsx, "Nous contacter" -> /contact, "Voir nos
// biens" -> /biens) sont aujourd'hui codés en dur directement dans le JSX de
// ces composants, pas dans config/content.ts. Ce ne sont PAS de nouvelles
// valeurs inventées pour cette phase : ce sont les valeurs réellement en
// production aujourd'hui, simplement recopiées ici à l'identique pour que
// resolveAgencyContent() puisse retourner un objet complet sans que le
// frontend futur (V3.3.W.5) ait à connaître de repli supplémentaire. Si ces
// valeurs venaient à changer dans Hero.tsx/CallToAction.tsx sans mise à jour
// ici, seul le comportement DE REPLI (agence n'ayant rien configuré) serait
// affecté — jamais le contenu configuré par une agence.
const HERO_CTA_HREF_FALLBACK = "#biens";
const CTA_PRIMARY_LABEL_FALLBACK = "Nous contacter";
const CTA_PRIMARY_HREF_FALLBACK = "/contact";
const CTA_SECONDARY_LABEL_FALLBACK = "Voir nos biens";
const CTA_SECONDARY_HREF_FALLBACK = "/biens";

const WHY_US_FEATURE_COUNT = 3;
const SERVICE_ITEM_COUNT = 4;
const SERVICE_ICON_KEYS: ServiceIconKey[] = ["home", "key", "trending-up", "building"];

// ---------------------------------------------------------------------------
// Validation — ne jamais faire confiance à la forme du JSONB retourné par
// Supabase (section 6 du ticket) : chaque helper renvoie `undefined` dès que
// la donnée n'a pas la forme attendue, laissant l'appelant retomber sur le
// repli plutôt que de propager une valeur à moitié correcte.
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Chaîne non vide uniquement — une chaîne vide ("") est traitée comme absente, pas comme une valeur voulue. */
function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function isValidWhyUsFeature(value: unknown): value is { title: string; description: string } {
  return (
    isRecord(value) &&
    asNonEmptyString(value.title) !== undefined &&
    asNonEmptyString(value.description) !== undefined
  );
}

function isValidServiceIcon(value: unknown): value is ServiceIconKey {
  return typeof value === "string" && (SERVICE_ICON_KEYS as string[]).includes(value);
}

function isValidServiceItem(value: unknown): value is { icon: ServiceIconKey; title: string; description: string } {
  return (
    isRecord(value) &&
    isValidServiceIcon(value.icon) &&
    asNonEmptyString(value.title) !== undefined &&
    asNonEmptyString(value.description) !== undefined
  );
}

// ---------------------------------------------------------------------------
// Résolution section par section
// ---------------------------------------------------------------------------

// Exportées (V3.3.W.4) pour être réutilisées telles quelles par
// AgencyContentForm.tsx lors du préremplissage du formulaire admin — même
// logique de repli exactement que celle qui alimente le site public via
// resolveAgencyContent, jamais une deuxième implémentation divergente.

// Hero / CTA : repli champ par champ (section 4/10 du ticket) — un champ
// DB manquant ou invalide retombe individuellement sur sa valeur statique,
// sans invalider les autres champs déjà correctement renseignés.
export function resolveHero(raw: unknown): Required<HeroContent> {
  const row = isRecord(raw) ? raw : {};
  return {
    eyebrow: asNonEmptyString(row.eyebrow) ?? content.hero.eyebrow,
    title: asNonEmptyString(row.title) ?? content.hero.title,
    subtitle: asNonEmptyString(row.subtitle) ?? content.hero.subtitle,
    ctaLabel: asNonEmptyString(row.ctaLabel) ?? content.hero.ctaLabel,
    ctaHref: asNonEmptyString(row.ctaHref) ?? HERO_CTA_HREF_FALLBACK,
  };
}

// Why Us : repli au niveau de LA SECTION ENTIÈRE si `features` n'est pas un
// tableau de exactement 3 entrées valides (section 5/8 du ticket) — jamais
// un mélange d'entrées DB et statiques au sein du même tableau.
export function resolveWhyUs(
  raw: unknown,
  agencyShortName: string
): { eyebrow: string; title: string; features: ResolvedWhyUsFeature[] } {
  const staticFeatures: ResolvedWhyUsFeature[] = content.home.features;
  const fallback = {
    eyebrow: content.home.whyUsEyebrow(agencyShortName),
    title: content.home.whyUsTitle,
    features: staticFeatures,
  };

  if (!isRecord(raw)) return fallback;

  const features = raw.features;
  const featuresValid =
    Array.isArray(features) &&
    features.length === WHY_US_FEATURE_COUNT &&
    features.every(isValidWhyUsFeature);

  if (!featuresValid) return fallback;

  return {
    eyebrow: asNonEmptyString(raw.eyebrow) ?? fallback.eyebrow,
    title: asNonEmptyString(raw.title) ?? fallback.title,
    features: features as ResolvedWhyUsFeature[],
  };
}

// Services : même principe que Why Us — repli section entière si `items`
// n'est pas un tableau de exactement 4 entrées valides, chacune avec une
// icône appartenant strictement aux 4 clés supportées (section 9 du ticket).
export function resolveServices(
  raw: unknown
): { eyebrow: string; title: string; description: string; items: ResolvedServiceItem[] } {
  const fallback = {
    eyebrow: content.services.eyebrow,
    title: content.services.title,
    description: content.services.description,
    items: content.services.items as ResolvedServiceItem[],
  };

  if (!isRecord(raw)) return fallback;

  const items = raw.items;
  const itemsValid =
    Array.isArray(items) && items.length === SERVICE_ITEM_COUNT && items.every(isValidServiceItem);

  if (!itemsValid) return fallback;

  return {
    eyebrow: asNonEmptyString(raw.eyebrow) ?? fallback.eyebrow,
    title: asNonEmptyString(raw.title) ?? fallback.title,
    description: asNonEmptyString(raw.description) ?? fallback.description,
    items: items as ResolvedServiceItem[],
  };
}

function resolveCtaButton(raw: unknown, labelFallback: string, hrefFallback: string): ResolvedCTAButton {
  const row = isRecord(raw) ? raw : {};
  return {
    label: asNonEmptyString(row.label) ?? labelFallback,
    href: asNonEmptyString(row.href) ?? hrefFallback,
  };
}

// CTA final : repli champ par champ pour title/subtitle, et par bouton pour
// primaryCta/secondaryCta (section 10 du ticket) — un bouton mal formé
// retombe sur SES DEUX champs (label+href) ensemble, jamais un label DB
// combiné à un href de repli ou l'inverse (incohérence évitée dès la racine,
// comme pour Why Us/Services).
export function resolveCta(
  raw: unknown
): { title: string; subtitle: string; primaryCta: ResolvedCTAButton; secondaryCta: ResolvedCTAButton } {
  const row = isRecord(raw) ? raw : {};
  return {
    title: asNonEmptyString(row.title) ?? content.callToAction.title,
    subtitle: asNonEmptyString(row.subtitle) ?? content.callToAction.subtitle,
    primaryCta: resolveCtaButton(row.primaryCta, CTA_PRIMARY_LABEL_FALLBACK, CTA_PRIMARY_HREF_FALLBACK),
    secondaryCta: resolveCtaButton(row.secondaryCta, CTA_SECONDARY_LABEL_FALLBACK, CTA_SECONDARY_HREF_FALLBACK),
  };
}

// ---------------------------------------------------------------------------
// Lecture Supabase
// ---------------------------------------------------------------------------

/**
 * Requête brute, partagée par resolveAgencyContent (site public, mémoïsée)
 * et getAgencyContent (admin, non mémoïsée) — même découpage que
 * fetchAgencySettings/resolveAgencySettings/getAgencySettings dans
 * lib/supabase/agencySettings.ts. Tolérant par construction : ligne absente,
 * colonne NULL, table pas encore migrée ou erreur réseau retombent tous
 * silencieusement sur `row: null` côté appelant — jamais de throw.
 */
async function fetchAgencyContentRow(): Promise<{ row: AgencyContentRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("agency_content")
    .select("id, hero, why_us, services, cta, created_at, updated_at")
    .eq("id", CONTENT_ROW_ID)
    .maybeSingle();

  if (error) {
    return { row: null, error: error.message };
  }

  return { row: data as AgencyContentRow | null, error: null };
}

/**
 * Résout le contenu marketing complet de l'agence : valeur runtime
 * (table agency_content) section par section si valide, sinon repli sur
 * config/content.ts — jamais les deux sources mélangées au sein d'une même
 * section (même règle que resolveAgencySettings, étendue ici au niveau
 * section plutôt que champ isolé pour Why Us/Services — voir l'audit
 * V3.3.W.1, section 9).
 *
 * `agencyShortName` : nécessaire uniquement au repli de l'eyebrow Why Us
 * ("Pourquoi {shortName}", content.home.whyUsEyebrow) — cette valeur vit
 * dans agency_settings, pas agency_content ; l'appelant (un Server
 * Component, comme aujourd'hui WhyUs.tsx/HomeProperties.tsx) la résout via
 * resolveAgencySettings() et la transmet ici, sans que ce module importe
 * agencySettings.ts ni ne duplique cette résolution.
 *
 * Enveloppé dans React `cache()` (même principe que resolveAgencySettings) :
 * plusieurs Server Components d'une même page peuvent l'appeler sans se
 * connaître, une seule requête réseau par rendu.
 *
 * NON connecté au frontend pendant cette phase (V3.3.W.3) : Hero.tsx/
 * WhyUs.tsx/Services.tsx/CallToAction.tsx continuent d'importer
 * config/content.ts directement, comme demandé. Cette fonction existe et
 * est testable indépendamment, prête pour V3.3.W.5.
 */
export const resolveAgencyContent = cache(
  async (agencyShortName: string): Promise<AgencyContent> => {
    const { row, error } = await fetchAgencyContentRow();
    if (error) {
      console.error("Erreur Supabase (resolveAgencyContent) — repli sur config/content.ts:", error);
    }

    return {
      hero: resolveHero(row?.hero),
      whyUs: resolveWhyUs(row?.why_us, agencyShortName),
      services: resolveServices(row?.services),
      cta: resolveCta(row?.cta),
    };
  }
);

/**
 * Lecture brute pour un futur formulaire admin (V3.3.W.4) : même requête que
 * resolveAgencyContent, mais SANS `cache()` (non applicable hors Server
 * Component) et sans repli — renvoie exactement ce que Supabase a, pour
 * qu'un formulaire distingue "champ jamais configuré" (undefined) de
 * "configuré avec cette valeur". Pas de validation stricte ici non plus :
 * ce n'est qu'une lecture, jamais affichée telle quelle au site public
 * (seul resolveAgencyContent l'est).
 */
export async function getAgencyContent(): Promise<{
  content: { hero: HeroContent; whyUs: WhyUsContent; services: ServicesContent; cta: CTAContent } | null;
  error: string | null;
}> {
  const { row, error } = await fetchAgencyContentRow();
  if (error || !row) {
    return { content: null, error };
  }

  return {
    content: {
      hero: isRecord(row.hero) ? (row.hero as HeroContent) : {},
      whyUs: isRecord(row.why_us) ? (row.why_us as WhyUsContent) : {},
      services: isRecord(row.services) ? (row.services as ServicesContent) : {},
      cta: isRecord(row.cta) ? (row.cta as CTAContent) : {},
    },
    error: null,
  };
}

/**
 * Écrit la ligne singleton (id fixe, voir CONTENT_ROW_ID) — upsert, même
 * principe que updateAgencySettings (lib/supabase/agencySettings.ts) :
 * fonctionne aussi bien si la ligne insérée par la migration 0015 existe
 * déjà (cas normal) que si elle a été supprimée entre-temps. `updated_at`
 * est posé explicitement ici, à l'identique de `updateMyReview`
 * (lib/supabase/reviews.ts) — aucune table du projet ne maintient ce champ
 * via un trigger SQL (voir migration 0015).
 *
 * Protégée uniquement par les policies RLS existantes (migration 0015,
 * "agency_content: admin insert/update") : aucune vérification de rôle
 * dupliquée ici, comme le reste des mutations admin du projet.
 */
export async function updateAgencyContent(
  agencyContent: AgencyContent
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("agency_content").upsert(
    {
      id: CONTENT_ROW_ID,
      hero: agencyContent.hero,
      why_us: agencyContent.whyUs,
      services: agencyContent.services,
      cta: agencyContent.cta,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("Erreur Supabase (updateAgencyContent):", error);
    return { error: error.message };
  }

  return { error: null };
}
