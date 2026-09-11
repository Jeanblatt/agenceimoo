"use client";

import { useMemo } from "react";
import type { VisitRequest } from "@/lib/supabase/visitRequests";
import { formatDayHeader, groupRequestsByDate } from "@/components/admin/visitRequests/visitScheduling";

interface VisitCalendarMonthProps {
  /** Grille complète du mois (semaines pleines, jours hors mois inclus), "YYYY-MM-DD". */
  dates: string[];
  referenceDateStr: string;
  requests: VisitRequest[];
  todayStr: string;
  /** Bascule vers la vue Jour de cette date (interaction simple, sans complexité excessive). */
  onSelectDay: (dateStr: string) => void;
}

const WEEKDAY_HEADERS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const WEEKDAY_HEADERS_SHORT = ["L", "M", "M", "J", "V", "S", "D"];

function isInReferenceMonth(dateStr: string, referenceDateStr: string): boolean {
  return dateStr.slice(0, 7) === referenceDateStr.slice(0, 7);
}

// V3.5.B — Vue Mois : uniquement un résumé (nombre de visites par statut),
// jamais de positionnement horaire (l'espace d'une cellule mensuelle est
// trop réduit — voir vue Jour/Semaine pour le détail par créneau).
export default function VisitCalendarMonth({
  dates,
  referenceDateStr,
  requests,
  todayStr,
  onSelectDay,
}: VisitCalendarMonthProps) {
  const dateSet = useMemo(() => new Set(dates), [dates]);
  const requestsByDate = useMemo(
    () => groupRequestsByDate(requests.filter((request) => dateSet.has(request.visitDate))),
    [requests, dateSet]
  );

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100">
      <div className="grid grid-cols-7 border-b border-stone-100">
        {WEEKDAY_HEADERS.map((label, index) => (
          <div key={label} className="px-1 py-2 text-center text-xs font-medium text-stone-500 sm:px-2">
            <span className="sm:hidden">{WEEKDAY_HEADERS_SHORT[index]}</span>
            <span className="hidden sm:inline">{label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {dates.map((dateStr) => {
          const dayRequests = requestsByDate.get(dateStr) ?? [];
          const isToday = dateStr === todayStr;
          const inMonth = isInReferenceMonth(dateStr, referenceDateStr);
          const header = formatDayHeader(dateStr);

          const pending = dayRequests.filter((r) => r.status === "pending").length;
          const confirmed = dayRequests.filter((r) => r.status === "confirmed").length;
          const other = dayRequests.length - pending - confirmed;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDay(dateStr)}
              className={`flex min-h-[3.75rem] flex-col items-start gap-1 border-b border-l border-stone-100 p-1.5 text-left transition-colors first:border-l-0 [&:nth-child(7n+1)]:border-l-0 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 sm:min-h-[5.5rem] sm:p-2 ${
                inMonth ? "" : "opacity-40"
              } ${isToday ? "bg-amber-50/60" : ""}`}
            >
              <span
                className={`text-xs font-medium ${isToday ? "flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-stone-950" : "text-stone-500"}`}
              >
                {header.day}
              </span>

              {dayRequests.length > 0 && (
                <>
                  {/* Mobile : indicateurs compacts (points colorés), pas de
                      détail — la vue Mois reste une synthèse. */}
                  <div className="flex flex-wrap gap-1 sm:hidden">
                    {confirmed > 0 && (
                      <span className="text-[10px] font-semibold text-blue-700">•{confirmed}</span>
                    )}
                    {pending > 0 && (
                      <span className="text-[10px] font-semibold text-amber-700">•{pending}</span>
                    )}
                    {other > 0 && <span className="text-[10px] font-semibold text-stone-400">•{other}</span>}
                  </div>

                  {/* Desktop : détail textuel (comportement V3.5.B inchangé). */}
                  <div className="hidden space-y-0.5 text-[11px] text-stone-600 sm:block">
                    <p className="font-medium">
                      {dayRequests.length} visite{dayRequests.length > 1 ? "s" : ""}
                    </p>
                    {confirmed > 0 && (
                      <p className="text-blue-700">{confirmed} confirmée{confirmed > 1 ? "s" : ""}</p>
                    )}
                    {pending > 0 && <p className="text-amber-700">{pending} en attente</p>}
                    {other > 0 && <p className="text-stone-400">{other} autre{other > 1 ? "s" : ""}</p>}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
