"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { AdminProperty } from "@/data/adminProperties";

interface DashboardStatsProps {
  properties: AdminProperty[];
}

interface Stat {
  label: string;
  value: number;
  icon: ReactNode;
}

export default function DashboardStats({ properties }: DashboardStatsProps) {
  const total = properties.length;
  const available = properties.filter((p) => p.status === "Disponible").length;
  const sold = properties.filter((p) => p.status === "Vendu").length;
  // Donnée simulée en attendant la connexion au vrai formulaire de contact.
  const contactRequests = 12;

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
      label: "Demandes de contact",
      value: contactRequests,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 6h16v12H4V6Zm0 0 8 7 8-7"
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
