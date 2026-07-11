"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

// Tableau de données : prêt à être remplacé par une requête Supabase
// (ex. table "statistiques") sans changer le rendu ci-dessous.
export const STATS: Stat[] = [
  { value: 10, suffix: "+", label: "Années d'expérience" },
  { value: 500, suffix: "+", label: "Biens disponibles" },
  { value: 1000, suffix: "+", label: "Clients satisfaits" },
  { value: 50, suffix: "+", label: "Projets réalisés" },
];

const COUNT_DURATION_MS = 1800;

function AnimatedStat({ stat, delay }: { stat: Stat; delay: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let frame: number;
    const start = performance.now() + delay * 1000;

    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed < 0) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(elapsed / COUNT_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * stat.value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isInView, stat.value, delay]);

  return (
    <p ref={ref} className="font-serif text-5xl text-white sm:text-6xl">
      {displayValue}
      <span className="text-amber-400">{stat.suffix}</span>
    </p>
  );
}

export default function Stats() {
  return (
    <section className="relative overflow-hidden bg-stone-950 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(217,180,105,0.12),_transparent_65%)]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-amber-500">
            Confiance
          </p>
          <h2 className="mt-3 font-serif text-3xl text-white sm:text-4xl">
            Notre agence en chiffres
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="text-center"
            >
              <AnimatedStat stat={stat} delay={index * 0.1} />
              <p className="mt-2 text-sm uppercase tracking-wider text-stone-400">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
