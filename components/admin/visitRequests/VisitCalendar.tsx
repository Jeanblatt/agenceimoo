"use client";

import { useEffect, useState } from "react";
import type { VisitRequest } from "@/lib/supabase/visitRequests";
import VisitCalendarToolbar from "@/components/admin/visitRequests/VisitCalendarToolbar";
import VisitCalendarTimeGrid from "@/components/admin/visitRequests/VisitCalendarTimeGrid";
import VisitCalendarMonth from "@/components/admin/visitRequests/VisitCalendarMonth";
import {
  formatPeriodLabel,
  getTunisTodayStr,
  getVisibleDates,
  shiftReferenceDate,
  type CalendarView,
} from "@/components/admin/visitRequests/visitScheduling";

interface VisitCalendarProps {
  /** Demandes déjà chargées par app/admin/visit-requests/page.tsx — aucune requête réseau ici. */
  requests: VisitRequest[];
  propertyTitles: Record<string, string>;
  onSelect: (request: VisitRequest) => void;
}

// V3.5.B — Smart Calendar : n'affiche que des visit_requests déjà
// existantes (aucun appel à getAvailableVisitSlots/resolveAvailability/
// generateDaySlots/generateTheoreticalSlots — voir visitScheduling.ts pour
// le détail des fonctions de positionnement, purement graphiques).
export default function VisitCalendar({ requests, propertyTitles, onSelect }: VisitCalendarProps) {
  // Valeur initiale déterministe (identique serveur/client) pour éviter tout
  // mismatch d'hydratation : "week" par défaut partout, ajusté à "day" une
  // seule fois après montage si le viewport est mobile (effet client-only,
  // jamais lu pendant le rendu initial).
  const [view, setView] = useState<CalendarView>("week");
  const [referenceDateStr, setReferenceDateStr] = useState(() => getTunisTodayStr());

  useEffect(() => {
    // IIFE (même schéma que app/admin/page.tsx et VisitCalendar) : un appel
    // setState direct comme unique instruction du corps de l'effet est
    // signalé par react-hooks/set-state-in-effect.
    (() => {
      if (window.matchMedia("(max-width: 767px)").matches) {
        setView("day");
      }
    })();
  }, []);

  const todayStr = getTunisTodayStr();
  const visibleDates = getVisibleDates(view, referenceDateStr);
  const periodLabel = formatPeriodLabel(view, referenceDateStr);

  const handleSelectDay = (dateStr: string) => {
    setReferenceDateStr(dateStr);
    setView("day");
  };

  return (
    <div className="space-y-3">
      <VisitCalendarToolbar
        view={view}
        onViewChange={setView}
        periodLabel={periodLabel}
        onToday={() => setReferenceDateStr(getTunisTodayStr())}
        onPrev={() => setReferenceDateStr((current) => shiftReferenceDate(view, current, -1))}
        onNext={() => setReferenceDateStr((current) => shiftReferenceDate(view, current, 1))}
      />

      {view === "month" ? (
        <VisitCalendarMonth
          dates={visibleDates}
          referenceDateStr={referenceDateStr}
          requests={requests}
          todayStr={todayStr}
          onSelectDay={handleSelectDay}
        />
      ) : (
        <VisitCalendarTimeGrid
          days={visibleDates}
          requests={requests}
          propertyTitles={propertyTitles}
          todayStr={todayStr}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}
