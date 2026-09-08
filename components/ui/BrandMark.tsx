"use client";

import { useState } from "react";
import { agency } from "@/config/agency";
import { getLogoPublicUrl } from "@/lib/supabase/agencyBranding";

interface BrandMarkProps {
  textClassName?: string;
  dotClassName?: string;
  imgClassName?: string;
  /**
   * Overrides runtime (agency_settings via resolveAgencySettings), passés
   * par un Server Component parent — voir components/NavbarServer.tsx
   * (V3.3.R.1). Optionnels : à défaut, repli sur config/agency.ts comme
   * avant (comportement inchangé pour AdminHeader/ClientHeader, qui ne les
   * passent pas).
   */
  agencyName?: string;
  agencyShortName?: string;
}

/**
 * Logo affiché, par ordre de priorité :
 * 1. `agency.logo` si renseigné — override statique explicite (ex. démo du
 *    template, déploiement sans Storage configuré) : ne doit jamais être
 *    silencieusement court-circuité par un fichier Storage.
 * 2. Le logo Supabase Storage (agency-assets/logo.webp, voir
 *    lib/supabase/agencyBranding.ts) — URL déterministe calculée en
 *    synchrone (zéro appel réseau depuis ce composant, aucun état lié à une
 *    résolution). Si l'image échoue à charger (404 : aucun logo encore
 *    uploadé, ou fichier invalide), `onError` bascule vers le texte — un
 *    `useState` local reflète uniquement cet événement navigateur, il ne
 *    déclenche ni ne résout aucune requête lui-même.
 * 3. `agency.shortName` en texte stylé (fallback final, comportement
 *    historique inchangé).
 *
 * Centralise le petit motif répété dans Navbar, Footer, ClientHeader et
 * AdminHeader — ces 4 consommateurs n'ont pas besoin de connaître la source
 * réelle du logo.
 */
export default function BrandMark({
  textClassName = "font-serif text-2xl text-white",
  dotClassName = "text-amber-500",
  imgClassName = "h-8 w-auto",
  agencyName,
  agencyShortName,
}: BrandMarkProps) {
  const [storageLogoFailed, setStorageLogoFailed] = useState(false);
  const name = agencyName ?? agency.name;
  const shortName = agencyShortName ?? agency.shortName;

  if (agency.logo) {
    // eslint-disable-next-line @next/next/no-img-element -- dimensions variables selon le logo fourni par le client
    return <img src={agency.logo} alt={name} className={imgClassName} />;
  }

  if (!storageLogoFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL Supabase Storage externe, dimensions variables
      <img
        src={getLogoPublicUrl()}
        alt={name}
        className={imgClassName}
        onError={() => setStorageLogoFailed(true)}
        ref={(node) => {
          // Filet pour un échec déjà survenu avant l'hydratation : ce <img>
          // est rendu côté serveur, donc le navigateur commence à le
          // charger dès le parsing du HTML, avant que React n'attache
          // `onError` — un échec rapide (ex. bucket/objet inexistant) peut
          // déjà avoir eu lieu à ce moment-là. `complete && naturalWidth
          // === 0` est la façon standard de détecter un tel échec après
          // coup, sans déclencher de nouvelle requête.
          if (node && node.complete && node.naturalWidth === 0) {
            setStorageLogoFailed(true);
          }
        }}
      />
    );
  }

  return (
    <span className={textClassName}>
      {shortName}
      <span className={dotClassName}>.</span>
    </span>
  );
}
