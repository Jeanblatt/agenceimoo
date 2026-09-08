import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/NavbarServer";
import Footer from "@/components/Footer";
import PropertyDetailHero from "@/components/properties/PropertyDetailHero";
import PropertyInfo from "@/components/properties/PropertyInfo";
import PropertyLocation from "@/components/properties/PropertyLocation";
import AgentCard from "@/components/properties/AgentCard";
import VisitRequestForm from "@/components/properties/VisitRequestForm";
import PropertyGrid from "@/components/PropertyGrid";
import PropertySchema from "@/components/PropertySchema";
import WhatsAppButton from "@/components/WhatsAppButtonServer";
import { getAnnonceById, getAnnonces } from "@/lib/supabase/annonces";
import { seo } from "@/config/seo";
import { defaultAgent } from "@/data/agent";
import { resolveAgencySettings } from "@/lib/supabase/agencySettings";

interface PropertyPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const { properties } = await getAnnonces();
  return properties.map((property) => ({ id: property.id }));
}

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { id } = await params;
  const [{ property }, settings] = await Promise.all([
    getAnnonceById(id),
    resolveAgencySettings(),
  ]);

  if (!property) {
    return { title: "Bien introuvable" };
  }

  const url = `${seo.siteUrl}/properties/${property.id}`;
  const image = property.images?.[0];
  // V3.3.U : agency.name (statique) -> settings.name (runtime, resolveAgencySettings()).
  const ogTitle = `${property.title} à ${property.location} | ${settings.name}`;

  return {
    title: property.title,
    description: property.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: ogTitle,
      description: property.description,
      images: image
        ? [{ url: image.url, width: 1200, height: 900, alt: property.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: property.description,
      images: image ? [image.url] : undefined,
    },
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;
  const { property } = await getAnnonceById(id);

  if (!property) {
    notFound();
  }

  const { properties } = await getAnnonces();
  const similarProperties = properties
    .filter((item) => item.id !== property.id && item.type === property.type)
    .slice(0, 3);
  const settings = await resolveAgencySettings();

  return (
    <>
      <PropertySchema property={property} settings={settings} />
      <Navbar />

      <main className="pb-24 pt-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <Link
            href="/biens"
            className="text-sm font-medium uppercase tracking-wide text-stone-500 transition-colors hover:text-amber-600"
          >
            ← Retour aux biens
          </Link>

          <div className="mt-6">
            <PropertyDetailHero property={property} />
          </div>

          <PropertyInfo property={property} />
          <PropertyLocation property={property} />

          <section className="mt-12">
            <h2 className="font-serif text-2xl text-stone-900">
              Votre conseiller
            </h2>
            <div className="mt-6">
              <AgentCard agent={defaultAgent} />
            </div>
          </section>

          <section id="planifier-visite" className="mt-12 scroll-mt-28">
            <h2 className="font-serif text-2xl text-stone-900">
              Planifier une visite
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              Remplissez ce formulaire, un conseiller vous recontactera pour confirmer.
            </p>
            <div className="mt-6 max-w-2xl">
              <VisitRequestForm propertyId={property.id} agencyShortName={settings.shortName} />
            </div>
          </section>

          {similarProperties.length > 0 && (
            <div className="mt-20">
              <h2 className="font-serif text-2xl text-stone-900">
                Biens similaires
              </h2>
              <div className="mt-8">
                <PropertyGrid properties={similarProperties} />
              </div>
            </div>
          )}
        </div>
      </main>

      <WhatsAppButton propertyTitle={property.title} />
      <Footer />
    </>
  );
}
