import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import PropertyHero from "@/components/properties/PropertyHero";
import PropertySearch from "@/components/properties/PropertySearch";
import PropertyGrid from "@/components/PropertyGrid";
import { getAnnonces, searchAnnonces } from "@/lib/supabase/annonces";

interface BiensPageProps {
  searchParams: Promise<{
    localisation?: string;
    type?: string;
    prixMax?: string;
    surfaceMin?: string;
  }>;
}

export default async function BiensPage({ searchParams }: BiensPageProps) {
  const params = await searchParams;
  const hasFilters = !!params.localisation || !!params.type || !!params.prixMax || !!params.surfaceMin;

  const { properties, error } = hasFilters
    ? await searchAnnonces({
        localisation: params.localisation,
        type: params.type,
        maxPrice: params.prixMax ? Number(params.prixMax) : undefined,
        minSurface: params.surfaceMin ? Number(params.surfaceMin) : undefined,
      })
    : await getAnnonces();

  return (
    <>
      <Navbar />

      <main className="pb-24">
        <PropertyHero />
        <PropertySearch />

        <div className="mx-auto max-w-7xl px-6 pt-16 lg:px-8">
          {error ? (
            <p className="py-16 text-center text-sm text-red-600">
              Une erreur est survenue lors du chargement des biens. Merci de réessayer plus tard.
            </p>
          ) : (
            <>
              <p className="text-sm text-stone-500">
                {properties.length} bien{properties.length !== 1 ? "s" : ""} trouvé
                {properties.length !== 1 ? "s" : ""}
              </p>
              <div className="mt-8">
                <PropertyGrid properties={properties} />
              </div>
            </>
          )}
        </div>
      </main>

      <WhatsAppButton />
      <Footer />
    </>
  );
}
