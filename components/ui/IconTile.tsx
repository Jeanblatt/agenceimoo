import clsx from "clsx";
import type { ReactNode } from "react";

export type IconTileSize = "sm" | "lg";

const SIZE_CLASSES: Record<IconTileSize, string> = {
  sm: "h-11 w-11",
  lg: "h-14 w-14",
};

interface IconTileProps {
  size?: IconTileSize;
  /** Inverse la couleur au survol du parent — nécessite `group` sur le conteneur hoverable. */
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}

// Badge circulaire icône (fond sombre, icône ambre) répété tel quel dans
// Services, PropertyInfo et PropertyLocation.
export default function IconTile({ size = "sm", interactive = false, className, children }: IconTileProps) {
  return (
    <span
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full bg-ink text-amber-400",
        interactive && "transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-ink",
        SIZE_CLASSES[size],
        className
      )}
    >
      {children}
    </span>
  );
}
