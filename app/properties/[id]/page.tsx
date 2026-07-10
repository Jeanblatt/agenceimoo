import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageGallery from "@/components/ImageGallery";
import ContactButton from "@/components/ContactButton";
import PropertyGrid from "@/components/PropertyGrid";
import PropertySchema from "@/components/PropertySchema";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getAnnonceById, getAnnonces } from "@/lib/supabase/annonces";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { formatPrice } from "@/utils/formatPrice";

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
  const { property } = await getAnnonceById(id);

  if (!property) {
    return { title: "Bien introuvable" };
  }

  const url = `${SITE_URL}/properties/${property.id}`;
  const image = property.images?.[0];
  const ogTitle = `${property.title} à ${property.location} | ${SITE_NAME}`;

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
        ? [{ url: image, width: 1200, height: 900, alt: property.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: property.description,
      images: image ? [image] : undefined,
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

  return (
    <>
      <PropertySchema property={property} />
      <Navbar />

      <main className="pb-24 pt-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <Link
            href="/#biens"
            className="text-sm font-medium uppercase tracking-wide text-stone-500 transition-colors hover:text-amber-600"
          >
            ← Retour aux biens
          </Link>

          <div className="mt-6">
            <ImageGallery images={property.images} title={property.title} />
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <span className="inline-block rounded-full bg-stone-950 px-3 py-1 text-xs font-medium uppercase tracking-wider text-amber-400">
                {property.type}
              </span>

              <h1 className="mt-4 font-serif text-3xl text-stone-900 sm:text-4xl">
                {property.title}
              </h1>

              <p className="mt-2 flex items-center gap-1.5 text-stone-500">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="h-4 w-4 shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z"
                  />
                  <circle cx="12" cy="9.5" r="2.25" strokeLinecap="round" />
                </svg>
                {property.location}
              </p>

              <div className="mt-8 grid grid-cols-3 gap-4 border-y border-stone-100 py-6 text-center">
                <div>
                  <p className="font-serif text-2xl text-stone-900">
                    {property.area} m²
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-stone-500">
                    Surface
                  </p>
                </div>
                <div>
                  <p className="font-serif text-2xl text-stone-900">
                    {property.bedrooms}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-stone-500">
                    Chambres
                  </p>
                </div>
                <div>
                  <p className="font-serif text-2xl text-stone-900">
                    {property.type}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-stone-500">
                    Type de bien
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="font-serif text-xl text-stone-900">
                  Description
                </h2>
                <p className="mt-3 leading-relaxed text-stone-600">
                  {property.description}
                </p>
              </div>

              {property.features && property.features.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-serif text-xl text-stone-900">
                    Caractéristiques
                  </h2>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {property.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-stone-600"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          className="h-4 w-4 shrink-0 text-amber-500"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m5 13 4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <aside className="h-fit rounded-2xl bg-stone-50 p-6 ring-1 ring-stone-100 lg:sticky lg:top-28">
              <p className="font-serif text-3xl text-stone-900">
                {formatPrice(property.price)}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Prix affiché, hors frais d&apos;agence
              </p>
              <div className="mt-6">
                <ContactButton propertyTitle={property.title} />
              </div>
            </aside>
          </div>

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
