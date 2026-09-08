"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Pencil, Plus, Star } from "lucide-react";
import { getMyProfile } from "@/lib/supabase/profiles";
import {
  createReview,
  getMyReviews,
  updateMyReview,
  type Review,
} from "@/lib/supabase/reviews";

const fieldClasses =
  "mt-1.5 w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none disabled:bg-stone-50 disabled:text-stone-400";
const labelClasses = "text-xs font-medium uppercase tracking-wider text-stone-500";

const statusStyles: Record<Review["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
};

const statusLabels: Record<Review["status"], string> = {
  pending: "En attente de validation",
  approved: "Publié",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
}

function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const filled = starValue <= (hovered ?? value);

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHovered(starValue)}
            aria-label={`${starValue} étoile${starValue > 1 ? "s" : ""}`}
            className="p-2"
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                filled ? "fill-amber-500 text-amber-500" : "text-stone-300"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

interface ReviewFormProps {
  submitLabel: string;
  initialRating?: number;
  initialComment?: string;
  onCancel: () => void;
  onSubmit: (values: { rating: number; comment: string }) => Promise<string | null>;
}

function ReviewForm({
  submitLabel,
  initialRating = 0,
  initialComment = "",
  onCancel,
  onSubmit,
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (rating < 1 || rating > 5) {
      setError("Merci de choisir une note entre 1 et 5 étoiles.");
      return;
    }
    if (comment.trim().length < 5) {
      setError("Votre commentaire est un peu court.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const submitError = await onSubmit({ rating, comment: comment.trim() });
    setIsSubmitting(false);

    if (submitError) {
      setError(submitError);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl bg-white p-6 ring-1 ring-stone-100 sm:p-8"
    >
      <div>
        <label className={labelClasses}>Note</label>
        <div className="mt-1.5">
          <StarRatingInput value={rating} onChange={setRating} />
        </div>
      </div>

      <div>
        <label htmlFor="review-comment" className={labelClasses}>
          Commentaire
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          className={fieldClasses}
          placeholder="Partagez votre expérience avec notre agence..."
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-amber-500 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Envoi..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-full px-6 py-3 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Annuler
        </button>
      </div>
    </motion.form>
  );
}

interface ReviewsViewProps {
  session: Session;
}

export default function ReviewsView({ session }: ReviewsViewProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("");
  const [formMode, setFormMode] = useState<"closed" | "create" | string>("closed");

  const refresh = async () => {
    const { reviews: data, error: fetchError } = await getMyReviews();
    setReviews(data);
    setError(fetchError);
  };

  useEffect(() => {
    (async () => {
      const [{ profile }] = await Promise.all([getMyProfile(), refresh()]);
      setClientName(profile?.fullName || session.user.email || "Client");
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une seule fois au montage
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-stone-900">Mes avis</h1>
          <p className="mt-1 text-sm text-stone-500">
            Partagez votre expérience et suivez la validation de vos avis.
          </p>
        </div>

        {formMode === "closed" && (
          <button
            type="button"
            onClick={() => setFormMode("create")}
            className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-[1.01]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Ajouter un avis
          </button>
        )}
      </div>

      {formMode === "create" && (
        <ReviewForm
          submitLabel="Publier mon avis"
          onCancel={() => setFormMode("closed")}
          onSubmit={async ({ rating, comment }) => {
            const { error: submitError } = await createReview({ clientName, rating, comment });
            if (submitError) return submitError;
            await refresh();
            setFormMode("closed");
            return null;
          }}
        />
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger vos avis : {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-stone-500">Chargement...</p>
      ) : reviews.length === 0 && formMode === "closed" ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-stone-100">
          <p className="text-sm text-stone-500">
            Vous n&apos;avez pas encore laissé d&apos;avis.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-2xl bg-white p-6 ring-1 ring-stone-100">
              {formMode === review.id ? (
                <ReviewForm
                  submitLabel="Enregistrer les modifications"
                  initialRating={review.rating}
                  initialComment={review.comment}
                  onCancel={() => setFormMode("closed")}
                  onSubmit={async ({ rating, comment }) => {
                    const { error: submitError } = await updateMyReview(review.id, {
                      rating,
                      comment,
                    });
                    if (submitError) return submitError;
                    await refresh();
                    setFormMode("closed");
                    return null;
                  }}
                />
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${
                            index < review.rating
                              ? "fill-amber-500 text-amber-500"
                              : "text-stone-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-stone-700">{review.comment}</p>
                    <p className="mt-2 text-xs text-stone-400">
                      {formatDate(review.updatedAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[review.status]}`}
                    >
                      {statusLabels[review.status]}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormMode(review.id)}
                      aria-label="Modifier l'avis"
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
