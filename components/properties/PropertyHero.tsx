"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import GlowBackdrop from "@/components/ui/GlowBackdrop";
import { agency } from "@/config/agency";
import { content } from "@/config/content";

export default function PropertyHero() {
  return (
    <section className="relative flex min-h-[55vh] items-center justify-center overflow-hidden bg-ink pb-24 pt-32">
      <div className="absolute inset-0">
        <Image
          src={agency.branding.heroImages[1]}
          alt={content.propertiesHero.imageAlt}
          fill
          preload
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/75" />
        <GlowBackdrop position="top" />
      </div>

      <Container size="3xl" className="relative z-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 text-xs uppercase tracking-[0.3em] text-amber-500"
        >
          {content.propertiesHero.eyebrow}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-serif text-4xl leading-tight text-white sm:text-5xl"
        >
          {content.propertiesHero.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mx-auto mt-5 max-w-xl text-base text-stone-300 sm:text-lg"
        >
          {content.propertiesHero.subtitle}
        </motion.p>
      </Container>
    </section>
  );
}
