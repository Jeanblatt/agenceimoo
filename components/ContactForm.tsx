"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";

const SUBJECTS = [
  "Demande de visite",
  "Renseignements généraux",
  "Estimation de bien",
  "Vendre mon bien",
  "Autre",
];

interface ContactFormProps {
  defaultSubject?: string;
  defaultMessage?: string;
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

const inputClasses =
  "w-full rounded-lg border px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none";

function fieldClasses(hasError: boolean) {
  return `${inputClasses} ${
    hasError
      ? "border-red-400 focus:border-red-500"
      : "border-stone-200 focus:border-amber-500"
  }`;
}

export default function ContactForm({
  defaultSubject,
  defaultMessage,
}: ContactFormProps) {
  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    phone: "",
    subject: defaultSubject ?? "",
    message: defaultMessage ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

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
    // Pas de backend pour le moment : on simule l'envoi côté frontend.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setStatus("success");
  };

  const handleReset = () => {
    setValues({ name: "", email: "", phone: "", subject: "", message: "" });
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
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="h-7 w-7 text-stone-950"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-6 font-serif text-2xl text-stone-900">Message envoyé</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600">
          Merci {values.name.split(" ")[0] || ""}, votre demande a bien été
          transmise. Un conseiller Horizon vous recontactera sous 24h.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="mt-6 text-sm font-medium uppercase tracking-wide text-amber-600 transition-colors hover:text-amber-700"
        >
          Envoyer un nouveau message
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Nom complet
          </label>
          <input
            id="contact-name"
            type="text"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            aria-invalid={!!errors.name}
            className={`mt-1.5 ${fieldClasses(!!errors.name)}`}
            placeholder="Jeanne Dupont"
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="contact-email" className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            aria-invalid={!!errors.email}
            className={`mt-1.5 ${fieldClasses(!!errors.email)}`}
            placeholder="jeanne.dupont@email.com"
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="contact-phone" className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Téléphone
          </label>
          <input
            id="contact-phone"
            type="tel"
            value={values.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            aria-invalid={!!errors.phone}
            className={`mt-1.5 ${fieldClasses(!!errors.phone)}`}
            placeholder="20 123 456"
          />
          {errors.phone && <p className="mt-1.5 text-xs text-red-600">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="contact-subject" className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Sujet
          </label>
          <select
            id="contact-subject"
            value={values.subject}
            onChange={(event) => updateField("subject", event.target.value)}
            aria-invalid={!!errors.subject}
            className={`mt-1.5 bg-white ${fieldClasses(!!errors.subject)}`}
          >
            <option value="">Choisissez un sujet</option>
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
          {errors.subject && <p className="mt-1.5 text-xs text-red-600">{errors.subject}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="text-xs font-medium uppercase tracking-wider text-stone-500">
          Message
        </label>
        <textarea
          id="contact-message"
          rows={5}
          value={values.message}
          onChange={(event) => updateField("message", event.target.value)}
          aria-invalid={!!errors.message}
          className={`mt-1.5 resize-none ${fieldClasses(!!errors.message)}`}
          placeholder="Parlez-nous de votre projet..."
        />
        {errors.message && <p className="mt-1.5 text-xs text-red-600">{errors.message}</p>}
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex w-full items-center justify-center rounded-full bg-amber-500 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {status === "submitting" ? "Envoi en cours..." : "Envoyer le message"}
      </button>
    </form>
  );
}
