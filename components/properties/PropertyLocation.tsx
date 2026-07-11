"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Bus, GraduationCap, MapPin, ShoppingBag, UtensilsCrossed } from "lucide-react";
import type { Property } from "@/data/properties";

const PropertyMapView = dynamic(() => import("@/components/properties/PropertyMapView"), {
  ssr: false,
});

interface PropertyLocationProps {
  property: Property;
}

interface Coords {
  lat: number;
  lng: number;
}

type GeocodeStatus = "loading" | "success" | "error";

const NEARBY_CATEGORIES = [
  { icon: GraduationCap, label: "Écoles" },
  { icon: ShoppingBag, label: "Commerces" },
  { icon: UtensilsCrossed, label: "Restaurants" },
  { icon: Bus, label: "Transports" },
];

// Géocode l'adresse texte via Nominatim (OpenStreetMap, gratuit, sans clé)
// tant qu'aucune colonne latitude/longitude n'existe côté Supabase. Dès que
// ces champs seront renseignés, ils sont utilisés directement (plus fiable
// qu'un géocodage automatique) — voir la priorité ci-dessous.
function useGeocodedPosition(property: Property) {
  const [coords, setCoords] = useState<Coords | null>(
    property.latitude !== undefined && property.longitude !== undefined
      ? { lat: property.latitude, lng: property.longitude }
      : null
  );
  const [status, setStatus] = useState<GeocodeStatus>(coords ? "success" : "loading");

  useEffect(() => {
    if (coords) return;

    const query = property.address || property.location;
    if (!query) {
      setStatus("error");
      return;
    }

    const controller = new AbortController();

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=tn&q=${encodeURIComponent(query)}`,
      { signal: controller.signal }
    )
      .then((response) => response.json())
      .then((results: { lat: string; lon: string }[]) => {
        if (results.length === 0) {
          setStatus("error");
          return;
        }
        setCoords({ lat: Number(results[0].lat), lng: Number(results[0].lon) });
        setStatus("success");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setStatus("error");
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.id]);

  return { coords, status };
}

export default function PropertyLocation({ property }: PropertyLocationProps) {
  const { coords, status } = useGeocodedPosition(property);

  return (
    <section className="mt-12">
      <h2 className="font-serif text-2xl text-stone-900">Localisation</h2>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-stone-600">
        <p className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 shrink-0 text-amber-500" strokeWidth={1.75} />
          {property.address || property.location}
        </p>
        {property.city && property.city !== property.location && (
          <p className="text-sm text-stone-500">{property.city}</p>
        )}
      </div>

      <div className="mt-6 h-[400px] overflow-hidden rounded-2xl bg-stone-100 shadow-md ring-1 ring-stone-100">
        {status === "loading" && (
          <div className="h-full w-full animate-pulse bg-stone-200" />
        )}

        {status === "success" && coords && (
          <PropertyMapView latitude={coords.lat} longitude={coords.lng} title={property.title} />
        )}

        {status === "error" && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-stone-400">
            <MapPin className="h-8 w-8" strokeWidth={1.5} />
            <p className="text-sm">
              Carte interactive bientôt disponible pour ce bien.
            </p>
          </div>
        )}
      </div>

      {/* À proximité */}
      <div className="mt-10">
        <h3 className="font-serif text-xl text-stone-900">À proximité</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {NEARBY_CATEGORIES.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -3 }}
                className="flex flex-col items-center gap-3 rounded-2xl bg-stone-50 p-6 text-center ring-1 ring-stone-100 transition-shadow duration-300 hover:shadow-lg hover:shadow-stone-900/5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-950 text-amber-400">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <p className="text-sm font-medium text-stone-700">{item.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
