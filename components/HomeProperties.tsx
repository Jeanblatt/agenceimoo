"use client";

import { useMemo, useState } from "react";
import SearchFilter, { type SearchFilters } from "@/components/SearchFilter";
import PropertyGrid from "@/components/PropertyGrid";
import type { Property } from "@/data/properties";

const emptyFilters: SearchFilters = {
  city: "",
  type: "",
  minPrice: "",
  maxPrice: "",
};

const features = [
  {
    title: "Expertise locale",
    description:
      "Une connaissance fine des marchés les plus prisés de Tunisie, du Grand Tunis à la côte de Hammamet et Sousse.",
  },
  {
    title: "Accompagnement sur mesure",
    description:
      "Un conseiller dédié à chaque étape, de la première visite jusqu'à la signature chez le notaire.",
  },
  {
    title: "Réseau international",
    description:
      "Une visibilité auprès d'une clientèle exigeante, en Tunisie comme à l'international.",
  },
];

interface HomePropertiesProps {
  properties: Property[];
  error: string | null;
}

export default function HomeProperties({ properties, error }: HomePropertiesProps) {
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);

  const filteredProperties = useMemo(() => {
    const city = filters.city.trim().toLowerCase();
    const min = filters.minPrice === "" ? null : Number(filters.minPrice);
    const max = filters.maxPrice === "" ? null : Number(filters.maxPrice);

    return properties.filter((property) => {
      const matchesCity =
        city === "" || property.location.toLowerCase().includes(city);
      const matchesType = filters.type === "" || property.type === filters.type;
      const matchesMin = min === null || property.price >= min;
      const matchesMax = max === null || property.price <= max;

      return matchesCity && matchesType && matchesMin && matchesMax;
    });
  }, [filters, properties]);

  return (
    <>
      <SearchFilter onSearch={setFilters} />

      <section id="services" className="bg-stone-50 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-600">
              Pourquoi Horizon
            </p>
            <h2 className="mt-3 font-serif text-3xl text-stone-900 sm:text-4xl">
              Une approche sur mesure de l&apos;immobilier de prestige
            </h2>
          </div>

          <div className="mt-16 grid gap-10 sm:grid-cols-3">
            {features.map((feature, index) => (
              <div key={feature.title} className="text-center">
                <span className="font-serif text-3xl text-amber-500">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-serif text-xl text-stone-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="biens" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-amber-600">
                Sélection
              </p>
              <h2 className="mt-3 font-serif text-3xl text-stone-900 sm:text-4xl">
                Nos biens d&apos;exception
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                {filteredProperties.length} bien
                {filteredProperties.length !== 1 ? "s" : ""} trouvé
                {filteredProperties.length !== 1 ? "s" : ""}
              </p>
            </div>
            <a
              href="#contact"
              className="text-sm font-medium uppercase tracking-wide text-stone-900 underline underline-offset-4 transition-colors hover:text-amber-600"
            >
              Voir tous les biens
            </a>
          </div>

          <div className="mt-14">
            {error ? (
              <p className="py-16 text-center text-sm text-red-600">
                Une erreur est survenue lors du chargement des annonces. Merci de réessayer plus tard.
              </p>
            ) : (
              <PropertyGrid properties={filteredProperties} />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
