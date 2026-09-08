"use client";

import { useState } from "react";
import Image from "next/image";
import Section from "@/components/ui/Section";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { getAgencyAssetPublicUrl } from "@/lib/supabase/agencyBranding";
import type { AgencyContent } from "@/lib/supabase/agencyContent";

// Fond optionnel de cette section (V3.3.V.3) — même principe que
// components/Stats.tsx : calcul d'URL synchrone (aucun appel réseau),
// purement décoratif, jamais de repli vers un autre asset (hero, cta, stats
// ou og restent indépendants) — en cas d'absence/échec, `onError` retire
// l'image et la section retrouve exactement son apparence actuelle (texte
// foncé sur fond clair, `tone="muted"`, comme avant l'introduction de cet
// asset).
//
// Correctif overlay (V3.3.V.3 — fix) : un voile plat quasi-opaque
// (`bg-surface-muted/90`) rendait l'image quasiment invisible. Remplacé par
// un dégradé gauche→droite réutilisant le token `ink` déjà utilisé pour les
// mêmes besoins dans Hero.tsx (`bg-gradient-to-r from-ink/... `) — plus
// sombre à gauche (où le texte se lit), plus transparent à droite (où
// l'image — consultant/clients/bureau — doit rester visible). Dès que
// l'image est affichée, le texte passe en clair (mêmes tokens que
// SectionHeading tone="onDark" et Stats/CallToAction) : du texte foncé sur
// une image assombrie ne serait plus lisible. Le cas "aucune image" garde
// exactement les couleurs d'origine (tone="onLight", charcoal/stone).
const WHY_US_BACKGROUND_URL = getAgencyAssetPublicUrl("whyUs");

interface WhyUsProps {
  /**
   * Résolu par app/page.tsx via resolveAgencyContent() (V3.3.W.5) — eyebrow,
   * titre et les 3 arguments viennent déjà entièrement résolus (Supabase ou
   * repli config/content.ts) : plus d'import direct de config/content.ts ni
   * de agencyShortName ici (l'eyebrow "Pourquoi {agence}" est déjà calculé
   * en amont, voir lib/supabase/agencyContent.ts, resolveWhyUs).
   */
  whyUs: AgencyContent["whyUs"];
}

export default function WhyUs({ whyUs }: WhyUsProps) {
  const [backgroundFailed, setBackgroundFailed] = useState(false);
  const hasBackground = !backgroundFailed;

  return (
    <Section as="section" id="services" tone="muted" className="relative overflow-hidden">
      {hasBackground && (
        <>
          <Image
            src={WHY_US_BACKGROUND_URL}
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            className="object-cover"
            onError={() => setBackgroundFailed(true)}
          />
          {/* Dégradé gauche→droite (comme Hero.tsx) : sombre côté texte,
              transparent côté sujets de la photo — l'image reste lisible. */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink/65 via-ink/45 to-ink/25" />
        </>
      )}

      <Container className="relative">
        <SectionHeading
          eyebrow={whyUs.eyebrow}
          title={whyUs.title}
          tone={hasBackground ? "onDark" : "onLight"}
        />

        <div className="mt-16 grid gap-10 sm:grid-cols-3">
          {whyUs.features.map((feature, index) => (
            <div key={feature.title} className="text-center">
              <span className="font-serif text-3xl text-amber-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className={`mt-4 font-serif text-xl ${hasBackground ? "text-white" : "text-charcoal"}`}>
                {feature.title}
              </h3>
              <p className={`mt-2 text-sm leading-relaxed ${hasBackground ? "text-stone-300" : "text-stone-600"}`}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
