"use client";

import { useMemo } from "react";
import type { VisitRequest } from "@/lib/supabase/visitRequests";
import StatusBadge from "@/components/admin/visitRequests/StatusBadge";
import {
  STATUS_ACCENT_CLASSES,
  computeTimeGridBounds,
  formatDate,
  formatDayHeader,
  getVisitBlockOffset,
  groupRequestsByDate,
} from "@/components/admin/visitRequests/visitScheduling";

interface VisitCalendarTimeGridProps {
  /** 1 date (vue Jour) ou 7 dates (vue Semaine), "YYYY-MM-DD". */
  days: string[];
  /** Demandes déjà chargées par la page (aucune requête réseau ici) — filtrées ici sur `days`. */
  requests: VisitRequest[];
  propertyTitles: Record<string, string>;
  todayStr: string;
  onSelect: (request: VisitRequest) => void;
}

// Hauteur d'une heure dans la grille — seule constante de rendu (px), tenue
// séparée du calcul de position (getVisitBlockOffset, purement en minutes,
// visitScheduling.ts) pour garder ce dernier indépendant de toute unité
// d'affichage.
const PIXELS_PER_HOUR = 64;
const MIN_BLOCK_HEIGHT_PX = 28;

function minutesToPixels(minutes: number): number {
  return (minutes / 60) * PIXELS_PER_HOUR;
}

export default function VisitCalendarTimeGrid({
  days,
  requests,
  propertyTitles,
  todayStr,
  onSelect,
}: VisitCalendarTimeGridProps) {
  const daySet = useMemo(() => new Set(days), [days]);

  const visibleRequests = useMemo(
    () => requests.filter((request) => daySet.has(request.visitDate)),
    [requests, daySet]
  );

  const requestsByDate = useMemo(() => groupRequestsByDate(visibleRequests), [visibleRequests]);

  const bounds = useMemo(
    () => computeTimeGridBounds(visibleRequests.filter((request) => request.visitTime)),
    [visibleRequests]
  );

  const hourMarks = useMemo(() => {
    const marks: number[] = [];
    for (let minute = bounds.startMinutes; minute <= bounds.endMinutes; minute += 60) {
      marks.push(minute);
    }
    return marks;
  }, [bounds]);

  const gridHeightPx = minutesToPixels(bounds.endMinutes - bounds.startMinutes);

  // Demandes sans heure (legacy, visitTime NULL) : jamais placées sur l'axe
  // temporel — jamais d'heure inventée (00:00, 09:00...) — listées à part,
  // triées par date.
  const untimedRequests = useMemo(
    () =>
      [...visibleRequests]
        .filter((request) => !request.visitTime)
        .sort((a, b) => (a.visitDate < b.visitDate ? -1 : a.visitDate > b.visitDate ? 1 : 0)),
    [visibleRequests]
  );

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100">
      {/* En-têtes de colonnes (utile surtout en vue Semaine). */}
      {days.length > 1 && (
        <div
          className="grid border-b border-stone-100"
          style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, 1fr)` }}
        >
          <div />
          {days.map((day) => {
            const header = formatDayHeader(day);
            const isToday = day === todayStr;
            return (
              <div
                key={day}
                className={`border-l border-stone-100 px-2 py-2 text-center text-xs font-medium ${
                  isToday ? "bg-amber-50 text-amber-800" : "text-stone-500"
                }`}
              >
                {header.weekday} {header.day}
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-x-auto">
        <div
          className="grid"
          style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(9rem, 1fr))`, minWidth: days.length > 1 ? "48rem" : undefined }}
        >
          {/* Axe des heures. */}
          <div className="relative" style={{ height: `${gridHeightPx}px` }}>
            {hourMarks.map((minute) => (
              <div
                key={minute}
                className="absolute right-2 -translate-y-1/2 text-[11px] text-stone-400"
                style={{ top: `${minutesToPixels(minute - bounds.startMinutes)}px` }}
              >
                {String(Math.floor(minute / 60)).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Colonnes des jours. */}
          {days.map((day) => {
            const dayRequests = (requestsByDate.get(day) ?? []).filter((request) => request.visitTime);
            const isToday = day === todayStr;

            return (
              <div
                key={day}
                className={`relative border-l border-stone-100 ${isToday ? "bg-amber-50/30" : ""}`}
                style={{ height: `${gridHeightPx}px` }}
              >
                {hourMarks.map((minute) => (
                  <div
                    key={minute}
                    className="absolute left-0 right-0 border-t border-stone-50"
                    style={{ top: `${minutesToPixels(minute - bounds.startMinutes)}px` }}
                  />
                ))}

                {dayRequests.map((request) => {
                  const offset = getVisitBlockOffset(request, bounds);
                  if (!offset) return null;
                  const heightPx = Math.max(minutesToPixels(offset.durationMinutes), MIN_BLOCK_HEIGHT_PX);

                  return (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => onSelect(request)}
                      className={`absolute left-1 right-1 overflow-hidden rounded-lg border px-2 py-1 text-left text-xs shadow-sm transition-shadow hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${STATUS_ACCENT_CLASSES[request.status]}`}
                      style={{ top: `${minutesToPixels(offset.topMinutes)}px`, height: `${heightPx}px` }}
                    >
                      <p className="truncate font-semibold">{request.visitTime?.slice(0, 5)}</p>
                      <p className="truncate">{request.clientName}</p>
                      <p className="truncate text-[11px] opacity-80">
                        {propertyTitles[request.propertyId] ?? `Bien #${request.propertyId}`}
                      </p>
                      {offset.durationMinutes >= 30 && (
                        <div className="mt-0.5">
                          <StatusBadge status={request.status} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {untimedRequests.length > 0 && (
        <div className="border-t border-stone-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Demandes sans heure
          </p>
          <ul className="mt-2 space-y-2">
            {untimedRequests.map((request) => (
              <li key={request.id}>
                <button
                  type="button"
                  onClick={() => onSelect(request)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2 text-left text-sm text-stone-700 ring-1 ring-stone-100 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <span className="min-w-0 truncate">
                    {formatDate(request.visitDate)} — {request.clientName} —{" "}
                    {propertyTitles[request.propertyId] ?? `Bien #${request.propertyId}`}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-600">
                      Date uniquement
                    </span>
                    <StatusBadge status={request.status} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
