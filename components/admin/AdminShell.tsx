"use client";

import { useEffect, useState, type ReactNode } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminSidebar, { type AdminView } from "@/components/admin/AdminSidebar";
import { signOut, useAdminSession } from "@/lib/supabase/auth";
import { getVisitRequests } from "@/lib/supabase/visitRequests";

function formatVisitDate(value: string) {
  const date = value.length <= 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

interface AdminShellProps {
  activeView: AdminView;
  onNavigate: (view: AdminView) => void;
  children: ReactNode;
}

// Coquille commune à toutes les pages /admin/* : vérifie la session (auth
// déjà existante, réutilisée ici sans changement) et affiche le formulaire
// de connexion tant qu'aucun utilisateur n'est authentifié, sinon le
// header + sidebar + contenu de la page.
export default function AdminShell({ activeView, onNavigate, children }: AdminShellProps) {
  const session = useAdminSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Notifications de la cloche : les demandes de visite en attente les plus
  // récentes, communes à toutes les pages /admin/* puisque le shell est
  // partagé entre elles.
  useEffect(() => {
    if (!session) return;

    let cancelled = false;
    (async () => {
      const { requests } = await getVisitRequests();
      if (cancelled) return;
      const pending = requests.filter((request) => request.status === "pending").slice(0, 5);
      setNotifications(
        pending.map(
          (request) => `Visite demandée par ${request.clientName} (${formatVisitDate(request.visitDate)})`
        )
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  if (session === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-stone-100">
        <p className="text-sm text-stone-500">Chargement...</p>
      </div>
    );
  }

  if (session === null) {
    return <AdminLogin />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-stone-100">
      <AdminHeader
        onMenuClick={() => setSidebarOpen(true)}
        userEmail={session.user.email ?? "Administrateur"}
        onSignOut={signOut}
        notifications={notifications}
      />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1">
        <AdminSidebar
          activeView={activeView}
          onNavigate={(view) => {
            onNavigate(view);
            setSidebarOpen(false);
          }}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="min-w-0 flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
