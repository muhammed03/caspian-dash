"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/shared/lib/cn";

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
  separator = " ",
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const raw = useMotionValue(0);
  const spring = useSpring(raw, { stiffness: 70, damping: 24, mass: 1 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) raw.set(value);
  }, [inView, value, raw]);

  useEffect(() => spring.on("change", (v) => setDisplay(v)), [spring]);

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
