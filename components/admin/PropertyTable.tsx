"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Property, PropertyStatus } from "@/data/properties";
import { formatPrice } from "@/utils/formatPrice";
import { getPropertyStatusLabel } from "@/config/catalog";

interface PropertyTableProps {
  properties: Property[];
  title?: string;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
}

const statusStyles: Record<PropertyStatus, string> = {
  available: "bg-emerald-100 text-emerald-700",
  reserved: "bg-amber-100 text-amber-700",
  sold: "bg-stone-200 text-stone-600",
};
const defaultStatusStyle = "bg-stone-100 text-stone-500";

export default function PropertyTable({
  properties,
  title,
  onEdit,
  onDelete,
}: PropertyTableProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100">
      {title && (
        <div className="border-b border-stone-100 px-6 py-5">
          <h2 className="font-serif text-xl text-stone-900">{title}</h2>
        </div>
      )}

      {properties.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-stone-500">
          Aucune propriété à afficher.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs uppercase tracking-wider text-stone-400">
                <th className="px-6 py-3 font-medium">Image</th>
                <th className="px-6 py-3 font-medium">Bien</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Localisation</th>
                <th className="px-6 py-3 font-medium">Prix</th>
                <th className="px-6 py-3 font-medium">Statut</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property, index) => {
                const image = property.images?.[0];
                return (
                  <motion.tr
                    key={property.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03 }}
                    className="border-b border-stone-50 last:border-0 hover:bg-stone-50"
                  >
                    <td className="px-6 py-3">
                      <div className="relative h-14 w-20 overflow-hidden rounded-lg bg-stone-100">
                        {image ? (
                          <Image
                            src={image.url}
                            alt={property.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-300">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="h-6 w-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="max-w-[220px] truncate px-6 py-3 font-medium text-stone-900">
                      {property.title}
                    </td>
                    <td className="px-6 py-3 text-stone-600">{property.type}</td>
                    <td className="px-6 py-3 text-stone-600">{property.location}</td>
                    <td className="whitespace-nowrap px-6 py-3 font-medium text-stone-900">
                      {formatPrice(property.price)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                          property.status ? statusStyles[property.status] : defaultStatusStyle
                        }`}
                      >
                        {property.status ? (getPropertyStatusLabel(property.status) ?? property.status) : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/properties/${property.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Voir l'annonce publique"
                          className="flex h-11 w-11 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </Link>

                        <button
                          type="button"
                          onClick={() => onEdit(property)}
                          aria-label="Modifier"
                          className="flex h-11 w-11 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"
                            />
                          </svg>
                        </button>

                        {confirmingId === property.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDelete(property.id);
                                setConfirmingId(null);
                              }}
                              className="whitespace-nowrap rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700"
                            >
                              Confirmer
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingId(null)}
                              className="rounded-lg px-2.5 py-2 text-xs text-stone-500 hover:bg-stone-100"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmingId(property.id)}
                            aria-label="Supprimer"
                            className="flex h-11 w-11 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
