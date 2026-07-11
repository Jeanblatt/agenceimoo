"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import PropertySearch from "@/components/PropertySearch";

const HERO_IMAGES = [
  { src: "/hero1.webp", alt: "Villa de prestige avec piscine à débordement, vue sur les collines" },
  { src: "/hero2.webp", alt: "Intérieur design d'une villa avec vue panoramique" },
  { src: "/hero3.webp", alt: "Vue aérienne d'une résidence moderne avec piscine et jardin paysager" },
];

const SLIDE_INTERVAL_MS = 6000;

export default function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

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
      ref={sectionRef}
      className="relative flex min-h-[90vh] items-center overflow-hidden bg-stone-950"
    >
      <motion.div className="absolute inset-0" style={{ y: backgroundY }}>
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
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/70 to-stone-950/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/40" />
      </motion.div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-8">
        <div className="text-left">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 text-xs uppercase tracking-[0.15em] text-amber-500 sm:text-sm sm:tracking-[0.3em]"
          >
            Maison Premium Immobilier
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-serif text-4xl leading-tight text-white sm:text-6xl lg:text-6xl"
          >
            Trouvez le bien immobilier qui correspond à votre avenir
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-6 max-w-xl text-base text-stone-300 sm:text-lg"
          >
            Nous vous accompagnons dans l&apos;achat, la vente et la location de
            biens d&apos;exception en Tunisie.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10"
          >
            <a
              href="#biens"
              className="inline-block rounded-full bg-amber-500 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-105"
            >
              Découvrir nos biens
            </a>
          </motion.div>
        </div>

        <PropertySearch />
      </div>
    </section>
  );
}
