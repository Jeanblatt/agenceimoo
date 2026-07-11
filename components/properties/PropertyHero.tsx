"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function PropertyHero() {
  return (
    <section className="relative flex min-h-[55vh] items-center justify-center overflow-hidden bg-stone-950 pb-24 pt-32">
      <div className="absolute inset-0">
        <Image
          src="/hero2.webp"
          alt="Intérieur design d'une propriété premium en Tunisie"
          fill
          preload
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-stone-950/75" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(217,180,105,0.16),_transparent_60%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 text-xs uppercase tracking-[0.3em] text-amber-500"
        >
          Nos biens
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-serif text-4xl leading-tight text-white sm:text-5xl"
        >
          Découvrez nos biens immobiliers
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mx-auto mt-5 max-w-xl text-base text-stone-300 sm:text-lg"
        >
          Villas, appartements, maisons et locaux d&apos;exception à l&apos;achat
          comme à la location, sélectionnés partout en Tunisie.
        </motion.p>
      </div>
    </section>
  );
}
