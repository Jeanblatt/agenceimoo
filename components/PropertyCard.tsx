"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { Property } from "@/data/properties";
import { formatPrice } from "@/utils/formatPrice";
import { getPropertyStatusLabel, getTransactionLabel } from "@/config/catalog";
import FavoriteButton from "@/components/FavoriteButton";
import Button from "@/components/ui/Button";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import { cardTiltSpring, hoverLift, tapScale, staggerDelay } from "@/lib/motion";

export interface PropertyCardProps extends Property {
  /** À réserver aux cartes visibles dès le premier écran (ex. début de grille). */
  preload?: boolean;
  /** Position dans la grille, utilisée pour l'effet de cascade à l'apparition. */
  index?: number;
}

export default function PropertyCard({
  id,
  title,
  description,
  location,
  price,
  type,
  bedrooms,
  area,
  images,
  featured,
  status,
  transaction,
  preload,
  index = 0,
}: PropertyCardProps) {
  const image = images?.[0];

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    // Lu uniquement après le montage (côté client) : window n'existe pas au
    // rendu serveur, donc impossible de le mettre dans l'état initial sans
    // provoquer un mismatch d'hydratation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Position du pointeur normalisée (0-1) sur la carte, utilisée pour le tilt.
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(pointerY, [0, 1], [7, -7]), cardTiltSpring);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-7, 7]), cardTiltSpring);

  const cardRef = useRef<HTMLElement>(null);

  // Tilt 3D actif à la souris (survol) comme au doigt (appui) : seul le
  // défilement de page n'est jamais entravé (pas de preventDefault ici).
  const updateTilt = (event: ReactPointerEvent<HTMLElement>) => {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width);
    pointerY.set((event.clientY - rect.top) / rect.height);
  };

  const resetTilt = () => {
    pointerX.set(0.5);
    pointerY.set(0.5);
  };

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: staggerDelay(index) }}
      whileHover={hoverLift}
      whileTap={tapScale}
      onPointerDown={updateTilt}
      onPointerMove={updateTilt}
      onPointerUp={resetTilt}
      onPointerLeave={resetTilt}
      onPointerCancel={resetTilt}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className="group relative overflow-hidden rounded-card bg-surface ring-1 ring-border transition-shadow duration-300 hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-200">
        {image ? (
          <Image
            src={image.url}
            alt={title}
            fill
            preload={preload}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          // Placeholder tant que les visuels IA ne sont pas intégrés
          <ImagePlaceholder />
        )}

        <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
          <span className="rounded-full bg-ink/85 px-3 py-1 text-xs font-medium uppercase tracking-wider text-amber-400">
            {type}
          </span>
          {transaction && (
            <span className="rounded-full bg-ink/85 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white">
              {getTransactionLabel(transaction)}
            </span>
          )}
        </div>

        <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
          {featured && (
            <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-950">
              Coup de cœur
            </span>
          )}
          {status === "reserved" && (
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-charcoal ring-1 ring-border">
              {getPropertyStatusLabel(status)}
            </span>
          )}
        </div>

        <div className="absolute bottom-4 right-4">
          <FavoriteButton propertyId={id} />
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-serif text-xl text-charcoal">{title}</h3>

        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-stone-500">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-4 w-4 shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z"
            />
            <circle cx="12" cy="9.5" r="2.25" strokeLinecap="round" />
          </svg>
          {location}
        </p>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-stone-500">
          {description}
        </p>

        <div className="mt-4 flex items-center gap-4 border-y border-stone-100 py-4 text-sm text-stone-600">
          {bedrooms > 0 && <span>{bedrooms} ch.</span>}
          <span>{area} m²</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="font-serif text-lg text-charcoal">{formatPrice(price)}</span>
          {/* p-3/-m-3 (au lieu de p-2/-m-2) : porte la zone tactile à ~44px
              de hauteur (V3.3.Q.1.8) sans déplacer le texte ni le prix
              voisin — la marge négative annule exactement le padding ajouté. */}
          <Button href={`/properties/${id}`} variant="ghost" className="-m-3 shrink-0 p-3">
            Voir détails →
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
