import Link from "next/link";
import clsx from "clsx";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "solid" | "outline" | "ghost";
export type ButtonSize = "default" | "compact";
export type ButtonTone = "onLight" | "onDark";

const SIZE_CLASSES: Record<ButtonVariant, Record<ButtonSize, string>> = {
  solid: { default: "px-8 py-3.5 text-sm", compact: "px-6 py-3 text-sm" },
  outline: { default: "px-8 py-3.5 text-sm", compact: "px-6 py-3 text-sm" },
  ghost: { default: "text-sm", compact: "text-sm" },
};

const OUTLINE_TONE_CLASSES: Record<ButtonTone, string> = {
  onDark: "border-white/30 text-white hover:border-accent hover:text-accent",
  onLight: "border-border text-charcoal hover:border-accent hover:text-accent-strong",
};

function variantClasses(variant: ButtonVariant, tone: ButtonTone) {
  switch (variant) {
    case "solid":
      return "rounded-full bg-accent font-semibold uppercase tracking-wider text-accent-ink transition-transform duration-300 hover:scale-105";
    case "outline":
      return clsx(
        "rounded-full border font-semibold uppercase tracking-wider transition-colors duration-300",
        OUTLINE_TONE_CLASSES[tone]
      );
    case "ghost":
      return "font-medium uppercase tracking-wide text-accent-strong transition-colors hover:text-amber-700";
  }
}

interface SharedProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

// Primitive de bouton unifiée : avant V2.1, chaque CTA du site public
// redéfinissait ses propres classes (rayon, mécanisme de hover, padding)
// pour ce qui est sémantiquement le même rôle. `variant`/`size`/`tone`
// couvrent tous les usages réels identifiés dans l'audit — voir le plan
// V2.1 pour le détail des sites d'appel.
export default function Button({
  variant = "solid",
  size = "default",
  tone = "onDark",
  className,
  children,
  href,
  ...rest
}: ButtonProps) {
  const classes = clsx(
    "inline-flex items-center justify-center gap-2",
    variantClasses(variant, tone),
    SIZE_CLASSES[variant][size],
    className
  );

  if (href !== undefined) {
    return (
      <Link href={href} className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
