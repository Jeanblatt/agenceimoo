"use client";

import { useState, type FormEvent } from "react";
import type { PropertyType } from "@/data/properties";

const propertyTypes: PropertyType[] = [
  "Villa",
  "Appartement",
  "Penthouse",
  "Terrain",
  "Maison traditionnelle",
  "Local commercial",
];

export interface SearchFilters {
  city: string;
  type: PropertyType | "";
  minPrice: string;
  maxPrice: string;
}

interface SearchFilterProps {
  /** Appelé à la soumission du formulaire. Prêt pour un futur branchement au filtrage des résultats. */
  onSearch?: (filters: SearchFilters) => void;
}

export default function SearchFilter({ onSearch }: SearchFilterProps) {
  const [city, setCity] = useState("");
  const [type, setType] = useState<PropertyType | "">("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch?.({ city, type, minPrice, maxPrice });
  };

  return (
    <div className="relative z-20 mx-auto -mt-16 max-w-6xl px-6 lg:px-8">
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl bg-white p-6 shadow-xl shadow-stone-900/10 ring-1 ring-stone-100 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_auto] lg:items-end lg:gap-4 lg:p-8"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="search-city" className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Ville
          </label>
          <input
            id="search-city"
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Tunis, Sousse, Hammamet..."
            className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="search-type" className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Type de bien
          </label>
          <select
            id="search-type"
            value={type}
            onChange={(event) => setType(event.target.value as PropertyType | "")}
            className="rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:outline-none"
          >
            <option value="">Tous types</option>
            {propertyTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="search-min-price" className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Prix minimum
          </label>
          <input
            id="search-min-price"
            type="number"
            min={0}
            inputMode="numeric"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="0 DT"
            className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="search-max-price" className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Prix maximum
          </label>
          <input
            id="search-max-price"
            type="number"
            min={0}
            inputMode="numeric"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Sans limite"
            className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-colors hover:bg-amber-400"
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
        </button>
      </form>
    </div>
  );
}
