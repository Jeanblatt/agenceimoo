"use client";

import { useState, type ComponentType } from "react";
import { motion } from "framer-motion";
import {
  Ruler,
  BedDouble,
  Bath,
  Home,
  MapPin,
  CalendarCheck,
  CheckCircle2,
  Wind,
  Car,
  ArrowUpDown,
  ChefHat,
  Waves,
  Trees,
  ShieldCheck,
  type LucideProps,
} from "lucide-react";
import type { Property } from "@/data/properties";

interface PropertyInfoProps {
  property: Property;
}

type IconType = ComponentType<LucideProps>;

const DESCRIPTION_PREVIEW_LENGTH = 260;

// Association mot-clé → icône pour les équipements (property.features).
// Retombe sur une coche générique si aucun mot-clé ne correspond.
const FEATURE_ICONS: { keywords: string[]; icon: IconType }[] = [
  { keywords: ["climatisation"], icon: Wind },
  { keywords: ["parking", "garage"], icon: Car },
  { keywords: ["ascenseur"], icon: ArrowUpDown },
  { keywords: ["cuisine"], icon: ChefHat },
  { keywords: ["piscine"], icon: Waves },
  { keywords: ["jardin", "terrasse", "paysager"], icon: Trees },
  { keywords: ["gardien", "sécurité", "securite"], icon: ShieldCheck },
];

function getFeatureIcon(label: string): IconType {
  const normalized = label.toLowerCase();
  const match = FEATURE_ICONS.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword))
  );
  return match?.icon ?? CheckCircle2;
}

export default function PropertyInfo({ property }: PropertyInfoProps) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const isLongDescription = property.description.length > DESCRIPTION_PREVIEW_LENGTH;

  const characteristics: { icon: IconType; label: string; value: string }[] = [
    { icon: Ruler, label: "Surface", value: `${property.area} m²` },
    { icon: BedDouble, label: "Chambres", value: String(property.bedrooms) },
    ...(property.bathrooms !== undefined
      ? [{ icon: Bath, label: "Salles de bain", value: String(property.bathrooms) }]
      : []),
    { icon: Home, label: "Type de bien", value: property.type },
    { icon: MapPin, label: "Localisation", value: property.location },
    ...(property.status
      ? [{ icon: CalendarCheck, label: "Statut", value: property.status }]
      : []),
  ];

  return (
    <section className="mt-16">
      {/* Caractéristiques principales */}
      <div>
        <h2 className="font-serif text-2xl text-stone-900">
          Informations du bien
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characteristics.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="flex items-center gap-4 rounded-2xl bg-stone-50 p-5 ring-1 ring-stone-100 transition-shadow duration-300 hover:shadow-lg hover:shadow-stone-900/5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-950 text-amber-400">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-stone-500">
                    {item.label}
                  </p>
                  <p className="truncate font-serif text-lg text-stone-900">
                    {item.value}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div className="mt-12">
        <h2 className="font-serif text-2xl text-stone-900">
          Description du bien
        </h2>
        <p
          className={`mt-4 leading-relaxed text-stone-600 ${
            descriptionExpanded ? "" : "line-clamp-4"
          }`}
        >
          {property.description}
        </p>
        {isLongDescription && (
          <button
            type="button"
            onClick={() => setDescriptionExpanded((current) => !current)}
            className="mt-3 text-sm font-medium uppercase tracking-wide text-amber-600 transition-colors hover:text-amber-700"
          >
            {descriptionExpanded ? "Réduire" : "Lire plus"}
          </button>
        )}
      </div>

      {/* Équipements */}
      {property.features && property.features.length > 0 && (
        <div className="mt-12">
          <h2 className="font-serif text-2xl text-stone-900">Équipements</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {property.features.map((feature, index) => {
              const Icon = getFeatureIcon(feature);
              return (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: index * 0.04 }}
                  whileHover={{ y: -3 }}
                  className="flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-stone-100 transition-shadow duration-300 hover:shadow-md hover:shadow-stone-900/5"
                >
                  <Icon className="h-5 w-5 shrink-0 text-amber-500" strokeWidth={1.75} />
                  <span className="text-sm text-stone-700">{feature}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
