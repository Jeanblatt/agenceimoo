import Navbar from "@/components/Navbar";
import { resolveAgencySettings } from "@/lib/supabase/agencySettings";

/**
 * Server wrapper (V3.3.R.1) : résout l'identité agence runtime puis rend le
 * Navbar (Client Component) avec les valeurs déjà résolues, sans que ce
 * dernier n'appelle jamais Supabase lui-même. Un seul point de résolution
 * pour les 5 pages qui montent le Navbar, plutôt que de dupliquer l'appel
 * dans chacune — `resolveAgencySettings` est mémoïsé par requête (React
 * `cache()`), donc aucun coût réseau supplémentaire si la page appelle
 * aussi la fonction pour ses propres besoins (ex. Footer, WhatsAppButtonServer).
 *
 * Les pages importent ce composant sous le nom `Navbar` (voir app/page.tsx
 * et les autres points de montage) : le composant Client d'origine reste
 * utilisable directement si un jour un appelant a déjà les valeurs sous la
 * main (ex. tests, storybook).
 */
export default async function NavbarServer() {
  const settings = await resolveAgencySettings();
  return <Navbar agencyName={settings.name} agencyShortName={settings.shortName} />;
}
