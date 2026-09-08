"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Share2 } from "lucide-react";
import type { Property } from "@/data/properties";
import { formatPrice } from "@/utils/formatPrice";
import { getPropertyStatusLabel, getTransactionLabel } from "@/config/catalog";
import ContactButton from "@/components/ContactButton";
import FavoriteButton from "@/components/FavoriteButton";
import IconButton from "@/components/ui/IconButton";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";

interface PropertyDetailHeroProps {
  property: Property;
}

// Reçoit le bien déjà normalisé (via getAnnonceById) en prop — aucune
// récupération de données ici. Prêt pour un futur champ "is_premium" côté
// Supabase : property.featured pilote déjà le badge Premium.
export default function PropertyDetailHero({ property }: PropertyDetailHeroProps) {
  const images = property.images ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
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
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-card bg-stone-200">
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
                src={activeImage.url}
                alt={activeImage.alt || `${property.title} — photo ${activeIndex + 1}`}
                fill
                preload
                sizes="(min-width: 1024px) 900px, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <ImagePlaceholder />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="absolute left-4 top-4 z-10 flex flex-col items-start gap-2">
          {property.featured && (
            <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-950">
              Premium
            </span>
          )}
          {property.status === "reserved" && (
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-charcoal ring-1 ring-border">
              {getPropertyStatusLabel(property.status)}
            </span>
          )}
        </div>

        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <FavoriteButton propertyId={property.id} />
          <IconButton onClick={handleShare} aria-label="Partager cette annonce">
            <Share2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-6">
          {images.map((image, index) => (
            <button
              key={image.id}
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
                src={image.url}
                alt={image.alt || `${property.title} — miniature ${index + 1}`}
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
          <div className="flex flex-wrap gap-2">
            <span className="inline-block rounded-full bg-ink px-3 py-1 text-xs font-medium uppercase tracking-wider text-amber-400">
              {property.type}
            </span>
            {property.transaction && (
              <span className="inline-block rounded-full bg-ink px-3 py-1 text-xs font-medium uppercase tracking-wider text-white">
                {getTransactionLabel(property.transaction)}
              </span>
            )}
          </div>

          <h1 className="mt-4 font-serif text-3xl text-charcoal sm:text-4xl">
            {property.title}
          </h1>

          <p className="mt-2 flex items-center gap-1.5 text-stone-500">
            <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {property.location}
          </p>
        </div>

        <div className="lg:text-right">
          <p className="font-serif text-3xl text-charcoal sm:text-4xl">
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
