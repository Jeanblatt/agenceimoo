"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { updatePassword } from "@/lib/supabase/auth";

const fieldClasses =
  "mt-1.5 w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none";
const labelClasses = "text-xs font-medium uppercase tracking-wider text-stone-500";

type Status = "checking" | "ready" | "invalid" | "success";

// Page atteinte uniquement via le lien reçu par email (resetPasswordForEmail,
// lib/supabase/auth.ts). Le client Supabase (detectSessionInUrl activé par
// défaut) échange lui-même le jeton présent dans l'URL contre une session de
// récupération temporaire et émet l'événement "PASSWORD_RECOVERY" — aucun
// système de token maison ici, uniquement le mécanisme officiel Supabase Auth.
export default function ResetPasswordForm() {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });

    // Filet de sécurité : si l'événement PASSWORD_RECOVERY a déjà été
    // consommé avant que ce composant ne s'abonne (course possible entre
    // l'analyse de l'URL par le SDK et le montage du composant), la
    // présence d'une session active suffit à autoriser le formulaire.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus((current) => (current === "checking" ? (session ? "ready" : "invalid") : current));
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await updatePassword(password);
    setIsSubmitting(false);

    if (updateError) {
      console.error("Échec de mise à jour du mot de passe :", updateError);
      setError("Impossible de mettre à jour le mot de passe. Réessayez ou redemandez un lien.");
      return;
    }

    setStatus("success");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-stone-100 px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl shadow-stone-900/5 ring-1 ring-stone-100"
      >
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-950 text-amber-400">
            <KeyRound className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <h1 className="mt-4 font-serif text-2xl text-stone-900">Nouveau mot de passe</h1>
        </div>

        {status === "checking" && (
          <p className="mt-6 text-center text-sm text-stone-500">Vérification du lien...</p>
        )}

        {status === "invalid" && (
          <div className="mt-6 space-y-4 text-center">
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Ce lien de réinitialisation est invalide ou a expiré.
            </p>
            <Link
              href="/compte"
              className="inline-block text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              ← Retour à la connexion
            </Link>
          </div>
        )}

        {status === "success" && (
          <div className="mt-6 space-y-4 text-center">
            <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Votre mot de passe a été mis à jour avec succès.
            </p>
            <Link
              href="/compte"
              className="inline-block text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              Aller à mon compte
            </Link>
          </div>
        )}

        {status === "ready" && (
          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <div>
              <label htmlFor="new-password" className={labelClasses}>
                Nouveau mot de passe
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={fieldClasses}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className={labelClasses}>
                Confirmer le mot de passe
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={fieldClasses}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-full bg-amber-500 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Veuillez patienter..." : "Mettre à jour le mot de passe"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
