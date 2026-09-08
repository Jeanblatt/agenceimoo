import Navbar from "@/components/NavbarServer";
import Hero from "@/components/Hero";
import HomeProperties from "@/components/HomeProperties";
import Services from "@/components/Services";
import Stats from "@/components/Stats";
import Testimonials from "@/components/Testimonials";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButtonServer";
import { getAnnonces } from "@/lib/supabase/annonces";
import { getApprovedReviews } from "@/lib/supabase/reviews";
import { resolveAgencySettings } from "@/lib/supabase/agencySettings";
import { resolveAgencyContent } from "@/lib/supabase/agencyContent";

// Les biens et avis affichés ici viennent de Supabase et changent via
// l'admin : la page doit être rendue à chaque requête (comme /biens et
// /annonces), pas figée au moment du build.
export const dynamic = "force-dynamic";

export default async function Home() {
  // resolveAgencySettings() est mémoïsée par requête (React cache()) :
  // NavbarServer/Footer/WhatsAppButtonServer l'appellent aussi plus bas dans
  // l'arbre sans coût réseau supplémentaire (V3.3.R.1).
  const [{ properties, error }, { reviews }, settings] = await Promise.all([
    getAnnonces(),
    getApprovedReviews(),
    resolveAgencySettings(),
  ]);

  // Séparé du Promise.all ci-dessus (V3.3.W.5) : resolveAgencyContent a
  // besoin de settings.shortName (repli de l'eyebrow Why Us), donc dépend du
  // résultat de resolveAgencySettings — pas d'appel Supabase superflu pour
  // autant, resolveAgencySettings est déjà mémoïsée par requête (cache()) et
  // resolveAgencyContent l'est également, un seul appel de chaque par page
  // quel que soit le nombre de sections qui en dépendent.
  const agencyContent = await resolveAgencyContent(settings.shortName);

  return (
    <>
      <Navbar />

      <main>
        <Hero heroMediaType={settings.heroMediaType} hero={agencyContent.hero} />
        <HomeProperties properties={properties} error={error} whyUs={agencyContent.whyUs} />
        <Services services={agencyContent.services} />
        <Stats propertiesCount={properties.length} foundedYear={settings.foundedYear} />
        <Testimonials reviews={reviews} />
        <CallToAction cta={agencyContent.cta} />
      </main>

      <WhatsAppButton />
      <Footer />
    </>
  );
}
