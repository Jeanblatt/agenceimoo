import { supabase } from "@/lib/supabase/client";

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
}

export interface VisitRequest {
  id: string;
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
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
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

export async function updateVisitRequestStatus(
  id: string,
  status: VisitRequestStatus
): Promise<{ error: string | null }> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant de demande invalide." };
  }

  const { error } = await supabase
    .from("visit_requests")
    .update({ status })
    .eq("id", numericId);

  if (error) {
    console.error("Erreur Supabase (updateVisitRequestStatus):", error);
    return { error: error.message };
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
