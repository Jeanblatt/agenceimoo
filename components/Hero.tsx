"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const HERO_IMAGES = [
  { src: "/hero1.webp", alt: "Villa de prestige avec piscine à débordement, vue sur les collines" },
  { src: "/hero2.webp", alt: "Intérieur design d'une villa avec vue panoramique" },
  { src: "/hero3.webp", alt: "Vue aérienne d'une résidence moderne avec piscine et jardin paysager" },
];

const SLIDE_INTERVAL_MS = 6000;

export default function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    // Respecte la préférence utilisateur : pas de diaporama automatique si
    // les animations sont réduites (la première image reste affichée).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % HERO_IMAGES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="accueil"
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-stone-950 py-28"
    >
      <div className="absolute inset-0">
        {HERO_IMAGES.map((image, index) => (
          <div
            key={image.src}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: index === activeIndex ? 1 : 0 }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              preload={index === 0}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/85 via-stone-950/75 to-stone-950/95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(217,180,105,0.16),_transparent_60%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 text-xs uppercase tracking-[0.15em] text-amber-500 sm:text-sm sm:tracking-[0.3em]"
        >
          Agence immobilière premium
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-serif text-4xl leading-tight text-white sm:text-6xl lg:text-7xl"
        >
          Des biens d&apos;exception,
          <br className="hidden sm:block" /> pour une vie de prestige en Tunisie
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mx-auto mt-6 max-w-2xl text-base text-stone-300 sm:text-lg"
        >
          Horizon sélectionne pour vous les propriétés les plus prestigieuses :
          villas, penthouses et demeures d&apos;exception, du golfe de Tunis à
          Djerba.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="#biens"
            className="rounded-full bg-amber-500 px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-105 sm:px-8"
          >
            Découvrir nos biens
          </a>
          <Link
            href="/contact?subject=estimation"
            className="rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:border-amber-500 hover:text-amber-500 sm:px-8"
          >
            Estimation gratuite
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border border-stone-500 p-1">
          <motion.div
            animate={{ y: [0, 14, 0] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="h-1.5 w-1.5 rounded-full bg-amber-500"
          />
        </div>
      </motion.div>
    </section>
  );
}
