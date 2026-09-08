import WhatsAppButton from "@/components/WhatsAppButton";
import { resolveAgencySettings } from "@/lib/supabase/agencySettings";

interface WhatsAppButtonServerProps {
  propertyTitle?: string;
}

/**
 * Server wrapper (V3.3.R.1), même principe que components/NavbarServer.tsx :
 * résout le numéro WhatsApp runtime puis rend le bouton (Client Component)
 * déjà alimenté, sans appel Supabase côté client.
 */
export default async function WhatsAppButtonServer({ propertyTitle }: WhatsAppButtonServerProps) {
  const settings = await resolveAgencySettings();
  return <WhatsAppButton whatsapp={settings.whatsapp} propertyTitle={propertyTitle} />;
}
