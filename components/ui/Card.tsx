import clsx from "clsx";
import type { ElementType, ReactNode } from "react";

export type CardPadding = "sm" | "default" | "lg";
export type CardTone = "surface" | "muted";
export type CardRing = "default" | "subtle";

const PADDING_CLASSES: Record<CardPadding, string> = {
  sm: "p-6",
  default: "p-8",
  lg: "p-10",
};

const TONE_CLASSES: Record<CardTone, string> = {
  surface: "bg-surface",
  muted: "bg-surface-muted",
};

const RING_CLASSES: Record<CardRing, string> = {
  default: "ring-border",
  subtle: "ring-border-subtle",
};

interface CardProps {
  as?: ElementType;
  padding?: CardPadding;
  tone?: CardTone;
  /** Intensité de la bordure : "subtle" (stone-100) pour les cartes au ton aérien (Services, Testimonials, AgentCard), "default" (stone-200) ailleurs. */
  ring?: CardRing;
  /** Ombre au survol (CSS pur). Le lift (translation Y) reste piloté par le composant appelant via framer-motion. */
  hoverShadow?: boolean;
  className?: string;
  children: ReactNode;
}

// Coquille "carte premium" (fond clair, bordure fine, ombre au survol)
// répétée à l'identique dans PropertyCard, Services, PropertyInfo,
// PropertyLocation, Testimonials, AgentCard et les panneaux de succès des
// formulaires. Les composants animés gardent leur propre wrapper
// framer-motion pour le lift/l'entrée — Card ne gère que le style statique.
export default function Card({
  as: Tag = "div",
  padding = "default",
  tone = "surface",
  ring = "default",
  hoverShadow = false,
  className,
  children,
}: CardProps) {
  return (
    <Tag
      className={clsx(
        "rounded-card ring-1",
        RING_CLASSES[ring],
        TONE_CLASSES[tone],
        PADDING_CLASSES[padding],
        hoverShadow && "transition-shadow duration-300 hover:shadow-card-hover",
        className
      )}
    >
      {children}
    </Tag>
  );
}
