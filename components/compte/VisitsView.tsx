"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/admin/visitRequests/StatusBadge";
import { getMyVisitRequests, type VisitRequest } from "@/lib/supabase/visitRequests";

function formatDate(value: string) {
  const date = value.length <= 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function VisitsView() {
  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { requests: data, error: fetchError } = await getMyVisitRequests();
      setRequests(data);
      setError(fetchError);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-stone-900">Mes demandes de visite</h1>
        <p className="mt-1 text-sm text-stone-500">
          Suivez le statut de vos demandes de visite.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger vos demandes : {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-stone-500">Chargement...</p>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-stone-100">
          <p className="text-sm text-stone-500">
            Vous n&apos;avez pas encore demandé de visite.{" "}
            <Link href="/biens" className="font-medium text-amber-600 hover:text-amber-700">
              Parcourir les biens
            </Link>
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100">
          <ul className="divide-y divide-stone-100">
            {requests.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div className="min-w-0">
                  <Link
                    href={`/properties/${request.propertyId}`}
                    className="text-sm font-medium text-stone-900 hover:text-amber-600"
                  >
                    Bien #{request.propertyId}
                  </Link>
                  <p className="mt-1 text-xs text-stone-500">
                    Visite souhaitée le {formatDate(request.visitDate)}
                  </p>
                  {request.adminNotes && (
                    <p className="mt-1 text-xs text-stone-500">
                      Note de l&apos;agence : {request.adminNotes}
                    </p>
                  )}
                </div>
                <StatusBadge status={request.status} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
