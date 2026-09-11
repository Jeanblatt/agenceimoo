"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import VisitRequestsToolbar, {
  type StatusFilter,
} from "@/components/admin/visitRequests/VisitRequestsToolbar";
import VisitRequestsTable from "@/components/admin/visitRequests/VisitRequestsTable";
import VisitRequestDetailDrawer from "@/components/admin/visitRequests/VisitRequestDetailDrawer";
import VisitCalendar from "@/components/admin/visitRequests/VisitCalendar";
import {
  buildVisitCenterGroups,
  computeVisitSummaryCounts,
  DEFAULT_DATE_FILTER,
  getTunisTodayStr,
  matchesDateFilter,
  matchesViewFilter,
  type DateFilterState,
  type ViewFilter,
} from "@/components/admin/visitRequests/visitScheduling";
import type { AdminView } from "@/components/admin/AdminSidebar";
import { getAnnonces } from "@/lib/supabase/annonces";
import type { Property } from "@/data/properties";
import {
  deleteVisitRequest,
  getVisitRequests,
  updateVisitRequestNotes,
  updateVisitRequestStatus,
  type VisitRequest,
  type VisitRequestStatus,
} from "@/lib/supabase/visitRequests";

interface Feedback {
  type: "success" | "error";
  message: string;
}

export default function AdminVisitRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // V3.5.B — le calendrier est additif : la Liste V3.5.A (recherche,
  // filtres, stats, À venir/Historique) reste intégralement disponible via
  // ce sélecteur, jamais remplacée.
  const [displayMode, setDisplayMode] = useState<"list" | "calendar">("list");

  // Recalculé à chaque rendu (appel Intl très léger, pas de useMemo requis)
  // : reste correct même si l'onglet admin reste ouvert au-delà de minuit.
  const todayStr = getTunisTodayStr();

  const refresh = useCallback(async () => {
    const [{ requests: data, error }, { properties: propertyData }] = await Promise.all([
      getVisitRequests(),
      getAnnonces(),
    ]);

    if (error) {
      setLoadError(error);
      return;
    }
    setLoadError(null);
    setRequests(data);
    setProperties(propertyData);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const propertyTitles = useMemo(
    () => Object.fromEntries(properties.map((property) => [property.id, property.title])),
    [properties]
  );

  // Le seul routage public identifiable pour une annonce est /properties/[id]
  // (app/properties/[id]/page.tsx, param = property.id, même espace que
  // VisitRequest.propertyId) — réutilisé tel quel, aucune nouvelle route.
  const propertyHrefs = useMemo(
    () => Object.fromEntries(properties.map((property) => [property.id, `/properties/${property.id}`])),
    [properties]
  );

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      all: requests.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const request of requests) {
      base[request.status] += 1;
    }
    return base;
  }, [requests]);

  // Toujours sur la liste complète (non filtrée), indépendant des filtres
  // actifs — même convention que `counts` ci-dessus.
  const summary = useMemo(() => computeVisitSummaryCounts(requests, todayStr), [requests, todayStr]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      if (statusFilter !== "all" && request.status !== statusFilter) return false;
      if (!matchesViewFilter(request, viewFilter, todayStr)) return false;
      if (!matchesDateFilter(request.visitDate, dateFilter, todayStr)) return false;
      if (!query) return true;

      const propertyTitle = propertyTitles[request.propertyId]?.toLowerCase() ?? "";
      return (
        request.clientName.toLowerCase().includes(query) ||
        request.phone.toLowerCase().includes(query) ||
        request.email.toLowerCase().includes(query) ||
        propertyTitle.includes(query)
      );
    });
  }, [requests, statusFilter, viewFilter, dateFilter, todayStr, search, propertyTitles]);

  const { upcomingGroups, historyRequests } = useMemo(
    () => buildVisitCenterGroups(filteredRequests, todayStr),
    [filteredRequests, todayStr]
  );

  const selectedRequest = requests.find((request) => request.id === selectedId) ?? null;
  const selectedProperty =
    properties.find((property) => property.id === selectedRequest?.propertyId) ?? null;

  const handleNavigate = (nextView: AdminView) => {
    if (nextView === "visitRequests") return;
    router.push("/admin");
  };

  const handleUpdateStatus = async (id: string, status: VisitRequestStatus) => {
    const { error } = await updateVisitRequestStatus(id, status);
    if (error) {
      console.error("Échec de la mise à jour du statut :", error);
      setFeedback({ type: "error", message: `La mise à jour a échoué : ${error}` });
      return;
    }
    await refresh();
    setFeedback({ type: "success", message: "Le statut de la demande a été mis à jour." });
  };

  const handleSaveNotes = async (id: string, notes: string) => {
    const { error } = await updateVisitRequestNotes(id, notes);
    if (error) {
      console.error("Échec de l'enregistrement de la note :", error);
      setFeedback({ type: "error", message: `L'enregistrement a échoué : ${error}` });
      return;
    }
    await refresh();
    setFeedback({ type: "success", message: "La note a été enregistrée." });
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteVisitRequest(id);
    if (error) {
      console.error("Échec de la suppression de la demande :", error);
      setFeedback({ type: "error", message: `La suppression a échoué : ${error}` });
      return;
    }
    setSelectedId(null);
    await refresh();
    setFeedback({ type: "success", message: "La demande a été supprimée." });
  };

  return (
    <AdminShell activeView="visitRequests" onNavigate={handleNavigate}>
      {feedback && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {loadError && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger les demandes de visite : {loadError}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl text-stone-900">Demandes de visite</h1>
          <p className="mt-1 text-sm text-stone-500">Planifiez et suivez les visites de vos clients.</p>
        </div>

        {loading ? (
          <p className="text-sm text-stone-500">Chargement des demandes...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "À venir", value: summary.upcoming },
                { label: "Aujourd'hui", value: summary.today },
                { label: "En attente", value: summary.pending },
                { label: "Confirmées", value: summary.confirmed },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-white p-4 ring-1 ring-stone-100">
                  <p className="font-serif text-2xl text-stone-900">{stat.value}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-wider text-stone-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-1.5">
              {([
                { value: "list", label: "Liste" },
                { value: "calendar", label: "Calendrier" },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDisplayMode(option.value)}
                  className={`rounded-full px-4 py-2.5 text-xs font-medium transition-colors sm:py-1.5 ${
                    displayMode === option.value
                      ? "bg-amber-500 text-stone-950"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {displayMode === "list" ? (
              <>
                <VisitRequestsToolbar
                  search={search}
                  onSearchChange={setSearch}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  counts={counts}
                  viewFilter={viewFilter}
                  onViewFilterChange={setViewFilter}
                  dateFilter={dateFilter}
                  onDateFilterChange={setDateFilter}
                />

                {(viewFilter === "all" || viewFilter === "upcoming") && (
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-stone-700">À venir</h2>
                    <VisitRequestsTable
                      groups={upcomingGroups}
                      propertyTitles={propertyTitles}
                      propertyHrefs={propertyHrefs}
                      todayStr={todayStr}
                      onSelect={(request) => setSelectedId(request.id)}
                      emptyMessage="Aucune visite à venir ne correspond à ces critères."
                    />
                  </div>
                )}

                {(viewFilter === "all" || viewFilter === "history") && (
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-stone-700">Historique</h2>
                    <VisitRequestsTable
                      groups={[{ requests: historyRequests }]}
                      propertyTitles={propertyTitles}
                      propertyHrefs={propertyHrefs}
                      todayStr={todayStr}
                      onSelect={(request) => setSelectedId(request.id)}
                      emptyMessage="Aucun historique ne correspond à ces critères."
                    />
                  </div>
                )}
              </>
            ) : (
              <VisitCalendar
                requests={requests}
                propertyTitles={propertyTitles}
                onSelect={(request) => setSelectedId(request.id)}
              />
            )}
          </>
        )}
      </div>

      <VisitRequestDetailDrawer
        request={selectedRequest}
        property={selectedProperty}
        onClose={() => setSelectedId(null)}
        onUpdateStatus={handleUpdateStatus}
        onSaveNotes={handleSaveNotes}
        onDelete={handleDelete}
      />
    </AdminShell>
  );
}
