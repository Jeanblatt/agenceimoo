import Link from "next/link";

interface ContactButtonProps {
  /** Pré-remplit la demande de contact avec le bien concerné. */
  propertyTitle?: string;
}

export default function ContactButton({ propertyTitle }: ContactButtonProps) {
  const propertyParam = propertyTitle
    ? `&property=${encodeURIComponent(propertyTitle)}`
    : "";

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        href={`/contact?subject=visite${propertyParam}`}
        className="flex flex-1 items-center justify-center rounded-full bg-amber-500 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-[1.02]"
      >
        Demander une visite
      </Link>

      <Link
        href={`/contact?subject=information${propertyParam}`}
        className="flex items-center justify-center rounded-full border border-stone-300 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-stone-900 transition-colors hover:border-amber-500 hover:text-amber-600"
      >
        Contacter l&apos;agence
      </Link>
    </div>
  );
}
