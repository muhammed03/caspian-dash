"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { AnimatedNumber } from "./animated-number";
import { GlassCard } from "./glass-card";

type Tone = "neutral" | "good" | "warn" | "bad";

const TONES: Record<Tone, { value: string; glow: string }> = {
  neutral: { value: "text-foam", glow: "from-glow/20" },
  good: { value: "text-alive", glow: "from-alive/20" },
  warn: { value: "text-warn", glow: "from-warn/20" },
  bad: { value: "text-danger", glow: "from-danger/20" },
};

export function MetricCard({
  label,
  value,
  unit,
  decimals = 0,
  delta,
  tone = "neutral",
  icon: Icon,
  footer,
  className,
  size = "md",
}: {
  label: string;
  value: number;
  unit?: string;
  decimals?: number;
  delta?: string;
  tone?: Tone;
  icon?: LucideIcon;
  footer?: React.ReactNode;
  className?: string;
  size?: "md" | "lg";
}) {
  const tones = TONES[tone];

  return (
    <GlassCard className={cn("group p-5", className)}>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-gradient-radial to-transparent opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100",
          tones.glow
        )}
        style={{ background: `radial-gradient(circle, currentColor 0%, transparent 70%)` }}
      />
      <div className="text-mist/70 flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
        {Icon && <Icon className="size-3.5" strokeWidth={1.5} />}
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <AnimatedNumber
          value={value}
          decimals={decimals}
          className={cn(
            "font-display font-semibold tracking-tight",
            size === "lg" ? "text-5xl md:text-6xl" : "text-3xl md:text-4xl",
            tones.value
          )}
        />
        {unit && <span className="text-mist/60 text-sm">{unit}</span>}
      </div>
      {delta && <div className="text-mist/60 mt-1.5 text-xs">{delta}</div>}
      {footer && <div className="mt-3">{footer}</div>}
    </GlassCard>
  );
}
