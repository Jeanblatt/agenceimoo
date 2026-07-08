"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const navLinks = [
  { label: "Accueil", href: "/#accueil" },
  { label: "Biens", href: "/#biens" },
  { label: "Services", href: "/#services" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // Sur les pages sans hero sombre (ex. fiche bien), la barre reste toujours opaque.
  const solid = !isHome || scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid
          ? "bg-stone-950/95 shadow-lg shadow-black/10 backdrop-blur-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl tracking-wide text-white">
            Horizon<span className="text-amber-500">.</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium uppercase tracking-wider text-stone-200 transition-colors hover:text-amber-500"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/contact"
          className="hidden rounded-full border border-amber-500/60 px-6 py-2.5 text-sm font-medium uppercase tracking-wider text-amber-500 transition-colors hover:bg-amber-500 hover:text-stone-950 md:inline-block"
        >
          Nous contacter
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          className="relative z-10 -mr-2.5 flex h-11 w-11 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <motion.span
            animate={{ rotate: open ? 45 : 0, y: open ? 7 : 0 }}
            className="h-0.5 w-6 rounded-full bg-white"
          />
          <motion.span
            animate={{ opacity: open ? 0 : 1 }}
            className="h-0.5 w-6 rounded-full bg-white"
          />
          <motion.span
            animate={{ rotate: open ? -45 : 0, y: open ? -7 : 0 }}
            className="h-0.5 w-6 rounded-full bg-white"
          />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden bg-stone-950 md:hidden"
          >
            <ul className="flex max-h-[calc(100dvh-5rem)] flex-col gap-1 overflow-y-auto px-6 pb-6">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 text-sm uppercase tracking-wider text-stone-200 hover:text-amber-500"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className="mt-2 block rounded-full bg-amber-500 px-6 py-3 text-center text-sm font-medium uppercase tracking-wider text-stone-950"
                >
                  Nous contacter
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
