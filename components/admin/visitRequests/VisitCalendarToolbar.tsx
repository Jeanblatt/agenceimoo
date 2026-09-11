"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarView } from "@/components/admin/visitRequests/visitScheduling";

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: "day", label: "Jour" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
];

interface VisitCalendarToolbarProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  periodLabel: string;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
}

// V3.5.B.1 — Jour/Semaine/Mois toutes accessibles sur mobile (avant : Semaine
// et Mois masquées sous md). C'est la présentation de chaque vue qui change
// selon le viewport (grille desktop vs agenda mobile pour Semaine, densité
// réduite pour Mois — voir VisitCalendarTimeGrid.tsx/VisitCalendarMonth.tsx),
// jamais la disponibilité du sélecteur lui-même. La détection mobile au
// montage (VisitCalendar.tsx) ne sert plus qu'à choisir la vue INITIALE.
export default function VisitCalendarToolbar({
  view,
  onViewChange,
  periodLabel,
  onToday,
  onPrev,
  onNext,
}: VisitCalendarToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-100 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1.5">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onViewChange(option.value)}
            className={`whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-medium transition-colors sm:px-4 sm:py-1.5 ${
              view === option.value ? "bg-amber-500 text-stone-950" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onToday}
          className="whitespace-nowrap rounded-full bg-stone-100 px-4 py-2.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-200 sm:py-1.5"
        >
          Aujourd&apos;hui
        </button>
        <button
          type="button"
          onClick={onPrev}
          aria-label="Période précédente"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <p className="text-center text-sm font-medium text-stone-700 sm:min-w-[14rem]">
          {periodLabel}
        </p>
        <button
          type="button"
          onClick={onNext}
          aria-label="Période suivante"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
