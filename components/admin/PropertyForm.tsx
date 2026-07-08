"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { AdminProperty, AdminPropertyStatus } from "@/data/adminProperties";
import type { PropertyType } from "@/data/properties";

const TYPES: PropertyType[] = [
  "Villa",
  "Appartement",
  "Penthouse",
  "Terrain",
  "Maison traditionnelle",
  "Local commercial",
];
const STATUSES: AdminPropertyStatus[] = ["Disponible", "Réservé", "Vendu"];

export interface PropertyFormValues {
  title: string;
  description: string;
  location: string;
  type: PropertyType;
  price: number;
  surface: number;
  bedrooms: number;
  status: AdminPropertyStatus;
  image: string;
}

interface PropertyFormProps {
  initialValues?: AdminProperty;
  onSubmit: (values: PropertyFormValues) => void;
  onCancel: () => void;
}

interface RawValues {
  title: string;
  description: string;
  location: string;
  type: PropertyType;
  price: string;
  surface: string;
  bedrooms: string;
  status: AdminPropertyStatus;
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

  return errors;
}

const fieldClasses =
  "mt-1.5 w-full rounded-lg border px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none";

function inputClasses(hasError: boolean) {
  return `${fieldClasses} ${
    hasError ? "border-red-400 focus:border-red-500" : "border-stone-200 focus:border-amber-500"
  }`;
}

const DEFAULT_IMAGE = "/images/properties/appartement-1/exterior.jpg";

export default function PropertyForm({
  initialValues,
  onSubmit,
  onCancel,
}: PropertyFormProps) {
  const [values, setValues] = useState<RawValues>({
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    location: initialValues?.location ?? "",
    type: initialValues?.type ?? "Appartement",
    price: initialValues ? String(initialValues.price) : "",
    surface: initialValues ? String(initialValues.surface) : "",
    bedrooms: initialValues ? String(initialValues.bedrooms) : "",
    status: initialValues?.status ?? "Disponible",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [images, setImages] = useState<string[]>(
    initialValues ? [initialValues.image] : []
  );

  const updateField = (field: keyof RawValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    // Simulation : pas d'upload réel, on prévisualise localement.
    const newUrls = Array.from(files).map((file) => URL.createObjectURL(file));
    setImages((current) => [...current, ...newUrls]);
    event.target.value = "";
  };

  const removeImage = (url: string) => {
    setImages((current) => current.filter((img) => img !== url));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      location: values.location.trim(),
      type: values.type,
      price: Number(values.price),
      surface: Number(values.surface),
      bedrooms: Number(values.bedrooms),
      status: values.status,
      image: images[0] ?? DEFAULT_IMAGE,
    });
  };

  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-100 sm:p-8">
      <h2 className="font-serif text-xl text-stone-900">
        {initialValues ? "Modifier le bien" : "Ajouter un bien"}
      </h2>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <div>
          <label htmlFor="property-title" className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Titre
          </label>
          <input
            id="property-title"
            type="text"
            value={values.title}
            onChange={(event) => updateField("title", event.target.value)}
            aria-invalid={!!errors.title}
            className={inputClasses(!!errors.title)}
            placeholder="Villa moderne avec piscine"
          />
          {errors.title && <p className="mt-1.5 text-xs text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="property-description" className="text-xs font-medium uppercase tracking-wider text-stone-500">
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
            <label htmlFor="property-location" className="text-xs font-medium uppercase tracking-wider text-stone-500">
              Localisation
            </label>
            <input
              id="property-location"
              type="text"
              value={values.location}
              onChange={(event) => updateField("location", event.target.value)}
              aria-invalid={!!errors.location}
              className={inputClasses(!!errors.location)}
              placeholder="Tunis, Tunisie"
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

        <div className="grid gap-5 sm:grid-cols-3">
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
            <label htmlFor="property-surface" className="text-xs font-medium uppercase tracking-wider text-stone-500">
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
            <label htmlFor="property-bedrooms" className="text-xs font-medium uppercase tracking-wider text-stone-500">
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
        </div>

        <div>
          <label htmlFor="property-status" className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Statut
          </label>
          <select
            id="property-status"
            value={values.status}
            onChange={(event) => updateField("status", event.target.value)}
            className={`${inputClasses(false)} bg-white sm:max-w-xs`}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Images
          </span>
          <label className="mt-1.5 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-stone-300 px-4 py-6 text-sm text-stone-500 transition-colors hover:border-amber-500 hover:text-amber-600">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
            Cliquez pour ajouter des photos (simulation)
          </label>

          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((url) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-lg bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element -- prévisualisation locale (blob:/chemin statique), non gérable par next/image */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    aria-label="Retirer l'image"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-stone-950/70 text-xs text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            type="submit"
            className="rounded-full bg-amber-500 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-[1.02]"
          >
            {initialValues ? "Enregistrer les modifications" : "Ajouter le bien"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-stone-300 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-stone-700 transition-colors hover:border-stone-400"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
