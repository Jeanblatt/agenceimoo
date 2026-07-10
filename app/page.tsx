import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HomeProperties from "@/components/HomeProperties";
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
      </main>

      <WhatsAppButton />
      <Footer />
    </>
  );
}
