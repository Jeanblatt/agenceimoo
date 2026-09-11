import { supabase } from "@/lib/supabase/client";

// V3.4.B — Lecture Supabase pour le moteur de disponibilité. Pur I/O :
// aucune validation métier ni calcul de créneaux ici (voir
// lib/scheduling/availability.ts) — ce module se contente de récupérer les
// données brutes une seule fois par appel, jamais une requête par créneau.

// Même ligne singleton que lib/supabase/agencySettings.ts ("1 déploiement =
// 1 agence" — migration 0009).
const SETTINGS_ROW_ID = 1;

interface AgencyScheduleRow {
  visit_hours: unknown;
  visit_duration_minutes: number;
  visit_buffer_minutes: number;
}

export interface AgencyVisitScheduleConfig {
  /**
   * Valeur brute de la colonne JSONB — null si non configurée. Jamais
   * validée ici : la validation de forme (structure valide/invalide) relève
   * exclusivement de lib/scheduling/availability.ts::parseVisitHours,
   * appelé par l'orchestrateur (lib/supabase/visitRequests.ts).
   */
  rawVisitHours: unknown;
  durationMinutes: number;
  bufferMinutes: number;
}

/**
 * Lit la configuration horaire globale de l'agence (agency_settings). Ligne
 * absente ou erreur réseau : repli tolérant sur les valeurs par défaut
 * techniques (60 min / 15 min, mêmes valeurs que les DEFAULT SQL de la
 * migration 0017) pour durationMinutes/bufferMinutes, mais rawVisitHours
 * reste strictement null (jamais d'horaires inventés) — même logique de
 * repli que fetchAgencySettings dans lib/supabase/agencySettings.ts.
 */
export async function getAgencyVisitSchedule(): Promise<{
  config: AgencyVisitScheduleConfig | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("agency_settings")
    .select("visit_hours, visit_duration_minutes, visit_buffer_minutes")
    .eq("id", SETTINGS_ROW_ID)
    .maybeSingle();

  if (error) {
    return { config: null, error: error.message };
  }

  const row = data as AgencyScheduleRow | null;

  return {
    config: {
      rawVisitHours: row?.visit_hours ?? null,
      durationMinutes: row?.visit_duration_minutes ?? 60,
      bufferMinutes: row?.visit_buffer_minutes ?? 15,
    },
    error: null,
  };
}

export interface ScheduleExceptionRow {
  startTime: string | null;
  endTime: string | null;
}

interface VisitScheduleExceptionRow {
  start_time: string | null;
  end_time: string | null;
}

/**
 * Lit les exceptions d'horaires (visit_schedule_exceptions) pour UNE date
 * précise uniquement — filtrage fait côté Supabase (eq "date"), jamais côté
 * client sur l'ensemble de la table. Les colonnes `time` de Postgres
 * reviennent au format "HH:mm:ss" côté client Supabase : normalisées ici en
 * "HH:mm" pour rester cohérentes avec le reste du moteur (jamais de suffixe
 * secondes manipulé au-delà de ce module).
 */
export async function getVisitScheduleExceptions(dateStr: string): Promise<{
  exceptions: ScheduleExceptionRow[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("visit_schedule_exceptions")
    .select("start_time, end_time")
    .eq("date", dateStr);

  if (error) {
    return { exceptions: [], error: error.message };
  }

  const rows = data as VisitScheduleExceptionRow[];

  return {
    exceptions: rows.map((row) => ({
      startTime: row.start_time ? row.start_time.slice(0, 5) : null,
      endTime: row.end_time ? row.end_time.slice(0, 5) : null,
    })),
    error: null,
  };
}
