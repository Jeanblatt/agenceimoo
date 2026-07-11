"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const PROPERTY_TYPES = ["Appartement", "Villa", "Maison", "Terrain", "Local commercial", "Bureau"];

interface SearchValues {
  type: string;
  ville: string;
  budgetMax: string;
  surfaceMin: string;
}

const emptyValues: SearchValues = {
  type: "",
  ville: "",
  budgetMax: "",
  surfaceMin: "",
};

const fieldClasses =
  "mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none";
const labelClasses = "text-xs font-medium uppercase tracking-wider text-stone-500";

export default function PropertySearch() {
  const router = useRouter();
  const [values, setValues] = useState<SearchValues>(emptyValues);

  const updateField = (field: keyof SearchValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (values.type) params.set("type", values.type);
    if (values.ville) params.set("localisation", values.ville);
    if (values.budgetMax) params.set("prixMax", values.budgetMax);
    if (values.surfaceMin) params.set("surfaceMin", values.surfaceMin);

    const query = params.toString();
    router.push(query ? `/biens?${query}` : "/biens");
  };

  return (
    <div className="relative z-20 mx-auto -mt-16 max-w-6xl px-6 lg:px-8">
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl bg-white p-6 shadow-xl shadow-stone-900/10 ring-1 ring-stone-100 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.8fr_0.8fr_auto] lg:items-end lg:gap-4 lg:p-8"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="biens-type" className={labelClasses}>
            Type de bien
          </label>
          <select
            id="biens-type"
            value={values.type}
            onChange={(event) => updateField("type", event.target.value)}
            className={`${fieldClasses} bg-white`}
          >
            <option value="">Tous types</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="biens-ville" className={labelClasses}>
            Ville
          </label>
          <input
            id="biens-ville"
            type="text"
            value={values.ville}
            onChange={(event) => updateField("ville", event.target.value)}
            placeholder="Tunis, Sousse, Hammamet..."
            className={fieldClasses}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="biens-budget" className={labelClasses}>
            Budget max
          </label>
          <input
            id="biens-budget"
            type="number"
            min={0}
            inputMode="numeric"
            value={values.budgetMax}
            onChange={(event) => updateField("budgetMax", event.target.value)}
            placeholder="Sans limite"
            className={fieldClasses}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="biens-surface" className={labelClasses}>
            Surface min
          </label>
          <input
            id="biens-surface"
            type="number"
            min={0}
            inputMode="numeric"
            value={values.surfaceMin}
            onChange={(event) => updateField("surfaceMin", event.target.value)}
            placeholder="0 m²"
            className={fieldClasses}
          />
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-colors hover:bg-amber-400"
        >
          <Search className="h-4 w-4" strokeWidth={2} />
          Rechercher
        </button>
      </form>
    </div>
  );
}
