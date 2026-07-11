"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, MapPin, Share2 } from "lucide-react";
import type { Property } from "@/data/properties";
import { formatPrice } from "@/utils/formatPrice";
import ContactButton from "@/components/ContactButton";

interface PropertyDetailHeroProps {
  property: Property;
}

function PlaceholderTile() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-200 via-stone-100 to-stone-300">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        className="h-16 w-16 text-stone-400"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6"
        />
      </svg>
    </div>
  );
}

// Reçoit le bien déjà normalisé (via getAnnonceById) en prop — aucune
// récupération de données ici. Prêt pour un futur champ "is_premium" côté
// Supabase : property.featured pilote déjà le badge Premium.
export default function PropertyDetailHero({ property }: PropertyDetailHeroProps) {
  const images = property.images ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const activeImage = images[activeIndex];

  const handleShare = async () => {
    const shareData = {
      title: property.title,
      text: `${property.title} — ${property.location}`,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Partage annulé par l'utilisateur : rien à faire.
      }
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard && shareData.url) {
      await navigator.clipboard.writeText(shareData.url);
    }
  };

  return (
    <section>
      {/* Galerie */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-stone-200">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="group absolute inset-0 overflow-hidden"
          >
            {activeImage ? (
              <Image
                src={activeImage}
                alt={`${property.title} — photo ${activeIndex + 1}`}
                fill
                preload
                sizes="(min-width: 1024px) 900px, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <PlaceholderTile />
            )}
          </motion.div>
        </AnimatePresence>

        {property.featured && (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-950">
            Premium
          </span>
        )}

        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <button
            type="button"
            onClick={() => setFavorite((current) => !current)}
            aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            aria-pressed={favorite}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md transition-colors hover:bg-white"
          >
            <Heart className={`h-4 w-4 ${favorite ? "fill-amber-500 text-amber-500" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Partager cette annonce"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md transition-colors hover:bg-white"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {images.length > 1 && (
        <div
          className="mt-4 grid gap-3"
          style={{ gridTemplateColumns: `repeat(${Math.min(images.length, 6)}, minmax(0, 1fr))` }}
        >
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Voir la photo ${index + 1}`}
              aria-current={index === activeIndex}
              className={`group relative aspect-square overflow-hidden rounded-lg ring-2 transition-colors ${
                index === activeIndex
                  ? "ring-amber-500"
                  : "ring-transparent hover:ring-stone-300"
              }`}
            >
              <Image
                src={src}
                alt={`${property.title} — miniature ${index + 1}`}
                fill
                sizes="150px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </button>
          ))}
        </div>
      )}

      {/* Informations */}
      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-block rounded-full bg-stone-950 px-3 py-1 text-xs font-medium uppercase tracking-wider text-amber-400">
            {property.type}
          </span>

          <h1 className="mt-4 font-serif text-3xl text-stone-900 sm:text-4xl">
            {property.title}
          </h1>

          <p className="mt-2 flex items-center gap-1.5 text-stone-500">
            <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {property.location}
          </p>
        </div>

        <div className="lg:text-right">
          <p className="font-serif text-3xl text-stone-900 sm:text-4xl">
            {formatPrice(property.price)}
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Prix affiché, hors frais d&apos;agence
          </p>
        </div>
      </div>

      {/* Boutons */}
      <div className="mt-6">
        <ContactButton propertyTitle={property.title} />
      </div>
    </section>
  );
}
