"use client";

import { Search } from "lucide-react";
import type { VisitRequestStatus } from "@/lib/supabase/visitRequests";
import { STATUS_LABELS } from "@/components/admin/visitRequests/StatusBadge";
import type { DateFilterState, DateFilterValue, ViewFilter } from "@/components/admin/visitRequests/visitScheduling";

export type StatusFilter = VisitRequestStatus | "all";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "pending", label: STATUS_LABELS.pending },
  { value: "confirmed", label: STATUS_LABELS.confirmed },
  { value: "completed", label: STATUS_LABELS.completed },
  { value: "cancelled", label: STATUS_LABELS.cancelled },
];

// V3.5.A — filtre de section, indépendant du filtre de statut ci-dessus
// (une visite "cancelled" reste "Historique" quel que soit son statut choisi
// ailleurs — voir getVisitSection dans visitScheduling.ts).
const VIEW_FILTERS: { value: ViewFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "upcoming", label: "À venir" },
  { value: "history", label: "Historique" },
];

const DATE_FILTERS: { value: DateFilterValue; label: string }[] = [
  { value: "all", label: "Toutes les dates" },
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "custom", label: "Personnalisée" },
];

const pillClasses = (isActive: boolean) =>
  `whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-medium transition-colors sm:py-1.5 ${
    isActive ? "bg-amber-500 text-stone-950" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
  }`;

interface VisitRequestsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  counts: Record<StatusFilter, number>;
  viewFilter: ViewFilter;
  onViewFilterChange: (filter: ViewFilter) => void;
  dateFilter: DateFilterState;
  onDateFilterChange: (filter: DateFilterState) => void;
}

export default function VisitRequestsToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  counts,
  viewFilter,
  onViewFilterChange,
  dateFilter,
  onDateFilterChange,
}: VisitRequestsToolbarProps) {
  return (
    <div className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-stone-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((filter) => {
            const isActive = statusFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => onStatusFilterChange(filter.value)}
                className={pillClasses(isActive)}
              >
                {filter.label}
                <span className={isActive ? "ml-1.5 text-stone-800" : "ml-1.5 text-stone-400"}>
                  {counts[filter.value] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Client, téléphone, email, bien..."
            className="w-full rounded-lg border border-stone-200 py-2.5 pl-9 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {VIEW_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => onViewFilterChange(filter.value)}
              className={pillClasses(viewFilter === filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {DATE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => onDateFilterChange({ ...dateFilter, value: filter.value })}
              className={pillClasses(dateFilter.value === filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {dateFilter.value === "custom" && (
        <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 pt-4">
          <label className="flex items-center gap-2 text-xs text-stone-500">
            Du
            <input
              type="date"
              value={dateFilter.customStart}
              onChange={(event) => onDateFilterChange({ ...dateFilter, customStart: event.target.value })}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-stone-500">
            Au
            <input
              type="date"
              value={dateFilter.customEnd}
              onChange={(event) => onDateFilterChange({ ...dateFilter, customEnd: event.target.value })}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none"
            />
          </label>
        </div>
      )}
    </div>
  );
}
