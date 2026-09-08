"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import PropertySearch from "@/components/PropertySearch";
import Button from "@/components/ui/Button";
import { agency } from "@/config/agency";
import { getAgencyAssetPublicUrl } from "@/lib/supabase/agencyBranding";
import type { HeroContent } from "@/lib/supabase/agencyContent";

// Hero single-media (V3.3.V.2) : plus de carrousel — un seul média actif,
// choisi explicitement par l'admin (agency_settings.hero_media_type),
// indépendamment de la simple présence des fichiers dans Storage (voir le
// rapport d'audit V3.3.V.2 : la présence seule ne suffit pas, l'admin doit
// pouvoir garder une vidéo "en réserve" sans qu'elle s'affiche).
const HERO_IMAGE_URL = getAgencyAssetPublicUrl("hero");
const HERO_IMAGE_ALT = "Villa de prestige avec piscine à débordement, vue sur les collines";
const HERO_VIDEO_URL = getAgencyAssetPublicUrl("heroVideo");

interface HeroProps {
  /**
   * Résolu par app/page.tsx via resolveAgencySettings() (V3.3.V.2) —
   * toujours "image" ou "video", jamais une valeur vide/invalide (voir
   * lib/supabase/agencySettings.ts, toHeroMediaType).
   */
  heroMediaType: "image" | "video";
  /**
   * Résolu par app/page.tsx via resolveAgencyContent() (V3.3.W.5) — chaque
   * champ est déjà garanti non-vide par le repli de lib/supabase/agencyContent.ts
   * (config/content.ts si l'agence n'a rien configuré) : plus d'import direct
   * de config/content.ts ici.
   */
  hero: Required<HeroContent>;
}

export default function Hero({ heroMediaType, hero }: HeroProps) {
  // Même principe qu'avant (V3.3.U.1) : verrou lié à l'URL en échec, jamais
  // un simple booléen figé — uniquement positionné par un échec réel
  // (`onError`, éventuellement le filet de sécurité ci-dessous pour la
  // vidéo), jamais par une heuristique avant hydratation.
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageFailed = failedImageUrl === HERO_IMAGE_URL;
  const [failedVideoUrl, setFailedVideoUrl] = useState<string | null>(null);
  const videoFailed = failedVideoUrl === HERO_VIDEO_URL;

  // Cascade : vidéo tentée uniquement si explicitement choisie ET pas déjà
  // constatée en échec → image Storage → image statique du template.
  const showVideo = heroMediaType === "video" && !videoFailed;

  const sectionRef = useRef<HTMLElement>(null);
  // `prefers-reduced-motion` n'est connaissable que côté client : brancher le
  // JSX dessus créerait un risque de mismatch d'hydratation (voir V3.3.V.1).
  // La structure rendue reste identique serveur/client — seule la LECTURE
  // de la vidéo déjà montée est mise en pause après coup, jamais l'élément.
  const videoRef = useRef<HTMLVideoElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  useEffect(() => {
    if (!showVideo) return;

    // Filet de sécurité, en plus de `onError` sur la balise <video>
    // (V3.3.V.1) : un <source> cross-origin renvoyant une erreur HTTP (ex.
    // hero.mp4 absent) peut être bloqué par la protection navigateur ORB
    // (Opaque Response Blocking) SANS déclencher l'événement `error` — la
    // vidéo reste alors bloquée en NETWORK_NO_SOURCE indéfiniment. Si elle
    // n'a toujours pas de première image exploitable après ce délai, on la
    // considère en échec.
    const timeout = setTimeout(() => {
      const video = videoRef.current;
      if (video && video.readyState < video.HAVE_CURRENT_DATA) {
        setFailedVideoUrl(HERO_VIDEO_URL);
      }
    }, 4000);

    return () => clearTimeout(timeout);
  }, [showVideo]);

  useEffect(() => {
    // Vidéo Hero mise en pause sur sa première image plutôt que jouée en
    // boucle si l'utilisateur préfère des animations réduites (l'élément
    // vidéo reste monté — seule sa lecture s'arrête).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      videoRef.current?.pause();
    }
  }, []);

  return (
    <section
      id="accueil"
      ref={sectionRef}
      className="relative flex min-h-[90vh] items-center overflow-hidden bg-ink"
    >
      <motion.div className="absolute inset-0" style={{ y: backgroundY }}>
        {showVideo ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
            onError={() => setFailedVideoUrl(HERO_VIDEO_URL)}
          >
            <source src={HERO_VIDEO_URL} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={imageFailed ? agency.branding.heroImages[0] : HERO_IMAGE_URL}
            alt={HERO_IMAGE_ALT}
            fill
            preload
            sizes="100vw"
            className="object-cover"
            onError={() => setFailedImageUrl(HERO_IMAGE_URL)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/70 to-ink/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/40" />
      </motion.div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
        <div className="text-left">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 text-xs uppercase tracking-[0.15em] text-amber-500 sm:text-sm sm:tracking-[0.3em]"
          >
            {hero.eyebrow}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-serif text-4xl leading-tight text-white sm:text-6xl lg:text-6xl"
          >
            {hero.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-6 max-w-xl text-base text-stone-300 sm:text-lg"
          >
            {hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10"
          >
            <Button href={hero.ctaHref}>{hero.ctaLabel}</Button>
          </motion.div>
        </div>

        <PropertySearch tone="onDark" />
      </div>
    </section>
  );
}
