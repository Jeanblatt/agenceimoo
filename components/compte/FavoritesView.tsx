"use client";

import { useEffect, useState } from "react";
import PropertyGrid from "@/components/PropertyGrid";
import { getMyFavoriteProperties } from "@/lib/supabase/favorites";
import type { Property } from "@/data/properties";

export default function FavoritesView() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { properties: data, error: fetchError } = await getMyFavoriteProperties();
      setProperties(data);
      setError(fetchError);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-stone-900">Mes favoris</h1>
        <p className="mt-1 text-sm text-stone-500">
          {properties.length} bien{properties.length !== 1 ? "s" : ""} sauvegardé
          {properties.length !== 1 ? "s" : ""}.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger vos favoris : {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-stone-500">Chargement...</p>
      ) : (
        <PropertyGrid properties={properties} />
      )}
    </div>
  );
}
