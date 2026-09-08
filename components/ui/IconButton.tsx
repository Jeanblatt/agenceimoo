import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type IconButtonSize = "sm" | "lg";

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: "h-11 w-11",
  lg: "h-14 w-14",
};

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: IconButtonSize;
  children: ReactNode;
  "aria-label": string;
}

// Unifie les cercles-icône (favori, partage...) dupliqués avec des classes
// identiques à plusieurs endroits. WhatsAppButton (FAB) réutilise la forme
// via ce composant mais garde sa propre couleur de marque et son animation.
export default function IconButton({ size = "sm", className, children, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        "flex items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md transition-colors hover:bg-white",
        SIZE_CLASSES[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
