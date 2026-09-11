"use client";

import { useCallback, useEffect, useRef, useState, type SubmitEvent } from "react";
import { CalendarCheck } from "lucide-react";
import { createVisitRequest, getAvailableVisitSlots } from "@/lib/supabase/visitRequests";
import type { AvailableSlotsResult } from "@/lib/scheduling/availability";
import { useSession } from "@/lib/supabase/auth";
import FormField, { formInputClasses } from "@/components/ui/FormField";
import FormSuccessPanel from "@/components/ui/FormSuccessPanel";
import Button from "@/components/ui/Button";

interface VisitRequestFormProps {
  propertyId: string;
  /** Résolu par le Server Component parent (app/properties/[id]/page.tsx, V3.3.R.1) — plus d'import direct de config/agency.ts ici. */
  agencyShortName: string;
}

interface FormValues {
  clientName: string;
  phone: string;
  email: string;
  visitDate: string;
  message: string;
}

interface FormErrors {
  clientName?: string;
  phone?: string;
  email?: string;
  visitDate?: string;
  /** V3.4.D — créneau horaire, pas un champ de FormValues (sélectionné via boutons, pas saisi). */
  visitTime?: string;
}

// État du chargement des créneaux disponibles pour la date sélectionnée.
type SlotsState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "loaded"; result: AvailableSlotsResult }
  | { phase: "error"; message: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\s().-]{8,20}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const emptyValues: FormValues = {
  clientName: "",
  phone: "",
  email: "",
  visitDate: "",
  message: "",
};

// V3.4.D — date locale tunisienne au format "YYYY-MM-DD", jamais
// new Date().toISOString().slice(0, 10) (UTC, peut différer de la date
// murale tunisienne autour de minuit). Même stratégie que
// getTunisWallClockNow côté serveur (lib/supabase/visitRequests.ts) : Intl
// avec un fuseau explicite, "en-CA" formate directement au format
// "YYYY-MM-DD" pour ces options.
function getTunisTodayStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Tunis",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Générique et non technique : couvre à la fois "configuration_required",
// "invalid_configuration" et un échec réseau/Supabase — dans tous ces cas,
// aucun créneau ne peut être proposé, mais la demande reste envoyable au
// format legacy (date seule, sans heure), jamais bloquée pour ce motif.
const SCHEDULING_UNAVAILABLE_MESSAGE =
  "La prise de rendez-vous en ligne n'est pas disponible pour le moment. Vous pouvez tout de même envoyer votre demande : nous vous recontacterons pour convenir d'un horaire.";
const NO_SLOTS_MESSAGE = "Aucun créneau disponible pour cette date. Veuillez choisir une autre date.";
const SLOT_UNAVAILABLE_MESSAGE = "Ce créneau vient d'être réservé. Veuillez choisir un autre horaire.";
const GENERIC_SUBMIT_ERROR_MESSAGE =
  "Une erreur est survenue lors de l'envoi de votre demande. Merci de réessayer.";

function validate(
  values: FormValues,
  scheduling: { selectedTime: string | null; slotsState: SlotsState }
): FormErrors {
  const errors: FormErrors = {};

  if (values.clientName.trim().length < 2) {
    errors.clientName = "Merci d'indiquer votre nom complet.";
  }
  if (!PHONE_REGEX.test(values.phone.trim())) {
    errors.phone = "Numéro de téléphone invalide.";
  }
  if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "Adresse email invalide.";
  }

  if (values.visitDate.trim() === "") {
    errors.visitDate = "Merci de choisir une date.";
  } else if (values.visitDate < getTunisTodayStr()) {
    errors.visitDate = "La date doit être aujourd'hui ou plus tard.";
  } else if (scheduling.slotsState.phase === "loaded") {
    const { result } = scheduling.slotsState;
    if (result.status === "date_in_past" || result.status === "no_slots") {
      errors.visitDate = NO_SLOTS_MESSAGE;
    } else if (result.status === "available" && !scheduling.selectedTime) {
      errors.visitTime = "Merci de choisir un horaire de visite.";
    }
  }

  return errors;
}

export default function VisitRequestForm({ propertyId, agencyShortName }: VisitRequestFormProps) {
  const session = useSession();
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slotsState, setSlotsState] = useState<SlotsState>({ phase: "idle" });
  const latestRequestIdRef = useRef(0);

  // Une seule requête par date sélectionnée (jamais par rendu) : dépendances
  // strictement limitées à propertyId/visitDate. requestId ignore une
  // réponse devenue obsolète si l'utilisateur change de date avant la fin du
  // chargement précédent (au lieu d'écraser l'état avec une réponse
  // périmée).
  const refreshSlots = useCallback(async () => {
    // Jamais conserver un créneau sélectionné pour une autre date — reset
    // systématique en tête, y compris lors d'un rechargement après
    // "slot_unavailable" (même créneau que celui refusé, jamais réaffiché
    // comme sélectionné).
    setSelectedTime(null);

    if (!propertyId || !DATE_PATTERN.test(values.visitDate)) {
      setSlotsState({ phase: "idle" });
      return;
    }

    const requestId = ++latestRequestIdRef.current;
    setSlotsState({ phase: "loading" });

    const { result, error } = await getAvailableVisitSlots(propertyId, values.visitDate);
    if (requestId !== latestRequestIdRef.current) return;

    if (error || !result) {
      setSlotsState({ phase: "error", message: error ?? "Erreur inconnue." });
      return;
    }

    setSlotsState({ phase: "loaded", result });
  }, [propertyId, values.visitDate]);

  // Changement de date (ou montage initial) : recharge les disponibilités —
  // refreshSlots se charge elle-même de vider le créneau sélectionné. IIFE
  // async (même schéma que app/admin/page.tsx) : l'appel direct d'un
  // callback mémoïsé comme seule instruction du corps de l'effet est
  // signalé par react-hooks/set-state-in-effect.
  useEffect(() => {
    (async () => {
      await refreshSlots();
    })();
  }, [refreshSlots]);

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setErrors((current) => ({ ...current, visitTime: undefined }));
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate(values, { selectedTime, slotsState });
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setStatus("submitting");
    setSubmitErrorMessage(null);

    // Un créneau n'est transmis que si l'engine a effectivement confirmé une
    // disponibilité pour cette date — sinon la demande reste au format
    // legacy (visitTime omis), jamais une valeur inventée côté client. Le
    // serveur (createVisitRequest) revalide de toute façon intégralement le
    // créneau avant tout INSERT : le frontend n'est jamais l'autorité.
    const wantsTimeSlot = slotsState.phase === "loaded" && slotsState.result.status === "available";

    const { error } = await createVisitRequest({
      propertyId,
      ...values,
      userId: session?.user.id,
      visitTime: wantsTimeSlot && selectedTime ? selectedTime : undefined,
    });

    if (error) {
      if (error === "slot_unavailable") {
        setSubmitErrorMessage(SLOT_UNAVAILABLE_MESSAGE);
        // refreshSlots vide aussi selectedTime (voir sa définition).
        refreshSlots();
      } else {
        setSubmitErrorMessage(GENERIC_SUBMIT_ERROR_MESSAGE);
      }
      setStatus("error");
      return;
    }

    setStatus("success");
  };

  const handleReset = () => {
    setValues(emptyValues);
    setErrors({});
    setStatus("idle");
    setSubmitErrorMessage(null);
    setSelectedTime(null);
  };

  if (status === "success") {
    return (
      <FormSuccessPanel
        icon={<CalendarCheck className="h-7 w-7 text-accent-ink" strokeWidth={2} />}
        title="Demande envoyée"
        message={`Merci ${values.clientName.split(" ")[0] || ""}, votre demande de visite a bien été transmise. Un conseiller ${agencyShortName} vous recontactera pour la confirmer.`}
        resetLabel="Envoyer une nouvelle demande"
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="rounded-card bg-surface-muted p-6 ring-1 ring-border sm:p-8">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Nom complet" htmlFor="visit-name" error={errors.clientName}>
            <input
              id="visit-name"
              type="text"
              value={values.clientName}
              onChange={(event) => updateField("clientName", event.target.value)}
              aria-invalid={!!errors.clientName}
              className={formInputClasses(!!errors.clientName)}
              placeholder="Jeanne Dupont"
            />
          </FormField>

          <FormField label="Téléphone" htmlFor="visit-phone" error={errors.phone}>
            <input
              id="visit-phone"
              type="tel"
              value={values.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              aria-invalid={!!errors.phone}
              className={formInputClasses(!!errors.phone)}
              placeholder="20 123 456"
            />
          </FormField>

          <FormField label="Email" htmlFor="visit-email" error={errors.email}>
            <input
              id="visit-email"
              type="email"
              value={values.email}
              onChange={(event) => updateField("email", event.target.value)}
              aria-invalid={!!errors.email}
              className={formInputClasses(!!errors.email)}
              placeholder="jeanne.dupont@email.com"
            />
          </FormField>

          <FormField label="Date souhaitée" htmlFor="visit-date" error={errors.visitDate}>
            <input
              id="visit-date"
              type="date"
              min={getTunisTodayStr()}
              value={values.visitDate}
              onChange={(event) => updateField("visitDate", event.target.value)}
              aria-invalid={!!errors.visitDate}
              className={formInputClasses(!!errors.visitDate)}
            />
          </FormField>
        </div>

        {/* V3.4.D — créneaux horaires, pilotés entièrement par l'Availability
            Engine (getAvailableVisitSlots) : jamais d'heures affichées qui
            n'en proviennent pas. */}
        {slotsState.phase === "loading" && (
          <p className="text-sm text-stone-500">Vérification des créneaux disponibles...</p>
        )}

        {slotsState.phase === "error" && (
          <p className="text-sm text-stone-500">{SCHEDULING_UNAVAILABLE_MESSAGE}</p>
        )}

        {slotsState.phase === "loaded" &&
          (slotsState.result.status === "configuration_required" ||
            slotsState.result.status === "invalid_configuration") && (
            <p className="text-sm text-stone-500">{SCHEDULING_UNAVAILABLE_MESSAGE}</p>
          )}

        {slotsState.phase === "loaded" &&
          (slotsState.result.status === "date_in_past" || slotsState.result.status === "no_slots") && (
            <p className="text-sm text-stone-500">{NO_SLOTS_MESSAGE}</p>
          )}

        {slotsState.phase === "loaded" && slotsState.result.status === "available" && (
          <div role="group" aria-label="Créneaux de visite disponibles">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
              Horaire de visite
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {slotsState.result.slots.map((slot) => {
                const isSelected = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={status === "submitting"}
                    onClick={() => handleSelectTime(slot)}
                    className={`min-w-[4.5rem] rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${
                      isSelected
                        ? "border-accent bg-accent text-accent-ink"
                        : "border-border bg-white text-charcoal hover:border-accent"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            {errors.visitTime && <p className="mt-1.5 text-xs text-red-600">{errors.visitTime}</p>}
          </div>
        )}

        <FormField label="Message (facultatif)" htmlFor="visit-message">
          <textarea
            id="visit-message"
            rows={4}
            value={values.message}
            onChange={(event) => updateField("message", event.target.value)}
            className={`resize-none ${formInputClasses(false)}`}
            placeholder="Précisez vos disponibilités ou toute autre information utile..."
          />
        </FormField>

        {status === "error" && submitErrorMessage && (
          <p className="text-sm text-red-600">{submitErrorMessage}</p>
        )}

        <Button type="submit" disabled={status === "submitting"} className="w-full disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto">
          {status === "submitting" ? "Envoi en cours..." : "Envoyer la demande"}
        </Button>
      </form>
    </div>
  );
}
