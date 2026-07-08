"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

const notifications = [
  "Nouvelle demande de contact — Villa Moderne avec Piscine",
  "Un bien vient d'être marqué comme vendu",
  "3 nouveaux messages de prospects cette semaine",
];

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-[73px] shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4 md:px-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Ouvrir le menu"
          className="flex h-10 w-10 items-center justify-center text-stone-600 md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-serif text-xl text-stone-900">
            Horizon<span className="text-amber-500">.</span>
          </span>
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
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
              />
              <path strokeLinecap="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-semibold text-stone-950">
              {notifications.length}
            </span>
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-72 rounded-xl bg-white p-2 shadow-xl ring-1 ring-stone-100"
              >
                <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-stone-400">
                  Notifications
                </p>
                <ul className="space-y-1">
                  {notifications.map((notification) => (
                    <li
                      key={notification}
                      className="rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
                    >
                      {notification}
                    </li>
                  ))}
                </ul>
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
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-stone-100"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
              AB
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium text-stone-900">Amira Ben Salah</span>
              <span className="block text-xs text-stone-500">Responsable des ventes</span>
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
