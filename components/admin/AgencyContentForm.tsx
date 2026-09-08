"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  getAgencyContent,
  updateAgencyContent,
  resolveHero,
  resolveWhyUs,
  resolveServices,
  resolveCta,
  type AgencyContent,
  type ServiceIconKey,
} from "@/lib/supabase/agencyContent";
import { agency } from "@/config/agency";

const labelClasses = "text-xs font-medium uppercase tracking-wider text-stone-500";
const fieldClasses =
  "mt-1.5 w-full rounded-lg border px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400";

function inputClasses(hasError: boolean) {
  return `${fieldClasses} ${
    hasError ? "border-red-400 focus:border-red-500" : "border-stone-200 focus:border-amber-500"
  }`;
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-stone-100 sm:p-8">
      <h2 className="font-serif text-lg text-stone-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

// Icône figée par construction (V3.3.W.4) : <select> fermé sur les 4 seules
// clés réellement supportées par components/Services.tsx (SERVICE_ICONS) —
// jamais un champ texte libre, pour ne jamais pouvoir enregistrer une icône
// que le frontend ne sait pas résoudre.
const ICON_OPTIONS: { value: ServiceIconKey; label: string }[] = [
  { value: "home", label: "Maison" },
  { value: "key", label: "Clé" },
  { value: "trending-up", label: "Tendance (investissement)" },
  { value: "building", label: "Bâtiment" },
];

interface FeatureValue {
  title: string;
  description: string;
}

interface ServiceValue {
  icon: ServiceIconKey;
  title: string;
  description: string;
}

// Tuples de longueur fixe (pas de tableau générique) : matérialise dans le
// type lui-même que la structure reste figée à 3 arguments / 4 services
// (V3.3.W.1 §3, V3.3.W.4 §8) — aucun ajout/suppression dynamique possible.
type WhyUsFeatures = [FeatureValue, FeatureValue, FeatureValue];
type ServiceItems = [ServiceValue, ServiceValue, ServiceValue, ServiceValue];

interface FormValues {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  heroCtaHref: string;
  whyUsEyebrow: string;
  whyUsTitle: string;
  whyUsFeatures: WhyUsFeatures;
  servicesEyebrow: string;
  servicesTitle: string;
  servicesDescription: string;
  serviceItems: ServiceItems;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
}

/**
 * Préremplit le formulaire à partir du contenu brut Supabase (getAgencyContent)
 * en réutilisant EXACTEMENT la même logique de repli que le site public
 * (resolveHero/resolveWhyUs/resolveServices/resolveCta, exportées de
 * lib/supabase/agencyContent.ts) : un admin voit donc ici précisément ce que
 * les visiteurs voient déjà, jamais une reconstruction divergente. `db` est
 * `null` uniquement si la table est inaccessible (voir loadNotice) — dans ce
 * cas chaque résolveur reçoit `undefined` et retombe intégralement sur
 * config/content.ts, comme resolveAgencyContent le ferait pour le site public.
 */
function toFormValues(db: {
  hero: unknown;
  whyUs: unknown;
  services: unknown;
  cta: unknown;
} | null): FormValues {
  const hero = resolveHero(db?.hero);
  // agency.shortName (repli statique) : suffisant pour une suggestion de
  // préremplissage — l'admin peut de toute façon éditer librement le champ
  // eyebrow une fois affiché, ce n'est plus un gabarit dynamique dès qu'il
  // est enregistré tel quel en base.
  const whyUs = resolveWhyUs(db?.whyUs, agency.shortName);
  const services = resolveServices(db?.services);
  const cta = resolveCta(db?.cta);

  const features = (whyUs.features ?? []) as FeatureValue[];
  const items = (services.items ?? []) as ServiceValue[];

  return {
    heroEyebrow: hero.eyebrow ?? "",
    heroTitle: hero.title ?? "",
    heroSubtitle: hero.subtitle ?? "",
    heroCtaLabel: hero.ctaLabel ?? "",
    heroCtaHref: hero.ctaHref ?? "",
    whyUsEyebrow: whyUs.eyebrow ?? "",
    whyUsTitle: whyUs.title ?? "",
    whyUsFeatures: [0, 1, 2].map((index) => ({
      title: features[index]?.title ?? "",
      description: features[index]?.description ?? "",
    })) as WhyUsFeatures,
    servicesEyebrow: services.eyebrow ?? "",
    servicesTitle: services.title ?? "",
    servicesDescription: services.description ?? "",
    serviceItems: [0, 1, 2, 3].map((index) => ({
      icon: items[index]?.icon ?? "home",
      title: items[index]?.title ?? "",
      description: items[index]?.description ?? "",
    })) as ServiceItems,
    ctaTitle: cta.title ?? "",
    ctaSubtitle: cta.subtitle ?? "",
    ctaPrimaryLabel: cta.primaryCta?.label ?? "",
    ctaPrimaryHref: cta.primaryCta?.href ?? "",
    ctaSecondaryLabel: cta.secondaryCta?.label ?? "",
    ctaSecondaryHref: cta.secondaryCta?.href ?? "",
  };
}

interface FormErrors {
  heroEyebrow?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroCtaLabel?: string;
  heroCtaHref?: string;
  whyUsEyebrow?: string;
  whyUsTitle?: string;
  whyUsFeatures?: Partial<Record<"title" | "description", string>>[];
  servicesEyebrow?: string;
  servicesTitle?: string;
  servicesDescription?: string;
  serviceItems?: Partial<Record<"title" | "description", string>>[];
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaPrimaryLabel?: string;
  ctaPrimaryHref?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
}

function required(value: string): string | undefined {
  return value.trim() === "" ? "Ce champ est obligatoire." : undefined;
}

/**
 * Un lien valide est soit une ancre interne ("#section"), soit un chemin
 * interne ("/page"), soit une URL absolue (http/https) — mêmes 3 formes
 * réellement utilisées aujourd'hui dans le template (Hero "#biens",
 * CallToAction "/contact"/"/biens"). Pas de validation d'URL externe plus
 * stricte : un admin doit pouvoir aussi bien lier vers son site que vers un
 * numéro WhatsApp éventuel plus tard.
 */
function isValidHref(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("#") || trimmed.startsWith("/") || /^https?:\/\/.+/i.test(trimmed);
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  errors.heroEyebrow = required(values.heroEyebrow);
  errors.heroTitle = required(values.heroTitle);
  errors.heroSubtitle = required(values.heroSubtitle);
  errors.heroCtaLabel = required(values.heroCtaLabel);
  errors.heroCtaHref = required(values.heroCtaHref) ?? (!isValidHref(values.heroCtaHref) ? "Lien invalide (attendu : #ancre, /page ou https://...)." : undefined);

  errors.whyUsEyebrow = required(values.whyUsEyebrow);
  errors.whyUsTitle = required(values.whyUsTitle);
  errors.whyUsFeatures = values.whyUsFeatures.map((feature) => ({
    title: required(feature.title),
    description: required(feature.description),
  }));

  errors.servicesEyebrow = required(values.servicesEyebrow);
  errors.servicesTitle = required(values.servicesTitle);
  errors.servicesDescription = required(values.servicesDescription);
  errors.serviceItems = values.serviceItems.map((item) => ({
    title: required(item.title),
    description: required(item.description),
  }));

  errors.ctaTitle = required(values.ctaTitle);
  errors.ctaSubtitle = required(values.ctaSubtitle);
  errors.ctaPrimaryLabel = required(values.ctaPrimaryLabel);
  errors.ctaPrimaryHref = required(values.ctaPrimaryHref) ?? (!isValidHref(values.ctaPrimaryHref) ? "Lien invalide (attendu : #ancre, /page ou https://...)." : undefined);
  errors.ctaSecondaryLabel = required(values.ctaSecondaryLabel);
  errors.ctaSecondaryHref = required(values.ctaSecondaryHref) ?? (!isValidHref(values.ctaSecondaryHref) ? "Lien invalide (attendu : #ancre, /page ou https://...)." : undefined);

  return errors;
}

function hasErrors(errors: FormErrors): boolean {
  return Object.values(errors).some((value) => {
    if (Array.isArray(value)) return value.some((entry) => entry.title || entry.description);
    return !!value;
  });
}

function toAgencyContent(values: FormValues): AgencyContent {
  return {
    hero: {
      eyebrow: values.heroEyebrow.trim(),
      title: values.heroTitle.trim(),
      subtitle: values.heroSubtitle.trim(),
      ctaLabel: values.heroCtaLabel.trim(),
      ctaHref: values.heroCtaHref.trim(),
    },
    whyUs: {
      eyebrow: values.whyUsEyebrow.trim(),
      title: values.whyUsTitle.trim(),
      features: values.whyUsFeatures.map((feature) => ({
        title: feature.title.trim(),
        description: feature.description.trim(),
      })),
    },
    services: {
      eyebrow: values.servicesEyebrow.trim(),
      title: values.servicesTitle.trim(),
      description: values.servicesDescription.trim(),
      items: values.serviceItems.map((item) => ({
        icon: item.icon,
        title: item.title.trim(),
        description: item.description.trim(),
      })),
    },
    cta: {
      title: values.ctaTitle.trim(),
      subtitle: values.ctaSubtitle.trim(),
      primaryCta: { label: values.ctaPrimaryLabel.trim(), href: values.ctaPrimaryHref.trim() },
      secondaryCta: { label: values.ctaSecondaryLabel.trim(), href: values.ctaSecondaryHref.trim() },
    },
  };
}

function updateFeature(
  features: WhyUsFeatures,
  index: number,
  field: "title" | "description",
  value: string
): WhyUsFeatures {
  return features.map((feature, i) => (i === index ? { ...feature, [field]: value } : feature)) as WhyUsFeatures;
}

function updateServiceItem(
  items: ServiceItems,
  index: number,
  field: "icon" | "title" | "description",
  value: string
): ServiceItems {
  return items.map((item, i) => (i === index ? { ...item, [field]: value } : item)) as ServiceItems;
}

/**
 * Formulaire "Contenu du site" (V3.3.W.4) — branché sur le case `view ===
 * "content"` de app/admin/page.tsx/AdminSidebar.tsx. Composant dédié,
 * distinct de AgencySettingsForm.tsx (identité/coordonnées/branding) :
 * même écran /admin, mêmes conventions visuelles, mais un formulaire séparé
 * pour ne pas alourdir davantage un formulaire déjà long (voir l'audit
 * V3.3.W.1, section "Remaining risks").
 *
 * Comme AgencySettingsForm, protégé uniquement par les policies RLS de
 * agency_content (migration 0015, "admin insert/update") — AdminShell a
 * déjà vérifié `role === "admin"` avant de monter cet écran, mais la
 * véritable barrière reste RLS.
 *
 * Le nombre d'arguments Why Us (3) et de services (4) est figé dans le JSX
 * ci-dessous (rendu explicite de 3/4 blocs, jamais une boucle sur un
 * tableau de longueur variable) : aucun bouton ajouter/supprimer n'existe,
 * conformément à V3.3.W.1 §3 (contenu configurable, structure fixe).
 */
export default function AgencyContentForm() {
  const [values, setValues] = useState<FormValues | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [loadNotice, setLoadNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { content: db, error } = await getAgencyContent();
      setValues(toFormValues(db));
      if (error) {
        setLoadNotice(
          "Impossible de joindre la table agency_content (elle n'a peut-être pas encore été créée en base). Les valeurs par défaut du template sont affichées ci-dessous ; l'enregistrement échouera tant que la migration n'aura pas été exécutée."
        );
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const updateField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values) return;

    const validation = validate(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setIsSubmitting(true);
    setFeedback(null);
    const { error } = await updateAgencyContent(toAgencyContent(values));
    setIsSubmitting(false);

    if (error) {
      setFeedback({ type: "error", message: "Impossible d'enregistrer le contenu." });
      return;
    }

    setFeedback({ type: "success", message: "Contenu enregistré avec succès." });
  };

  if (loading || !values) {
    return <p className="text-sm text-stone-500">Chargement du contenu...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-stone-900">Contenu du site</h1>
        <p className="mt-1 text-sm text-stone-500">
          Les textes affichés sur la page d&apos;accueil (Hero, Pourquoi nous, Services, CTA
          final). Le nombre de blocs reste fixe ; seul leur texte est modifiable ici.
        </p>
      </div>

      {loadNotice && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{loadNotice}</p>
      )}

      {feedback && (
        <p
          className={`rounded-lg px-4 py-3 text-sm ${
            feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <Section title="Hero">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="content-hero-eyebrow" label="Eyebrow" error={errors.heroEyebrow}>
              <input
                id="content-hero-eyebrow"
                type="text"
                value={values.heroEyebrow}
                onChange={(event) => updateField("heroEyebrow", event.target.value)}
                aria-invalid={!!errors.heroEyebrow}
                className={inputClasses(!!errors.heroEyebrow)}
              />
            </Field>
            <Field id="content-hero-cta-label" label="Texte du bouton" error={errors.heroCtaLabel}>
              <input
                id="content-hero-cta-label"
                type="text"
                value={values.heroCtaLabel}
                onChange={(event) => updateField("heroCtaLabel", event.target.value)}
                aria-invalid={!!errors.heroCtaLabel}
                className={inputClasses(!!errors.heroCtaLabel)}
              />
            </Field>
          </div>

          <Field id="content-hero-title" label="Titre" error={errors.heroTitle}>
            <textarea
              id="content-hero-title"
              rows={2}
              value={values.heroTitle}
              onChange={(event) => updateField("heroTitle", event.target.value)}
              aria-invalid={!!errors.heroTitle}
              className={`resize-none ${inputClasses(!!errors.heroTitle)}`}
            />
          </Field>

          <Field id="content-hero-subtitle" label="Sous-titre" error={errors.heroSubtitle}>
            <textarea
              id="content-hero-subtitle"
              rows={2}
              value={values.heroSubtitle}
              onChange={(event) => updateField("heroSubtitle", event.target.value)}
              aria-invalid={!!errors.heroSubtitle}
              className={`resize-none ${inputClasses(!!errors.heroSubtitle)}`}
            />
          </Field>

          <Field id="content-hero-cta-href" label="Lien du bouton" error={errors.heroCtaHref}>
            <input
              id="content-hero-cta-href"
              type="text"
              value={values.heroCtaHref}
              onChange={(event) => updateField("heroCtaHref", event.target.value)}
              aria-invalid={!!errors.heroCtaHref}
              className={inputClasses(!!errors.heroCtaHref)}
              placeholder="#biens, /biens ou https://..."
            />
          </Field>
        </Section>

        <Section title="Pourquoi nous">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="content-whyus-eyebrow" label="Eyebrow" error={errors.whyUsEyebrow}>
              <input
                id="content-whyus-eyebrow"
                type="text"
                value={values.whyUsEyebrow}
                onChange={(event) => updateField("whyUsEyebrow", event.target.value)}
                aria-invalid={!!errors.whyUsEyebrow}
                className={inputClasses(!!errors.whyUsEyebrow)}
              />
            </Field>
            <Field id="content-whyus-title" label="Titre" error={errors.whyUsTitle}>
              <input
                id="content-whyus-title"
                type="text"
                value={values.whyUsTitle}
                onChange={(event) => updateField("whyUsTitle", event.target.value)}
                aria-invalid={!!errors.whyUsTitle}
                className={inputClasses(!!errors.whyUsTitle)}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {values.whyUsFeatures.map((feature, index) => (
              <div key={index} className="rounded-lg bg-surface-muted p-4 ring-1 ring-stone-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Argument {index + 1}
                </p>
                <div className="mt-3">
                  <Field
                    id={`content-feature-${index}-title`}
                    label="Titre"
                    error={errors.whyUsFeatures?.[index]?.title}
                  >
                    <input
                      id={`content-feature-${index}-title`}
                      type="text"
                      value={feature.title}
                      onChange={(event) =>
                        updateField("whyUsFeatures", updateFeature(values.whyUsFeatures, index, "title", event.target.value))
                      }
                      aria-invalid={!!errors.whyUsFeatures?.[index]?.title}
                      className={inputClasses(!!errors.whyUsFeatures?.[index]?.title)}
                    />
                  </Field>
                </div>
                <div className="mt-3">
                  <Field
                    id={`content-feature-${index}-description`}
                    label="Description"
                    error={errors.whyUsFeatures?.[index]?.description}
                  >
                    <textarea
                      id={`content-feature-${index}-description`}
                      rows={3}
                      value={feature.description}
                      onChange={(event) =>
                        updateField(
                          "whyUsFeatures",
                          updateFeature(values.whyUsFeatures, index, "description", event.target.value)
                        )
                      }
                      aria-invalid={!!errors.whyUsFeatures?.[index]?.description}
                      className={`resize-none ${inputClasses(!!errors.whyUsFeatures?.[index]?.description)}`}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Services">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="content-services-eyebrow" label="Eyebrow" error={errors.servicesEyebrow}>
              <input
                id="content-services-eyebrow"
                type="text"
                value={values.servicesEyebrow}
                onChange={(event) => updateField("servicesEyebrow", event.target.value)}
                aria-invalid={!!errors.servicesEyebrow}
                className={inputClasses(!!errors.servicesEyebrow)}
              />
            </Field>
            <Field id="content-services-title" label="Titre" error={errors.servicesTitle}>
              <input
                id="content-services-title"
                type="text"
                value={values.servicesTitle}
                onChange={(event) => updateField("servicesTitle", event.target.value)}
                aria-invalid={!!errors.servicesTitle}
                className={inputClasses(!!errors.servicesTitle)}
              />
            </Field>
          </div>

          <Field id="content-services-description" label="Description" error={errors.servicesDescription}>
            <textarea
              id="content-services-description"
              rows={2}
              value={values.servicesDescription}
              onChange={(event) => updateField("servicesDescription", event.target.value)}
              aria-invalid={!!errors.servicesDescription}
              className={`resize-none ${inputClasses(!!errors.servicesDescription)}`}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            {values.serviceItems.map((item, index) => (
              <div key={index} className="rounded-lg bg-surface-muted p-4 ring-1 ring-stone-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Service {index + 1}
                </p>
                <div className="mt-3">
                  <Field id={`content-service-${index}-icon`} label="Icône">
                    <select
                      id={`content-service-${index}-icon`}
                      value={item.icon}
                      onChange={(event) =>
                        updateField("serviceItems", updateServiceItem(values.serviceItems, index, "icon", event.target.value))
                      }
                      className={`${inputClasses(false)} bg-white`}
                    >
                      {ICON_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="mt-3">
                  <Field
                    id={`content-service-${index}-title`}
                    label="Titre"
                    error={errors.serviceItems?.[index]?.title}
                  >
                    <input
                      id={`content-service-${index}-title`}
                      type="text"
                      value={item.title}
                      onChange={(event) =>
                        updateField("serviceItems", updateServiceItem(values.serviceItems, index, "title", event.target.value))
                      }
                      aria-invalid={!!errors.serviceItems?.[index]?.title}
                      className={inputClasses(!!errors.serviceItems?.[index]?.title)}
                    />
                  </Field>
                </div>
                <div className="mt-3">
                  <Field
                    id={`content-service-${index}-description`}
                    label="Description"
                    error={errors.serviceItems?.[index]?.description}
                  >
                    <textarea
                      id={`content-service-${index}-description`}
                      rows={3}
                      value={item.description}
                      onChange={(event) =>
                        updateField(
                          "serviceItems",
                          updateServiceItem(values.serviceItems, index, "description", event.target.value)
                        )
                      }
                      aria-invalid={!!errors.serviceItems?.[index]?.description}
                      className={`resize-none ${inputClasses(!!errors.serviceItems?.[index]?.description)}`}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="CTA final">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="content-cta-title" label="Titre" error={errors.ctaTitle}>
              <input
                id="content-cta-title"
                type="text"
                value={values.ctaTitle}
                onChange={(event) => updateField("ctaTitle", event.target.value)}
                aria-invalid={!!errors.ctaTitle}
                className={inputClasses(!!errors.ctaTitle)}
              />
            </Field>
            <Field id="content-cta-subtitle" label="Sous-titre" error={errors.ctaSubtitle}>
              <input
                id="content-cta-subtitle"
                type="text"
                value={values.ctaSubtitle}
                onChange={(event) => updateField("ctaSubtitle", event.target.value)}
                aria-invalid={!!errors.ctaSubtitle}
                className={inputClasses(!!errors.ctaSubtitle)}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-lg bg-surface-muted p-4 ring-1 ring-stone-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Bouton principal
              </p>
              <div className="mt-3">
                <Field id="content-cta-primary-label" label="Label" error={errors.ctaPrimaryLabel}>
                  <input
                    id="content-cta-primary-label"
                    type="text"
                    value={values.ctaPrimaryLabel}
                    onChange={(event) => updateField("ctaPrimaryLabel", event.target.value)}
                    aria-invalid={!!errors.ctaPrimaryLabel}
                    className={inputClasses(!!errors.ctaPrimaryLabel)}
                  />
                </Field>
              </div>
              <div className="mt-3">
                <Field id="content-cta-primary-href" label="Lien" error={errors.ctaPrimaryHref}>
                  <input
                    id="content-cta-primary-href"
                    type="text"
                    value={values.ctaPrimaryHref}
                    onChange={(event) => updateField("ctaPrimaryHref", event.target.value)}
                    aria-invalid={!!errors.ctaPrimaryHref}
                    className={inputClasses(!!errors.ctaPrimaryHref)}
                    placeholder="#ancre, /page ou https://..."
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-lg bg-surface-muted p-4 ring-1 ring-stone-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Bouton secondaire
              </p>
              <div className="mt-3">
                <Field id="content-cta-secondary-label" label="Label" error={errors.ctaSecondaryLabel}>
                  <input
                    id="content-cta-secondary-label"
                    type="text"
                    value={values.ctaSecondaryLabel}
                    onChange={(event) => updateField("ctaSecondaryLabel", event.target.value)}
                    aria-invalid={!!errors.ctaSecondaryLabel}
                    className={inputClasses(!!errors.ctaSecondaryLabel)}
                  />
                </Field>
              </div>
              <div className="mt-3">
                <Field id="content-cta-secondary-href" label="Lien" error={errors.ctaSecondaryHref}>
                  <input
                    id="content-cta-secondary-href"
                    type="text"
                    value={values.ctaSecondaryHref}
                    onChange={(event) => updateField("ctaSecondaryHref", event.target.value)}
                    aria-invalid={!!errors.ctaSecondaryHref}
                    className={inputClasses(!!errors.ctaSecondaryHref)}
                    placeholder="#ancre, /page ou https://..."
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-amber-500 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Enregistrement..." : "Enregistrer le contenu"}
          </button>
        </div>
      </form>
    </div>
  );
}
