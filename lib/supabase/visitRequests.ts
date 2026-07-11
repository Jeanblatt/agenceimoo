import { supabase } from "@/lib/supabase/client";

export interface VisitRequestPayload {
  propertyId: string;
  clientName: string;
  phone: string;
  email: string;
  visitDate: string;
  message: string;
}

export async function createVisitRequest(
  payload: VisitRequestPayload
): Promise<{ error: string | null }> {
  const numericPropertyId = Number(payload.propertyId);
  if (!Number.isFinite(numericPropertyId)) {
    return { error: "Bien introuvable." };
  }

  // Pas de .select() après l'insert : le rôle anon n'a qu'un droit d'écriture
  // sur cette table (confidentialité des coordonnées des demandeurs), pas de
  // lecture — voir la policy RLS "insert only" à créer côté Supabase.
  const { error } = await supabase.from("visit_requests").insert({
    property_id: numericPropertyId,
    client_name: payload.clientName,
    phone: payload.phone,
    email: payload.email,
    visit_date: payload.visitDate,
    message: payload.message || null,
    status: "En attente",
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
