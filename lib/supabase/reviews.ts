import { supabase } from "@/lib/supabase/client";
import { createNotification } from "@/lib/supabase/notifications";

export type ReviewStatus = "pending" | "approved";

export interface Review {
  id: string;
  userId: string | null;
  clientName: string;
  clientPhoto: string | null;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

interface ReviewRow {
  id: number;
  user_id: string | null;
  client_name: string;
  client_photo: string | null;
  rating: number;
  comment: string;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

function mapReviewRow(row: ReviewRow): Review {
  return {
    id: String(row.id),
    userId: row.user_id,
    clientName: row.client_name,
    clientPhoto: row.client_photo,
    rating: row.rating,
    comment: row.comment,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getReviews(): Promise<{ reviews: Review[]; error: string | null }> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { reviews: [], error: error.message };
  }

  return { reviews: (data as ReviewRow[]).map(mapReviewRow), error: null };
}

// Utilisé par la page d'accueil (public) : uniquement les avis validés par
// l'admin. La policy RLS "anon" ne laisse de toute façon voir que ces
// lignes-là, mais le filtre explicite documente l'intention.
export async function getApprovedReviews(): Promise<{
  reviews: Review[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    return { reviews: [], error: error.message };
  }

  return { reviews: (data as ReviewRow[]).map(mapReviewRow), error: null };
}

export interface ReviewPayload {
  clientName: string;
  rating: number;
  comment: string;
}

// Lecture réservée au client propriétaire de l'avis (rôle authenticated,
// policy RLS "reviews: select own") — utilisée par /compte/avis.
export async function getMyReviews(): Promise<{ reviews: Review[]; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { reviews: [], error: null };
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { reviews: [], error: error.message };
  }

  return { reviews: (data as ReviewRow[]).map(mapReviewRow), error: null };
}

// Création d'un avis par le client connecté. Le statut est toujours forcé à
// "pending" ici (la policy RLS "reviews: insert own" le garantit de toute
// façon) : un nouvel avis attend systématiquement une validation admin.
export async function createReview(payload: ReviewPayload): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté." };
  }

  const { error } = await supabase.from("reviews").insert({
    user_id: user.id,
    client_name: payload.clientName,
    rating: payload.rating,
    comment: payload.comment,
    status: "pending",
  });

  if (error) {
    console.error("Erreur Supabase (createReview):", error);
    return { error: error.message };
  }

  return { error: null };
}

// Modification par le client de son propre avis (policy RLS "reviews:
// update own"). Le statut repasse à "pending" : toute modification doit être
// revalidée par l'admin.
export async function updateMyReview(
  id: string,
  payload: Pick<ReviewPayload, "rating" | "comment">
): Promise<{ error: string | null }> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant d'avis invalide." };
  }

  const { error } = await supabase
    .from("reviews")
    .update({
      rating: payload.rating,
      comment: payload.comment,
      status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", numericId);

  if (error) {
    console.error("Erreur Supabase (updateMyReview):", error);
    return { error: error.message };
  }

  return { error: null };
}

// Notifie le client propriétaire de l'avis (si connecté) après validation
// par l'admin. Échec de la notification non bloquant : voir le commentaire
// équivalent dans visitRequests.ts (updateVisitRequestStatus).
export async function approveReview(id: string): Promise<{ error: string | null }> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant d'avis invalide." };
  }

  const { data, error } = await supabase
    .from("reviews")
    .update({ status: "approved" })
    .eq("id", numericId)
    .select()
    .single();

  if (error) {
    console.error("Erreur Supabase (approveReview):", error);
    return { error: error.message };
  }

  const row = data as ReviewRow;
  if (row.user_id) {
    await createNotification({
      userId: row.user_id,
      title: "Avis publié",
      message: "Votre avis a été validé et est maintenant visible sur le site.",
      type: "review_approved",
    });
  }

  return { error: null };
}

export async function deleteReview(id: string): Promise<{ error: string | null }> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant d'avis invalide." };
  }

  const { error } = await supabase.from("reviews").delete().eq("id", numericId);

  if (error) {
    console.error("Erreur Supabase (deleteReview):", error);
    return { error: error.message };
  }

  return { error: null };
}
