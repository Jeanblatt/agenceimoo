"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import type { Property, PropertyStatus, TransactionType } from "@/data/properties";
import type { AnnoncePayload } from "@/lib/supabase/annonces";
import { catalog } from "@/config/catalog";
import { content } from "@/config/content";
import { slugify } from "@/utils/slugify";
import PropertyImageManager from "@/components/admin/PropertyImageManager";

const TYPES = catalog.propertyTypes;
const STATUSES = catalog.propertyStatuses;
const TRANSACTIONS = catalog.transactionTypes;

interface PropertyFormProps {
  initialValues?: Property;
  onSubmit: (values: AnnoncePayload) => Promise<{ property: Property | null; error: string | null }>;
  /** Appelé une fois le bien (et, en édition, uniquement les champs) réellement enregistré. */
  onSaved: (message: string) => void;
  onCancel: () => void;
}

interface RawValues {
  title: string;
  description: string;
  location: string;
  type: string;
  price: string;
  surface: string;
  bedrooms: string;
  status: string;
  // V3.3.V — tous optionnels : chaîne vide acceptée, jamais de valeur
  // inventée pour compléter un champ laissé vide (voir toPayloadExtras).
  transaction: string;
  bathrooms: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  featured: boolean;
  slug: string;
}

type FormErrors = Partial<Record<keyof RawValues, string>>;

function validate(values: RawValues): FormErrors {
  const errors: FormErrors = {};

  if (values.title.trim().length < 3) {
    errors.title = "Le titre doit contenir au moins 3 caractères.";
  }
  if (values.description.trim().length < 10) {
    errors.description = "La description doit contenir au moins 10 caractères.";
  }
  if (values.location.trim().length < 2) {
    errors.location = "Merci d'indiquer la localisation.";
  }

  const price = Number(values.price);
  if (values.price === "" || Number.isNaN(price) || price <= 0) {
    errors.price = "Merci d'indiquer un prix valide.";
  }

  const surface = Number(values.surface);
  if (values.surface === "" || Number.isNaN(surface) || surface <= 0) {
    errors.surface = "Merci d'indiquer une surface valide.";
  }

  const bedrooms = Number(values.bedrooms);
  if (values.bedrooms === "" || Number.isNaN(bedrooms) || bedrooms < 0) {
    errors.bedrooms = "Nombre de chambres invalide.";
  }

  if (values.bathrooms !== "" && (Number.isNaN(Number(values.bathrooms)) || Number(values.bathrooms) < 0)) {
    errors.bathrooms = "Nombre de salles de bain invalide.";
  }

  if (values.latitude !== "" && Number.isNaN(Number(values.latitude))) {
    errors.latitude = "Latitude invalide.";
  }
  if (values.longitude !== "" && Number.isNaN(Number(values.longitude))) {
    errors.longitude = "Longitude invalide.";
  }

  if (values.slug !== "" && slugify(values.slug) !== values.slug) {
    errors.slug = "Le slug ne doit contenir que des lettres minuscules, chiffres et tirets.";
  }

  return errors;
}

const fieldClasses =
  "mt-1.5 w-full rounded-lg border px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none";

function inputClasses(hasError: boolean) {
  return `${fieldClasses} ${
    hasError ? "border-red-400 focus:border-red-500" : "border-stone-200 focus:border-amber-500"
  }`;
}

function formatUploadNote(summary: { succeeded: number; failed: number } | null): string {
  if (!summary || (summary.succeeded === 0 && summary.failed === 0)) return "";
  if (summary.failed > 0) {
    return ` ${summary.succeeded} photo(s) envoyée(s), ${summary.failed} échec(s) — vérifiez la galerie ci-dessous.`;
  }
  return ` ${summary.succeeded} photo(s) envoyée(s).`;
}

export default function PropertyForm({ initialValues, onSubmit, onSaved, onCancel }: PropertyFormProps) {
  const [values, setValues] = useState<RawValues>({
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    location: initialValues?.location ?? "",
    type: initialValues?.type ?? "Appartement",
    price: initialValues ? String(initialValues.price) : "",
    surface: initialValues ? String(initialValues.area) : "",
    bedrooms: initialValues ? String(initialValues.bedrooms) : "",
    status: initialValues?.status ?? "available",
    transaction: initialValues?.transaction ?? "",
    bathrooms: initialValues?.bathrooms !== undefined ? String(initialValues.bathrooms) : "",
    city: initialValues?.city ?? "",
    address: initialValues?.address ?? "",
    latitude: initialValues?.latitude !== undefined ? String(initialValues.latitude) : "",
    longitude: initialValues?.longitude !== undefined ? String(initialValues.longitude) : "",
    featured: initialValues?.featured ?? false,
    slug: initialValues?.slug ?? "",
  });
  const [features, setFeatures] = useState<string[]>(initialValues?.features ?? []);
  const [featureDraft, setFeatureDraft] = useState("");
  // Le slug n'est auto-suggéré qu'en création, et seulement tant que l'admin
  // n'a pas commencé à le modifier lui-même — jamais recalculé au-dessus
  // d'une valeur déjà existante en édition (pas d'invention de donnée).
  const [slugTouched, setSlugTouched] = useState(!!initialValues?.slug);
  const [errors, setErrors] = useState<FormErrors>({});
  const [phase, setPhase] = useState<"idle" | "saving">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Création uniquement : une fois l'annonce enregistrée, le formulaire de
  // champs se referme et la galerie (déjà affichée pendant la saisie, en
  // mode "en attente") reçoit un vrai annonceId — elle uploade alors
  // automatiquement les photos sélectionnées avant la création.
  const [createdProperty, setCreatedProperty] = useState<Property | null>(null);
  const [photosSettled, setPhotosSettled] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<{ succeeded: number; failed: number } | null>(null);

  const justCreated = !initialValues && !!createdProperty;
  const annonceId = createdProperty?.id ?? initialValues?.id;
  const legacyImageUrl =
    initialValues?.images?.[0]?.id.startsWith("legacy-") ? initialValues.images[0].url : undefined;

  const updateField = (field: keyof RawValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const updateTitle = (value: string) => {
    updateField("title", value);
    // Auto-suggestion du slug depuis le titre — uniquement tant que l'admin
    // n'a jamais touché le champ slug lui-même (pas de donnée inventée
    // au-dessus d'une valeur qu'il aurait déjà choisie).
    if (!slugTouched) {
      setValues((current) => ({ ...current, slug: slugify(value) }));
    }
  };

  const updateSlug = (value: string) => {
    setSlugTouched(true);
    updateField("slug", value);
  };

  const toggleFeatured = () => {
    setValues((current) => ({ ...current, featured: !current.featured }));
  };

  const addFeature = () => {
    const trimmed = featureDraft.trim();
    if (trimmed === "" || features.includes(trimmed)) {
      setFeatureDraft("");
      return;
    }
    setFeatures((current) => [...current, trimmed]);
    setFeatureDraft("");
  };

  const removeFeature = (feature: string) => {
    setFeatures((current) => current.filter((item) => item !== feature));
  };

  const handleFeatureKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addFeature();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase !== "idle") return;

    const validation = validate(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitError(null);
    setPhase("saving");

    const { property, error } = await onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      location: values.location.trim(),
      type: values.type,
      price: Number(values.price),
      surface: Number(values.surface),
      bedrooms: Number(values.bedrooms),
      status: values.status as PropertyStatus,
      transaction: (values.transaction || undefined) as TransactionType | undefined,
      bathrooms: values.bathrooms !== "" ? Number(values.bathrooms) : undefined,
      city: values.city.trim() || undefined,
      address: values.address.trim() || undefined,
      latitude: values.latitude !== "" ? Number(values.latitude) : undefined,
      longitude: values.longitude !== "" ? Number(values.longitude) : undefined,
      featured: values.featured,
      features: features.length > 0 ? features : undefined,
      slug: values.slug.trim() || undefined,
    });

    setPhase("idle");

    if (error || !property) {
      setSubmitError(error ?? "Une erreur inconnue est survenue.");
      return;
    }

    if (initialValues) {
      // Édition : les photos sont déjà gérées en direct par la galerie
      // (upload/suppression/couverture/ordre immédiats), rien à attendre de
      // plus ici — modifier les champs ne touche jamais aux images.
      onSaved("Le bien a été mis à jour avec succès.");
      return;
    }

    // Création : on reste sur ce formulaire le temps que la galerie ait fini
    // d'uploader les photos sélectionnées avant l'enregistrement.
    setPhotosSettled(false);
    setUploadSummary(null);
    setCreatedProperty(property);
  };

  const handleFinish = () => {
    onSaved(`Le bien a été ajouté avec succès.${formatUploadNote(uploadSummary)}`);
  };

  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-100 sm:p-8">
      <h2 className="font-serif text-xl text-stone-900">
        {initialValues ? "Modifier le bien" : "Ajouter un bien"}
      </h2>

      {/*
        PropertyImageManager reste au même endroit de l'arbre JSX que
        justCreated soit vrai ou faux (un seul <form>, jamais deux branches
        distinctes) : le faire dépendre de justCreated pour choisir entre
        deux blocs JSX différents démonterait le composant au moment précis
        où l'annonce vient d'être créée, perdant les photos en attente
        avant même qu'elles aient pu être uploadées.
      */}
      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        {justCreated ? (
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Le bien « {values.title.trim()} » a été créé. Ajoutez ou organisez ses photos ci-dessous, puis
            cliquez sur Terminé.
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="property-title" className="text-xs font-medium uppercase tracking-wider text-stone-500">
                Titre
              </label>
              <input
                id="property-title"
                type="text"
                value={values.title}
                onChange={(event) => updateTitle(event.target.value)}
                aria-invalid={!!errors.title}
                className={inputClasses(!!errors.title)}
                placeholder="Villa moderne avec piscine"
              />
              {errors.title && <p className="mt-1.5 text-xs text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label
                htmlFor="property-description"
                className="text-xs font-medium uppercase tracking-wider text-stone-500"
              >
                Description
              </label>
              <textarea
                id="property-description"
                rows={4}
                value={values.description}
                onChange={(event) => updateField("description", event.target.value)}
                aria-invalid={!!errors.description}
                className={`${inputClasses(!!errors.description)} resize-none`}
                placeholder="Décrivez le bien..."
              />
              {errors.description && <p className="mt-1.5 text-xs text-red-600">{errors.description}</p>}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="property-location"
                  className="text-xs font-medium uppercase tracking-wider text-stone-500"
                >
                  Localisation
                </label>
                <input
                  id="property-location"
                  type="text"
                  value={values.location}
                  onChange={(event) => updateField("location", event.target.value)}
                  aria-invalid={!!errors.location}
                  className={inputClasses(!!errors.location)}
                  placeholder={content.placeholders.propertyLocation}
                />
                {errors.location && <p className="mt-1.5 text-xs text-red-600">{errors.location}</p>}
              </div>

              <div>
                <label htmlFor="property-type" className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Type
                </label>
                <select
                  id="property-type"
                  value={values.type}
                  onChange={(event) => updateField("type", event.target.value)}
                  className={`${inputClasses(false)} bg-white`}
                >
                  {TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="property-transaction"
                  className="text-xs font-medium uppercase tracking-wider text-stone-500"
                >
                  Transaction
                </label>
                <select
                  id="property-transaction"
                  value={values.transaction}
                  onChange={(event) => updateField("transaction", event.target.value)}
                  className={`${inputClasses(false)} bg-white`}
                >
                  <option value="">Non précisé</option>
                  {TRANSACTIONS.map((transaction) => (
                    <option key={transaction.id} value={transaction.id}>
                      {transaction.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="property-city" className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Ville
                </label>
                <input
                  id="property-city"
                  type="text"
                  value={values.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  className={inputClasses(false)}
                  placeholder="Tunis"
                />
              </div>
            </div>

            <div>
              <label htmlFor="property-address" className="text-xs font-medium uppercase tracking-wider text-stone-500">
                Adresse précise (non affichée publiquement)
              </label>
              <input
                id="property-address"
                type="text"
                value={values.address}
                onChange={(event) => updateField("address", event.target.value)}
                className={inputClasses(false)}
                placeholder="12 Rue des Oliviers"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="property-latitude" className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Latitude
                </label>
                <input
                  id="property-latitude"
                  type="number"
                  step="any"
                  value={values.latitude}
                  onChange={(event) => updateField("latitude", event.target.value)}
                  aria-invalid={!!errors.latitude}
                  className={inputClasses(!!errors.latitude)}
                  placeholder="36.8065"
                />
                {errors.latitude && <p className="mt-1.5 text-xs text-red-600">{errors.latitude}</p>}
              </div>

              <div>
                <label htmlFor="property-longitude" className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Longitude
                </label>
                <input
                  id="property-longitude"
                  type="number"
                  step="any"
                  value={values.longitude}
                  onChange={(event) => updateField("longitude", event.target.value)}
                  aria-invalid={!!errors.longitude}
                  className={inputClasses(!!errors.longitude)}
                  placeholder="10.1815"
                />
                {errors.longitude && <p className="mt-1.5 text-xs text-red-600">{errors.longitude}</p>}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="property-price" className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Prix (DT)
                </label>
                <input
                  id="property-price"
                  type="number"
                  min={0}
                  value={values.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  aria-invalid={!!errors.price}
                  className={inputClasses(!!errors.price)}
                  placeholder="850000"
                />
                {errors.price && <p className="mt-1.5 text-xs text-red-600">{errors.price}</p>}
              </div>

              <div>
                <label
                  htmlFor="property-surface"
                  className="text-xs font-medium uppercase tracking-wider text-stone-500"
                >
                  Surface (m²)
                </label>
                <input
                  id="property-surface"
                  type="number"
                  min={0}
                  value={values.surface}
                  onChange={(event) => updateField("surface", event.target.value)}
                  aria-invalid={!!errors.surface}
                  className={inputClasses(!!errors.surface)}
                  placeholder="120"
                />
                {errors.surface && <p className="mt-1.5 text-xs text-red-600">{errors.surface}</p>}
              </div>

              <div>
                <label
                  htmlFor="property-bedrooms"
                  className="text-xs font-medium uppercase tracking-wider text-stone-500"
                >
                  Chambres
                </label>
                <input
                  id="property-bedrooms"
                  type="number"
                  min={0}
                  value={values.bedrooms}
                  onChange={(event) => updateField("bedrooms", event.target.value)}
                  aria-invalid={!!errors.bedrooms}
                  className={inputClasses(!!errors.bedrooms)}
                  placeholder="3"
                />
                {errors.bedrooms && <p className="mt-1.5 text-xs text-red-600">{errors.bedrooms}</p>}
              </div>

              <div>
                <label
                  htmlFor="property-bathrooms"
                  className="text-xs font-medium uppercase tracking-wider text-stone-500"
                >
                  Salles de bain
                </label>
                <input
                  id="property-bathrooms"
                  type="number"
                  min={0}
                  value={values.bathrooms}
                  onChange={(event) => updateField("bathrooms", event.target.value)}
                  aria-invalid={!!errors.bathrooms}
                  className={inputClasses(!!errors.bathrooms)}
                  placeholder="2"
                />
                {errors.bathrooms && <p className="mt-1.5 text-xs text-red-600">{errors.bathrooms}</p>}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="property-status" className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Statut
                </label>
                <select
                  id="property-status"
                  value={values.status}
                  onChange={(event) => updateField("status", event.target.value)}
                  className={`${inputClasses(false)} bg-white`}
                >
                  {STATUSES.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="property-slug" className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Slug (URL)
                </label>
                <input
                  id="property-slug"
                  type="text"
                  value={values.slug}
                  onChange={(event) => updateSlug(event.target.value)}
                  aria-invalid={!!errors.slug}
                  className={inputClasses(!!errors.slug)}
                  placeholder="villa-moderne-hammamet"
                />
                {errors.slug && <p className="mt-1.5 text-xs text-red-600">{errors.slug}</p>}
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={values.featured}
                onChange={toggleFeatured}
                className="h-4 w-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
              />
              Bien mis en avant (Coup de cœur / Premium)
            </label>

            <div>
              <label
                htmlFor="property-feature-draft"
                className="text-xs font-medium uppercase tracking-wider text-stone-500"
              >
                Équipements
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="property-feature-draft"
                  type="text"
                  value={featureDraft}
                  onChange={(event) => setFeatureDraft(event.target.value)}
                  onKeyDown={handleFeatureKeyDown}
                  className={inputClasses(false)}
                  placeholder="Piscine, Garage, Jardin..."
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="shrink-0 rounded-lg border border-stone-200 px-4 text-sm font-medium text-stone-700 transition-colors hover:border-amber-500 hover:text-amber-600"
                >
                  Ajouter
                </button>
              </div>
              {features.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 py-1 pl-3 pr-1.5 text-xs font-medium text-stone-700"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(feature)}
                        aria-label={`Retirer ${feature}`}
                        className="flex h-4 w-4 items-center justify-center rounded-full text-stone-400 hover:bg-stone-200 hover:text-stone-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <PropertyImageManager
          annonceId={annonceId}
          legacyImageUrl={legacyImageUrl}
          onUploadSummary={(summary) => {
            setUploadSummary(summary);
            setPhotosSettled(true);
          }}
        />

        {submitError && !justCreated && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          {justCreated ? (
            <button
              type="button"
              onClick={handleFinish}
              disabled={!photosSettled}
              className="w-full rounded-full bg-amber-500 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              {photosSettled ? "Terminé" : "Upload des photos..."}
            </button>
          ) : (
            <>
              <button
                type="submit"
                disabled={phase !== "idle"}
                className="w-full rounded-full bg-amber-500 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {phase === "saving"
                  ? "Enregistrement..."
                  : initialValues
                    ? "Enregistrer les modifications"
                    : "Ajouter le bien"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={phase !== "idle"}
                className="w-full rounded-full border border-stone-300 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-stone-700 transition-colors hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                Annuler
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
