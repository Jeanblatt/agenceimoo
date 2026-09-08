"use client";

import { useEffect, useState, type ReactNode } from "react";
import ClientAuthForm from "@/components/compte/ClientAuthForm";
import ClientHeader from "@/components/compte/ClientHeader";
import ClientSidebar, { type ClientView } from "@/components/compte/ClientSidebar";
import { signOut, useSession } from "@/lib/supabase/auth";
import { getAgencySettings } from "@/lib/supabase/agencySettings";

interface ClientShellProps {
  activeView: ClientView;
  onNavigate: (view: ClientView) => void;
  unreadCount: number;
  children: ReactNode;
}

// Coquille commune à l'espace /compte : affiche le formulaire de
// connexion/inscription tant qu'aucun utilisateur n'est authentifié, sinon
// le header + sidebar + contenu de la page (même pattern que AdminShell).
export default function ClientShell({ activeView, onNavigate, unreadCount, children }: ClientShellProps) {
  const session = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Identité de l'agence pour le header — même principe que AdminShell
  // (V3.3.S.2) : /compte est aussi un arbre Client Component de bout en
  // bout, getAgencySettings() est la fonction prévue pour ce cas.
  const [agencyName, setAgencyName] = useState<string | undefined>(undefined);
  const [agencyShortName, setAgencyShortName] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { settings } = await getAgencySettings();
      if (cancelled) return;
      setAgencyName(settings.name);
      setAgencyShortName(settings.shortName);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (session === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-stone-100">
        <p className="text-sm text-stone-500">Chargement...</p>
      </div>
    );
  }

  if (session === null) {
    return <ClientAuthForm />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-stone-100">
      <ClientHeader
        onMenuClick={() => setSidebarOpen(true)}
        userEmail={session.user.email ?? "Mon compte"}
        onSignOut={signOut}
        unreadCount={unreadCount}
        onBellClick={() => onNavigate("notifications")}
        agencyName={agencyName}
        agencyShortName={agencyShortName}
      />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1">
        <ClientSidebar
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
