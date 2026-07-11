import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HomeProperties from "@/components/HomeProperties";
import Services from "@/components/Services";
import Stats from "@/components/Stats";
import Testimonials from "@/components/Testimonials";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getAnnonces } from "@/lib/supabase/annonces";
import { getApprovedReviews } from "@/lib/supabase/reviews";

// Les biens et avis affichés ici viennent de Supabase et changent via
// l'admin : la page doit être rendue à chaque requête (comme /biens et
// /annonces), pas figée au moment du build.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { properties, error } = await getAnnonces();
  const { reviews } = await getApprovedReviews();

  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <HomeProperties properties={properties} error={error} />
        <Services />
        <Stats />
        <Testimonials reviews={reviews} />
        <CallToAction />
      </main>

      <WhatsAppButton />
      <Footer />
    </>
  );
}
