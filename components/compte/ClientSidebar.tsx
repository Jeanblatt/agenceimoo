"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

export type ClientView = "profile" | "favorites" | "visits" | "messages" | "reviews" | "notifications";

interface NavItem {
  view: ClientView;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  {
    view: "profile",
    label: "Profil",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path strokeLinecap="round" d="M4.5 20a7.5 7.5 0 0 1 15 0" />
      </>
    ),
  },
  {
    view: "favorites",
    label: "Favoris",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z"
      />
    ),
  },
  {
    view: "visits",
    label: "Mes visites",
    icon: (
      <>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path strokeLinecap="round" d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 14.5 2.2 2.2 4.3-4.3" />
      </>
    ),
  },
  {
    view: "messages",
    label: "Mes messages",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4 8.3 8.3 0 0 1-3.8-.9L3 21l1.9-5.8a8.3 8.3 0 0 1-.9-3.8A8.4 8.4 0 1 1 21 11.5Z"
      />
    ),
  },
  {
    view: "reviews",
    label: "Mes avis",
    icon: (
      <polygon
        strokeLinejoin="round"
        points="12 3 14.6 8.6 20.8 9.4 16.4 13.6 17.5 19.8 12 16.8 6.5 19.8 7.6 13.6 3.2 9.4 9.4 8.6"
      />
    ),
  },
  {
    view: "notifications",
    label: "Notifications",
    icon: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3a5 5 0 0 0-5 5c0 5-2 6-2 7h14c0-1-2-2-2-7a5 5 0 0 0-5-5Z"
        />
        <path strokeLinecap="round" d="M10 19a2 2 0 0 0 4 0" />
      </>
    ),
  },
];

interface ClientSidebarProps {
  activeView: ClientView;
  onNavigate: (view: ClientView) => void;
  open: boolean;
  onClose: () => void;
}

export default function ClientSidebar({
  activeView,
  onNavigate,
  open,
  onClose,
}: ClientSidebarProps) {
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-stone-950/40 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out md:sticky md:top-[73px] md:z-30 md:h-[calc(100dvh-73px)] md:w-64 md:translate-x-0 md:shadow-none md:transition-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 md:hidden">
          <span className="font-serif text-lg text-stone-900">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="flex h-11 w-11 items-center justify-center text-stone-500"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          {navItems.map((item) => {
            const isActive = activeView === item.view;

            return (
              <button
                key={item.view}
                type="button"
                onClick={() => onNavigate(item.view)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-amber-500/10 text-amber-700"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="h-5 w-5 shrink-0"
                >
                  {item.icon}
                </svg>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-6">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-stone-500 transition-colors hover:bg-stone-100"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19 3 12l7-7M3 12h18" />
            </svg>
            Retour au site
          </Link>
        </div>
      </aside>
    </>
  );
}
