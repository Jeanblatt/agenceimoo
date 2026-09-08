import { supabase } from "@/lib/supabase/client";
import { createNotification } from "@/lib/supabase/notifications";

// Le bien lié est stocké dans la table "annonces" (pas "properties" —
// c'est le nom réellement utilisé dans ce projet, voir lib/supabase/annonces.ts).
export type VisitRequestStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface VisitRequestPayload {
  propertyId: string;
  clientName: string;
  phone: string;
  email: string;
  visitDate: string;
  message: string;
  userId?: string;
}

export interface VisitRequest {
  id: string;
  userId: string | null;
  propertyId: string;
  clientName: string;
  phone: string;
  email: string;
  visitDate: string;
  message: string | null;
  status: VisitRequestStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VisitRequestRow {
  id: number;
  user_id: string | null;
  property_id: number;
  client_name: string;
  phone: string;
  email: string;
  visit_date: string;
  message: string | null;
  status: VisitRequestStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapVisitRequestRow(row: VisitRequestRow): VisitRequest {
  return {
    id: String(row.id),
    userId: row.user_id,
    propertyId: String(row.property_id),
    clientName: row.client_name,
    phone: row.phone,
    email: row.email,
    visitDate: row.visit_date,
    message: row.message,
    status: row.status,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatVisitDateLong(value: string) {
  const date = value.length <= 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

// Insertion publique (formulaire "Demander une visite" sur la fiche bien).
// Pas de .select() après l'insert : le rôle anon n'a qu'un droit d'écriture
// sur cette table (confidentialité des coordonnées des demandeurs) — voir la
// policy RLS "anon can insert visit requests" côté Supabase.
export async function createVisitRequest(
  payload: VisitRequestPayload
): Promise<{ error: string | null }> {
  const numericPropertyId = Number(payload.propertyId);
  if (!Number.isFinite(numericPropertyId)) {
    return { error: "Bien introuvable." };
  }

  const { error } = await supabase.from("visit_requests").insert({
    property_id: numericPropertyId,
    client_name: payload.clientName,
    phone: payload.phone,
    email: payload.email,
    visit_date: payload.visitDate,
    message: payload.message || null,
    status: "pending",
    user_id: payload.userId ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// Lecture réservée au client propriétaire de la demande (rôle authenticated,
// policy RLS "visit_requests: select own") — utilisée par l'espace /compte.
// Le filtre user_id est explicite ici (la RLS le garantit de toute façon)
// pour documenter l'intention, comme getApprovedReviews() le fait pour les avis.
export async function getMyVisitRequests(): Promise<{
  requests: VisitRequest[];
  error: string | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { requests: [], error: null };
  }

  const { data, error } = await supabase
    .from("visit_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { requests: [], error: error.message };
  }

  return { requests: (data as VisitRequestRow[]).map(mapVisitRequestRow), error: null };
}

// Lecture réservée à l'admin (rôle authenticated) — voir la policy RLS
// "authenticated can select visit requests" côté Supabase.
export async function getVisitRequests(): Promise<{
  requests: VisitRequest[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("visit_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { requests: [], error: error.message };
  }

  return { requests: (data as VisitRequestRow[]).map(mapVisitRequestRow), error: null };
}

export async function getVisitRequestById(id: string): Promise<{
  request: VisitRequest | null;
  error: string | null;
}> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { request: null, error: "Identifiant de demande invalide." };
  }

  const { data, error } = await supabase
    .from("visit_requests")
    .select("*")
    .eq("id", numericId)
    .maybeSingle();

  if (error) {
    return { request: null, error: error.message };
  }

  return {
    request: data ? mapVisitRequestRow(data as VisitRequestRow) : null,
    error: null,
  };
}

// Après un changement de statut par l'admin, notifie le client propriétaire
// de la demande (si connecté) pour "confirmed"/"cancelled". L'échec éventuel
// de la notification n'est pas remonté à l'appelant : le changement de
// statut lui-même a déjà réussi à ce stade.
export async function updateVisitRequestStatus(
  id: string,
  status: VisitRequestStatus
): Promise<{ error: string | null }> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant de demande invalide." };
  }

  const { data, error } = await supabase
    .from("visit_requests")
    .update({ status })
    .eq("id", numericId)
    .select()
    .single();

  if (error) {
    console.error("Erreur Supabase (updateVisitRequestStatus):", error);
    return { error: error.message };
  }

  const row = data as VisitRequestRow;
  if (row.user_id && (status === "confirmed" || status === "cancelled")) {
    await createNotification({
      userId: row.user_id,
      title: status === "confirmed" ? "Visite confirmée" : "Visite annulée",
      message:
        status === "confirmed"
          ? `Votre demande de visite pour le bien #${row.property_id} a été confirmée pour le ${formatVisitDateLong(row.visit_date)}.`
          : `Votre demande de visite pour le bien #${row.property_id} a été annulée par l'agence.`,
      type: status === "confirmed" ? "visit_confirmed" : "visit_cancelled",
    });
  }

  return { error: null };
}

export async function updateVisitRequestNotes(
  id: string,
  adminNotes: string
): Promise<{ error: string | null }> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant de demande invalide." };
  }

  const { error } = await supabase
    .from("visit_requests")
    .update({ admin_notes: adminNotes || null })
    .eq("id", numericId);

  if (error) {
    console.error("Erreur Supabase (updateVisitRequestNotes):", error);
    return { error: error.message };
  }

  return { error: null };
}

export async function deleteVisitRequest(id: string): Promise<{ error: string | null }> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant de demande invalide." };
  }

  const { error } = await supabase.from("visit_requests").delete().eq("id", numericId);

  if (error) {
    console.error("Erreur Supabase (deleteVisitRequest):", error);
    return { error: error.message };
  }

  return { error: null };
}
