"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CallToAction() {
  return (
    <section className="relative overflow-hidden bg-stone-950 py-28">
      <div className="absolute inset-0">
        <Image
          src="/hero1.webp"
          alt="Villa de prestige illuminée au crépuscule"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-stone-950/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(217,180,105,0.14),_transparent_65%)]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="font-serif text-3xl text-white sm:text-4xl lg:text-5xl"
        >
          Votre projet immobilier commence maintenant
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-5 max-w-xl text-base text-stone-300 sm:text-lg"
        >
          Notre équipe d&apos;experts est disponible pour vous accompagner dans
          toutes vos démarches.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/contact"
            className="rounded-full bg-amber-500 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-105"
          >
            Nous contacter
          </Link>
          <Link
            href="/annonces"
            className="rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:border-amber-500 hover:text-amber-500"
          >
            Voir nos biens
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
