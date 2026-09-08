"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DashboardStats from "@/components/admin/DashboardStats";
import PropertyTable from "@/components/admin/PropertyTable";
import PropertyForm from "@/components/admin/PropertyForm";
import AgencySettingsForm from "@/components/admin/AgencySettingsForm";
import AgencyContentForm from "@/components/admin/AgencyContentForm";
import type { Property } from "@/data/properties";
import type { AdminView } from "@/components/admin/AdminSidebar";
import {
  getAnnonces,
  insertAnnonce,
  updateAnnonce,
  deleteAnnonce,
  type AnnoncePayload,
} from "@/lib/supabase/annonces";
import { getVisitRequests } from "@/lib/supabase/visitRequests";

interface Feedback {
  type: "success" | "error";
  message: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [pendingVisits, setPendingVisits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [view, setView] = useState<AdminView>("dashboard");
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const refreshProperties = useCallback(async () => {
    const { properties: data, error } = await getAnnonces();
    if (error) {
      setLoadError(error);
      return;
    }
    setLoadError(null);
    setProperties(data);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [, { requests }] = await Promise.all([refreshProperties(), getVisitRequests()]);
      setPendingVisits(requests.filter((request) => request.status === "pending").length);
      setLoading(false);
    })();
  }, [refreshProperties]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const handleNavigate = (nextView: AdminView) => {
    // "Avis clients", "Demandes de visite" et "Messages" sont de vraies
    // pages séparées, pas des vues locales.
    if (nextView === "reviews") {
      router.push("/admin/reviews");
      return;
    }
    if (nextView === "visitRequests") {
      router.push("/admin/visit-requests");
      return;
    }
    if (nextView === "messages") {
      router.push("/admin/messages");
      return;
    }
    if (nextView !== "edit") setEditingProperty(null);
    setView(nextView);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setView("edit");
  };

  // Ces deux fonctions se contentent de retourner le résultat brut de
  // insertAnnonce/updateAnnonce ({ property, error }) : PropertyForm attend
  // l'annonce créée/modifiée pour, en création, uploader ensuite les photos
  // en attente vers Storage. Le rafraîchissement de la liste et le feedback
  // n'interviennent qu'une fois tout terminé, via handleSaved.
  const handleCreate = (values: AnnoncePayload) => insertAnnonce(values);

  const handleUpdate = (values: AnnoncePayload) => {
    if (!editingProperty) {
      return Promise.resolve({ property: null, error: "Aucun bien sélectionné." });
    }
    return updateAnnonce(editingProperty.id, values);
  };

  const handleSaved = async (message: string) => {
    await refreshProperties();
    router.refresh();
    setFeedback({ type: "success", message });
    setEditingProperty(null);
    setView("properties");
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteAnnonce(id);

    if (error) {
      console.error("Échec de la suppression du bien :", error);
      setFeedback({ type: "error", message: `La suppression a échoué : ${error}` });
      return;
    }

    await refreshProperties();
    router.refresh();
    setFeedback({ type: "success", message: "Le bien a été supprimé." });
  };

  return (
    <AdminShell activeView={view} onNavigate={handleNavigate}>
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
          Impossible de charger les biens : {loadError}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-stone-500">Chargement des biens...</p>
      ) : (
        <>
          {view === "dashboard" && (
            <div className="space-y-8">
              <div>
                <h1 className="font-serif text-2xl text-stone-900">Tableau de bord</h1>
                <p className="mt-1 text-sm text-stone-500">
                  Vue d&apos;ensemble de votre portefeuille de biens.
                </p>
              </div>

              <DashboardStats properties={properties} pendingVisits={pendingVisits} />

              <PropertyTable
                properties={properties.slice(0, 5)}
                title="Dernières annonces"
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}

          {view === "properties" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-2xl text-stone-900">Propriétés</h1>
                <p className="mt-1 text-sm text-stone-500">
                  {properties.length} bien{properties.length !== 1 ? "s" : ""} au total.
                </p>
              </div>

              <PropertyTable
                properties={properties}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}

          {view === "add" && (
            <div className="space-y-6">
              <h1 className="font-serif text-2xl text-stone-900">Ajouter un bien</h1>
              <PropertyForm onSubmit={handleCreate} onSaved={handleSaved} onCancel={() => setView("properties")} />
            </div>
          )}

          {view === "edit" && editingProperty && (
            <div className="space-y-6">
              <h1 className="font-serif text-2xl text-stone-900">Modifier le bien</h1>
              <PropertyForm
                initialValues={editingProperty}
                onSubmit={handleUpdate}
                onSaved={handleSaved}
                onCancel={() => {
                  setEditingProperty(null);
                  setView("properties");
                }}
              />
            </div>
          )}

          {view === "content" && <AgencyContentForm />}

          {view === "settings" && <AgencySettingsForm />}
        </>
      )}
    </AdminShell>
  );
}
