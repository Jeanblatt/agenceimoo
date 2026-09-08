import clsx from "clsx";

export type GlowBackdropPosition = "center" | "top";

const GRADIENTS: Record<GlowBackdropPosition, string> = {
  center: "radial-gradient(circle at center, rgba(217,180,105,0.14), transparent 65%)",
  top: "radial-gradient(circle at top, rgba(217,180,105,0.14), transparent 60%)",
};

interface GlowBackdropProps {
  position?: GlowBackdropPosition;
  className?: string;
}

// Halo ambre en radial-gradient, dupliqué avec des opacités légèrement
// différentes (0.12/0.14/0.16) dans CallToAction, Stats et PropertyHero —
// une seule valeur canonique ici.
export default function GlowBackdrop({ position = "center", className }: GlowBackdropProps) {
  return (
    <div
      aria-hidden
      className={clsx("pointer-events-none absolute inset-0", className)}
      style={{ backgroundImage: GRADIENTS[position] }}
    />
  );
}
