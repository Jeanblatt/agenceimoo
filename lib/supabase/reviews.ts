import { supabase } from "@/lib/supabase/client";

export type ReviewStatus = "pending" | "approved";

export interface Review {
  id: string;
  clientName: string;
  clientPhoto: string | null;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
}

interface ReviewRow {
  id: number;
  client_name: string;
  client_photo: string | null;
  rating: number;
  comment: string;
  status: ReviewStatus;
  created_at: string;
}

function mapReviewRow(row: ReviewRow): Review {
  return {
    id: String(row.id),
    clientName: row.client_name,
    clientPhoto: row.client_photo,
    rating: row.rating,
    comment: row.comment,
    status: row.status,
    createdAt: row.created_at,
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

export async function approveReview(id: string): Promise<{ error: string | null }> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant d'avis invalide." };
  }

  const { error } = await supabase
    .from("reviews")
    .update({ status: "approved" })
    .eq("id", numericId);

  if (error) {
    console.error("Erreur Supabase (approveReview):", error);
    return { error: error.message };
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
