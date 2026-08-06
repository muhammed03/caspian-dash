"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/shared/lib/cn";
import { fadeUp, viewportOnce } from "@/shared/lib/motion";

type Props = Omit<HTMLMotionProps<"div">, "children"> & {
  children?: React.ReactNode;
  /** Adds the cyan rim-light used for the primary card on a screen. */
  accent?: boolean;
  /** Skips the scroll-triggered entrance (for cards inside already-animated parents). */
  static?: boolean;
};

export function GlassCard({
  className,
  accent = false,
  static: isStatic = false,
  children,
  ...props
}: Props) {
  const motionProps = isStatic
    ? {}
    : { variants: fadeUp, initial: "hidden" as const, whileInView: "show" as const, viewport: viewportOnce };

  return (
    <motion.div
      {...motionProps}
      {...props}
      className={cn(
        "glass relative overflow-hidden rounded-2xl",
        accent && "ring-glow",
        className
      )}
    >
      {/* top rim light */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />
      {children}
    </motion.div>
  );
}
