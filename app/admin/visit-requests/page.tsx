"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import VisitRequestsToolbar, {
  type StatusFilter,
} from "@/components/admin/visitRequests/VisitRequestsToolbar";
import VisitRequestsTable from "@/components/admin/visitRequests/VisitRequestsTable";
import VisitRequestDetailDrawer from "@/components/admin/visitRequests/VisitRequestDetailDrawer";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      if (statusFilter !== "all" && request.status !== statusFilter) return false;
      if (!query) return true;

      const propertyTitle = propertyTitles[request.propertyId]?.toLowerCase() ?? "";
      return (
        request.clientName.toLowerCase().includes(query) ||
        request.phone.toLowerCase().includes(query) ||
        request.email.toLowerCase().includes(query) ||
        propertyTitle.includes(query)
      );
    });
  }, [requests, statusFilter, search, propertyTitles]);

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
          <p className="mt-1 text-sm text-stone-500">
            {loading
              ? "Chargement..."
              : `${requests.length} demande${requests.length !== 1 ? "s" : ""} au total, dont ${counts.pending} en attente.`}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-stone-500">Chargement des demandes...</p>
        ) : (
          <>
            <VisitRequestsToolbar
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              counts={counts}
            />

            <VisitRequestsTable
              requests={filteredRequests}
              propertyTitles={propertyTitles}
              onSelect={(request) => setSelectedId(request.id)}
            />
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
