import Link from "next/link";
import PropertyGrid from "@/components/PropertyGrid";
import WhyUs from "@/components/WhyUs";
import type { Property } from "@/data/properties";
import type { AgencyContent } from "@/lib/supabase/agencyContent";
import { content } from "@/config/content";
import Section from "@/components/ui/Section";
import Container from "@/components/ui/Container";

interface HomePropertiesProps {
  properties: Property[];
  error: string | null;
  /** Résolu par app/page.tsx via resolveAgencyContent() (V3.3.W.5) — plus de "Horizon" figé ni de agencyShortName ici (l'eyebrow est déjà résolu en amont). */
  whyUs: AgencyContent["whyUs"];
}

export default function HomeProperties({ properties, error, whyUs }: HomePropertiesProps) {
  return (
    <>
      <WhyUs whyUs={whyUs} />

      <Section as="section" id="biens">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-amber-600">
                {content.home.propertiesEyebrow}
              </p>
              <h2 className="mt-3 font-serif text-3xl text-charcoal sm:text-4xl">
                {content.home.propertiesTitle}
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                {properties.length} bien
                {properties.length !== 1 ? "s" : ""} trouvé
                {properties.length !== 1 ? "s" : ""}
              </p>
            </div>
            {/* inline-block + py-3/-my-3 : zone tactile ~44px (V3.3.Q.1.8)
                sans changer la position visuelle du lien (alignement
                items-end du conteneur parent inchangé). */}
            <Link
              href="/biens"
              className="inline-block -my-3 py-3 text-sm font-medium uppercase tracking-wide text-charcoal underline underline-offset-4 transition-colors hover:text-amber-600"
            >
              Voir tous les biens
            </Link>
          </div>

          <div className="mt-14">
            {error ? (
              <p className="py-16 text-center text-sm text-red-600">
                Une erreur est survenue lors du chargement des annonces. Merci de réessayer plus tard.
              </p>
            ) : (
              <PropertyGrid properties={properties} />
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}
