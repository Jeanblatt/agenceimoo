"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ANNONCE_SORT_OPTIONS, isAnnonceSort, type AnnonceSort } from "@/lib/supabase/annonces";

const SORT_LABELS: Record<AnnonceSort, string> = {
  recent: "Plus récents",
  "prix-asc": "Prix croissant",
  "prix-desc": "Prix décroissant",
  "surface-asc": "Surface croissante",
  "surface-desc": "Surface décroissante",
};

// Composant de tri de /biens. Ne réécrit jamais l'URL au complet : part des
// searchParams actuels pour ne toucher que `tri` et laisser filtres/valeurs
// existants intacts (cf. PropertySearch.handleSubmit qui fait l'inverse).
export default function PropertySort() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawSort = searchParams.get("tri");
  const currentSort: AnnonceSort = isAnnonceSort(rawSort) ? rawSort : "recent";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "recent") {
      params.delete("tri");
    } else {
      params.set("tri", value);
    }

    const query = params.toString();
    router.push(query ? `/biens?${query}` : "/biens");
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="property-sort" className="text-stone-500">
        Trier par
      </label>
      <div className="relative">
        <select
          id="property-sort"
          value={currentSort}
          onChange={(event) => handleChange(event.target.value)}
          className="appearance-none rounded-field border border-border bg-surface py-2 pl-3 pr-8 text-sm text-charcoal focus:border-accent focus:outline-none"
        >
          {ANNONCE_SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {SORT_LABELS[option]}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
          strokeWidth={2}
        />
      </div>
    </div>
  );
}
