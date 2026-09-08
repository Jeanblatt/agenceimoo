"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BrandMark from "@/components/ui/BrandMark";

interface AdminHeaderProps {
  onMenuClick: () => void;
  userEmail: string;
  onSignOut: () => void;
  notifications: string[];
  /** Résolus par AdminShell (V3.3.S.2) via getAgencySettings() et transmis à BrandMark. */
  agencyName?: string;
  agencyShortName?: string;
}

function initialsOf(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export default function AdminHeader({
  onMenuClick,
  userEmail,
  onSignOut,
  notifications,
  agencyName,
  agencyShortName,
}: AdminHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
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

        <Link href="/admin" className="flex items-center gap-2">
          <BrandMark
            textClassName="font-serif text-xl text-stone-900"
            agencyName={agencyName}
            agencyShortName={agencyShortName}
          />
          <span className="hidden rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-stone-500 sm:inline-block">
            Admin
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
              />
              <path strokeLinecap="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-semibold text-stone-950">
                {notifications.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl bg-white p-2 shadow-xl ring-1 ring-stone-100"
              >
                <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-stone-400">
                  Notifications
                </p>
                {notifications.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-stone-500">
                    Aucune demande de visite en attente.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {notifications.map((notification, index) => (
                      <li
                        key={index}
                        className="rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
                      >
                        {notification}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-full py-1.5 pl-1 pr-2 transition-colors hover:bg-stone-100"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
              {initialsOf(userEmail)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block max-w-[160px] truncate text-sm font-medium text-stone-900">
                {userEmail}
              </span>
              <span className="block text-xs text-stone-500">Administrateur</span>
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
