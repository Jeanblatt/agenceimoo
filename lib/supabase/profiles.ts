import { supabase } from "@/lib/supabase/client";

export type ProfileRole = "admin" | "client";

export interface Profile {
  id: string;
  role: ProfileRole;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

interface ProfileRow {
  id: string;
  role: ProfileRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    role: row.role,
    fullName: row.full_name,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

// Lit le profil de l'utilisateur connecté (policy RLS "profiles: select own").
export async function getMyProfile(): Promise<{
  profile: Profile | null;
  error: string | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { profile: null, error: null };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return { profile: null, error: error.message };
  }

  return { profile: data ? mapProfileRow(data as ProfileRow) : null, error: null };
}

export interface ProfileUpdatePayload {
  fullName: string;
  phone: string;
  avatarUrl: string;
}

// Le "role" n'est jamais envoyé ici : la policy RLS "profiles: update own"
// refuserait de toute façon qu'un client change sa propre valeur.
export async function updateMyProfile(
  payload: ProfileUpdatePayload
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: payload.fullName || null,
      phone: payload.phone || null,
      avatar_url: payload.avatarUrl || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Erreur Supabase (updateMyProfile):", error);
    return { error: error.message };
  }

  return { error: null };
}

// Upload de la photo de profil dans le bucket public "avatars" (policy RLS
// "avatars: insert own" : chacun n'écrit que dans son propre dossier
// "<user_id>/..."). Retourne l'URL publique à enregistrer ensuite via
// updateMyProfile — l'upload seul ne modifie pas encore le profil.
export async function uploadAvatar(file: File): Promise<{ url: string | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { url: null, error: "Non connecté." };
  }

  const extension = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    console.error("Erreur Supabase (uploadAvatar):", uploadError);
    return { url: null, error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  return { url: publicUrl, error: null };
}
