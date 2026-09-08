"use client";

import { useState, type SubmitEvent } from "react";
import { CalendarCheck } from "lucide-react";
import { createVisitRequest } from "@/lib/supabase/visitRequests";
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

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\s().-]{8,20}$/;

const emptyValues: FormValues = {
  clientName: "",
  phone: "",
  email: "",
  visitDate: "",
  message: "",
};

function validate(values: FormValues): FormErrors {
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
  } else if (values.visitDate < new Date().toISOString().slice(0, 10)) {
    errors.visitDate = "La date doit être aujourd'hui ou plus tard.";
  }

  return errors;
}

export default function VisitRequestForm({ propertyId, agencyShortName }: VisitRequestFormProps) {
  const session = useSession();
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setStatus("submitting");
    const { error } = await createVisitRequest({
      propertyId,
      ...values,
      userId: session?.user.id,
    });

    if (error) {
      setStatus("error");
      return;
    }

    setStatus("success");
  };

  const handleReset = () => {
    setValues(emptyValues);
    setErrors({});
    setStatus("idle");
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
              min={new Date().toISOString().slice(0, 10)}
              value={values.visitDate}
              onChange={(event) => updateField("visitDate", event.target.value)}
              aria-invalid={!!errors.visitDate}
              className={formInputClasses(!!errors.visitDate)}
            />
          </FormField>
        </div>

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

        {status === "error" && (
          <p className="text-sm text-red-600">
            Une erreur est survenue lors de l&apos;envoi de votre demande. Merci de réessayer.
          </p>
        )}

        <Button type="submit" disabled={status === "submitting"} className="w-full disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto">
          {status === "submitting" ? "Envoi en cours..." : "Envoyer la demande"}
        </Button>
      </form>
    </div>
  );
}
