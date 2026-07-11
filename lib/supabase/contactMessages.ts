import { supabase } from "@/lib/supabase/client";

export type ContactMessageStatus = "new" | "read";

export interface ContactMessagePayload {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
}

interface ContactMessageRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  created_at: string;
}

function mapContactMessageRow(row: ContactMessageRow): ContactMessage {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

// Insertion publique (formulaire de contact du site). Le rôle anon ET le
// rôle authenticated ont le droit d'insérer (un admin peut naviguer sur le
// site public sans se déconnecter) — voir les policies RLS côté Supabase.
export async function createContactMessage(
  payload: ContactMessagePayload
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("contact_messages").insert({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    subject: payload.subject,
    message: payload.message,
    status: "new",
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// Lecture réservée à l'admin (rôle authenticated) — voir la policy RLS
// "authenticated can select contact messages" côté Supabase.
export async function getContactMessages(): Promise<{
  messages: ContactMessage[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { messages: [], error: error.message };
  }

  return { messages: (data as ContactMessageRow[]).map(mapContactMessageRow), error: null };
}

export async function markContactMessageAsRead(id: string): Promise<{ error: string | null }> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant de message invalide." };
  }

  const { error } = await supabase
    .from("contact_messages")
    .update({ status: "read" })
    .eq("id", numericId);

  if (error) {
    console.error("Erreur Supabase (markContactMessageAsRead):", error);
    return { error: error.message };
  }

  return { error: null };
}

export async function deleteContactMessage(id: string): Promise<{ error: string | null }> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant de message invalide." };
  }

  const { error } = await supabase.from("contact_messages").delete().eq("id", numericId);

  if (error) {
    console.error("Erreur Supabase (deleteContactMessage):", error);
    return { error: error.message };
  }

  return { error: null };
}
