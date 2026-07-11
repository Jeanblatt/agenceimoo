"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { CalendarCheck } from "lucide-react";
import { createVisitRequest } from "@/lib/supabase/visitRequests";

interface VisitRequestFormProps {
  propertyId: string;
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

const fieldClasses =
  "mt-1.5 w-full rounded-lg border px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none";
const labelClasses = "text-xs font-medium uppercase tracking-wider text-stone-500";

function inputClasses(hasError: boolean) {
  return `${fieldClasses} ${
    hasError ? "border-red-400 focus:border-red-500" : "border-stone-200 focus:border-amber-500"
  }`;
}

export default function VisitRequestForm({ propertyId }: VisitRequestFormProps) {
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setStatus("submitting");
    const { error } = await createVisitRequest({ propertyId, ...values });

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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center rounded-2xl bg-stone-50 p-10 text-center ring-1 ring-stone-100"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500">
          <CalendarCheck className="h-7 w-7 text-stone-950" strokeWidth={2} />
        </div>
        <h3 className="mt-6 font-serif text-2xl text-stone-900">Demande envoyée</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600">
          Merci {values.clientName.split(" ")[0] || ""}, votre demande de visite a bien
          été transmise. Un conseiller Horizon vous recontactera pour la confirmer.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="mt-6 text-sm font-medium uppercase tracking-wide text-amber-600 transition-colors hover:text-amber-700"
        >
          Envoyer une nouvelle demande
        </button>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl bg-stone-50 p-6 ring-1 ring-stone-100 sm:p-8">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="visit-name" className={labelClasses}>
              Nom complet
            </label>
            <input
              id="visit-name"
              type="text"
              value={values.clientName}
              onChange={(event) => updateField("clientName", event.target.value)}
              aria-invalid={!!errors.clientName}
              className={inputClasses(!!errors.clientName)}
              placeholder="Jeanne Dupont"
            />
            {errors.clientName && (
              <p className="mt-1.5 text-xs text-red-600">{errors.clientName}</p>
            )}
          </div>

          <div>
            <label htmlFor="visit-phone" className={labelClasses}>
              Téléphone
            </label>
            <input
              id="visit-phone"
              type="tel"
              value={values.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              aria-invalid={!!errors.phone}
              className={inputClasses(!!errors.phone)}
              placeholder="20 123 456"
            />
            {errors.phone && <p className="mt-1.5 text-xs text-red-600">{errors.phone}</p>}
          </div>

          <div>
            <label htmlFor="visit-email" className={labelClasses}>
              Email
            </label>
            <input
              id="visit-email"
              type="email"
              value={values.email}
              onChange={(event) => updateField("email", event.target.value)}
              aria-invalid={!!errors.email}
              className={inputClasses(!!errors.email)}
              placeholder="jeanne.dupont@email.com"
            />
            {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="visit-date" className={labelClasses}>
              Date souhaitée
            </label>
            <input
              id="visit-date"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={values.visitDate}
              onChange={(event) => updateField("visitDate", event.target.value)}
              aria-invalid={!!errors.visitDate}
              className={inputClasses(!!errors.visitDate)}
            />
            {errors.visitDate && (
              <p className="mt-1.5 text-xs text-red-600">{errors.visitDate}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="visit-message" className={labelClasses}>
            Message (facultatif)
          </label>
          <textarea
            id="visit-message"
            rows={4}
            value={values.message}
            onChange={(event) => updateField("message", event.target.value)}
            className={`${fieldClasses} resize-none border-stone-200 focus:border-amber-500`}
            placeholder="Précisez vos disponibilités ou toute autre information utile..."
          />
        </div>

        {status === "error" && (
          <p className="text-sm text-red-600">
            Une erreur est survenue lors de l&apos;envoi de votre demande. Merci de réessayer.
          </p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="flex w-full items-center justify-center rounded-full bg-amber-500 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {status === "submitting" ? "Envoi en cours..." : "Envoyer la demande"}
        </button>
      </form>
    </div>
  );
}
