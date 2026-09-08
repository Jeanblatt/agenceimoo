import Link from "next/link";
import { content } from "@/config/content";
import { resolveAgencySettings } from "@/lib/supabase/agencySettings";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import BrandMark from "@/components/ui/BrandMark";

// Icônes dessinées à la main (comme components/WhatsAppButton.tsx) : la
// version de lucide-react installée dans ce projet n'inclut plus les icônes
// de marques (Facebook/Instagram/LinkedIn), voir node_modules/lucide-react.
const SOCIAL_ICONS = {
  facebook: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 4h-2a4 4 0 0 0-4 4v3H7v3h2v7h3v-7h2.5l.5-3H12V8a1 1 0 0 1 1-1h2V4Z"
    />
  ),
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M17 7h.01" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10.5v6M8 7.5h.01M12 16.5v-3.8a2.2 2.2 0 0 1 4.4 0v3.8" />
    </>
  ),
} as const;

const SOCIAL_LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
} as const;

export default async function Footer() {
  // Identité, coordonnées et réseaux sociaux runtime (agency_settings) avec
  // repli sur config/agency.ts — voir lib/supabase/agencySettings.ts
  // (V3.3.Q pour les réseaux, étendu en V3.3.R à l'identité/contact).
  const settings = await resolveAgencySettings();
  // Ne liste que les réseaux réellement renseignés : tant qu'aucune valeur
  // runtime ni statique n'existe, ce tableau reste vide et rien n'est affiché.
  const socialLinks = (Object.keys(SOCIAL_ICONS) as (keyof typeof SOCIAL_ICONS)[])
    .map((key) => ({ key, href: settings.socials[key] }))
    .filter((link): link is { key: keyof typeof SOCIAL_ICONS; href: string } => Boolean(link.href));

  return (
    <footer id="contact" className="bg-ink text-stone-300">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <BrandMark
              textClassName="font-serif text-2xl text-white"
              agencyName={settings.name}
              agencyShortName={settings.shortName}
            />
            <p className="mt-4 max-w-xs text-sm text-stone-400">
              {content.footer.tagline(settings.foundedYear)}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Navigation
            </h3>
            {/* py-1.5/-my-1.5 (V3.3.Q.1.8) : agrandit la zone tactile de
                chaque lien sans chevaucher son voisin — les deux liens
                adjacents "gagnent" chacun exactement la moitié de l'espace
                du gap-y-3 (12px) qui les sépare déjà, sans le réduire. */}
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  href="/#accueil"
                  className="inline-block -my-1.5 py-1.5 transition-colors hover:text-amber-500"
                >
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  href="/#biens"
                  className="inline-block -my-1.5 py-1.5 transition-colors hover:text-amber-500"
                >
                  Nos biens
                </Link>
              </li>
              <li>
                <Link
                  href="/#services"
                  className="inline-block -my-1.5 py-1.5 transition-colors hover:text-amber-500"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="inline-block -my-1.5 py-1.5 transition-colors hover:text-amber-500"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-stone-400">
              <li>
                {settings.address.street}, {settings.address.postalCode}{" "}
                {settings.address.city}
              </li>
              <li>{settings.phoneDisplay}</li>
              <li>{settings.email}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Newsletter
            </h3>
            <p className="mt-4 text-sm text-stone-400">
              Recevez nos nouvelles offres en avant-première.
            </p>
            <form className="mt-4 flex gap-2">
              <label htmlFor="newsletter-email" className="sr-only">
                Adresse email
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Votre email"
                className="min-w-0 flex-1 rounded-full border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-white placeholder:text-stone-500 focus:border-amber-500 focus:outline-none"
              />
              <Button type="submit" size="compact" className="shrink-0">
                OK
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-stone-800 pt-8 text-sm text-stone-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {settings.name}. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
            {/* py-3/-my-3 (V3.3.Q.1.8) : ces deux liens sont côte à côte
                (gap-6 horizontal, pas d'empilement vertical), donc aucun
                risque de chevauchement à agrandir jusqu'à ~44px. */}
            <a href="#" className="inline-block -my-3 py-3 transition-colors hover:text-amber-500">
              Mentions légales
            </a>
            <a href="#" className="inline-block -my-3 py-3 transition-colors hover:text-amber-500">
              Confidentialité
            </a>

            {socialLinks.length > 0 && (
              <div className="flex items-center gap-4">
                {socialLinks.map(({ key, href }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_LABELS[key]}
                    className="text-stone-400 transition-colors hover:text-amber-500"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      className="h-5 w-5"
                    >
                      {SOCIAL_ICONS[key]}
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </footer>
  );
}
