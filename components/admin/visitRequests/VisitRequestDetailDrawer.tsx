"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Home,
  Loader2,
  Mail,
  Phone,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import type { Property } from "@/data/properties";
import type { VisitRequest, VisitRequestStatus } from "@/lib/supabase/visitRequests";
import StatusBadge from "@/components/admin/visitRequests/StatusBadge";
import { formatPrice } from "@/utils/formatPrice";

interface VisitRequestDetailDrawerProps {
  request: VisitRequest | null;
  property: Property | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: VisitRequestStatus) => Promise<void>;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function formatDateTime(value: string) {
  const date = value.length <= 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  const date = value.length <= 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function VisitRequestDetailDrawer({
  request,
  property,
  onClose,
  onUpdateStatus,
  onSaveNotes,
  onDelete,
}: VisitRequestDetailDrawerProps) {
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<VisitRequestStatus | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Réinitialise le brouillon de note à chaque changement de demande
  // sélectionnée. Ajustement pendant le rendu (plutôt qu'un effect) pour
  // éviter un re-render en cascade — cf. la doc React sur l'adaptation
  // d'un state suite au changement d'une prop.
  const [loadedRequestId, setLoadedRequestId] = useState<string | null>(null);
  if (request && request.id !== loadedRequestId) {
    setLoadedRequestId(request.id);
    setNotesDraft(request.adminNotes ?? "");
    setConfirmingDelete(false);
  }

  const open = request !== null;

  const handleStatusChange = async (status: VisitRequestStatus) => {
    if (!request) return;
    setUpdatingStatus(status);
    await onUpdateStatus(request.id, status);
    setUpdatingStatus(null);
  };

  const handleSaveNotes = async () => {
    if (!request) return;
    setSavingNotes(true);
    await onSaveNotes(request.id, notesDraft);
    setSavingNotes(false);
  };

  const handleDelete = async () => {
    if (!request) return;
    setDeleting(true);
    await onDelete(request.id);
    setDeleting(false);
  };

  const notesChanged = request !== null && notesDraft !== (request.adminNotes ?? "");

  return (
    <AnimatePresence>
      {open && request && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-stone-950/40"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5">
              <div>
                <h2 className="font-serif text-xl text-stone-900">Demande de visite</h2>
                <div className="mt-1.5">
                  <StatusBadge status={request.status} />
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex-1 space-y-6 px-6 py-6">
              <section>
                <h3 className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  Bien concerné
                </h3>
                <div className="mt-2 rounded-xl bg-stone-50 p-4 ring-1 ring-stone-100">
                  <div className="flex items-start gap-2">
                    <Home className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" strokeWidth={1.75} />
                    <div>
                      <p className="font-medium text-stone-900">
                        {property?.title ?? `Bien #${request.propertyId}`}
                      </p>
                      {property && (
                        <p className="mt-0.5 text-sm text-stone-500">
                          {property.location} · {formatPrice(property.price)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  Client
                </h3>
                <div className="mt-2 space-y-2 rounded-xl bg-stone-50 p-4 ring-1 ring-stone-100">
                  <p className="font-medium text-stone-900">{request.clientName}</p>
                  <a
                    href={`tel:${request.phone}`}
                    className="flex items-center gap-2 text-sm text-stone-600 hover:text-amber-600"
                  >
                    <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {request.phone}
                  </a>
                  <a
                    href={`mailto:${request.email}`}
                    className="flex items-center gap-2 text-sm text-stone-600 hover:text-amber-600"
                  >
                    <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {request.email}
                  </a>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  Visite souhaitée
                </h3>
                <div className="mt-2 flex items-center gap-2 rounded-xl bg-stone-50 p-4 text-sm text-stone-700 ring-1 ring-stone-100">
                  <CalendarDays className="h-4 w-4 text-amber-600" strokeWidth={1.75} />
                  {formatDate(request.visitDate)}
                </div>
              </section>

              {request.message && (
                <section>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-stone-400">
                    Message du client
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-stone-50 p-4 text-sm leading-relaxed text-stone-600 ring-1 ring-stone-100">
                    {request.message}
                  </p>
                </section>
              )}

              <section>
                <h3 className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  Historique
                </h3>
                <div className="mt-2 space-y-1.5 rounded-xl bg-stone-50 p-4 text-sm text-stone-600 ring-1 ring-stone-100">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.75} />
                    Créée le {formatDateTime(request.createdAt)}
                  </div>
                  {request.updatedAt !== request.createdAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.75} />
                      Mise à jour le {formatDateTime(request.updatedAt)}
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  Note administrateur
                </h3>
                <textarea
                  rows={3}
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                  placeholder="Note interne, visible uniquement par l'équipe..."
                  className="mt-2 w-full resize-none rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={!notesChanged || savingNotes}
                  className="mt-2 flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {savingNotes && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Enregistrer la note
                </button>
              </section>
            </div>

            <div className="space-y-2 border-t border-stone-100 px-6 py-5">
              {(request.status === "pending" || request.status === "confirmed") && (
                <div className="flex flex-wrap gap-2">
                  {request.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange("confirmed")}
                      disabled={updatingStatus !== null}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updatingStatus === "confirmed" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Confirmer
                    </button>
                  )}
                  {request.status === "confirmed" && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange("completed")}
                      disabled={updatingStatus !== null}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {updatingStatus === "completed" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Marquer terminée
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleStatusChange("cancelled")}
                    disabled={updatingStatus !== null}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-stone-100 px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    {updatingStatus === "cancelled" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Annuler
                  </button>
                </div>
              )}

              {confirmingDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirmer la suppression
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="rounded-lg px-4 py-2.5 text-sm text-stone-500 hover:bg-stone-100"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  Supprimer la demande
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
