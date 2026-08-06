"use client";

import { cn } from "@/shared/lib/cn";
import { AnimatedNumber } from "./animated-number";
import { Label, Plain } from "./primitives";

type Tone = "neutral" | "good" | "warn" | "bad";

const TONES: Record<Tone, string> = {
  neutral: "text-ink",
  good: "text-good",
  warn: "text-warn",
  bad: "text-bad",
};

/**
 * One number, told properly: what it is, the figure itself, and a sentence in
 * plain words explaining what it means. The explanation is not optional —
 * a number without it is just a number.
 */
export function MetricCard({
  label,
  value,
  unit,
  decimals = 0,
  delta,
  plain,
  tone = "neutral",
  className,
  size = "md",
}: {
  label: string;
  value: number;
  unit?: string;
  decimals?: number;
  delta?: string;
  /** Plain-language sentence: what this number means for a normal person. */
  plain?: string;
  tone?: Tone;
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <div className={cn("rule-t pt-4", className)}>
      <Label>{label}</Label>
      <div className="mt-2 flex items-baseline gap-1.5">
        <AnimatedNumber
          value={value}
          decimals={decimals}
          className={cn(
            "display",
            size === "lg" ? "text-5xl md:text-6xl" : "text-3xl md:text-4xl",
            TONES[tone]
          )}
        />
        {unit && <span className="text-ink-3 text-sm">{unit}</span>}
      </div>
      {delta && <div className="text-ink-2 mt-1.5 text-xs">{delta}</div>}
      {plain && <Plain className="mt-2">{plain}</Plain>}
    </div>
  );
}
