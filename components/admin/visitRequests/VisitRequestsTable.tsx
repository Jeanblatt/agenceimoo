"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { VisitRequest } from "@/lib/supabase/visitRequests";
import StatusBadge from "@/components/admin/visitRequests/StatusBadge";

interface VisitRequestsTableProps {
  requests: VisitRequest[];
  propertyTitles: Record<string, string>;
  onSelect: (request: VisitRequest) => void;
}

function formatDate(value: string) {
  // "visitDate" est une date simple (YYYY-MM-DD), "createdAt" un timestamp.
  const date = value.length <= 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function VisitRequestsTable({
  requests,
  propertyTitles,
  onSelect,
}: VisitRequestsTableProps) {
  if (requests.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100">
        <p className="px-6 py-10 text-center text-sm text-stone-500">
          Aucune demande ne correspond à ces critères.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100">
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
            {requests.map((request, index) => (
              <motion.tr
                key={request.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03 }}
                onClick={() => onSelect(request)}
                className="cursor-pointer border-b border-stone-50 last:border-0 hover:bg-stone-50"
              >
                <td className="max-w-[220px] truncate px-6 py-3 font-medium text-stone-900">
                  {propertyTitles[request.propertyId] ?? `Bien #${request.propertyId}`}
                </td>
                <td className="px-6 py-3 text-stone-600">{request.clientName}</td>
                <td className="px-6 py-3 text-stone-600">
                  <div className="whitespace-nowrap">{request.phone}</div>
                  <div className="max-w-[180px] truncate text-xs text-stone-400">
                    {request.email}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-stone-600">
                  {formatDate(request.visitDate)}
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-stone-600">
                  {formatDate(request.createdAt)}
                </td>
                <td className="px-6 py-3">
                  <StatusBadge status={request.status} />
                </td>
                <td className="px-6 py-3 text-right">
                  <ChevronRight className="ml-auto h-4 w-4 text-stone-300" />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
