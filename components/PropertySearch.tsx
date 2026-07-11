"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const LOCATIONS = ["Tunis", "La Marsa", "Carthage", "Ariana", "Sousse", "Hammamet", "Nabeul"];
const PROPERTY_TYPES = ["Appartement", "Villa", "Maison", "Terrain", "Local commercial", "Bureau"];

interface SearchState {
  location: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  surface: string;
}

const emptySearch: SearchState = {
  location: "",
  propertyType: "",
  minPrice: "",
  maxPrice: "",
  surface: "",
};

const fieldClasses =
  "mt-1.5 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/50 backdrop-blur-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400";
const labelClasses = "text-xs font-medium uppercase tracking-wider text-white/70";

export default function PropertySearch() {
  const router = useRouter();
  const [values, setValues] = useState<SearchState>(emptySearch);

  const updateField = (field: keyof SearchState, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (values.location) params.set("localisation", values.location);
    if (values.propertyType) params.set("type", values.propertyType);
    if (values.minPrice) params.set("prixMin", values.minPrice);
    if (values.maxPrice) params.set("prixMax", values.maxPrice);
    if (values.surface) params.set("surfaceMin", values.surface);

    const query = params.toString();
    router.push(query ? `/annonces?${query}` : "/annonces");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3 }}
      className="w-full rounded-[20px] border border-white/20 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8"
    >
      <h2 className="font-serif text-xl text-white">Rechercher un bien</h2>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="search-location" className={labelClasses}>
            Localisation
          </label>
          <select
            id="search-location"
            value={values.location}
            onChange={(event) => updateField("location", event.target.value)}
            className={`${fieldClasses} appearance-none bg-white/10`}
          >
            <option className="text-stone-900" value="">
              Toutes les villes
            </option>
            {LOCATIONS.map((city) => (
              <option className="text-stone-900" key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="search-type" className={labelClasses}>
            Type de bien
          </label>
          <select
            id="search-type"
            value={values.propertyType}
            onChange={(event) => updateField("propertyType", event.target.value)}
            className={`${fieldClasses} appearance-none bg-white/10`}
          >
            <option className="text-stone-900" value="">
              Tous types
            </option>
            {PROPERTY_TYPES.map((type) => (
              <option className="text-stone-900" key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="search-min-price" className={labelClasses}>
              Prix minimum
            </label>
            <input
              id="search-min-price"
              type="number"
              min={0}
              inputMode="numeric"
              value={values.minPrice}
              onChange={(event) => updateField("minPrice", event.target.value)}
              placeholder="0 DT"
              className={fieldClasses}
            />
          </div>
          <div>
            <label htmlFor="search-max-price" className={labelClasses}>
              Prix maximum
            </label>
            <input
              id="search-max-price"
              type="number"
              min={0}
              inputMode="numeric"
              value={values.maxPrice}
              onChange={(event) => updateField("maxPrice", event.target.value)}
              placeholder="Sans limite"
              className={fieldClasses}
            />
          </div>
        </div>

        <div>
          <label htmlFor="search-surface" className={labelClasses}>
            Surface minimum (m²)
          </label>
          <input
            id="search-surface"
            type="number"
            min={0}
            inputMode="numeric"
            value={values.surface}
            onChange={(event) => updateField("surface", event.target.value)}
            placeholder="0 m²"
            className={fieldClasses}
          />
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-blue-950/40 transition-colors hover:bg-blue-500"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-4 w-4"
          >
            <circle cx="11" cy="11" r="7" strokeLinecap="round" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5" />
          </svg>
          Rechercher
        </motion.button>
      </form>
    </motion.div>
  );
}
