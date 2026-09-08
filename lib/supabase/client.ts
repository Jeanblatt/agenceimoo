import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Timeout explicite : sans lui, une base injoignable (DNS mort, projet en
// pause...) peut faire attendre le fetch natif bien au-delà de 7s avant
// d'abandonner. La valeur reste assez large pour ne pas couper les upload
// (photo de profil) sur une connexion lente.
const SUPABASE_FETCH_TIMEOUT_MS = 15000;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (input, init) =>
      fetch(input, { ...init, signal: AbortSignal.timeout(SUPABASE_FETCH_TIMEOUT_MS) }),
  },
});