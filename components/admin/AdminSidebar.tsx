"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

export type AdminView =
  | "dashboard"
  | "properties"
  | "add"
  | "edit"
  | "reviews"
  | "visitRequests"
  | "messages"
  | "content"
  | "settings";

interface NavItem {
  view: AdminView;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  {
    view: "dashboard",
    label: "Dashboard",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    view: "properties",
    label: "Propriétés",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6"
      />
    ),
  },
  {
    view: "add",
    label: "Ajouter un bien",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 8v8M8 12h8" />
      </>
    ),
  },
  {
    view: "reviews",
    label: "Avis clients",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m12 2.5 2.9 6.3 6.6.7-5 4.6 1.4 6.6L12 17.6l-5.9 3.1 1.4-6.6-5-4.6 6.6-.7L12 2.5Z"
      />
    ),
  },
  {
    view: "visitRequests",
    label: "Demandes de visite",
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
    label: "Messages",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4 8.3 8.3 0 0 1-3.8-.9L3 21l1.9-5.8a8.3 8.3 0 0 1-.9-3.8A8.4 8.4 0 1 1 21 11.5Z"
      />
    ),
  },
  {
    view: "content",
    label: "Contenu du site",
    icon: (
      <>
        <rect x="3.5" y="4" width="17" height="16" rx="2" />
        <path strokeLinecap="round" d="M7.5 8.5h9M7.5 12h9M7.5 15.5h5.5" />
      </>
    ),
  },
  {
    view: "settings",
    label: "Paramètres",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path
          strokeLinecap="round"
          d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
        />
      </>
    ),
  },
];

interface AdminSidebarProps {
  activeView: AdminView;
  onNavigate: (view: AdminView) => void;
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({
  activeView,
  onNavigate,
  open,
  onClose,
}: AdminSidebarProps) {
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
            const isActive =
              activeView === item.view ||
              (item.view === "properties" && activeView === "edit");

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
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-stone-500 transition-colors hover:bg-stone-100"
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
