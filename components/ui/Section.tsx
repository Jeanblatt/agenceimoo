import type { ElementType, ReactNode } from "react";

export type SectionTone = "light" | "muted" | "dark";
export type SectionSpacing = "default" | "large";

const TONE_CLASSES: Record<SectionTone, string> = {
  light: "bg-surface text-charcoal",
  muted: "bg-surface-muted text-charcoal",
  dark: "bg-ink text-stone-300",
};

const SPACING_CLASSES: Record<SectionSpacing, string> = {
  default: "py-24",
  large: "py-28",
};

interface SectionProps {
  as?: ElementType;
  id?: string;
  tone?: SectionTone;
  spacing?: SectionSpacing;
  className?: string;
  children: ReactNode;
}

// Extraction du rythme vertical "py-24" (py-28 pour la section de clôture)
// commun à toutes les sections publiques, avec le fond clair/sombre associé.
export default function Section({
  as: Tag = "section",
  id,
  tone = "light",
  spacing = "default",
  className,
  children,
}: SectionProps) {
  return (
    <Tag
      id={id}
      className={`${TONE_CLASSES[tone]} ${SPACING_CLASSES[spacing]}${className ? ` ${className}` : ""}`}
    >
      {children}
    </Tag>
  );
}
