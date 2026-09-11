// V3.4.B — Smart Visit Scheduling : moteur de calcul des créneaux
// disponibles.
//
// Module pur : aucun import Supabase, aucun import React, aucune API
// navigateur, aucun appel à Date.now()/new Date() pour "l'heure actuelle"
// (l'heure murale tunisienne courante est calculée par l'appelant —
// lib/supabase/visitRequests.ts — et injectée ici en paramètres). Toute
// donnée temporelle manipulée ici est une chaîne "YYYY-MM-DD" ou "HH:mm"
// prise au sens littéral (heure murale), jamais convertie en UTC.
//
// Les seules utilisations de Date() dans ce fichier (getWeekdayKey) passent
// systématiquement par Date.UTC(...)/getUTCDay() des deux côtés — jamais un
// mélange parsing-implicitement-UTC / lecture-en-heure-locale (le bug
// classique de "new Date('2024-01-01').getDay()"), donc le résultat est
// déterministe quel que soit le fuseau du serveur d'exécution.

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const WEEKDAYS: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/** [début, fin] au format "HH:mm". */
export type TimeRange = [string, string];

export interface VisitDaySchedule {
  closed: boolean;
  /** null = pas de session le matin ce jour-là. */
  morning: TimeRange | null;
  /** null = pas de session l'après-midi ce jour-là. */
  afternoon: TimeRange | null;
}

export type VisitHours = Record<Weekday, VisitDaySchedule>;

/** Une exception d'horaire déjà filtrée par l'appelant sur la date visée. */
export interface ScheduleException {
  /** null + null = journée entière bloquée. */
  startTime: string | null;
  endTime: string | null;
}

/** Une réservation existante déjà filtrée (bien + date + statut bloquant + visit_time non nul). */
export interface ExistingBookingSlot {
  visitTime: string;
  durationMinutes: number;
}

export type AvailableSlotsResult =
  | { status: "configuration_required" }
  | { status: "invalid_configuration" }
  | { status: "date_in_past" }
  | { status: "no_slots" }
  | { status: "available"; slots: string[] };

export interface ResolveAvailabilityInput {
  /** Valeur brute de agency_settings.visit_hours — null si non configuré, forme non validée sinon. */
  rawVisitHours: unknown;
  durationMinutes: number;
  bufferMinutes: number;
  /** Date demandée, "YYYY-MM-DD". */
  dateStr: string;
  /** Date du jour, heure murale tunisienne, "YYYY-MM-DD" — fournie par l'appelant. */
  todayStr: string;
  /** Heure actuelle, heure murale tunisienne, "HH:mm" — fournie par l'appelant. */
  nowTimeStr: string;
  /** Exceptions déjà filtrées sur dateStr. */
  exceptions: ScheduleException[];
  /** Réservations existantes déjà filtrées sur (bien, dateStr, statuts bloquants, visit_time non nul). */
  existingBookings: ExistingBookingSlot[];
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidTime(value: unknown): value is string {
  return typeof value === "string" && TIME_PATTERN.test(value);
}

function isValidTimeRange(value: unknown): value is TimeRange {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    isValidTime(value[0]) &&
    isValidTime(value[1]) &&
    value[0] < value[1]
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidDaySchedule(value: unknown): value is VisitDaySchedule {
  if (!isRecord(value)) return false;
  if (typeof value.closed !== "boolean") return false;
  if (value.morning !== null && !isValidTimeRange(value.morning)) return false;
  if (value.afternoon !== null && !isValidTimeRange(value.afternoon)) return false;
  return true;
}

/**
 * Valide la forme complète de agency_settings.visit_hours. Retourne null si
 * la structure ne respecte pas le contrat attendu (clé manquante, jour
 * malformé, plage horaire invalide/inversée...) — jamais d'exception levée,
 * jamais de valeur par défaut inventée pour combler un trou.
 */
export function parseVisitHours(raw: unknown): VisitHours | null {
  if (!isRecord(raw)) return null;

  for (const day of WEEKDAYS) {
    if (!isValidDaySchedule(raw[day])) return null;
  }

  return raw as unknown as VisitHours;
}

/**
 * Jour de semaine d'une date "YYYY-MM-DD", sans passer par un parsing de
 * date dépendant du fuseau d'exécution (voir note en tête de fichier).
 */
export function getWeekdayKey(dateStr: string): Weekday {
  const [year, month, day] = dateStr.split("-").map(Number);
  const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const byUtcDay: Weekday[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return byUtcDay[utcDay];
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

/**
 * Créneaux théoriques d'une session isolée (matin OU après-midi, jamais les
 * deux à la fois — l'indépendance des sessions est garantie par l'appelant,
 * generateDaySlots, qui ne fusionne jamais matin/après-midi en une seule
 * plage : la pause déjeuner ne peut donc jamais être "pontée" par un
 * créneau).
 *
 * Règle : un créneau démarrant à `start` n'est valide que si
 * `start + durationMinutes <= sessionEnd` — un créneau qui déborderait la
 * fin de session, même partiellement, est exclu. Exemple : session
 * 09:00–12:00, durée 60 min, battement 15 min → 09:00 (fin 10:00), 10:15
 * (fin 11:15), puis 11:30 est exclu car 11:30 + 60 = 12:30 > 12:00 — seuls
 * 09:00 et 10:15 sont retournés.
 */
export function generateTheoreticalSlots(
  range: TimeRange,
  durationMinutes: number,
  bufferMinutes: number
): string[] {
  if (durationMinutes <= 0) return [];

  const sessionStart = timeToMinutes(range[0]);
  const sessionEnd = timeToMinutes(range[1]);
  const step = durationMinutes + bufferMinutes;

  const slots: string[] = [];
  for (let start = sessionStart; start + durationMinutes <= sessionEnd; start += step) {
    slots.push(minutesToTime(start));
  }
  return slots;
}

/** Créneaux théoriques d'une journée entière (matin ∪ après-midi, jamais pontés). */
export function generateDaySlots(
  day: VisitDaySchedule,
  durationMinutes: number,
  bufferMinutes: number
): string[] {
  if (day.closed) return [];

  const morningSlots = day.morning
    ? generateTheoreticalSlots(day.morning, durationMinutes, bufferMinutes)
    : [];
  const afternoonSlots = day.afternoon
    ? generateTheoreticalSlots(day.afternoon, durationMinutes, bufferMinutes)
    : [];

  return [...morningSlots, ...afternoonSlots];
}

interface BlockedMinuteRange {
  start: number;
  end: number;
}

/** Chevauchement en sémantique [start, end) — deux plages jointives (A.end === B.start) ne se chevauchent pas. */
function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function buildExceptionBlockedRanges(
  exceptions: ScheduleException[]
): BlockedMinuteRange[] | "full_day" {
  for (const exception of exceptions) {
    if (exception.startTime === null && exception.endTime === null) {
      return "full_day";
    }
  }

  const ranges: BlockedMinuteRange[] = [];
  for (const exception of exceptions) {
    if (exception.startTime !== null && exception.endTime !== null) {
      ranges.push({
        start: timeToMinutes(exception.startTime),
        end: timeToMinutes(exception.endTime),
      });
    }
  }
  return ranges;
}

/**
 * Le battement ne prolonge que la fenêtre bloquée des réservations
 * EXISTANTES (visitEnd + buffer) — jamais la valeur duration_minutes
 * stockée sur la ligne, qui reste inchangée. Les exceptions, elles, ne
 * reçoivent aucun battement : leur plage bloquée est prise au sens littéral.
 */
function buildBookingBlockedRanges(
  bookings: ExistingBookingSlot[],
  bufferMinutes: number
): BlockedMinuteRange[] {
  return bookings.map((booking) => {
    const start = timeToMinutes(booking.visitTime);
    return { start, end: start + booking.durationMinutes + bufferMinutes };
  });
}

function filterSlotsAgainstBlocked(
  slots: string[],
  durationMinutes: number,
  blocked: BlockedMinuteRange[]
): string[] {
  if (blocked.length === 0) return slots;
  return slots.filter((slot) => {
    const start = timeToMinutes(slot);
    const end = start + durationMinutes;
    return !blocked.some((range) => rangesOverlap(start, end, range.start, range.end));
  });
}

/** Comparaison lexicographique valide : "YYYY-MM-DD" trie chronologiquement à l'identique. */
export function isDateInPast(dateStr: string, todayStr: string): boolean {
  return dateStr < todayStr;
}

/**
 * Un créneau démarrant à l'heure actuelle ou avant n'est plus réservable
 * (<=, pas seulement <) — comparaison lexicographique valide sur "HH:mm"
 * zero-paddé.
 */
function isTimePastToday(timeStr: string, nowTimeStr: string): boolean {
  return timeStr <= nowTimeStr;
}

/**
 * Point d'entrée unique du moteur : résout l'ensemble des états métier
 * (configuration absente/invalide, date passée, aucun créneau, créneaux
 * disponibles) à partir de données déjà récupérées une seule fois par
 * l'appelant (aucune requête Supabase ici, aucune boucle "une requête par
 * créneau").
 */
export function resolveAvailability(input: ResolveAvailabilityInput): AvailableSlotsResult {
  if (input.rawVisitHours === null || input.rawVisitHours === undefined) {
    return { status: "configuration_required" };
  }

  const visitHours = parseVisitHours(input.rawVisitHours);
  if (!visitHours) {
    return { status: "invalid_configuration" };
  }

  if (isDateInPast(input.dateStr, input.todayStr)) {
    return { status: "date_in_past" };
  }

  const day = visitHours[getWeekdayKey(input.dateStr)];
  let slots = generateDaySlots(day, input.durationMinutes, input.bufferMinutes);

  if (slots.length > 0) {
    const exceptionRanges = buildExceptionBlockedRanges(input.exceptions);
    slots = exceptionRanges === "full_day"
      ? []
      : filterSlotsAgainstBlocked(slots, input.durationMinutes, exceptionRanges);
  }

  if (slots.length > 0 && input.existingBookings.length > 0) {
    const bookingRanges = buildBookingBlockedRanges(input.existingBookings, input.bufferMinutes);
    slots = filterSlotsAgainstBlocked(slots, input.durationMinutes, bookingRanges);
  }

  if (slots.length > 0 && input.dateStr === input.todayStr) {
    slots = slots.filter((slot) => !isTimePastToday(slot, input.nowTimeStr));
  }

  return slots.length === 0 ? { status: "no_slots" } : { status: "available", slots };
}
