import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";
import { agency } from "@/config/agency";
import { seo, buildDefaultMetadata } from "@/config/seo";
import { getAgencyAssetPublicUrl } from "@/lib/supabase/agencyBranding";
import { resolveAgencySettings } from "@/lib/supabase/agencySettings";

// V3.3.U : `getAgencyAssetPublicUrl` est un calcul synchrone (aucun appel
// réseau, voir lib/supabase/agencyBranding.ts) — reste utilisable ici même
// après le passage à `generateMetadata()` async ci-dessous. Contrairement à
// un <img> (Hero, BrandMark), une balise <meta> ne peut pas réagir à un
// échec de chargement (`onError`) : les crawlers sociaux n'exécutent pas de
// JS et ne retentent pas une autre URL. Le compromis retenu est de lister
// l'asset Storage EN PREMIER candidat puis l'image statique du template en
// second — un usage standard (plusieurs balises og:image) que la plupart des
// crawlers (dont Facebook) parcourent dans l'ordre jusqu'à en trouver une
// valide, mais qui n'est pas garanti à 100% pour tous les consommateurs. Une
// installation fraîche sans upload reste donc couverte par le second candidat.
const ogImageCandidates = [getAgencyAssetPublicUrl("og"), agency.branding.ogImage];

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

// V3.3.U : passe de `export const metadata` (figé sur config/agency.ts au
// chargement du module) à `generateMetadata()` — le nom et la description
// affichés dans <title>, la meta description, Open Graph et Twitter
// proviennent désormais de `resolveAgencySettings()` (agency_settings en
// base, avec repli automatique sur config/agency.ts si une agence n'a pas
// encore renseigné un champ ou si Supabase est indisponible — voir le
// commentaire de resolveAgencySettings). `cache()` y déduplique déjà cet
// appel avec celui de NavbarServer/Footer sur la même requête, donc aucun
// coût réseau supplémentaire. `buildDefaultMetadata` (config/seo.ts) reste
// la seule construction du titre par défaut, pour ne pas dupliquer cette
// logique.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await resolveAgencySettings();
  const { defaultTitle, titleTemplate, defaultDescription } = buildDefaultMetadata(
    settings.name,
    settings.description
  );

  return {
    metadataBase: new URL(seo.siteUrl),
    title: {
      default: defaultTitle,
      template: titleTemplate,
    },
    description: defaultDescription,
    keywords: seo.keywords,
    authors: [{ name: settings.name, url: seo.siteUrl }],
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: seo.locale,
      url: seo.siteUrl,
      siteName: settings.name,
      title: defaultTitle,
      description: defaultDescription,
      images: ogImageCandidates.map((url) => ({
        url,
        width: 1200,
        height: 630,
        alt: settings.name,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: defaultDescription,
      images: ogImageCandidates,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={seo.language}
      className={`${geistSans.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-charcoal">
        {children}
      </body>
    </html>
  );
}
