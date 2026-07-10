import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import PropertyGrid from "@/components/PropertyGrid";
import { getAnnonces } from "@/lib/supabase/annonces";

export default async function AnnoncesPage() {
  const { properties, error } = await getAnnonces();

  return (
    <>
      <Navbar />

      <main className="pb-24 pt-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-600">
              Sélection
            </p>
            <h1 className="mt-3 font-serif text-3xl text-stone-900 sm:text-4xl">
              Toutes nos annonces
            </h1>
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
        </div>
      </main>

      <WhatsAppButton />
      <Footer />
    </>
  );
}
