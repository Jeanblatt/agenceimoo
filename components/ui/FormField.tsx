import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

// Regroupe label + champ + message d'erreur — balisage quasi identique
// dupliqué entre ContactForm et VisitRequestForm avant V2.1. Ne touche pas
// à la logique de validation/soumission, qui reste dans chaque formulaire.
export default function FormField({ label, htmlFor, error, className, children }: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wider text-stone-500">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Classes du champ lui-même (input/select/textarea) : à passer directement
// en className sur l'élément, `FormField` ne stylise que le label/l'erreur.
export function formInputClasses(hasError: boolean) {
  return `w-full rounded-field border px-4 py-2.5 text-sm text-charcoal placeholder:text-stone-400 focus:outline-none ${
    hasError ? "border-red-400 focus:border-red-500" : "border-border focus:border-accent"
  }`;
}
