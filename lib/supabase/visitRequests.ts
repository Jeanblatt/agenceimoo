import { supabase } from "@/lib/supabase/client";
import { createNotification } from "@/lib/supabase/notifications";
import { getAgencyVisitSchedule, getVisitScheduleExceptions } from "@/lib/supabase/agencySchedule";
import { resolveAvailability, type AvailableSlotsResult } from "@/lib/scheduling/availability";

// Le bien lié est stocké dans la table "annonces" (pas "properties" —
// c'est le nom réellement utilisé dans ce projet, voir lib/supabase/annonces.ts).
export type VisitRequestStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface VisitRequestPayload {
  propertyId: string;
  clientName: string;
  phone: string;
  email: string;
  visitDate: string;
  message: string;
  userId?: string;
  /**
   * V3.4.C — optionnel, "HH:mm". Omis = comportement legacy inchangé
   * (visit_time reste NULL en base, aucune validation de créneau). Fourni :
   * validé et vérifié disponible côté serveur avant tout INSERT — jamais de
   * confiance dans une valeur envoyée par le frontend.
   */
  visitTime?: string;
}

// Mêmes formats que lib/scheduling/availability.ts (TIME_PATTERN interne à
// ce module-là). Dupliqués ici volontairement plutôt qu'exportés depuis
// availability.ts : cette étape (V3.4.C) reste strictement bornée à
// supabase/migrations/ et lib/supabase/visitRequests.ts, une simple
// validation de format n'est pas "l'algorithme" à ne pas dupliquer (au
// contraire de la disponibilité elle-même, qui réutilise intégralement
// getAvailableVisitSlots plus bas).
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
// DATE_PATTERN est déclaré plus bas (juste avant getAvailableVisitSlots,
// V3.4.B) — réutilisé tel quel ici (pas de redéclaration) : une const
// module-level référencée dans le corps d'une fonction n'est évaluée qu'à
// l'appel de cette fonction, jamais avant la fin du chargement du module.

export interface VisitRequest {
  id: string;
  userId: string | null;
  propertyId: string;
  clientName: string;
  phone: string;
  email: string;
  visitDate: string;
  /** V3.4.D (admin) — "HH:mm:ss" (format brut Postgres `time`), null pour une demande legacy sans créneau. */
  visitTime: string | null;
  durationMinutes: number;
  message: string | null;
  status: VisitRequestStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  /** V3.5.A — horodatages posés par updateVisitRequestStatus, null tant que la transition correspondante n'a jamais eu lieu. */
  confirmedAt: string | null;
  cancelledAt: string | null;
}

interface VisitRequestRow {
  id: number;
  user_id: string | null;
  property_id: number;
  client_name: string;
  phone: string;
  email: string;
  visit_date: string;
  visit_time: string | null;
  duration_minutes: number;
  message: string | null;
  status: VisitRequestStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
}

function mapVisitRequestRow(row: VisitRequestRow): VisitRequest {
  return {
    id: String(row.id),
    userId: row.user_id,
    propertyId: String(row.property_id),
    clientName: row.client_name,
    phone: row.phone,
    email: row.email,
    visitDate: row.visit_date,
    visitTime: row.visit_time,
    durationMinutes: row.duration_minutes,
    message: row.message,
    status: row.status,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    confirmedAt: row.confirmed_at,
    cancelledAt: row.cancelled_at,
  };
}

function formatVisitDateLong(value: string) {
  const date = value.length <= 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

// Insertion publique (formulaire "Demander une visite" sur la fiche bien).
// Pas de .select() après l'insert : le rôle anon n'a qu'un droit d'écriture
// sur cette table (confidentialité des coordonnées des demandeurs) — voir la
// policy RLS "anon can insert visit requests" côté Supabase.
export async function createVisitRequest(
  payload: VisitRequestPayload
): Promise<{ error: string | null }> {
  const numericPropertyId = Number(payload.propertyId);
  if (!Number.isFinite(numericPropertyId)) {
    return { error: "Bien introuvable." };
  }

  const insertPayload: {
    property_id: number;
    client_name: string;
    phone: string;
    email: string;
    visit_date: string;
    message: string | null;
    status: "pending";
    user_id: string | null;
    visit_time?: string;
    duration_minutes?: number;
  } = {
    property_id: numericPropertyId,
    client_name: payload.clientName,
    phone: payload.phone,
    email: payload.email,
    visit_date: payload.visitDate,
    message: payload.message || null,
    status: "pending",
    user_id: payload.userId ?? null,
  };

  // V3.4.C — un créneau horaire reste optionnel : sans visitTime, la ligne
  // est créée exactement comme avant cette étape (visit_time NULL,
  // duration_minutes reprend le DEFAULT SQL). Fourni, il est intégralement
  // revalidé côté serveur — jamais de confiance dans le frontend.
  if (payload.visitTime) {
    if (!TIME_PATTERN.test(payload.visitTime)) {
      return { error: "invalid_time_format" };
    }
    if (!DATE_PATTERN.test(payload.visitDate)) {
      return { error: "invalid_time_format" };
    }

    // Réutilise intégralement le moteur V3.4.B (config horaire + exceptions
    // + réservations bloquantes + date/heure passées, via la RPC
    // get_blocking_visit_slots) plutôt que de recalculer la disponibilité
    // ici — une seule source de vérité pour "quels créneaux sont réellement
    // disponibles".
    const { result, error: availabilityError } = await getAvailableVisitSlots(
      payload.propertyId,
      payload.visitDate
    );

    if (availabilityError) {
      return { error: availabilityError };
    }
    if (!result) {
      return { error: "Configuration des horaires introuvable." };
    }
    if (result.status === "configuration_required") {
      return { error: "configuration_required" };
    }
    if (result.status === "invalid_configuration") {
      return { error: "invalid_configuration" };
    }
    if (result.status === "date_in_past") {
      return { error: "date_in_past" };
    }
    if (result.status === "no_slots") {
      return { error: "slot_unavailable" };
    }
    if (!result.slots.includes(payload.visitTime)) {
      return { error: "slot_unavailable" };
    }

    // duration_minutes n'est jamais fourni par l'appelant (le payload
    // public n'expose même pas ce champ, voir VisitRequestPayload) : seule
    // la configuration serveur fait foi. Le buffer (visit_buffer_minutes)
    // reste une règle de planning utilisée par le moteur de disponibilité —
    // il n'est jamais additionné à la durée stockée sur la ligne.
    const { config, error: configError } = await getAgencyVisitSchedule();
    if (configError) {
      return { error: configError };
    }
    if (!config) {
      return { error: "configuration_required" };
    }

    insertPayload.visit_time = payload.visitTime;
    insertPayload.duration_minutes = config.durationMinutes;
  }

  const { error } = await supabase.from("visit_requests").insert(insertPayload);

  if (error) {
    // 23505 = violation de contrainte unique PostgreSQL. La seule
    // contrainte unique de cette table est
    // visit_requests_active_slot_unique_idx (migration 0019, anti-double-
    // réservation) : un 23505 sur cette table ne peut donc provenir que de
    // là — erreur métier renvoyée à la place du message PostgreSQL brut
    // ("duplicate key value violates unique constraint..."), jamais exposé
    // à l'appelant. Toute autre erreur suit la convention existante
    // (message brut renvoyé tel quel).
    if (error.code === "23505") {
      return { error: "slot_unavailable" };
    }
    return { error: error.message };
  }

  return { error: null };
}

// Lecture réservée au client propriétaire de la demande (rôle authenticated,
// policy RLS "visit_requests: select own") — utilisée par l'espace /compte.
// Le filtre user_id est explicite ici (la RLS le garantit de toute façon)
// pour documenter l'intention, comme getApprovedReviews() le fait pour les avis.
export async function getMyVisitRequests(): Promise<{
  requests: VisitRequest[];
  error: string | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { requests: [], error: null };
  }

  const { data, error } = await supabase
    .from("visit_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { requests: [], error: error.message };
  }

  return { requests: (data as VisitRequestRow[]).map(mapVisitRequestRow), error: null };
}

// Lecture réservée à l'admin (rôle authenticated) — voir la policy RLS
// "authenticated can select visit requests" côté Supabase.
export async function getVisitRequests(): Promise<{
  requests: VisitRequest[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("visit_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { requests: [], error: error.message };
  }

  return { requests: (data as VisitRequestRow[]).map(mapVisitRequestRow), error: null };
}

export async function getVisitRequestById(id: string): Promise<{
  request: VisitRequest | null;
  error: string | null;
}> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { request: null, error: "Identifiant de demande invalide." };
  }

  const { data, error } = await supabase
    .from("visit_requests")
    .select("*")
    .eq("id", numericId)
    .maybeSingle();

  if (error) {
    return { request: null, error: error.message };
  }

  return {
    request: data ? mapVisitRequestRow(data as VisitRequestRow) : null,
    error: null,
  };
}

// Après un changement de statut par l'admin, notifie le client propriétaire
// de la demande (si connecté) pour "confirmed"/"cancelled". L'échec éventuel
// de la notification n'est pas remonté à l'appelant : le changement de
// statut lui-même a déjà réussi à ce stade.
export async function updateVisitRequestStatus(
  id: string,
  status: VisitRequestStatus
): Promise<{ error: string | null }> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant de demande invalide." };
  }

  const { data, error } = await supabase
    .from("visit_requests")
    .update({ status })
    .eq("id", numericId)
    .select()
    .single();

  if (error) {
    console.error("Erreur Supabase (updateVisitRequestStatus):", error);
    return { error: error.message };
  }

  const row = data as VisitRequestRow;
  if (row.user_id && (status === "confirmed" || status === "cancelled")) {
    await createNotification({
      userId: row.user_id,
      title: status === "confirmed" ? "Visite confirmée" : "Visite annulée",
      message:
        status === "confirmed"
          ? `Votre demande de visite pour le bien #${row.property_id} a été confirmée pour le ${formatVisitDateLong(row.visit_date)}.`
          : `Votre demande de visite pour le bien #${row.property_id} a été annulée par l'agence.`,
      type: status === "confirmed" ? "visit_confirmed" : "visit_cancelled",
    });
  }

  return { error: null };
}

export async function updateVisitRequestNotes(
  id: string,
  adminNotes: string
): Promise<{ error: string | null }> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant de demande invalide." };
  }

  const { error } = await supabase
    .from("visit_requests")
    .update({ admin_notes: adminNotes || null })
    .eq("id", numericId);

  if (error) {
    console.error("Erreur Supabase (updateVisitRequestNotes):", error);
    return { error: error.message };
  }

  return { error: null };
}

export async function deleteVisitRequest(id: string): Promise<{ error: string | null }> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { error: "Identifiant de demande invalide." };
  }

  const { error } = await supabase.from("visit_requests").delete().eq("id", numericId);

  if (error) {
    console.error("Erreur Supabase (deleteVisitRequest):", error);
    return { error: error.message };
  }

  return { error: null };
}

// --- V3.4.B — Smart Visit Scheduling : moteur de disponibilité ---

interface BlockingVisitSlotRow {
  property_id: number;
  visit_date: string;
  visit_time: string;
  duration_minutes: number;
  status: VisitRequestStatus;
}

/**
 * Réservations existantes bloquantes pour UN bien à UNE date précise —
 * jamais une requête globale.
 *
 * V3.4.C : passe par la RPC SECURITY DEFINER public.get_blocking_visit_slots
 * (migration 0019) plutôt que par un SELECT direct sur visit_requests avec
 * le client anon. Raison : aucune policy SELECT publique n'existe sur cette
 * table (seules "select own"/"admin select all", réservées à authenticated,
 * migration 0001) — un SELECT direct renvoyait systématiquement 0 ligne
 * pour un visiteur anonyme ou un client non-propriétaire, empêchant toute
 * détection réelle de conflit (constat V3.4.B). La RPC contourne cette
 * limite via SECURITY DEFINER tout en ne retournant QUE les 5 colonnes
 * nécessaires au calcul de disponibilité : property_id, visit_date,
 * visit_time, duration_minutes, status. Aucune colonne contenant des
 * données personnelles d'un autre client (client_name, phone, email,
 * message, admin_notes, user_id) n'est sélectionnée côté SQL — elle ne
 * quitte donc jamais la base, ni cette fonction, strictement interne à ce
 * module (non exportée).
 *
 * Filtre "pending"/"confirmed" uniquement (déjà appliqué côté SQL dans la
 * RPC) : "cancelled" libère le créneau, "completed" ne bloque jamais
 * (toujours une date passée). Les lignes legacy sans créneau (visit_time IS
 * NULL) sont exclues côté RPC — jamais interprétées comme un horaire à
 * deviner.
 */
async function fetchBlockingVisitSlots(
  propertyId: number,
  dateStr: string
): Promise<{ bookings: { visitTime: string; durationMinutes: number }[]; error: string | null }> {
  const { data, error } = await supabase.rpc("get_blocking_visit_slots", {
    p_property_id: propertyId,
    p_visit_date: dateStr,
  });

  if (error) {
    return { bookings: [], error: error.message };
  }

  const rows = (data ?? []) as BlockingVisitSlotRow[];

  return {
    bookings: rows.map((row) => ({
      visitTime: row.visit_time.slice(0, 5),
      durationMinutes: row.duration_minutes,
    })),
    error: null,
  };
}

/**
 * Heure murale tunisienne courante ("YYYY-MM-DD" / "HH:mm"), calculée via
 * Intl avec un fuseau explicite — jamais new Date().toISOString() (UTC,
 * décalé de l'heure locale tunisienne) ni new Date() sans fuseau (dépend du
 * fuseau du serveur d'exécution, non garanti). Seul point du moteur qui lit
 * l'horloge système ; le reste (lib/scheduling/availability.ts) reste pur et
 * reçoit ces valeurs en paramètres.
 */
function getTunisWallClockNow(): { todayStr: string; nowTimeStr: string } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Tunis",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  return {
    todayStr: `${part("year")}-${part("month")}-${part("day")}`,
    nowTimeStr: `${part("hour")}:${part("minute")}`,
  };
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Calcule les créneaux disponibles pour un bien à une date donnée.
 *
 * Orchestrateur pur I/O : récupère la configuration horaire, les exceptions
 * de cette date et les réservations bloquantes de ce bien à cette date —
 * chacune en une seule requête — puis délègue tout le calcul à
 * resolveAvailability (lib/scheduling/availability.ts), qui ne touche jamais
 * Supabase.
 *
 * `error` n'est renseigné qu'en cas d'échec technique (bien/date invalide,
 * erreur réseau/Supabase) — jamais pour un état métier normal
 * (configuration absente, date passée, aucun créneau...), qui est porté par
 * `result.status` afin que l'appelant n'ait pas à distinguer une exception
 * d'un état attendu.
 */
export async function getAvailableVisitSlots(
  propertyId: string,
  dateStr: string
): Promise<{ result: AvailableSlotsResult | null; error: string | null }> {
  const numericPropertyId = Number(propertyId);
  if (!Number.isFinite(numericPropertyId)) {
    return { result: null, error: "Bien introuvable." };
  }
  if (!DATE_PATTERN.test(dateStr)) {
    return { result: null, error: "Date invalide." };
  }

  const [
    { config, error: configError },
    { exceptions, error: exceptionsError },
    { bookings, error: bookingsError },
  ] = await Promise.all([
    getAgencyVisitSchedule(),
    getVisitScheduleExceptions(dateStr),
    fetchBlockingVisitSlots(numericPropertyId, dateStr),
  ]);

  if (configError) return { result: null, error: configError };
  if (exceptionsError) return { result: null, error: exceptionsError };
  if (bookingsError) return { result: null, error: bookingsError };
  if (!config) return { result: null, error: "Configuration des horaires introuvable." };

  const { todayStr, nowTimeStr } = getTunisWallClockNow();

  const result = resolveAvailability({
    rawVisitHours: config.rawVisitHours,
    durationMinutes: config.durationMinutes,
    bufferMinutes: config.bufferMinutes,
    dateStr,
    todayStr,
    nowTimeStr,
    exceptions,
    existingBookings: bookings,
  });

  return { result, error: null };
}
