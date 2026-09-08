"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { signIn } from "@/lib/supabase/auth";
import { agency } from "@/config/agency";

const fieldClasses =
  "mt-1.5 w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none";
const labelClasses = "text-xs font-medium uppercase tracking-wider text-stone-500";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await signIn(email.trim(), password);
    setIsSubmitting(false);

    if (signInError) {
      console.error("Échec de connexion admin :", signInError);
      setError("Email ou mot de passe incorrect.");
      return;
    }
    // Succès : onAuthStateChange (écouté par app/admin/page.tsx) prend le relais.
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
            <Lock className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <h1 className="mt-4 font-serif text-2xl text-stone-900">Espace administrateur</h1>
          <p className="mt-1 text-sm text-stone-500">
            Connectez-vous pour gérer les biens de l&apos;agence.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          <div>
            <label htmlFor="admin-email" className={labelClasses}>
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClasses}
              placeholder={agency.email}
            />
          </div>

          <div>
            <label htmlFor="admin-password" className={labelClasses}>
              Mot de passe
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
