"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, animate } from "motion/react";
import { cn } from "@/shared/lib/cn";
import { EASE_FLUID } from "@/shared/lib/motion";

type Props = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** Thousands separator; defaults to a narrow no-break space. */
  separator?: string;
};

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  separator = " ",
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  // no root margin: a negative margin was keeping elements that sit low in
  // the first viewport from ever registering as visible
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    const controls = animate(0, value, {
      duration: 1.6,
      ease: EASE_FLUID,
      onUpdate: setDisplay,
      // guarantees the final value even if the animation is interrupted
      onComplete: () => setDisplay(value),
    });
    return () => controls.stop();
  }, [inView, value]);

  const formatted = display
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, separator);

  return (
    <span ref={ref} className={cn("tabular", className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
