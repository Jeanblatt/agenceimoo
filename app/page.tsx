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

export default async function Home() {
  const { properties, error } = await getAnnonces();

  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <HomeProperties properties={properties} error={error} />
        <Services />
        <Stats />
        <Testimonials />
        <CallToAction />
      </main>

      <WhatsAppButton />
      <Footer />
    </>
  );
}
