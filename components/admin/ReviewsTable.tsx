"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Star, Trash2 } from "lucide-react";
import type { Review } from "@/lib/supabase/reviews";

interface ReviewsTableProps {
  reviews: Review[];
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
}

const statusStyles: Record<Review["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
};

const statusLabels: Record<Review["status"], string> = {
  pending: "En attente",
  approved: "Validé",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ReviewsTable({ reviews, onApprove, onDelete }: ReviewsTableProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (reviews.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100">
        <p className="px-6 py-10 text-center text-sm text-stone-500">
          Aucun avis pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-xs uppercase tracking-wider text-stone-400">
              <th className="px-6 py-3 font-medium">Client</th>
              <th className="px-6 py-3 font-medium">Note</th>
              <th className="px-6 py-3 font-medium">Commentaire</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Statut</th>
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review, index) => (
              <motion.tr
                key={review.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03 }}
                className="border-b border-stone-50 last:border-0 hover:bg-stone-50"
              >
                <td className="px-6 py-3 font-medium text-stone-900">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-900 text-xs font-semibold text-white">
                      {review.clientPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element -- avatar externe, taille fixe non critique
                        <img
                          src={review.clientPhoto}
                          alt={review.clientName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        review.clientName.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    {review.clientName}
                  </div>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className={`h-3.5 w-3.5 ${
                          starIndex < review.rating
                            ? "fill-amber-500 text-amber-500"
                            : "text-stone-300"
                        }`}
                      />
                    ))}
                  </div>
                </td>
                <td className="max-w-[280px] truncate px-6 py-3 text-stone-600">
                  {review.comment}
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-stone-600">
                  {formatDate(review.createdAt)}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[review.status]}`}
                  >
                    {statusLabels[review.status]}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {review.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => onApprove(review.id)}
                        aria-label="Valider l'avis"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                      >
                        <Check className="h-4 w-4" strokeWidth={2} />
                      </button>
                    )}

                    {confirmingId === review.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(review.id);
                            setConfirmingId(null);
                          }}
                          className="whitespace-nowrap rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                        >
                          Confirmer
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          className="rounded-lg px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-100"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(review.id)}
                        aria-label="Supprimer l'avis"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
