"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DashboardStats from "@/components/admin/DashboardStats";
import PropertyTable from "@/components/admin/PropertyTable";
import PropertyForm from "@/components/admin/PropertyForm";
import type { Property } from "@/data/properties";
import type { AdminView } from "@/components/admin/AdminSidebar";
import {
  getAnnonces,
  insertAnnonce,
  updateAnnonce,
  deleteAnnonce,
  type AnnoncePayload,
} from "@/lib/supabase/annonces";

interface Feedback {
  type: "success" | "error";
  message: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [view, setView] = useState<AdminView>("dashboard");
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
      await refreshProperties();
      setLoading(false);
    })();
  }, [refreshProperties]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const handleNavigate = (nextView: AdminView) => {
    // "Avis clients" est une vraie page séparée, pas une vue locale.
    if (nextView === "reviews") {
      router.push("/admin/reviews");
      return;
    }
    if (nextView !== "edit") setEditingProperty(null);
    setSubmitError(null);
    setView(nextView);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setSubmitError(null);
    setView("edit");
  };

  const handleCreate = async (values: AnnoncePayload) => {
    setIsSubmitting(true);
    setSubmitError(null);

    const { error } = await insertAnnonce(values);
    setIsSubmitting(false);

    if (error) {
      // Erreur Supabase complète, pour le diagnostic.
      console.error("Échec de l'ajout du bien :", error);
      setSubmitError(
        `L'ajout a échoué : ${error}. Vérifiez que la table "annonces" autorise l'insertion (policy RLS).`
      );
      return;
    }

    await refreshProperties();
    router.refresh();
    setFeedback({ type: "success", message: "Le bien a été ajouté avec succès." });
    setView("properties");
  };

  const handleUpdate = async (values: AnnoncePayload) => {
    if (!editingProperty) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const { error } = await updateAnnonce(editingProperty.id, values);
    setIsSubmitting(false);

    if (error) {
      console.error("Échec de la modification du bien :", error);
      setSubmitError(`La modification a échoué : ${error}.`);
      return;
    }

    await refreshProperties();
    router.refresh();
    setFeedback({ type: "success", message: "Le bien a été mis à jour avec succès." });
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

              <DashboardStats properties={properties} />

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
              <PropertyForm
                onSubmit={handleCreate}
                onCancel={() => setView("properties")}
                isSubmitting={isSubmitting}
                submitError={submitError}
              />
            </div>
          )}

          {view === "edit" && editingProperty && (
            <div className="space-y-6">
              <h1 className="font-serif text-2xl text-stone-900">Modifier le bien</h1>
              <PropertyForm
                initialValues={editingProperty}
                onSubmit={handleUpdate}
                onCancel={() => {
                  setEditingProperty(null);
                  setView("properties");
                }}
                isSubmitting={isSubmitting}
                submitError={submitError}
              />
            </div>
          )}

          {view === "messages" && (
            <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-stone-100">
              <h1 className="font-serif text-2xl text-stone-900">Messages</h1>
              <p className="mt-2 text-sm text-stone-500">
                La messagerie des prospects sera bientôt connectée au formulaire de
                contact du site.
              </p>
            </div>
          )}

          {view === "settings" && (
            <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-stone-100">
              <h1 className="font-serif text-2xl text-stone-900">Paramètres</h1>
              <p className="mt-2 text-sm text-stone-500">
                Les paramètres de l&apos;agence seront disponibles dans une prochaine
                version.
              </p>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
