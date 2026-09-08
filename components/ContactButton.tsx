import Button from "@/components/ui/Button";

interface ContactButtonProps {
  /** Pré-remplit la demande de contact avec le bien concerné. */
  propertyTitle?: string;
}

export default function ContactButton({ propertyTitle }: ContactButtonProps) {
  const propertyParam = propertyTitle
    ? `&property=${encodeURIComponent(propertyTitle)}`
    : "";

  // Sur une fiche bien, "Demander une visite" doit remplir le vrai
  // formulaire (connecté à Supabase, section #planifier-visite plus bas sur
  // la même page) plutôt que le formulaire de contact générique — ce
  // dernier ne propose d'ailleurs plus "Demande de visite" comme sujet,
  // cette action est exclusivement gérée par ce bouton.
  const visitHref = propertyTitle ? "#planifier-visite" : "/contact";

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button href={visitHref} className="flex-1">
        Demander une visite
      </Button>

      <Button
        href={`/contact?subject=information${propertyParam}`}
        variant="outline"
        tone="onLight"
      >
        Contacter l&apos;agence
      </Button>
    </div>
  );
}
