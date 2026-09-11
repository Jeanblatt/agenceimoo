import type { VisitRequest, VisitRequestStatus } from "@/lib/supabase/visitRequests";

// V3.5.A — Admin Visit Center : classification/tri/formatage partagés par
// VisitRequestsTable, VisitRequestDetailDrawer, VisitRequestsToolbar et
// app/admin/visit-requests/page.tsx. Centralise ici formatDate/formatDateTime
// /formatVisitDate, jusqu'ici dupliqués à l'identique entre Table et Drawer.
//
// Pur TS, aucun appel réseau, aucune dépendance à lib/scheduling/
// availability.ts ni lib/supabase/agencySchedule.ts (moteur V3.4 non touché
// et non importé ici, volontairement — le Visit Center ne fait que consommer
// les données déjà renvoyées par getVisitRequests()).

// Même stratégie que VisitRequestForm.tsx (V3.4.D) : jamais
// new Date().toISOString().slice(0, 10) (UTC) — Intl avec un fuseau
// explicite, cohérent avec Africa/Tunis utilisé par le moteur côté serveur.
export function getTunisTodayStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Tunis",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatDate(value: string): string {
  const date = value.length <= 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(value: string): string {
  const date = value.length <= 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// visitTime vient de Postgres au format "HH:mm:ss" : on n'affiche que
// "HH:mm". null = demande legacy sans créneau horaire (V3.4.A/B) — jamais
// d'heure inventée, affichage date seule inchangé.
export function formatVisitDate(visitDate: string, visitTime: string | null): string {
  const date = formatDate(visitDate);
  return visitTime ? `${date} · ${visitTime.slice(0, 5)}` : date;
}

// Version compacte pour la liste (table/cartes) : ajoute la durée entre
// parenthèses quand un créneau existe — jamais affichée pour une ligne
// legacy (une durée sans heure n'a pas de sens à afficher).
export function formatVisitSummary(
  request: Pick<VisitRequest, "visitDate" | "visitTime" | "durationMinutes">
): string {
  const date = formatVisitDate(request.visitDate, request.visitTime);
  return request.visitTime ? `${date} (${request.durationMinutes} min)` : date;
}

export type VisitTiming = "today" | "upcoming" | "past";

// Comparaison lexicographique valide : "YYYY-MM-DD" trie chronologiquement
// à l'identique (même principe que isDateInPast dans availability.ts, non
// importé ici — périmètre V3.5.A strictement limité aux fichiers visit-requests).
export function getVisitTiming(visitDate: string, todayStr: string): VisitTiming {
  if (visitDate === todayStr) return "today";
  return visitDate > todayStr ? "upcoming" : "past";
}

export type VisitSection = "upcoming" | "history";

// cancelled/completed -> toujours HISTORIQUE, quelle que soit la date (une
// visite annulée hier comme dans 3 mois reste un fait passé pour l'admin).
// pending/confirmed -> HISTORIQUE seulement si la date est déjà passée,
// sinon (aujourd'hui ou future) -> À VENIR. Classification d'affichage
// uniquement : ne modifie/ne supprime jamais la donnée.
export function getVisitSection(
  request: Pick<VisitRequest, "status" | "visitDate">,
  todayStr: string
): VisitSection {
  if (request.status === "cancelled" || request.status === "completed") return "history";
  return getVisitTiming(request.visitDate, todayStr) === "past" ? "history" : "upcoming";
}

// Clé de tri interne (jamais affichée) : une demande legacy (visitTime
// null) se place après les créneaux horodatés de la même date, sans jamais
// inventer d'heure réelle.
function sortKeyOf(request: Pick<VisitRequest, "visitDate" | "visitTime">): string {
  return `${request.visitDate}T${request.visitTime ?? "99:99"}`;
}

export function compareAscending(a: VisitRequest, b: VisitRequest): number {
  const [ka, kb] = [sortKeyOf(a), sortKeyOf(b)];
  return ka < kb ? -1 : ka > kb ? 1 : 0;
}

export function compareDescending(a: VisitRequest, b: VisitRequest): number {
  return -compareAscending(a, b);
}

export interface VisitRequestGroup {
  label?: string;
  requests: VisitRequest[];
}

// À VENIR : "Aujourd'hui" (visites du jour, mises en avant, §3) séparé du
// reste des visites futures ; chaque sous-groupe trié chronologiquement
// croissant (le prochain rendez-vous en premier).
// HISTORIQUE : un seul groupe, trié décroissant (l'événement le plus récent
// en premier — plus utile pour une revue d'activité passée).
export function buildVisitCenterGroups(
  requests: VisitRequest[],
  todayStr: string
): { upcomingGroups: VisitRequestGroup[]; historyRequests: VisitRequest[] } {
  const upcoming = requests.filter((request) => getVisitSection(request, todayStr) === "upcoming");
  const history = requests.filter((request) => getVisitSection(request, todayStr) === "history");

  const today = upcoming
    .filter((request) => getVisitTiming(request.visitDate, todayStr) === "today")
    .sort(compareAscending);
  const later = upcoming
    .filter((request) => getVisitTiming(request.visitDate, todayStr) !== "today")
    .sort(compareAscending);

  const upcomingGroups: VisitRequestGroup[] = [];
  if (today.length > 0) upcomingGroups.push({ label: "Aujourd'hui", requests: today });
  if (later.length > 0) upcomingGroups.push({ label: "À venir", requests: later });

  return { upcomingGroups, historyRequests: [...history].sort(compareDescending) };
}

export interface VisitSummaryCounts {
  upcoming: number;
  today: number;
  pending: number;
  confirmed: number;
}

// Toujours calculé sur la liste COMPLÈTE (non filtrée) — même convention que
// les compteurs de statut déjà présents dans VisitRequestsToolbar
// (indépendants du filtre de recherche actif).
export function computeVisitSummaryCounts(
  requests: VisitRequest[],
  todayStr: string
): VisitSummaryCounts {
  let upcoming = 0;
  let today = 0;
  let pending = 0;
  let confirmed = 0;

  for (const request of requests) {
    if (getVisitSection(request, todayStr) === "upcoming") upcoming += 1;
    if (
      getVisitTiming(request.visitDate, todayStr) === "today" &&
      (request.status === "pending" || request.status === "confirmed")
    ) {
      today += 1;
    }
    if (request.status === "pending") pending += 1;
    if (request.status === "confirmed") confirmed += 1;
  }

  return { upcoming, today, pending, confirmed };
}

// -- Filtre de vue (section) --

export type ViewFilter = "all" | VisitSection;

export function matchesViewFilter(
  request: Pick<VisitRequest, "status" | "visitDate">,
  filter: ViewFilter,
  todayStr: string
): boolean {
  if (filter === "all") return true;
  return getVisitSection(request, todayStr) === filter;
}

// -- Filtre par date --

export type DateFilterValue = "all" | "today" | "week" | "custom";

export interface DateFilterState {
  value: DateFilterValue;
  customStart: string;
  customEnd: string;
}

export const DEFAULT_DATE_FILTER: DateFilterState = { value: "all", customStart: "", customEnd: "" };

function toUtcDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

// "Cette semaine" = semaine calendaire ISO (lundi -> dimanche) contenant
// aujourd'hui. Arithmétique purement en date UTC (mêmes composants Y/M/D des
// deux côtés, jamais de conversion locale/UTC ambiguë) — même principe que
// getWeekdayKey dans lib/scheduling/availability.ts (non importé ici :
// périmètre V3.5.A strictement limité aux fichiers visit-requests, cette
// poignée de lignes est réécrite localement plutôt que d'introduire une
// dépendance au moteur V3.4).
export function getWeekRange(todayStr: string): { start: string; end: string } {
  const date = toUtcDate(todayStr);
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) };
}

export function matchesDateFilter(visitDate: string, filter: DateFilterState, todayStr: string): boolean {
  switch (filter.value) {
    case "all":
      return true;
    case "today":
      return visitDate === todayStr;
    case "week": {
      const { start, end } = getWeekRange(todayStr);
      return visitDate >= start && visitDate <= end;
    }
    case "custom": {
      if (!filter.customStart && !filter.customEnd) return true;
      if (filter.customStart && visitDate < filter.customStart) return false;
      if (filter.customEnd && visitDate > filter.customEnd) return false;
      return true;
    }
  }
}

// -- V3.5.B — Smart Calendar --
//
// Positionnement/regroupement purement graphiques : AUCUNE fonction
// ci-dessous ne calcule de disponibilité. Le calendrier affiche uniquement
// des visit_requests déjà existantes (déjà chargées par getVisitRequests(),
// V3.4/V3.5.A) — jamais resolveAvailability/generateDaySlots/
// generateTheoreticalSlots/getAvailableVisitSlots, volontairement non
// importés ici.

export type CalendarView = "day" | "week" | "month";

const MONTH_NAMES_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
const WEEKDAY_NAMES_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const WEEKDAY_SHORT_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// "HH:mm" ou "HH:mm:ss" (format brut Postgres `time`) -> minutes depuis
// minuit. Réécrit localement (même principe que TIME_PATTERN dans
// lib/supabase/visitRequests.ts, V3.4.C) plutôt que d'importer l'équivalent
// privé de lib/scheduling/availability.ts — périmètre V3.5.B strictement
// limité aux fichiers visit-requests.
function timeStringToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

// Dates (YYYY-MM-DD) à afficher pour une vue donnée. "week" : lundi->dimanche
// de la semaine contenant referenceDateStr (réutilise getWeekRange
// ci-dessus). "month" : grille mensuelle complétée aux semaines pleines.
export function getVisibleDates(view: CalendarView, referenceDateStr: string): string[] {
  if (view === "day") return [referenceDateStr];

  if (view === "week") {
    const { start } = getWeekRange(referenceDateStr);
    const startDate = toUtcDate(start);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startDate);
      date.setUTCDate(startDate.getUTCDate() + index);
      return date.toISOString().slice(0, 10);
    });
  }

  return getMonthGridDates(referenceDateStr);
}

// Grille mensuelle : toutes les dates du mois de referenceDateStr,
// complétées avant/après par les jours des semaines adjacentes nécessaires
// pour obtenir des semaines complètes (lundi->dimanche) — pattern standard
// d'un calendrier mensuel.
export function getMonthGridDates(referenceDateStr: string): string[] {
  const [year, month] = referenceDateStr.split("-").map(Number);
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const lastOfMonth = new Date(Date.UTC(year, month, 0));

  const firstWeekday = firstOfMonth.getUTCDay();
  const leading = firstWeekday === 0 ? 6 : firstWeekday - 1;

  const lastWeekday = lastOfMonth.getUTCDay();
  const trailing = lastWeekday === 0 ? 0 : 7 - lastWeekday;

  const start = new Date(firstOfMonth);
  start.setUTCDate(firstOfMonth.getUTCDate() - leading);

  const totalDays = leading + lastOfMonth.getUTCDate() + trailing;

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

// Déplace la date de référence d'une unité (jour/semaine/mois) selon la vue
// active. "month" normalise toujours au 1er du mois cible (évite le bug
// classique "31 janvier + 1 mois" -> débordement en mars via février).
export function shiftReferenceDate(
  view: CalendarView,
  referenceDateStr: string,
  direction: 1 | -1
): string {
  const date = toUtcDate(referenceDateStr);
  if (view === "day") {
    date.setUTCDate(date.getUTCDate() + direction);
  } else if (view === "week") {
    date.setUTCDate(date.getUTCDate() + direction * 7);
  } else {
    date.setUTCMonth(date.getUTCMonth() + direction, 1);
  }
  return date.toISOString().slice(0, 10);
}

export function formatPeriodLabel(view: CalendarView, referenceDateStr: string): string {
  if (view === "day") {
    const date = toUtcDate(referenceDateStr);
    return `${capitalize(WEEKDAY_NAMES_FR[date.getUTCDay()])} ${date.getUTCDate()} ${MONTH_NAMES_FR[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  }

  if (view === "week") {
    const { start, end } = getWeekRange(referenceDateStr);
    const startDate = toUtcDate(start);
    const endDate = toUtcDate(end);
    const endLabel = `${endDate.getUTCDate()} ${MONTH_NAMES_FR[endDate.getUTCMonth()]} ${endDate.getUTCFullYear()}`;
    if (startDate.getUTCMonth() === endDate.getUTCMonth() && startDate.getUTCFullYear() === endDate.getUTCFullYear()) {
      return `${startDate.getUTCDate()} – ${endLabel}`;
    }
    return `${startDate.getUTCDate()} ${MONTH_NAMES_FR[startDate.getUTCMonth()]} – ${endLabel}`;
  }

  const date = toUtcDate(`${referenceDateStr.slice(0, 7)}-01`);
  return `${capitalize(MONTH_NAMES_FR[date.getUTCMonth()])} ${date.getUTCFullYear()}`;
}

// En-tête court d'une colonne jour (vue Semaine), ex. { weekday: "Lun", day: 14 }.
export function formatDayHeader(dateStr: string): { weekday: string; day: number } {
  const date = toUtcDate(dateStr);
  return { weekday: WEEKDAY_SHORT_FR[date.getUTCDay()], day: date.getUTCDate() };
}

// Regroupe des demandes par visitDate — utilisé par la vue Mois (compteurs)
// et la vue Jour/Semaine (retrouver les demandes d'une colonne).
export function groupRequestsByDate(requests: VisitRequest[]): Map<string, VisitRequest[]> {
  const map = new Map<string, VisitRequest[]>();
  for (const request of requests) {
    const bucket = map.get(request.visitDate);
    if (bucket) bucket.push(request);
    else map.set(request.visitDate, [request]);
  }
  return map;
}

export interface TimeGridBounds {
  startMinutes: number;
  endMinutes: number;
}

const DEFAULT_GRID_START_MINUTES = 8 * 60;
const DEFAULT_GRID_END_MINUTES = 20 * 60;

// Bornes horaires de la grille — uniquement pour dimensionner l'axe
// temporel affiché, aucun rapport avec les horaires d'ouverture réels de
// l'agence (visit_hours) : une plage par défaut raisonnable (08:00–20:00),
// étendue si une visite existante déborde de cette plage (jamais tronquée —
// une visite réelle doit toujours rester visible).
export function computeTimeGridBounds(requests: Pick<VisitRequest, "visitTime" | "durationMinutes">[]): TimeGridBounds {
  let start = DEFAULT_GRID_START_MINUTES;
  let end = DEFAULT_GRID_END_MINUTES;

  for (const request of requests) {
    if (!request.visitTime) continue;
    const requestStart = timeStringToMinutes(request.visitTime);
    const requestEnd = requestStart + request.durationMinutes;
    if (requestStart < start) start = Math.floor(requestStart / 60) * 60;
    if (requestEnd > end) end = Math.ceil(requestEnd / 60) * 60;
  }

  return { startMinutes: start, endMinutes: end };
}

export interface VisitBlockOffset {
  topMinutes: number;
  durationMinutes: number;
}

// Position purement graphique d'un rendez-vous dans la grille horaire —
// AUCUN calcul de disponibilité. null si la demande n'a pas de créneau
// (visitTime NULL, legacy) : ces demandes ne sont jamais placées sur l'axe
// temporel, voir "Demandes sans heure" dans VisitCalendarTimeGrid.
export function getVisitBlockOffset(
  request: Pick<VisitRequest, "visitTime" | "durationMinutes">,
  bounds: TimeGridBounds
): VisitBlockOffset | null {
  if (!request.visitTime) return null;
  const startMinutes = Math.max(0, timeStringToMinutes(request.visitTime) - bounds.startMinutes);
  return { topMinutes: startMinutes, durationMinutes: request.durationMinutes };
}

// Couleurs d'accent par statut pour les blocs du calendrier — reflète
// volontairement les mêmes familles de couleurs que STATUS_STYLES dans
// StatusBadge.tsx (amber/blue/emerald/stone) sans modifier ce fichier
// (hors périmètre de cette étape) ni y importer une constante non exportée.
export const STATUS_ACCENT_CLASSES: Record<VisitRequestStatus, string> = {
  pending: "border-amber-400 bg-amber-50 text-amber-900",
  confirmed: "border-blue-400 bg-blue-50 text-blue-900",
  completed: "border-emerald-400 bg-emerald-50 text-emerald-900",
  cancelled: "border-stone-300 bg-stone-100 text-stone-500",
};
