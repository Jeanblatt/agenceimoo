"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminSidebar, { type AdminView } from "@/components/admin/AdminSidebar";
import { signOut, useSession } from "@/lib/supabase/auth";
import { getMyProfile, type ProfileRole } from "@/lib/supabase/profiles";
import { getVisitRequests } from "@/lib/supabase/visitRequests";
import { getAgencySettings } from "@/lib/supabase/agencySettings";

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
  const session = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  // `undefined` = vérification du rôle en cours, `null` = pas de profil
  // (ne devrait pas arriver, le trigger Supabase en crée un à l'inscription).
  // N'importe quel compte authentifié n'est plus suffisant pour accéder à
  // /admin depuis l'ouverture de l'espace client : il faut role === "admin".
  const [role, setRole] = useState<ProfileRole | null | undefined>(undefined);

  // Identité de l'agence pour le header (V3.3.S.2) : /admin est un arbre
  // Client Component de bout en bout (voir app/admin/page.tsx), donc pas de
  // Server Component parent disponible pour résoudre resolveAgencySettings()
  // (mémoïsée par React cache(), non applicable hors Server Component).
  // getAgencySettings() est la fonction prévue pour ce cas depuis V3.3.S ;
  // tant qu'elle n'a pas répondu, BrandMark retombe sur config/agency.ts
  // (props undefined), jamais sur une valeur vide/undefined affichée telle
  // quelle.
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!session) {
        if (!cancelled) setRole(undefined);
        return;
      }
      const { profile } = await getMyProfile();
      if (!cancelled) setRole(profile?.role ?? null);
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  // Notifications de la cloche : les demandes de visite en attente les plus
  // récentes, communes à toutes les pages /admin/* puisque le shell est
  // partagé entre elles.
  useEffect(() => {
    if (!session || role !== "admin") return;

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
  }, [session, role]);

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

  if (role === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-stone-100">
        <p className="text-sm text-stone-500">Vérification des droits...</p>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-stone-100 px-6 text-center">
        <h1 className="font-serif text-2xl text-stone-900">Accès refusé</h1>
        <p className="max-w-sm text-sm text-stone-500">
          Ce compte n&apos;a pas les droits d&apos;administration nécessaires pour accéder à
          cet espace.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/compte"
            className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"
          >
            Mon compte
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="rounded-full px-6 py-2.5 text-sm font-medium text-stone-600 ring-1 ring-stone-300 transition-colors hover:bg-stone-200"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-stone-100">
      <AdminHeader
        onMenuClick={() => setSidebarOpen(true)}
        userEmail={session.user.email ?? "Administrateur"}
        onSignOut={signOut}
        notifications={notifications}
        agencyName={agencyName}
        agencyShortName={agencyShortName}
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
