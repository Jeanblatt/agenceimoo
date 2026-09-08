import Navbar from "@/components/NavbarServer";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButtonServer";
import PropertyHero from "@/components/properties/PropertyHero";
import PropertySearch from "@/components/PropertySearch";
import PropertySort from "@/components/PropertySort";
import PropertyGrid from "@/components/PropertyGrid";
import { getAnnonces, searchAnnonces, isAnnonceSort } from "@/lib/supabase/annonces";

interface BiensPageProps {
  searchParams: Promise<{
    localisation?: string;
    type?: string;
    prixMin?: string;
    prixMax?: string;
    surfaceMin?: string;
    chambresMin?: string;
    tri?: string;
  }>;
}

export default async function BiensPage({ searchParams }: BiensPageProps) {
  const params = await searchParams;
  // Un `tri` invalide/inconnu retombe silencieusement sur le défaut (recent)
  // plutôt que de propager une erreur Supabase.
  const sort = isAnnonceSort(params.tri) ? params.tri : undefined;
  const hasFilters =
    !!params.localisation ||
    !!params.type ||
    !!params.prixMin ||
    !!params.prixMax ||
    !!params.surfaceMin ||
    !!params.chambresMin ||
    !!params.tri;

  const { properties, error } = hasFilters
    ? await searchAnnonces({
        localisation: params.localisation,
        type: params.type,
        minPrice: params.prixMin ? Number(params.prixMin) : undefined,
        maxPrice: params.prixMax ? Number(params.prixMax) : undefined,
        minSurface: params.surfaceMin ? Number(params.surfaceMin) : undefined,
        minBedrooms: params.chambresMin ? Number(params.chambresMin) : undefined,
        sort,
      })
    : await getAnnonces();

  return (
    <>
      <Navbar />

      <main className="pb-24">
        <PropertyHero />
        <div className="relative z-20 mx-auto -mt-16 max-w-6xl px-6 lg:px-8">
          <PropertySearch />
        </div>

        <div className="mx-auto max-w-7xl px-6 pt-16 lg:px-8">
          {error ? (
            <p className="py-16 text-center text-sm text-red-600">
              Une erreur est survenue lors du chargement des biens. Merci de réessayer plus tard.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-stone-500">
                  {properties.length} bien{properties.length !== 1 ? "s" : ""} trouvé
                  {properties.length !== 1 ? "s" : ""}
                </p>
                <PropertySort />
              </div>
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
