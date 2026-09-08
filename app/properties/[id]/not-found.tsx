import Link from "next/link";
import Navbar from "@/components/NavbarServer";
import Footer from "@/components/Footer";

export default function PropertyNotFound() {
  return (
    <>
      <Navbar />

      <main className="flex min-h-screen flex-col items-center justify-center px-6 pt-32 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-600">
          Erreur 404
        </p>
        <h1 className="mt-4 font-serif text-3xl text-stone-900 sm:text-4xl">
          Ce bien n&apos;existe pas ou n&apos;est plus disponible
        </h1>
        <p className="mt-4 max-w-md text-stone-500">
          Il a peut-être déjà trouvé preneur. Découvrez le reste de notre
          sélection de biens d&apos;exception.
        </p>
        <Link
          href="/#biens"
          className="mt-8 rounded-full bg-amber-500 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-105"
        >
          Voir tous les biens
        </Link>
      </main>

      <Footer />
    </>
  );
}
