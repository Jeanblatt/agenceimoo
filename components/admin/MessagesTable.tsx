"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Trash2 } from "lucide-react";
import type { ContactMessage } from "@/lib/supabase/contactMessages";

interface MessagesTableProps {
  messages: ContactMessage[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const statusStyles: Record<ContactMessage["status"], string> = {
  new: "bg-amber-100 text-amber-700",
  read: "bg-stone-200 text-stone-500",
};

const statusLabels: Record<ContactMessage["status"], string> = {
  new: "Nouveau",
  read: "Lu",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function MessagesTable({ messages, onMarkAsRead, onDelete }: MessagesTableProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (messages.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100">
        <p className="px-6 py-10 text-center text-sm text-stone-500">
          Aucun message pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-xs uppercase tracking-wider text-stone-400">
              <th className="px-6 py-3 font-medium">Client</th>
              <th className="px-6 py-3 font-medium">Sujet</th>
              <th className="px-6 py-3 font-medium">Message</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Statut</th>
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((message, index) => (
              <motion.tr
                key={message.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03 }}
                className="border-b border-stone-50 last:border-0 hover:bg-stone-50"
              >
                <td className="px-6 py-3 font-medium text-stone-900">
                  {message.name}
                  <div className="mt-0.5 text-xs font-normal text-stone-500">
                    {message.email}
                  </div>
                  <div className="text-xs font-normal text-stone-500">{message.phone}</div>
                </td>
                <td className="px-6 py-3 text-stone-600">{message.subject}</td>
                <td
                  className="max-w-[320px] truncate px-6 py-3 text-stone-600"
                  title={message.message}
                >
                  {message.message}
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-stone-600">
                  {formatDate(message.createdAt)}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[message.status]}`}
                  >
                    {statusLabels[message.status]}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {message.status === "new" && (
                      <button
                        type="button"
                        onClick={() => onMarkAsRead(message.id)}
                        aria-label="Marquer comme lu"
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                      >
                        <Check className="h-4 w-4" strokeWidth={2} />
                      </button>
                    )}

                    {confirmingId === message.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(message.id);
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
                        onClick={() => setConfirmingId(message.id)}
                        aria-label="Supprimer le message"
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600"
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
