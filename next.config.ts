import type { NextConfig } from "next";

// Dérivé de NEXT_PUBLIC_SUPABASE_URL plutôt que codé en dur : ce projet est
// un template réutilisé par différentes agences, chacune avec son propre
// projet Supabase (donc un domaine *.supabase.co différent).
function supabaseStorageHostname(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

const supabaseHostname = supabaseStorageHostname();

const nextConfig: NextConfig = {
  // Autorise l'accès au serveur de dev depuis un téléphone sur le même
  // réseau local (sinon Next.js bloque les assets JS en cross-origin,
  // ce qui empêche l'hydratation : animations figées, boutons inertes).
  allowedDevOrigins: ["10.187.116.40"],
  // Photos d'annonces (V3.2.D) : les URLs publiques du bucket Storage
  // "property-images" sont servies par next/image, qui refuse par défaut
  // tout hôte externe non déclaré ici.
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  // /annonces était un doublon de /biens sans formulaire de recherche.
  // Redirection permanente (308) : les query params (type, prixMax...) sont
  // automatiquement transmis à /biens par Next.js.
  async redirects() {
    return [
      {
        source: "/annonces",
        destination: "/biens",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
