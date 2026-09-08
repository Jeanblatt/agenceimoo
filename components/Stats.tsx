"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import Section from "@/components/ui/Section";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import GlowBackdrop from "@/components/ui/GlowBackdrop";
import { fadeUpVariants, fadeUpTransition, viewportOnce } from "@/lib/motion";
import { content, type StatEntry } from "@/config/content";
import { getAgencyAssetPublicUrl } from "@/lib/supabase/agencyBranding";

// Fond optionnel de la section (V3.3.V.2) : calcul d'URL synchrone, aucun
// appel réseau (voir agencyBranding.ts) — pas de coût ajouté pour les
// déploiements qui n'en configurent jamais. Contrairement au Hero/CTA, il
// n'y a pas de "fallback statique dédié" : en l'absence de cette image (cas
// par défaut), la section retrouve exactement son fond sombre uni actuel,
// sans rien afficher de plus — c'est une pure surcouche décorative.
const STATS_BACKGROUND_URL = getAgencyAssetPublicUrl("stats");

const COUNT_DURATION_MS = 1800;

function AnimatedStat({ stat, delay }: { stat: StatEntry; delay: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  // Même config que `viewport={viewportOnce}` ci-dessous (V3.3.Q.1.5) : une
  // seule source de vérité pour la marge de détection, plutôt qu'une valeur
  // dupliquée qui aurait pu diverger et réintroduire le bug côté comptage.
  const isInView = useInView(ref, viewportOnce);
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

interface StatsProps {
  /**
   * Nombre de biens réellement disponibles (déjà chargés par la page pour
   * HomeProperties — aucune requête Supabase supplémentaire ici). Omis :
   * la statistique correspondante n'est simplement pas affichée.
   */
  propertiesCount?: number;
  /**
   * Résolu par app/page.tsx via getAgencySettings() (V3.3.U) — même source
   * runtime que Footer/Contact (`agency_settings.founded_year`, repli
   * config/agency.ts), pour ne jamais afficher un nombre d'années différent
   * de l'accroche du footer / de la page contact.
   */
  foundedYear: number;
}

export default function Stats({ propertiesCount, foundedYear }: StatsProps) {
  const experienceYears = new Date().getFullYear() - foundedYear;
  // Pas de verrou lié à l'URL ici (contrairement à Hero/CTA) : il n'y a
  // qu'un seul état "avec image" / "sans image", jamais de bascule entre
  // plusieurs candidats — un simple booléen suffit et reste plus lisible.
  const [backgroundFailed, setBackgroundFailed] = useState(false);

  const stats: StatEntry[] = [
    { value: experienceYears, suffix: "", label: "Années d'expérience" },
    ...(propertiesCount !== undefined
      ? [{ value: propertiesCount, suffix: "", label: "Biens disponibles" }]
      : []),
    ...content.stats,
  ];

  if (stats.length === 0) return null;

  return (
    <Section tone="dark" className="relative overflow-hidden">
      {!backgroundFailed && (
        <>
          <Image
            src={STATS_BACKGROUND_URL}
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            className="object-cover"
            onError={() => setBackgroundFailed(true)}
          />
          {/* Assombrit l'image pour conserver le contraste du texte blanc/ambre
              du fond sombre actuel — même traitement que CallToAction.tsx. */}
          <div className="absolute inset-0 bg-ink/80" />
        </>
      )}

      <GlowBackdrop />

      <Container className="relative">
        <SectionHeading eyebrow="Confiance" title="Notre agence en chiffres" tone="onDark" />

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={fadeUpVariants}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              transition={{ ...fadeUpTransition, duration: 0.5, delay: index * 0.08 }}
              className="text-center"
            >
              <AnimatedStat stat={stat} delay={index * 0.1} />
              <p className="mt-2 text-sm uppercase tracking-wider text-stone-400">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
