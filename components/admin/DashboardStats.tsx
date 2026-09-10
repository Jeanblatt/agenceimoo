"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Property } from "@/data/properties";

interface DashboardStatsProps {
  properties: Property[];
  pendingVisits: number;
  newMessages: number;
  pendingReviews: number;
}

interface Stat {
  label: string;
  value: number;
  icon: ReactNode;
}

export default function DashboardStats({
  properties,
  pendingVisits,
  newMessages,
  pendingReviews,
}: DashboardStatsProps) {
  const total = properties.length;
  const available = properties.filter((p) => p.status === "available").length;
  const sold = properties.filter((p) => p.status === "sold").length;

  const stats: Stat[] = [
    {
      label: "Total propriétés",
      value: total,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6"
        />
      ),
    },
    {
      label: "Biens disponibles",
      value: available,
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />,
    },
    {
      label: "Biens vendus",
      value: sold,
      icon: (
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m20.6 12.9-7.7 7.7a2 2 0 0 1-2.8 0l-6.7-6.7a2 2 0 0 1 0-2.8l7.7-7.7A2 2 0 0 1 12.5 3H19a2 2 0 0 1 2 2v6.5a2 2 0 0 1-.4 1.4Z"
          />
          <circle cx="14.5" cy="9.5" r="1.5" />
        </>
      ),
    },
    {
      label: "Visites en attente",
      value: pendingVisits,
      icon: (
        <>
          <rect x="3.5" y="5" width="17" height="15" rx="2" />
          <path strokeLinecap="round" d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
        </>
      ),
    },
    {
      // Nouveaux messages (pas le total) : voir le commentaire dans
      // app/admin/page.tsx pour la justification de cette convention.
      // Icône reprise à l'identique de AdminSidebar.tsx ("Messages") pour
      // rester cohérent visuellement avec le reste de l'admin.
      label: "Nouveaux messages",
      value: newMessages,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4 8.3 8.3 0 0 1-3.8-.9L3 21l1.9-5.8a8.3 8.3 0 0 1-.9-3.8A8.4 8.4 0 1 1 21 11.5Z"
        />
      ),
    },
    {
      // Icône reprise à l'identique de AdminSidebar.tsx ("Avis clients").
      label: "Avis en attente",
      value: pendingReviews,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m12 2.5 2.9 6.3 6.6.7-5 4.6 1.4 6.6L12 17.6l-5.9 3.1 1.4-6.6-5-4.6 6.6-.7L12 2.5Z"
        />
      ),
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.06 }}
          className="rounded-2xl bg-white p-6 ring-1 ring-stone-100"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              {stat.icon}
            </svg>
          </span>
          <p className="mt-4 font-serif text-3xl text-stone-900">{stat.value}</p>
          <p className="mt-1 text-sm text-stone-500">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
