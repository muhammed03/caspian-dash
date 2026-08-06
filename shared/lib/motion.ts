import type { Variants, Transition } from "motion/react";

/** Every entrance in the product uses one of these, so the site breathes in sync. */
export const EASE_FLUID = [0.22, 1, 0.36, 1] as const;
export const EASE_SNAP = [0.16, 1, 0.3, 1] as const;

export const springSoft: Transition = { type: "spring", stiffness: 180, damping: 26, mass: 0.9 };
export const springSnappy: Transition = { type: "spring", stiffness: 420, damping: 32 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_FLUID } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.9, ease: EASE_FLUID } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE_FLUID } },
};

export const revealMask: Variants = {
  hidden: { opacity: 0, clipPath: "inset(0 0 100% 0)" },
  show: {
    opacity: 1,
    clipPath: "inset(0 0 0% 0)",
    transition: { duration: 1.1, ease: EASE_FLUID },
  },
};

/** Parent that releases its children one after another. */
export function stagger(delayChildren = 0, staggerChildren = 0.08): Variants {
  return {
    hidden: {},
    show: { transition: { delayChildren, staggerChildren } },
  };
}

export const viewportOnce = { once: true, margin: "-12% 0px -12% 0px" } as const;
