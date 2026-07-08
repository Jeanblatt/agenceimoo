import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Autorise l'accès au serveur de dev depuis un téléphone sur le même
  // réseau local (sinon Next.js bloque les assets JS en cross-origin,
  // ce qui empêche l'hydratation : animations figées, boutons inertes).
  allowedDevOrigins: ["10.20.96.40"],
};

export default nextConfig;
