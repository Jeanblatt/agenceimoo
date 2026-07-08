import { AGENCY, SITE_URL } from "@/lib/site";
import type { Property } from "@/data/properties";

interface PropertySchemaProps {
  property: Property;
}

export default function PropertySchema({ property }: PropertySchemaProps) {
  const url = `${SITE_URL}/properties/${property.id}`;
  const images = (property.images ?? []).map((src) => `${SITE_URL}${src}`);

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
      priceCurrency: "TND",
      availability: "https://schema.org/InStock",
      url,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: property.location,
      addressCountry: "TN",
    },
    floorSize: {
      "@type": "QuantitativeValue",
      value: property.area,
      unitCode: "MTK",
    },
    ...(property.bedrooms > 0 && { numberOfRooms: property.bedrooms }),
    seller: {
      "@type": "RealEstateAgent",
      name: AGENCY.name,
      telephone: AGENCY.telephone,
      email: AGENCY.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: AGENCY.address.streetAddress,
        addressLocality: AGENCY.address.addressLocality,
        postalCode: AGENCY.address.postalCode,
        addressCountry: AGENCY.address.addressCountry,
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
