import { supabase } from "@/lib/supabase/client";

export type NotificationType = "visit_confirmed" | "visit_cancelled" | "review_approved";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

interface NotificationRow {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

function mapNotificationRow(row: NotificationRow): Notification {
  return {
    id: String(row.id),
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

// Lecture réservée au propriétaire (policy RLS "notifications: select own").
export async function getMyNotifications(): Promise<{
  notifications: Notification[];
  error: string | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { notifications: [], error: null };
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { notifications: [], error: error.message };
  }

  return { notifications: (data as NotificationRow[]).map(mapNotificationRow), error: null };
}

// Le grant colonne "update (is_read)" (migration 0006) empêche de toute
// façon de modifier autre chose que ce champ.
export async function markNotificationRead(id: string): Promise<{ error: string | null }> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant de notification invalide." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", numericId);

  if (error) {
    console.error("Erreur Supabase (markNotificationRead):", error);
    return { error: error.message };
  }

  return { error: null };
}

export async function markAllNotificationsRead(): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Erreur Supabase (markAllNotificationsRead):", error);
    return { error: error.message };
  }

  return { error: null };
}

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}

// Création réservée à l'admin (policy RLS "notifications: admin insert") —
// appelée depuis les actions admin qui affectent un client (visites, avis).
// Échec non bloquant pour l'appelant : voir les call sites dans
// visitRequests.ts/reviews.ts, qui journalisent l'erreur sans faire échouer
// l'action admin principale (déjà réussie à ce stade).
export async function createNotification(
  payload: NotificationPayload
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("notifications").insert({
    user_id: payload.userId,
    title: payload.title,
    message: payload.message,
    type: payload.type,
  });

  if (error) {
    console.error("Erreur Supabase (createNotification):", error);
    return { error: error.message };
  }

  return { error: null };
}
