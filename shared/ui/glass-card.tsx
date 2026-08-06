"use client";

import { motion } from "motion/react";
import { cn } from "@/shared/lib/cn";
import { fadeUp, viewportOnce } from "@/shared/lib/motion";

/**
 * Card surface. Kept flat on purpose — a hairline border and white paper,
 * no blur and no shadow, so the data inside is the only thing with weight.
 */
type Props = {
  children?: React.ReactNode;
  className?: string;
  /** Marks the primary card on a screen; renders on tinted paper. */
  accent?: boolean;
  /** Skips the scroll-triggered entrance. */
  static?: boolean;
};

export function GlassCard({
  className,
  accent = false,
  static: isStatic = false,
  children,
}: Props) {
  const motionProps = isStatic
    ? {}
    : {
        variants: fadeUp,
        initial: "hidden" as const,
        whileInView: "show" as const,
        viewport: viewportOnce,
      };

  return (
    <motion.div
      {...motionProps}
      className={cn(
        "border-rule rounded-lg border",
        accent ? "bg-tint" : "bg-paper",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
