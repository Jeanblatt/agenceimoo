"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  getAgencySettings,
  updateAgencySettings,
  type AgencySettings,
  type AgencySettingsPayload,
} from "@/lib/supabase/agencySettings";
import {
  getAgencyAssetPublicUrl,
  uploadAgencyAsset,
  deleteAgencyAsset,
  type AgencyAssetKind,
} from "@/lib/supabase/agencyBranding";

const labelClasses = "text-xs font-medium uppercase tracking-wider text-stone-500";
const fieldClasses =
  "mt-1.5 w-full rounded-lg border px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400";

function inputClasses(hasError: boolean) {
  return `${fieldClasses} ${
    hasError ? "border-red-400 focus:border-red-500" : "border-stone-200 focus:border-amber-500"
  }`;
}

interface FormValues {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  foundedYear: string;
  phone: string;
  phoneDisplay: string;
  whatsapp: string;
  email: string;
  addressStreet: string;
  addressPostalCode: string;
  addressCity: string;
  addressCountry: string;
  hours: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  heroMediaType: "image" | "video";
}

function toFormValues(settings: AgencySettings): FormValues {
  return {
    name: settings.name,
    shortName: settings.shortName,
    tagline: settings.tagline,
    description: settings.description,
    foundedYear: String(settings.foundedYear),
    phone: settings.phone,
    phoneDisplay: settings.phoneDisplay,
    whatsapp: settings.whatsapp,
    email: settings.email,
    addressStreet: settings.address.street,
    addressPostalCode: settings.address.postalCode,
    addressCity: settings.address.city,
    addressCountry: settings.address.country,
    hours: settings.hours,
    facebook: settings.socials.facebook ?? "",
    instagram: settings.socials.instagram ?? "",
    linkedin: settings.socials.linkedin ?? "",
    heroMediaType: settings.heroMediaType,
  };
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Même tolérance que ContactForm/VisitRequestForm : chiffres, espaces,
// +()-. — accepte aussi bien un format international qu'un format local.
const PHONE_REGEX = /^[0-9+\s().-]{6,20}$/;
const URL_REGEX = /^https?:\/\/.+/i;
const CURRENT_YEAR = new Date().getFullYear();

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = "Le nom de l'agence est obligatoire.";
  }

  if (values.email.trim() && !EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "Adresse email invalide.";
  }

  if (values.phone.trim() && !PHONE_REGEX.test(values.phone.trim())) {
    errors.phone = "Numéro de téléphone invalide.";
  }

  if (values.whatsapp.trim() && !PHONE_REGEX.test(values.whatsapp.trim())) {
    errors.whatsapp = "Numéro WhatsApp invalide.";
  }

  if (values.facebook.trim() && !URL_REGEX.test(values.facebook.trim())) {
    errors.facebook = "Merci d'indiquer une URL complète (https://...).";
  }
  if (values.instagram.trim() && !URL_REGEX.test(values.instagram.trim())) {
    errors.instagram = "Merci d'indiquer une URL complète (https://...).";
  }
  if (values.linkedin.trim() && !URL_REGEX.test(values.linkedin.trim())) {
    errors.linkedin = "Merci d'indiquer une URL complète (https://...).";
  }

  if (values.foundedYear.trim()) {
    const year = Number(values.foundedYear);
    if (!Number.isInteger(year) || year < 1800 || year > CURRENT_YEAR) {
      errors.foundedYear = `Année invalide (entre 1800 et ${CURRENT_YEAR}).`;
    }
  }

  return errors;
}

function toPayload(values: FormValues): AgencySettingsPayload {
  const year = values.foundedYear.trim() ? Number(values.foundedYear) : null;

  return {
    name: values.name,
    shortName: values.shortName,
    tagline: values.tagline,
    description: values.description,
    phone: values.phone,
    phoneDisplay: values.phoneDisplay,
    whatsapp: values.whatsapp,
    email: values.email,
    address: {
      street: values.addressStreet,
      postalCode: values.addressPostalCode,
      city: values.addressCity,
      country: values.addressCountry,
    },
    hours: values.hours,
    foundedYear: year,
    socials: {
      facebook: values.facebook.trim() || undefined,
      instagram: values.instagram.trim() || undefined,
      linkedin: values.linkedin.trim() || undefined,
    },
    heroMediaType: values.heroMediaType,
  };
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
      <div className="mt-6 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

interface AssetUploaderProps {
  kind: AgencyAssetKind;
  title: string;
  hint: string;
  accept: string;
  inputId: string;
  previewClassName: string;
  fallbackLabel: string;
  /** "video" pour l'aperçu vidéo Hero (V3.3.V.1) — logique upload/suppression identique, seul l'aperçu change. */
  mediaType?: "image" | "video";
}

/**
 * Bloc upload/aperçu/suppression réutilisé pour les assets de branding
 * (logo, hero, og — V3.3.U ; vidéo Hero — V3.3.V.1). Un seul composant
 * plutôt que de dupliquer le bloc pour chacun : même comportement (aperçu
 * déterministe + `onError`, cache-busting après upload/suppression, jamais
 * de faux succès) pour tous, seul le rendu de l'aperçu (image ou vidéo)
 * diffère selon `mediaType`.
 */
function AssetUploader({
  kind,
  title,
  hint,
  accept,
  inputId,
  previewClassName,
  fallbackLabel,
  mediaType = "image",
}: AssetUploaderProps) {
  const [failed, setFailed] = useState(false);
  const [nonce, setNonce] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setError(null);
    const { error: uploadError } = await uploadAgencyAsset(kind, file);
    setIsUploading(false);

    if (uploadError) {
      setError(uploadError);
      return;
    }

    setFailed(false);
    setNonce(String(Date.now()));
  };

  const handleDelete = async () => {
    setIsUploading(true);
    setError(null);
    const { error: deleteError } = await deleteAgencyAsset(kind);
    setIsUploading(false);

    if (deleteError) {
      setError(deleteError);
      return;
    }

    setFailed(true);
    setNonce(String(Date.now()));
  };

  return (
    <div>
      <p className="text-sm font-medium text-stone-900">{title}</p>
      <p className="mt-0.5 text-xs text-stone-500">{hint}</p>

      <div className="mt-3 flex items-center gap-5">
        {!failed ? (
          mediaType === "video" ? (
            <video
              key={nonce ?? "initial"}
              src={getAgencyAssetPublicUrl(kind, nonce ? { cacheNonce: nonce } : undefined)}
              muted
              loop
              playsInline
              controls
              className={previewClassName}
              onError={() => setFailed(true)}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- URL Supabase Storage externe, aperçu admin
            <img
              key={nonce ?? "initial"}
              src={getAgencyAssetPublicUrl(kind, nonce ? { cacheNonce: nonce } : undefined)}
              alt={`${title} actuel`}
              className={previewClassName}
              onError={() => setFailed(true)}
            />
          )
        ) : (
          <span className={`flex shrink-0 items-center justify-center rounded-lg bg-stone-100 text-center text-xs text-stone-400 ring-1 ring-stone-200 ${previewClassName}`}>
            {fallbackLabel}
          </span>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor={inputId}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-stone-600 transition-colors hover:border-amber-500 hover:text-amber-600 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-70"
          >
            <input
              id={inputId}
              type="file"
              accept={accept}
              onChange={handleChange}
              disabled={isUploading}
              className="hidden"
            />
            {isUploading ? "Envoi en cours..." : "Remplacer"}
          </label>

          {!failed && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isUploading}
              className="text-xs font-medium uppercase tracking-wider text-stone-400 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/**
 * Formulaire "Paramètres agence" (V3.3.S) — branché sur le case `view ===
 * "settings"` déjà présent dans app/admin/page.tsx et AdminSidebar.tsx
 * (jusqu'ici un simple message "à venir"). Suit le même pattern que les
 * autres écrans admin (PropertyForm, ProfileView) : Client Component,
 * lecture/écriture Supabase directes, protégées par les policies RLS de
 * agency_settings (migration 0009) plutôt que par une vérification côté
 * client — AdminShell a déjà vérifié `role === "admin"` avant de monter
 * cet écran, mais la véritable barrière reste RLS.
 *
 * Aucun champ n'est spécifique à Horizon Immobilier : labels, validations
 * et structure fonctionnent pour n'importe quelle agence (V3.3.S §25).
 */
export default function AgencySettingsForm() {
  const [values, setValues] = useState<FormValues | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [loadNotice, setLoadNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const { settings, error } = await getAgencySettings();
      setValues(toFormValues(settings));
      if (error) {
        setLoadNotice(
          "Impossible de joindre la table agency_settings (elle n'a peut-être pas encore été créée en base). Les valeurs par défaut du template sont affichées ci-dessous ; l'enregistrement échouera tant que la migration n'aura pas été exécutée."
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

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => (current ? { ...current, [field]: value } : current));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  // Distinct de updateField : heroMediaType est une énumération à deux
  // valeurs pilotée par un toggle, pas un champ texte libre (V3.3.V.2).
  const setHeroMediaType = (heroMediaType: "image" | "video") => {
    setValues((current) => (current ? { ...current, heroMediaType } : current));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values) return;

    const validation = validate(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setIsSubmitting(true);
    setFeedback(null);
    const { error } = await updateAgencySettings(toPayload(values));
    setIsSubmitting(false);

    if (error) {
      setFeedback({
        type: "error",
        message: `Impossible d'enregistrer les paramètres : ${error}`,
      });
      return;
    }

    setFeedback({ type: "success", message: "Paramètres enregistrés." });
  };

  if (loading || !values) {
    return <p className="text-sm text-stone-500">Chargement des paramètres...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-stone-900">Paramètres de l&apos;agence</h1>
        <p className="mt-1 text-sm text-stone-500">
          Ces informations sont utilisées sur l&apos;ensemble du site public (navigation, pied
          de page, page contact, bouton WhatsApp).
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
        <section className="rounded-2xl bg-white p-6 ring-1 ring-stone-100 sm:p-8">
          <h2 className="font-serif text-lg text-stone-900">Logo</h2>
          <div className="mt-6">
            <AssetUploader
              kind="logo"
              title="Logo"
              hint="Formats acceptés : WebP, PNG (2 Mo max). Remplace le logo actif sur tout le site."
              accept="image/webp,image/png"
              inputId="agency-logo"
              previewClassName="h-16 w-auto max-w-[12rem] rounded-lg bg-stone-100 object-contain p-2 ring-1 ring-stone-200"
              fallbackLabel="Aucun logo"
            />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-stone-100 sm:p-8">
          <h2 className="font-serif text-lg text-stone-900">Images du site</h2>
          <p className="mt-1 text-sm text-stone-500">
            Remplace les médias de fond utilisés sur la page d&apos;accueil et lors du partage
            du site sur les réseaux sociaux.
          </p>

          <div className="mt-6 space-y-8">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Hero principal
              </h3>

              <div className="mt-4">
                <p className="text-sm font-medium text-stone-900">Type de média actif</p>
                <div className="mt-2 inline-flex rounded-full border border-stone-200 p-1">
                  <button
                    type="button"
                    onClick={() => setHeroMediaType("image")}
                    aria-pressed={values.heroMediaType === "image"}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                      values.heroMediaType === "image"
                        ? "bg-amber-500 text-stone-950"
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    🖼 Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroMediaType("video")}
                    aria-pressed={values.heroMediaType === "video"}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                      values.heroMediaType === "video"
                        ? "bg-amber-500 text-stone-950"
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    🎥 Vidéo
                  </button>
                </div>
                <p className="mt-2 text-xs text-stone-500">
                  Détermine ce qui est affiché publiquement. L&apos;image et la vidéo peuvent
                  rester configurées toutes les deux — seul le type sélectionné ici est utilisé
                  sur le site (enregistrer pour appliquer le changement).
                </p>
              </div>

              <div className="mt-6 space-y-6">
                <AssetUploader
                  kind="hero"
                  title="Image Hero"
                  hint="Utilisée si « Image » est sélectionné ci-dessus, et comme repli si la vidéo échoue. Formats acceptés : WebP, PNG, JPEG (5 Mo max)."
                  accept="image/webp,image/png,image/jpeg"
                  inputId="agency-hero"
                  previewClassName="h-16 w-28 rounded-lg bg-stone-100 object-cover ring-1 ring-stone-200"
                  fallbackLabel="Image par défaut du template"
                />

                <AssetUploader
                  kind="heroVideo"
                  title="Vidéo Hero"
                  hint="Utilisée si « Vidéo » est sélectionné ci-dessus. Silencieuse, en boucle. Format accepté : MP4 (15 Mo max)."
                  accept="video/mp4"
                  inputId="agency-hero-video"
                  previewClassName="h-16 w-28 rounded-lg bg-stone-100 object-cover ring-1 ring-stone-200"
                  fallbackLabel="Aucune vidéo configurée"
                  mediaType="video"
                />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Pourquoi nous
              </h3>
              <p className="mt-1 text-xs text-stone-500">
                Image de fond optionnelle pour la section « Pourquoi {"{"}nom de l&apos;agence{"}"} ».
                Si aucune image n&apos;est configurée, le design actuel de la section est conservé.
              </p>
              <div className="mt-4">
                <AssetUploader
                  kind="whyUs"
                  title="Image de fond"
                  hint="Optionnel. Formats acceptés : WebP, PNG, JPEG (5 Mo max)."
                  accept="image/webp,image/png,image/jpeg"
                  inputId="agency-why-us"
                  previewClassName="h-16 w-28 rounded-lg bg-stone-100 object-cover ring-1 ring-stone-200"
                  fallbackLabel="Design par défaut du template"
                />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                CTA final
              </h3>
              <div className="mt-4">
                <AssetUploader
                  kind="cta"
                  title="Image de fond"
                  hint="Bandeau d'appel à l'action juste avant le pied de page — indépendant du Hero. Formats acceptés : WebP, PNG, JPEG (5 Mo max)."
                  accept="image/webp,image/png,image/jpeg"
                  inputId="agency-cta"
                  previewClassName="h-16 w-28 rounded-lg bg-stone-100 object-cover ring-1 ring-stone-200"
                  fallbackLabel="Image par défaut du template"
                />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Open Graph
              </h3>
              <div className="mt-4">
                <AssetUploader
                  kind="og"
                  title="Image de partage"
                  hint="Aperçu affiché lors du partage du site sur les réseaux sociaux (format recommandé 1200×630). Formats acceptés : WebP, PNG, JPEG (3 Mo max)."
                  accept="image/webp,image/png,image/jpeg"
                  inputId="agency-og"
                  previewClassName="h-16 w-28 rounded-lg bg-stone-100 object-cover ring-1 ring-stone-200"
                  fallbackLabel="Image par défaut du template"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-stone-100 sm:p-8">
          <h2 className="font-serif text-lg text-stone-900">Statistiques</h2>
          <p className="mt-1 text-sm text-stone-500">
            Image de fond optionnelle pour la section « Notre agence en chiffres ». Si aucune
            image n&apos;est configurée, le fond sombre actuel du template reste utilisé tel quel.
          </p>
          <div className="mt-6">
            <AssetUploader
              kind="stats"
              title="Image de fond"
              hint="Optionnel. Formats acceptés : WebP, PNG, JPEG (5 Mo max)."
              accept="image/webp,image/png,image/jpeg"
              inputId="agency-stats"
              previewClassName="h-16 w-28 rounded-lg bg-stone-100 object-cover ring-1 ring-stone-200"
              fallbackLabel="Fond par défaut du template"
            />
          </div>
        </section>

        <Section title="Identité">
          <Field id="agency-name" label="Nom de l'agence" error={errors.name}>
            <input
              id="agency-name"
              type="text"
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              aria-invalid={!!errors.name}
              className={inputClasses(!!errors.name)}
            />
          </Field>

          <Field id="agency-short-name" label="Nom court">
            <input
              id="agency-short-name"
              type="text"
              value={values.shortName}
              onChange={(event) => updateField("shortName", event.target.value)}
              className={inputClasses(false)}
            />
          </Field>

          <Field id="agency-tagline" label="Slogan">
            <input
              id="agency-tagline"
              type="text"
              value={values.tagline}
              onChange={(event) => updateField("tagline", event.target.value)}
              className={inputClasses(false)}
            />
          </Field>

          <Field id="agency-founded-year" label="Année de création" error={errors.foundedYear}>
            <input
              id="agency-founded-year"
              type="number"
              inputMode="numeric"
              min={1800}
              max={CURRENT_YEAR}
              value={values.foundedYear}
              onChange={(event) => updateField("foundedYear", event.target.value)}
              aria-invalid={!!errors.foundedYear}
              className={inputClasses(!!errors.foundedYear)}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field id="agency-description" label="Description">
              <textarea
                id="agency-description"
                rows={3}
                value={values.description}
                onChange={(event) => updateField("description", event.target.value)}
                className={`resize-none ${inputClasses(false)}`}
              />
            </Field>
          </div>
        </Section>

        <Section title="Contact">
          <Field id="agency-phone" label="Téléphone" error={errors.phone}>
            <input
              id="agency-phone"
              type="tel"
              value={values.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              aria-invalid={!!errors.phone}
              className={inputClasses(!!errors.phone)}
              placeholder="+21671234567"
            />
          </Field>

          <Field id="agency-phone-display" label="Téléphone affiché">
            <input
              id="agency-phone-display"
              type="text"
              value={values.phoneDisplay}
              onChange={(event) => updateField("phoneDisplay", event.target.value)}
              className={inputClasses(false)}
              placeholder="+216 71 234 567"
            />
          </Field>

          <Field id="agency-whatsapp" label="WhatsApp" error={errors.whatsapp}>
            <input
              id="agency-whatsapp"
              type="tel"
              value={values.whatsapp}
              onChange={(event) => updateField("whatsapp", event.target.value)}
              aria-invalid={!!errors.whatsapp}
              className={inputClasses(!!errors.whatsapp)}
              placeholder="+21671234567"
            />
          </Field>

          <Field id="agency-email" label="Email" error={errors.email}>
            <input
              id="agency-email"
              type="email"
              value={values.email}
              onChange={(event) => updateField("email", event.target.value)}
              aria-invalid={!!errors.email}
              className={inputClasses(!!errors.email)}
            />
          </Field>
        </Section>

        <Section title="Adresse">
          <div className="sm:col-span-2">
            <Field id="agency-address-street" label="Rue">
              <input
                id="agency-address-street"
                type="text"
                value={values.addressStreet}
                onChange={(event) => updateField("addressStreet", event.target.value)}
                className={inputClasses(false)}
              />
            </Field>
          </div>

          <Field id="agency-address-postal-code" label="Code postal">
            <input
              id="agency-address-postal-code"
              type="text"
              value={values.addressPostalCode}
              onChange={(event) => updateField("addressPostalCode", event.target.value)}
              className={inputClasses(false)}
            />
          </Field>

          <Field id="agency-address-city" label="Ville">
            <input
              id="agency-address-city"
              type="text"
              value={values.addressCity}
              onChange={(event) => updateField("addressCity", event.target.value)}
              className={inputClasses(false)}
            />
          </Field>

          <Field id="agency-address-country" label="Pays (code ISO, ex. TN)">
            <input
              id="agency-address-country"
              type="text"
              value={values.addressCountry}
              onChange={(event) => updateField("addressCountry", event.target.value.toUpperCase())}
              maxLength={2}
              className={inputClasses(false)}
            />
          </Field>
        </Section>

        <Section title="Horaires">
          <div className="sm:col-span-2">
            <Field id="agency-hours" label="Horaires">
              <input
                id="agency-hours"
                type="text"
                value={values.hours}
                onChange={(event) => updateField("hours", event.target.value)}
                className={inputClasses(false)}
                placeholder="Lun–Ven 9h–19h · Sam 10h–17h"
              />
            </Field>
          </div>
        </Section>

        <Section title="Réseaux sociaux" description="Laisser vide pour ne pas afficher le réseau correspondant.">
          <Field id="agency-facebook" label="Facebook" error={errors.facebook}>
            <input
              id="agency-facebook"
              type="url"
              value={values.facebook}
              onChange={(event) => updateField("facebook", event.target.value)}
              aria-invalid={!!errors.facebook}
              className={inputClasses(!!errors.facebook)}
              placeholder="https://facebook.com/..."
            />
          </Field>

          <Field id="agency-instagram" label="Instagram" error={errors.instagram}>
            <input
              id="agency-instagram"
              type="url"
              value={values.instagram}
              onChange={(event) => updateField("instagram", event.target.value)}
              aria-invalid={!!errors.instagram}
              className={inputClasses(!!errors.instagram)}
              placeholder="https://instagram.com/..."
            />
          </Field>

          <Field id="agency-linkedin" label="LinkedIn" error={errors.linkedin}>
            <input
              id="agency-linkedin"
              type="url"
              value={values.linkedin}
              onChange={(event) => updateField("linkedin", event.target.value)}
              aria-invalid={!!errors.linkedin}
              className={inputClasses(!!errors.linkedin)}
              placeholder="https://linkedin.com/company/..."
            />
          </Field>
        </Section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-amber-500 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
