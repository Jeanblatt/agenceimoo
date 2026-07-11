"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { Property } from "@/data/properties";
import { formatPrice } from "@/utils/formatPrice";

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
  preload,
  index = 0,
}: PropertyCardProps) {
  const image = images?.[0];

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Position du pointeur normalisée (0-1) sur la carte, utilisée pour le tilt.
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const springConfig = { stiffness: 150, damping: 20, mass: 0.5 };
  const rotateX = useSpring(useTransform(pointerY, [0, 1], [7, -7]), springConfig);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-7, 7]), springConfig);

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
      transition={{ duration: 0.5, delay: Math.min(index, 6) * 0.06 }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      onPointerDown={updateTilt}
      onPointerMove={updateTilt}
      onPointerUp={resetTilt}
      onPointerLeave={resetTilt}
      onPointerCancel={resetTilt}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className="group relative overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200 transition-shadow duration-300 hover:shadow-xl hover:shadow-stone-900/10"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-200">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            preload={preload}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          // Placeholder tant que les visuels IA ne sont pas intégrés
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
        )}

        <span className="absolute left-4 top-4 rounded-full bg-stone-950/85 px-3 py-1 text-xs font-medium uppercase tracking-wider text-amber-400">
          {type}
        </span>

        {featured && (
          <span className="absolute right-4 top-4 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-950">
            Coup de cœur
          </span>
        )}
      </div>

      <div className="p-6">
        <h3 className="font-serif text-xl text-stone-900">{title}</h3>

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
          <span className="font-serif text-lg text-stone-900">{formatPrice(price)}</span>
          <Link
            href={`/properties/${id}`}
            className="shrink-0 text-sm font-medium uppercase tracking-wide text-amber-600 transition-colors hover:text-amber-700"
          >
            Voir détails →
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
