"use client";

import type { KeyboardEvent } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { VisitRequest } from "@/lib/supabase/visitRequests";
import StatusBadge from "@/components/admin/visitRequests/StatusBadge";
import {
  formatDate,
  formatVisitSummary,
  getVisitTiming,
  type VisitRequestGroup,
} from "@/components/admin/visitRequests/visitScheduling";

interface VisitRequestsTableProps {
  groups: VisitRequestGroup[];
  propertyTitles: Record<string, string>;
  propertyHrefs: Record<string, string>;
  todayStr: string;
  onSelect: (request: VisitRequest) => void;
  emptyMessage: string;
}

type FlatItem = { kind: "header"; label: string } | { kind: "row"; request: VisitRequest };

function flattenGroups(groups: VisitRequestGroup[]): FlatItem[] {
  const items: FlatItem[] = [];
  for (const group of groups) {
    if (group.label) items.push({ kind: "header", label: group.label });
    for (const request of group.requests) items.push({ kind: "row", request });
  }
  return items;
}

// Petit badge discret pour une demande legacy (visit_time NULL, V3.4.A) —
// jamais d'heure inventée, juste une indication que le créneau n'a pas été
// précisé.
function LegacyDateBadge() {
  return (
    <span className="ml-1.5 inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
      Date uniquement
    </span>
  );
}

function PropertyLink({ title, href }: { title: string; href?: string }) {
  if (!href) return <>{title}</>;
  return (
    <Link
      href={href}
      onClick={(event) => event.stopPropagation()}
      className="hover:text-amber-700 hover:underline"
    >
      {title}
    </Link>
  );
}

function handleRowKeyDown(event: KeyboardEvent, onActivate: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onActivate();
  }
}

export default function VisitRequestsTable({
  groups,
  propertyTitles,
  propertyHrefs,
  todayStr,
  onSelect,
  emptyMessage,
}: VisitRequestsTableProps) {
  const items = flattenGroups(groups);
  const hasRows = items.some((item) => item.kind === "row");

  if (!hasRows) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100">
        <p className="px-6 py-10 text-center text-sm text-stone-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop : tableau. */}
      <div className="hidden overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs uppercase tracking-wider text-stone-400">
                <th className="px-6 py-3 font-medium">Bien concerné</th>
                <th className="px-6 py-3 font-medium">Client</th>
                <th className="px-6 py-3 font-medium">Contact</th>
                <th className="px-6 py-3 font-medium">Visite souhaitée</th>
                <th className="px-6 py-3 font-medium">Créée le</th>
                <th className="px-6 py-3 font-medium">Statut</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) =>
                item.kind === "header" ? (
                  <tr key={`header-${item.label}-${index}`}>
                    <td
                      colSpan={7}
                      className="bg-stone-50 px-6 py-2 text-xs font-semibold uppercase tracking-wider text-stone-500"
                    >
                      {item.label}
                    </td>
                  </tr>
                ) : (
                  <motion.tr
                    key={item.request.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03 }}
                    tabIndex={0}
                    onClick={() => onSelect(item.request)}
                    onKeyDown={(event) => handleRowKeyDown(event, () => onSelect(item.request))}
                    className="cursor-pointer border-b border-stone-50 last:border-0 hover:bg-stone-50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-500"
                  >
                    <td className="max-w-[220px] truncate px-6 py-3 font-medium text-stone-900">
                      <PropertyLink
                        title={propertyTitles[item.request.propertyId] ?? `Bien #${item.request.propertyId}`}
                        href={propertyHrefs[item.request.propertyId]}
                      />
                    </td>
                    <td className="px-6 py-3 text-stone-600">{item.request.clientName}</td>
                    <td className="px-6 py-3 text-stone-600">
                      <div className="whitespace-nowrap">{item.request.phone}</div>
                      <div className="max-w-[180px] truncate text-xs text-stone-400">
                        {item.request.email}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-stone-600">
                      {formatVisitSummary(item.request)}
                      {!item.request.visitTime && <LegacyDateBadge />}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-stone-600">
                      {formatDate(item.request.createdAt)}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={item.request.status} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-stone-300" />
                    </td>
                  </motion.tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile : cartes. */}
      <div className="space-y-3 md:hidden">
        {items.map((item, index) =>
          item.kind === "header" ? (
            <p
              key={`header-m-${item.label}-${index}`}
              className="px-1 pt-2 text-xs font-semibold uppercase tracking-wider text-stone-500 first:pt-0"
            >
              {item.label}
            </p>
          ) : (
            <div
              key={item.request.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(item.request)}
              onKeyDown={(event) => handleRowKeyDown(event, () => onSelect(item.request))}
              className="cursor-pointer rounded-2xl bg-white p-4 ring-1 ring-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-stone-900">{item.request.clientName}</p>
                  <p className="truncate text-sm text-stone-500">
                    <PropertyLink
                      title={propertyTitles[item.request.propertyId] ?? `Bien #${item.request.propertyId}`}
                      href={propertyHrefs[item.request.propertyId]}
                    />
                  </p>
                </div>
                <StatusBadge status={item.request.status} />
              </div>

              <div className="mt-3 flex items-center justify-between text-sm text-stone-600">
                <span>
                  {formatVisitSummary(item.request)}
                  {!item.request.visitTime && <LegacyDateBadge />}
                  {getVisitTiming(item.request.visitDate, todayStr) === "today" && (
                    <span className="ml-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                      Aujourd&apos;hui
                    </span>
                  )}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
}
