import type { ReactNode } from "react";

const SIZE_CLASSES = {
  "7xl": "max-w-7xl",
  "6xl": "max-w-6xl",
  "3xl": "max-w-3xl",
  "2xl": "max-w-2xl",
  xl: "max-w-xl",
} as const;

export type ContainerSize = keyof typeof SIZE_CLASSES;

interface ContainerProps {
  size?: ContainerSize;
  className?: string;
  children: ReactNode;
}

// Extraction du rythme "mx-auto max-w-{X} px-6 lg:px-8" répété sur toutes
// les sections publiques du site.
export default function Container({ size = "7xl", className, children }: ContainerProps) {
  return (
    <div className={`mx-auto ${SIZE_CLASSES[size]} px-6 lg:px-8${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
