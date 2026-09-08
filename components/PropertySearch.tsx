"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import Button from "@/components/ui/Button";
import { catalog } from "@/config/catalog";
import { content } from "@/config/content";

export type PropertySearchTone = "onLight" | "onDark";

interface SearchValues {
  localisation: string;
  type: string;
  prixMin: string;
  prixMax: string;
  surfaceMin: string;
  chambresMin: string;
}

function toSearchValues(
  localisation: string | null,
  type: string | null,
  prixMin: string | null,
  prixMax: string | null,
  surfaceMin: string | null,
  chambresMin: string | null
): SearchValues {
  return {
    localisation: localisation ?? "",
    type: type ?? "",
    prixMin: prixMin ?? "",
    prixMax: prixMax ?? "",
    surfaceMin: surfaceMin ?? "",
    chambresMin: chambresMin ?? "",
  };
}

const LIGHT_FIELD_CLASSES =
  "mt-1.5 w-full rounded-field border border-border bg-surface px-4 py-3 text-sm text-charcoal placeholder:text-stone-400 focus:border-accent focus:outline-none";
const LIGHT_LABEL_CLASSES = "text-xs font-medium uppercase tracking-wider text-stone-500";

const DARK_FIELD_CLASSES =
  "mt-1.5 w-full rounded-field border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/50 backdrop-blur-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400";
const DARK_LABEL_CLASSES = "text-xs font-medium uppercase tracking-wider text-white/70";

interface PropertySearchProps {
  /** onLight (défaut) : carte claire pour /biens. onDark : panneau verre dépoli pour le Hero sombre. */
  tone?: PropertySearchTone;
}

// Composant de recherche unique (avant V2.1, deux implémentations
// distinctes coexistaient — l'une dans le Hero, l'autre sur /biens — avec
// des styles, routes cibles et jeux de champs différents). Redirige
// systématiquement vers /biens, la page de listing canonique, quel que soit
// le contexte visuel (`tone`).
export default function PropertySearch({ tone = "onLight" }: PropertySearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramLocalisation = searchParams.get("localisation");
  const paramType = searchParams.get("type");
  const paramPrixMin = searchParams.get("prixMin");
  const paramPrixMax = searchParams.get("prixMax");
  const paramSurfaceMin = searchParams.get("surfaceMin");
  const paramChambresMin = searchParams.get("chambresMin");

  // Pré-remplit le formulaire avec les filtres déjà actifs dans l'URL (ex.
  // lien partagé, retour navigateur) — avant, le formulaire repartait
  // toujours vide même quand des résultats filtrés étaient déjà affichés.
  const [values, setValues] = useState<SearchValues>(() =>
    toSearchValues(paramLocalisation, paramType, paramPrixMin, paramPrixMax, paramSurfaceMin, paramChambresMin)
  );

  // Resynchronise le formulaire quand l'URL change pour une raison externe
  // (bouton "Réinitialiser la recherche", retour navigateur, lien partagé) —
  // sans ça, l'état local restait figé sur les valeurs du montage initial
  // tant que React réutilisait la même instance du composant. Dépend des 6
  // champs individuellement (pas de searchParams.toString() global) pour
  // qu'un changement de `tri` seul (géré par PropertySort) ne redéclenche
  // pas cette resynchronisation et n'écrase pas une saisie en cours dans un
  // champ sans rapport.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(toSearchValues(paramLocalisation, paramType, paramPrixMin, paramPrixMax, paramSurfaceMin, paramChambresMin));
  }, [paramLocalisation, paramType, paramPrixMin, paramPrixMax, paramSurfaceMin, paramChambresMin]);

  const updateField = (field: keyof SearchValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (values.localisation) params.set("localisation", values.localisation);
    if (values.type) params.set("type", values.type);
    if (values.prixMin) params.set("prixMin", values.prixMin);
    if (values.prixMax) params.set("prixMax", values.prixMax);
    if (values.surfaceMin) params.set("surfaceMin", values.surfaceMin);
    if (values.chambresMin) params.set("chambresMin", values.chambresMin);

    // Le tri actif ne fait pas partie de ce formulaire (contrôlé par
    // PropertySort) mais doit survivre à une nouvelle soumission des filtres.
    const currentSort = searchParams.get("tri");
    if (currentSort) params.set("tri", currentSort);

    const query = params.toString();
    router.push(query ? `/biens?${query}` : "/biens");
  };

  if (tone === "onDark") {
    return (
      <div className="w-full rounded-card border border-white/20 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
        <h2 className="font-serif text-xl text-white">Rechercher un bien</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="search-localisation" className={DARK_LABEL_CLASSES}>
              Localisation
            </label>
            <input
              id="search-localisation"
              type="text"
              value={values.localisation}
              onChange={(event) => updateField("localisation", event.target.value)}
              placeholder={content.placeholders.searchLocation}
              className={DARK_FIELD_CLASSES}
            />
          </div>

          <div>
            <label htmlFor="search-type" className={DARK_LABEL_CLASSES}>
              Type de bien
            </label>
            <select
              id="search-type"
              value={values.type}
              onChange={(event) => updateField("type", event.target.value)}
              className={`${DARK_FIELD_CLASSES} appearance-none bg-white/10`}
            >
              <option className="text-stone-900" value="">
                Tous types
              </option>
              {catalog.propertyTypes.map((type) => (
                <option className="text-stone-900" key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="w-full">
            <Search className="h-4 w-4" strokeWidth={2} />
            Rechercher
          </Button>
        </form>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card bg-surface p-6 shadow-xl shadow-stone-900/10 ring-1 ring-border lg:p-8"
    >
      {/* Ligne 1 : localisation, type, chambres */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="search-localisation" className={LIGHT_LABEL_CLASSES}>
            Localisation
          </label>
          <input
            id="search-localisation"
            type="text"
            value={values.localisation}
            onChange={(event) => updateField("localisation", event.target.value)}
            placeholder={content.placeholders.searchLocation}
            className={LIGHT_FIELD_CLASSES}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="search-type" className={LIGHT_LABEL_CLASSES}>
            Type de bien
          </label>
          <select
            id="search-type"
            value={values.type}
            onChange={(event) => updateField("type", event.target.value)}
            className={LIGHT_FIELD_CLASSES}
          >
            <option value="">Tous types</option>
            {catalog.propertyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="search-chambres" className={LIGHT_LABEL_CLASSES}>
            Chambres minimum
          </label>
          <input
            id="search-chambres"
            type="number"
            min={0}
            inputMode="numeric"
            value={values.chambresMin}
            onChange={(event) => updateField("chambresMin", event.target.value)}
            placeholder="0"
            className={LIGHT_FIELD_CLASSES}
          />
        </div>
      </div>

      {/* Ligne 2 : prix, surface, CTA */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="search-prix-min" className={LIGHT_LABEL_CLASSES}>
            Prix minimum
          </label>
          <input
            id="search-prix-min"
            type="number"
            min={0}
            inputMode="numeric"
            value={values.prixMin}
            onChange={(event) => updateField("prixMin", event.target.value)}
            placeholder={`0 ${catalog.currencyDisplay}`}
            className={LIGHT_FIELD_CLASSES}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="search-prix-max" className={LIGHT_LABEL_CLASSES}>
            Prix maximum
          </label>
          <input
            id="search-prix-max"
            type="number"
            min={0}
            inputMode="numeric"
            value={values.prixMax}
            onChange={(event) => updateField("prixMax", event.target.value)}
            placeholder="Sans limite"
            className={LIGHT_FIELD_CLASSES}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="search-surface" className={LIGHT_LABEL_CLASSES}>
            Surface minimum (m²)
          </label>
          <input
            id="search-surface"
            type="number"
            min={0}
            inputMode="numeric"
            value={values.surfaceMin}
            onChange={(event) => updateField("surfaceMin", event.target.value)}
            placeholder="0 m²"
            className={LIGHT_FIELD_CLASSES}
          />
        </div>

        <Button type="submit" size="compact" className="min-h-11">
          <Search className="h-4 w-4" strokeWidth={2} />
          Rechercher
        </Button>
      </div>
    </form>
  );
}
