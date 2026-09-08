import type { Transition, Variants } from "framer-motion";

// Constantes d'animation harmonisées : avant V2.1, chaque composant
// redéfinissait ses propres valeurs (duration 0.5 à 0.7, margin -60px à
// -100px, lift -3 à -6...) pour des interactions visuellement censées être
// identiques. Un seul jeu de valeurs canoniques ici.

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const fadeUpTransition: Transition = {
  duration: 0.6,
  ease: "easeOut",
};

// À passer à la prop `viewport` de framer-motion pour les révélations au scroll.
// margin: "0px" (aucun retrait) — un retrait négatif (`-80px`, valeur d'origine)
// réduit la zone de détection de l'IntersectionObserver sur les viewports
// mobiles, où la hauteur visible varie déjà (barre d'adresse qui se
// rétracte/réapparaît au scroll) : combinée à `once: true`, cette réduction
// pouvait empêcher `whileInView` de se déclencher et laisser des blocs entiers
// bloqués à `opacity: 0` sur mobile (Stats, Services, CallToAction, ainsi que
// tout SectionHeading — audit V3.3.Q.1.4, correctif V3.3.Q.1.5). Sans retrait,
// la révélation se déclenche dès que l'élément touche réellement le viewport
// visible, sur tous les écrans.
export const viewportOnce = { once: true, margin: "0px" } as const;

// À passer à `whileHover` sur les cartes.
export const hoverLift = { y: -6 } as const;

// À passer à `whileTap` pour le retour visuel au clic/appui.
export const tapScale = { scale: 0.98 } as const;

// Config ressort du tilt 3D de PropertyCard — interaction unique, pas un
// pattern partagé, mais nommée pour éviter les magic numbers en place.
export const cardTiltSpring = { stiffness: 150, damping: 20, mass: 0.5 } as const;

// Délai de cascade pour l'apparition échelonnée d'une grille de cartes.
export function staggerDelay(index: number, step = 0.06, max = 6) {
  return Math.min(index, max) * step;
}
