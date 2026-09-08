"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";

interface ClientHeaderProps {
  onMenuClick: () => void;
  userEmail: string;
  onSignOut: () => void;
  unreadCount: number;
  onBellClick: () => void;
  /** Résolus par ClientShell (V3.3.S.2) via getAgencySettings() et transmis à BrandMark. */
  agencyName?: string;
  agencyShortName?: string;
}

function initialsOf(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export default function ClientHeader({
  onMenuClick,
  userEmail,
  onSignOut,
  unreadCount,
  onBellClick,
  agencyName,
  agencyShortName,
}: ClientHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-[73px] shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4 md:px-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Ouvrir le menu"
          className="flex h-11 w-11 items-center justify-center text-stone-600 md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link href="/compte" className="flex items-center gap-2">
          <BrandMark
            textClassName="font-serif text-xl text-stone-900"
            agencyName={agencyName}
            agencyShortName={agencyShortName}
          />
          <span className="hidden rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-stone-500 sm:inline-block">
            Mon compte
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBellClick}
          aria-label="Notifications"
          className="relative flex h-11 w-11 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100"
        >
          <Bell className="h-5 w-5" strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-stone-950">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full py-1.5 pl-1 pr-2 transition-colors hover:bg-stone-100"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
              {initialsOf(userEmail)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block max-w-[160px] truncate text-sm font-medium text-stone-900">
                {userEmail}
              </span>
            </span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-stone-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 rounded-xl bg-white p-2 shadow-xl ring-1 ring-stone-100"
              >
                <Link
                  href="/"
                  className="block rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
                >
                  ← Retour au site
                </Link>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Se déconnecter
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
