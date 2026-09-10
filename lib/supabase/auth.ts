import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export async function signIn(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

// Inscription client (espace /compte). Le trigger "on_auth_user_created"
// crée automatiquement la ligne "profiles" (role "client") côté Supabase,
// à partir de full_name/phone passés ici en user_metadata.
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone } },
  });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// Mot de passe oublié (espace /compte, client uniquement — ne concerne pas
// /admin). Supabase n'indique jamais si l'email correspond à un compte
// existant : le message affiché à l'appelant doit rester générique quel que
// soit le résultat (voir ClientAuthForm.tsx). `redirectTo` pointe vers la
// page dédiée qui finalise la réinitialisation une fois le lien de l'email
// ouvert — le mécanisme officiel Supabase Auth (pas de token maison).
export async function requestPasswordReset(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/compte/reinitialiser-mot-de-passe`,
  });
  return { error: error?.message ?? null };
}

// Finalise la réinitialisation : n'est utilisable que dans le contexte de
// la session de récupération temporaire que Supabase établit lui-même après
// ouverture du lien reçu par email (voir ResetPasswordForm.tsx) — aucune
// vérification de token supplémentaire nécessaire ici, Supabase l'a déjà
// fait avant d'autoriser updateUser().
export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error?.message ?? null };
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Retourne une fonction de désabonnement, à appeler dans le cleanup d'un useEffect. */
export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => subscription.unsubscribe();
}

/**
 * `undefined` = vérification de session en cours, `null` = non connecté.
 * Générique : partagé par les pages /admin/* et /compte/* pour éviter de
 * dupliquer la logique de session.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    getCurrentSession().then(setSession);
    return onAuthStateChange(setSession);
  }, []);

  return session;
}
