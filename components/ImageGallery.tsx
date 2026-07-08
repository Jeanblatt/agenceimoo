"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

interface ImageGalleryProps {
  /** URLs des images du bien. Laisser vide en attendant les visuels IA. */
  images?: string[];
  title: string;
}

const PLACEHOLDER_COUNT = 4;

function PlaceholderTile({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-200 via-stone-100 to-stone-300 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        className="h-12 w-12 text-stone-400"
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

function ArrowButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Photo précédente" : "Photo suivante"}
      className={`absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-lg transition-transform hover:scale-105 hover:bg-white ${
        direction === "prev" ? "left-4" : "right-4"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={direction === "prev" ? "m15 19-7-7 7-7" : "m9 5 7 7-7 7"}
        />
      </svg>
    </button>
  );
}

export default function ImageGallery({ images = [], title }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  // Prêt à recevoir des visuels IA : tant qu'aucune image réelle n'est fournie,
  // on affiche des vignettes placeholder pour conserver la mise en page finale.
  const slots = images.length > 0 ? images : new Array(PLACEHOLDER_COUNT).fill(null);
  const activeImage = images[activeIndex];

  const goTo = (index: number) => {
    setActiveIndex((index + slots.length) % slots.length);
  };

  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-stone-200">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {activeImage ? (
              <Image
                src={activeImage}
                alt={`${title} — photo ${activeIndex + 1}`}
                fill
                preload
                sizes="(min-width: 1024px) 800px, 100vw"
                className="object-cover"
              />
            ) : (
              <PlaceholderTile />
            )}
          </motion.div>
        </AnimatePresence>

        {slots.length > 1 && (
          <>
            <ArrowButton direction="prev" onClick={() => goTo(activeIndex - 1)} />
            <ArrowButton direction="next" onClick={() => goTo(activeIndex + 1)} />
          </>
        )}
      </div>

      {slots.length > 1 && (
        <div
          className="mt-4 grid gap-3"
          style={{ gridTemplateColumns: `repeat(${Math.min(slots.length, 6)}, minmax(0, 1fr))` }}
        >
          {slots.map((src, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Voir la photo ${index + 1}`}
              aria-current={index === activeIndex}
              className={`relative aspect-square overflow-hidden rounded-lg ring-2 transition-colors ${
                index === activeIndex
                  ? "ring-amber-500"
                  : "ring-transparent hover:ring-stone-300"
              }`}
            >
              {src ? (
                <Image
                  src={src}
                  alt={`${title} — miniature ${index + 1}`}
                  fill
                  sizes="150px"
                  className="object-cover"
                />
              ) : (
                <PlaceholderTile />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
