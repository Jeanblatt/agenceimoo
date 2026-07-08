"use client";

import { useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar, { type AdminView } from "@/components/admin/AdminSidebar";
import DashboardStats from "@/components/admin/DashboardStats";
import PropertyTable from "@/components/admin/PropertyTable";
import PropertyForm, { type PropertyFormValues } from "@/components/admin/PropertyForm";
import {
  adminProperties as initialProperties,
  type AdminProperty,
} from "@/data/adminProperties";

export default function AdminDashboardPage() {
  const [properties, setProperties] = useState<AdminProperty[]>(initialProperties);
  const [view, setView] = useState<AdminView>("dashboard");
  const [editingProperty, setEditingProperty] = useState<AdminProperty | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (nextView: AdminView) => {
    if (nextView !== "edit") setEditingProperty(null);
    setView(nextView);
    setSidebarOpen(false);
  };

  const handleEdit = (property: AdminProperty) => {
    setEditingProperty(property);
    setView("edit");
  };

  const handleCreate = (values: PropertyFormValues) => {
    const newProperty: AdminProperty = {
      ...values,
      id: `local-${Date.now()}`,
    };
    setProperties((current) => [newProperty, ...current]);
    setView("properties");
  };

  const handleUpdate = (values: PropertyFormValues) => {
    if (!editingProperty) return;
    setProperties((current) =>
      current.map((property) =>
        property.id === editingProperty.id ? { ...values, id: editingProperty.id } : property
      )
    );
    setEditingProperty(null);
    setView("properties");
  };

  const handleDelete = (id: string) => {
    setProperties((current) => current.filter((property) => property.id !== id));
  };

  return (
    <div className="flex min-h-dvh flex-col bg-stone-100">
      <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1">
        <AdminSidebar
          activeView={view}
          onNavigate={handleNavigate}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="min-w-0 flex-1 px-4 py-8 md:px-8">
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
        </main>
      </div>
    </div>
  );
}
