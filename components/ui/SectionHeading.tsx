"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { fadeUpVariants, fadeUpTransition, viewportOnce } from "@/lib/motion";

export type SectionHeadingTone = "onLight" | "onDark";

const TONE_CLASSES: Record<SectionHeadingTone, { eyebrow: string; title: string; description: string }> = {
  onLight: { eyebrow: "text-amber-600", title: "text-charcoal", description: "text-stone-600" },
  onDark: { eyebrow: "text-amber-500", title: "text-white", description: "text-stone-300" },
};

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  tone?: SectionHeadingTone;
  className?: string;
}

// Pattern "eyebrow + titre (+ intro)" répété à l'identique dans la plupart
// des sections publiques — bundle aussi la révélation au scroll pour éviter
// de la redupliquer à chaque site d'appel.
export default function SectionHeading({
  eyebrow,
  title,
  description,
  tone = "onLight",
  className,
}: SectionHeadingProps) {
  const colors = TONE_CLASSES[tone];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeUpVariants}
      transition={fadeUpTransition}
      className={clsx("mx-auto max-w-2xl text-center", className)}
    >
      <p className={clsx("text-sm uppercase tracking-[0.3em]", colors.eyebrow)}>{eyebrow}</p>
      <h2 className={clsx("mt-3 font-serif text-3xl sm:text-4xl", colors.title)}>{title}</h2>
      {description && <p className={clsx("mt-4 text-base", colors.description)}>{description}</p>}
    </motion.div>
  );
}
