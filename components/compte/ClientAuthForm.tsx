"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { UserCircle } from "lucide-react";
import { requestPasswordReset, signIn, signUp } from "@/lib/supabase/auth";

const fieldClasses =
  "mt-1.5 w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none";
const labelClasses = "text-xs font-medium uppercase tracking-wider text-stone-500";

type Mode = "signIn" | "signUp" | "forgotPassword";

export default function ClientAuthForm() {
  const [mode, setMode] = useState<Mode>("signIn");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    if (mode === "forgotPassword") {
      const { error: resetError } = await requestPasswordReset(email.trim());
      setIsSubmitting(false);

      if (resetError) {
        // Erreur technique uniquement (réseau, limite de requêtes...) —
        // jamais formulée différemment selon que l'email existe ou non.
        console.error("Échec de demande de réinitialisation :", resetError);
        setError("Une erreur est survenue. Merci de réessayer plus tard.");
        return;
      }

      // Message volontairement identique que l'email corresponde ou non à
      // un compte : ne jamais révéler l'existence d'un compte via ce
      // formulaire (Supabase lui-même ne le révèle jamais côté réponse).
      setNotice(
        "Si un compte existe avec cette adresse, vous recevrez un email pour réinitialiser votre mot de passe."
      );
      return;
    }

    if (mode === "signIn") {
      const { error: signInError } = await signIn(email.trim(), password);
      setIsSubmitting(false);

      if (signInError) {
        console.error("Échec de connexion client :", signInError);
        setError("Email ou mot de passe incorrect.");
        return;
      }
      // Succès : onAuthStateChange (écouté par ClientShell) prend le relais.
      return;
    }

    const { error: signUpError } = await signUp(email.trim(), password, fullName.trim(), phone.trim());
    setIsSubmitting(false);

    if (signUpError) {
      console.error("Échec d'inscription client :", signUpError);
      setError(signUpError);
      return;
    }

    setNotice("Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.");
    switchMode("signIn");
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
            <UserCircle className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <h1 className="mt-4 font-serif text-2xl text-stone-900">Mon compte</h1>
          <p className="mt-1 text-sm text-stone-500">
            {mode === "signIn"
              ? "Connectez-vous pour suivre vos favoris et vos demandes."
              : mode === "signUp"
                ? "Créez votre compte pour suivre vos favoris et vos demandes."
                : "Indiquez votre email pour recevoir un lien de réinitialisation."}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          {mode === "signUp" && (
            <>
              <div>
                <label htmlFor="client-name" className={labelClasses}>
                  Nom complet
                </label>
                <input
                  id="client-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className={fieldClasses}
                  placeholder="Jeanne Dupont"
                />
              </div>

              <div>
                <label htmlFor="client-phone" className={labelClasses}>
                  Téléphone
                </label>
                <input
                  id="client-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={fieldClasses}
                  placeholder="20 123 456"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="client-email" className={labelClasses}>
              Email
            </label>
            <input
              id="client-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClasses}
              placeholder="jeanne.dupont@email.com"
            />
          </div>

          {mode !== "forgotPassword" && (
            <div>
              <label htmlFor="client-password" className={labelClasses}>
                Mot de passe
              </label>
              <input
                id="client-password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={fieldClasses}
                placeholder="••••••••"
              />
              {mode === "signIn" && (
                <div className="mt-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => switchMode("forgotPassword")}
                    className="text-xs font-medium text-amber-600 hover:text-amber-700"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              )}
            </div>
          )}

          {notice && (
            <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-full bg-amber-500 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting
              ? "Veuillez patienter..."
              : mode === "signIn"
                ? "Se connecter"
                : mode === "signUp"
                  ? "Créer mon compte"
                  : "Envoyer le lien"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          {mode === "signIn" && (
            <>
              Pas encore de compte ?{" "}
              <button
                type="button"
                onClick={() => switchMode("signUp")}
                className="font-medium text-amber-600 hover:text-amber-700"
              >
                Créer un compte
              </button>
            </>
          )}
          {mode === "signUp" && (
            <>
              Déjà un compte ?{" "}
              <button
                type="button"
                onClick={() => switchMode("signIn")}
                className="font-medium text-amber-600 hover:text-amber-700"
              >
                Se connecter
              </button>
            </>
          )}
          {mode === "forgotPassword" && (
            <button
              type="button"
              onClick={() => switchMode("signIn")}
              className="font-medium text-amber-600 hover:text-amber-700"
            >
              ← Retour à la connexion
            </button>
          )}
        </p>
      </motion.div>
    </div>
  );
}
