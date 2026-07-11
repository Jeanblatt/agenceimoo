"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import ReviewsTable from "@/components/admin/ReviewsTable";
import type { AdminView } from "@/components/admin/AdminSidebar";
import { approveReview, deleteReview, getReviews, type Review } from "@/lib/supabase/reviews";

interface Feedback {
  type: "success" | "error";
  message: string;
}

export default function AdminReviewsPage() {
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const refreshReviews = useCallback(async () => {
    const { reviews: data, error } = await getReviews();
    if (error) {
      setLoadError(error);
      return;
    }
    setLoadError(null);
    setReviews(data);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshReviews();
      setLoading(false);
    })();
  }, [refreshReviews]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const handleNavigate = (nextView: AdminView) => {
    if (nextView === "reviews") return;
    // Les autres vues appartiennent au tableau de bord principal.
    router.push("/admin");
  };

  const handleApprove = async (id: string) => {
    const { error } = await approveReview(id);
    if (error) {
      console.error("Échec de la validation de l'avis :", error);
      setFeedback({ type: "error", message: `La validation a échoué : ${error}` });
      return;
    }
    await refreshReviews();
    setFeedback({ type: "success", message: "L'avis a été validé." });
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteReview(id);
    if (error) {
      console.error("Échec de la suppression de l'avis :", error);
      setFeedback({ type: "error", message: `La suppression a échoué : ${error}` });
      return;
    }
    await refreshReviews();
    setFeedback({ type: "success", message: "L'avis a été supprimé." });
  };

  const pendingCount = reviews.filter((review) => review.status === "pending").length;

  return (
    <AdminShell activeView="reviews" onNavigate={handleNavigate}>
      {feedback && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {loadError && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger les avis : {loadError}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl text-stone-900">Avis clients</h1>
          <p className="mt-1 text-sm text-stone-500">
            {loading
              ? "Chargement..."
              : `${reviews.length} avis au total, dont ${pendingCount} en attente de validation.`}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-stone-500">Chargement des avis...</p>
        ) : (
          <ReviewsTable reviews={reviews} onApprove={handleApprove} onDelete={handleDelete} />
        )}
      </div>
    </AdminShell>
  );
}
