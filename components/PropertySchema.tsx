import { seo } from "@/config/seo";
import { catalog } from "@/config/catalog";
import type { Property } from "@/data/properties";
import type { AgencySettings } from "@/lib/supabase/agencySettings";

interface PropertySchemaProps {
  property: Property;
  /**
   * Résolu par l'appelant via resolveAgencySettings() (V3.3.U) — plus
   * d'import direct de config/agency.ts ici : le vendeur ("seller") du
   * JSON-LD doit refléter l'agence réellement configurée en base, pas le
   * repli statique du template. Passé en prop plutôt que résolu ici pour ne
   * pas dupliquer un appel déjà fait par la page appelante
   * (app/properties/[id]/page.tsx), `cache()` le déduplique de toute façon
   * mais autant garder ce composant simple, non async.
   */
  settings: AgencySettings;
}

export default function PropertySchema({ property, settings }: PropertySchemaProps) {
  const url = `${seo.siteUrl}/properties/${property.id}`;
  // property.images[].url est soit une URL Supabase Storage déjà absolue,
  // soit un chemin relatif legacy (repli image_principale, voir
  // lib/supabase/annonces.ts) : ne préfixer que dans ce second cas, sous
  // peine de produire "https://site.com/https://xxx.supabase.co/...".
  const images = (property.images ?? []).map((image) =>
    /^https?:\/\//.test(image.url) ? image.url : `${seo.siteUrl}${image.url}`
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description,
    url,
    ...(images.length > 0 && { image: images }),
    category: property.type,
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: catalog.currency,
      availability: "https://schema.org/InStock",
      url,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: property.location,
      addressCountry: settings.address.country,
    },
    floorSize: {
      "@type": "QuantitativeValue",
      value: property.area,
      unitCode: "MTK",
    },
    ...(property.bedrooms > 0 && { numberOfRooms: property.bedrooms }),
    seller: {
      "@type": "RealEstateAgent",
      name: settings.name,
      telephone: settings.phone,
      email: settings.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: settings.address.street,
        addressLocality: settings.address.city,
        postalCode: settings.address.postalCode,
        addressCountry: settings.address.country,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify n'échappe pas "<", nécessaire pour éviter une
      // fermeture prématurée de la balise <script> si jamais une
      // description contenait ce caractère.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}
