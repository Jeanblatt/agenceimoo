"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section
      id="accueil"
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-stone-950 py-28"
    >
      {/*
        Placeholder tant que les visuels IA ne sont pas intégrés.
        Remplacer par: <Image src="/hero.jpg" alt="..." fill preload className="object-cover" />
      */}
      <div className="absolute inset-0">
        <div className="h-full w-full bg-gradient-to-br from-stone-900 via-stone-950 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(217,180,105,0.14),_transparent_60%)]" />
        <div className="absolute inset-0 bg-black/30" />
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
