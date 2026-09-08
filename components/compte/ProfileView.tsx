"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { Pencil, UserCircle } from "lucide-react";
import { getMyProfile, updateMyProfile, uploadAvatar, type Profile } from "@/lib/supabase/profiles";

const fieldClasses =
  "mt-1.5 w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none disabled:bg-stone-50 disabled:text-stone-400";
const labelClasses = "text-xs font-medium uppercase tracking-wider text-stone-500";

interface ProfileViewProps {
  session: Session;
}

interface AvatarProps {
  avatarUrl: string | null;
  fallback: string;
}

function Avatar({ avatarUrl, fallback }: AvatarProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar externe (URL saisie), taille fixe non critique
      <img
        src={avatarUrl}
        alt="Photo de profil"
        className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-stone-100"
      />
    );
  }

  return (
    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-stone-900 text-lg font-semibold text-white">
      {fallback ? fallback.slice(0, 2).toUpperCase() : <UserCircle className="h-8 w-8" strokeWidth={1.5} />}
    </span>
  );
}

export default function ProfileView({ session }: ProfileViewProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { profile: data } = await getMyProfile();
      setProfile(data);
      setLoading(false);
    })();
  }, []);

  const startEditing = () => {
    setFullName(profile?.fullName ?? "");
    setPhone(profile?.phone ?? "");
    setAvatarUrl(profile?.avatarUrl ?? "");
    setAvatarError(null);
    setFeedback(null);
    setIsEditing(true);
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploadingAvatar(true);
    setAvatarError(null);
    const { url, error } = await uploadAvatar(file);
    setIsUploadingAvatar(false);

    if (error || !url) {
      setAvatarError(error || "Échec de l'envoi de la photo.");
      return;
    }

    setAvatarUrl(url);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const { error } = await updateMyProfile({ fullName, phone, avatarUrl });
    setIsSubmitting(false);

    if (error) {
      setFeedback({ type: "error", message: `La mise à jour a échoué : ${error}` });
      return;
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            fullName: fullName || null,
            phone: phone || null,
            avatarUrl: avatarUrl || null,
          }
        : current
    );
    setIsEditing(false);
    setFeedback({ type: "success", message: "Votre profil a été mis à jour." });
  };

  if (loading) {
    return <p className="text-sm text-stone-500">Chargement...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-stone-900">Mon profil</h1>
        <p className="mt-1 text-sm text-stone-500">Vos informations personnelles.</p>
      </div>

      {feedback && !isEditing && (
        <p
          className={`rounded-lg px-4 py-3 text-sm ${
            feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </p>
      )}

      {isEditing ? (
        <form
          onSubmit={handleSubmit}
          className="max-w-lg space-y-5 rounded-2xl bg-white p-6 ring-1 ring-stone-100 sm:p-8"
        >
          <div className="flex items-center gap-4">
            <Avatar avatarUrl={avatarUrl || null} fallback={fullName || session.user.email || ""} />
            <div className="min-w-0 flex-1">
              <span className={labelClasses}>Photo de profil (optionnel)</span>
              <label
                htmlFor="profile-avatar"
                className="mt-1.5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 px-4 py-3 text-xs font-medium uppercase tracking-wider text-stone-600 transition-colors hover:border-amber-500 hover:text-amber-600 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-70"
              >
                <input
                  id="profile-avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={isUploadingAvatar}
                  className="hidden"
                />
                {isUploadingAvatar ? "Envoi en cours..." : "Changer la photo"}
              </label>
              {avatarError && <p className="mt-2 text-xs text-red-600">{avatarError}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="profile-email" className={labelClasses}>
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={session.user.email ?? ""}
              disabled
              className={fieldClasses}
            />
          </div>

          <div>
            <label htmlFor="profile-name" className={labelClasses}>
              Nom complet
            </label>
            <input
              id="profile-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={fieldClasses}
              placeholder="Jeanne Dupont"
            />
          </div>

          <div>
            <label htmlFor="profile-phone" className={labelClasses}>
              Téléphone
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={fieldClasses}
              placeholder="20 123 456"
            />
          </div>

          {feedback && (
            <p
              className={`rounded-lg px-4 py-3 text-sm ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {feedback.message}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || isUploadingAvatar}
              className="rounded-full bg-amber-500 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
              className="rounded-full px-6 py-3 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <div className="max-w-lg rounded-2xl bg-white p-6 ring-1 ring-stone-100 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar
                avatarUrl={profile?.avatarUrl ?? null}
                fallback={profile?.fullName || session.user.email || ""}
              />
              <div>
                <p className="text-sm font-medium text-stone-900">
                  {profile?.fullName || "Nom non renseigné"}
                </p>
                <p className="mt-0.5 text-sm text-stone-500">{session.user.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={startEditing}
              aria-label="Modifier mon profil"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>

          <dl className="mt-6 space-y-4 border-t border-stone-100 pt-6">
            <div>
              <dt className={labelClasses}>Téléphone</dt>
              <dd className="mt-1 text-sm text-stone-700">
                {profile?.phone || "Non renseigné"}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
