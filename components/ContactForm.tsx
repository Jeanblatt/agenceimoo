"use client";

import { useState, type SubmitEvent } from "react";
import { createContactMessage } from "@/lib/supabase/contactMessages";
import { useSession } from "@/lib/supabase/auth";
import FormField, { formInputClasses } from "@/components/ui/FormField";
import FormSuccessPanel from "@/components/ui/FormSuccessPanel";
import Button from "@/components/ui/Button";

const SUBJECTS = [
  "Renseignements généraux",
  "Estimation de bien",
  "Vendre mon bien",
  "Autre",
];

interface ContactFormProps {
  defaultSubject?: string;
  defaultMessage?: string;
  /** Résolu par le Server Component parent (app/contact/page.tsx, V3.3.R.1) — plus d'import direct de config/agency.ts ici. */
  agencyShortName: string;
}

interface FormValues {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\s().-]{8,20}$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = "Merci d'indiquer votre nom complet.";
  }
  if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "Adresse email invalide.";
  }
  if (!PHONE_REGEX.test(values.phone.trim())) {
    errors.phone = "Numéro de téléphone invalide.";
  }
  if (values.subject.trim() === "") {
    errors.subject = "Merci de choisir un sujet.";
  }
  if (values.message.trim().length < 10) {
    errors.message = "Votre message doit contenir au moins 10 caractères.";
  }

  return errors;
}

export default function ContactForm({
  defaultSubject,
  defaultMessage,
  agencyShortName,
}: ContactFormProps) {
  const session = useSession();
  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    phone: "",
    subject: defaultSubject ?? "",
    message: defaultMessage ?? "",
  });
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
    const { error } = await createContactMessage({ ...values, userId: session?.user.id });

    if (error) {
      setStatus("error");
      return;
    }

    setStatus("success");
  };

  const handleReset = () => {
    setValues({ name: "", email: "", phone: "", subject: "", message: "" });
    setErrors({});
    setStatus("idle");
  };

  if (status === "success") {
    return (
      <FormSuccessPanel
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="h-7 w-7 text-accent-ink"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
          </svg>
        }
        title="Message envoyé"
        message={`Merci ${values.name.split(" ")[0] || ""}, votre demande a bien été transmise. Un conseiller ${agencyShortName} vous recontactera sous 24h.`}
        resetLabel="Envoyer un nouveau message"
        onReset={handleReset}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Nom complet" htmlFor="contact-name" error={errors.name}>
          <input
            id="contact-name"
            type="text"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            aria-invalid={!!errors.name}
            className={formInputClasses(!!errors.name)}
            placeholder="Jeanne Dupont"
          />
        </FormField>

        <FormField label="Email" htmlFor="contact-email" error={errors.email}>
          <input
            id="contact-email"
            type="email"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            aria-invalid={!!errors.email}
            className={formInputClasses(!!errors.email)}
            placeholder="jeanne.dupont@email.com"
          />
        </FormField>

        <FormField label="Téléphone" htmlFor="contact-phone" error={errors.phone}>
          <input
            id="contact-phone"
            type="tel"
            value={values.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            aria-invalid={!!errors.phone}
            className={formInputClasses(!!errors.phone)}
            placeholder="20 123 456"
          />
        </FormField>

        <FormField label="Sujet" htmlFor="contact-subject" error={errors.subject}>
          <select
            id="contact-subject"
            value={values.subject}
            onChange={(event) => updateField("subject", event.target.value)}
            aria-invalid={!!errors.subject}
            className={`bg-surface ${formInputClasses(!!errors.subject)}`}
          >
            <option value="">Choisissez un sujet</option>
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Message" htmlFor="contact-message" error={errors.message}>
        <textarea
          id="contact-message"
          rows={5}
          value={values.message}
          onChange={(event) => updateField("message", event.target.value)}
          aria-invalid={!!errors.message}
          className={`resize-none ${formInputClasses(!!errors.message)}`}
          placeholder="Parlez-nous de votre projet..."
        />
      </FormField>

      {status === "error" && (
        <p className="text-sm text-red-600">
          Une erreur est survenue lors de l&apos;envoi de votre message. Merci de réessayer.
        </p>
      )}

      <Button type="submit" disabled={status === "submitting"} className="w-full disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto">
        {status === "submitting" ? "Envoi en cours..." : "Envoyer le message"}
      </Button>
    </form>
  );
}
