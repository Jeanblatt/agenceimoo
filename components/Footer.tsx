import Link from "next/link";
import { AGENCY } from "@/lib/site";

export default function Footer() {
  return (
    <footer id="contact" className="bg-stone-950 text-stone-300">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <span className="font-serif text-2xl text-white">
              Horizon<span className="text-amber-500">.</span>
            </span>
            <p className="mt-4 max-w-xs text-sm text-stone-400">
              Agence immobilière premium, dédiée à la recherche de biens
              d&apos;exception depuis 2010.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Navigation
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/#accueil" className="transition-colors hover:text-amber-500">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/#biens" className="transition-colors hover:text-amber-500">
                  Nos biens
                </Link>
              </li>
              <li>
                <Link href="/#services" className="transition-colors hover:text-amber-500">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-amber-500">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-stone-400">
              <li>
                {AGENCY.address.streetAddress}, {AGENCY.address.postalCode}{" "}
                {AGENCY.address.addressLocality}
              </li>
              <li>{AGENCY.telephoneDisplay}</li>
              <li>{AGENCY.email}</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Newsletter
            </h4>
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
                className="w-full rounded-full border border-stone-700 bg-stone-900 px-4 py-2.5 text-sm text-white placeholder:text-stone-500 focus:border-amber-500 focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-medium text-stone-950 transition-colors hover:bg-amber-400"
              >
                OK
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-stone-800 pt-8 text-sm text-stone-500 sm:flex-row">
          <p>© 2026 Horizon Immobilier. Tous droits réservés.</p>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-amber-500">
              Mentions légales
            </a>
            <a href="#" className="transition-colors hover:text-amber-500">
              Confidentialité
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
