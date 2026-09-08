import type { MetadataRoute } from "next";
import { getAnnonces } from "@/lib/supabase/annonces";
import { seo } from "@/config/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { properties } = await getAnnonces();
  const propertyRoutes: MetadataRoute.Sitemap = properties.map((property) => ({
    url: `${seo.siteUrl}/properties/${property.id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: seo.siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...propertyRoutes,
  ];
}
