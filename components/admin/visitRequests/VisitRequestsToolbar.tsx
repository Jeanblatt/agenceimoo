"use client";

import { Search } from "lucide-react";
import type { VisitRequestStatus } from "@/lib/supabase/visitRequests";
import { STATUS_LABELS } from "@/components/admin/visitRequests/StatusBadge";

export type StatusFilter = VisitRequestStatus | "all";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "pending", label: STATUS_LABELS.pending },
  { value: "confirmed", label: STATUS_LABELS.confirmed },
  { value: "completed", label: STATUS_LABELS.completed },
  { value: "cancelled", label: STATUS_LABELS.cancelled },
];

interface VisitRequestsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  counts: Record<StatusFilter, number>;
}

export default function VisitRequestsToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  counts,
}: VisitRequestsToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-stone-100 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => {
          const isActive = statusFilter === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => onStatusFilterChange(filter.value)}
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-medium transition-colors sm:py-1.5 ${
                isActive
                  ? "bg-amber-500 text-stone-950"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
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
  );
}
