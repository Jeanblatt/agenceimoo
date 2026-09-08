"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Section from "@/components/ui/Section";
import Container from "@/components/ui/Container";
import GlowBackdrop from "@/components/ui/GlowBackdrop";
import Button from "@/components/ui/Button";
import { fadeUpTransition, viewportOnce } from "@/lib/motion";
import { agency } from "@/config/agency";
import { getAgencyAssetPublicUrl } from "@/lib/supabase/agencyBranding";
import type { AgencyContent } from "@/lib/supabase/agencyContent";

// Asset indépendant du Hero depuis V3.3.V.2 (auparavant partagé avec la
// slide 1 du Hero, voir le rapport d'audit V3.3.V.2) : changer le média du
// Hero (image/vidéo) n'affecte jamais ce bandeau. Le fallback statique
// reste agency.branding.heroImages[0], réutilisé tel quel (même image de
// repli générique du template, pas une nouvelle source de vérité).
const CTA_ASSET_URL = getAgencyAssetPublicUrl("cta");

interface CallToActionProps {
  /** Résolu par app/page.tsx via resolveAgencyContent() (V3.3.W.5) — plus d'import direct de config/content.ts ni de libellés/liens de boutons codés en dur ici. */
  cta: AgencyContent["cta"];
}

export default function CallToAction({ cta }: CallToActionProps) {
  // Même principe que Hero.tsx (V3.3.U.1) : verrou lié à l'URL en échec,
  // uniquement déclenché par `onError` (échec réel constaté par le
  // navigateur) — plus de vérification `complete`/`naturalWidth` avant
  // hydratation.
  const [failedAssetUrl, setFailedAssetUrl] = useState<string | null>(null);
  const ctaAssetFailed = failedAssetUrl === CTA_ASSET_URL;

  return (
    <Section tone="dark" spacing="large" className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={ctaAssetFailed ? agency.branding.heroImages[0] : CTA_ASSET_URL}
          alt="Villa de prestige illuminée au crépuscule"
          fill
          sizes="100vw"
          className="object-cover"
          onError={() => setFailedAssetUrl(CTA_ASSET_URL)}
        />
        <div className="absolute inset-0 bg-ink/80" />
        <GlowBackdrop />
      </div>

      <Container size="3xl" className="relative text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={fadeUpTransition}
          className="font-serif text-3xl text-white sm:text-4xl lg:text-5xl"
        >
          {cta.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ ...fadeUpTransition, delay: 0.1 }}
          className="mx-auto mt-5 max-w-xl text-base text-stone-300 sm:text-lg"
        >
          {cta.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ ...fadeUpTransition, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button href={cta.primaryCta.href}>{cta.primaryCta.label}</Button>
          <Button href={cta.secondaryCta.href} variant="outline" tone="onDark">
            {cta.secondaryCta.label}
          </Button>
        </motion.div>
      </Container>
    </Section>
  );
}
