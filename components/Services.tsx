"use client";

import { motion } from "framer-motion";
import { Home, Key, TrendingUp, Building2, type LucideIcon } from "lucide-react";
import Section from "@/components/ui/Section";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
import IconTile from "@/components/ui/IconTile";
import { fadeUpVariants, fadeUpTransition, viewportOnce, hoverLift } from "@/lib/motion";
import type { AgencyContent, ServiceIconKey } from "@/lib/supabase/agencyContent";

// Résout l'icône lucide-react associée à chaque service — la donnée
// (Supabase ou repli config/content.ts, voir lib/supabase/agencyContent.ts)
// ne stocke qu'une clé texte parmi ces 4, jamais une icône libre.
const SERVICE_ICONS: Record<ServiceIconKey, LucideIcon> = {
  home: Home,
  key: Key,
  "trending-up": TrendingUp,
  building: Building2,
};

interface ServicesProps {
  /** Résolu par app/page.tsx via resolveAgencyContent() (V3.3.W.5) — plus d'import direct de config/content.ts ici. */
  services: AgencyContent["services"];
}

export default function Services({ services }: ServicesProps) {
  return (
    <Section id="services-immobiliers">
      <Container>
        <SectionHeading
          eyebrow={services.eyebrow}
          title={services.title}
          description={services.description}
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.items.map((service, index) => {
            const Icon = SERVICE_ICONS[service.icon];
            return (
              <motion.div
                key={service.title}
                variants={fadeUpVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                transition={{ ...fadeUpTransition, duration: 0.5, delay: index * 0.08 }}
                whileHover={hoverLift}
              >
                <Card tone="muted" ring="subtle" hoverShadow className="group h-full">
                  <IconTile size="lg" interactive>
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </IconTile>
                  <h3 className="mt-6 font-serif text-xl text-charcoal">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    {service.description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
