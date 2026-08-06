"use client";

import { cn } from "@/shared/lib/cn";
import { GlassCard } from "./glass-card";
import { SourceBadge, type SourceStatus } from "./source-badge";
import { CHART_INK } from "@/shared/config/chart-palette";

/**
 * Wrapper every chart sits in: title, the chart itself, an optional caveat
 * from the data owner, and the source badge the hackathon spec requires
 * under every figure.
 */
export function ChartFrame({
  title,
  subtitle,
  note,
  sourceId,
  status,
  children,
  className,
  action,
}: {
  title: string;
  subtitle?: string;
  note?: string;
  sourceId: string;
  status?: SourceStatus;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <GlassCard className={cn("p-4", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-foam text-sm font-medium">{title}</h3>
          {subtitle && <p className="text-mist/55 mt-0.5 text-xs">{subtitle}</p>}
        </div>
        {action}
      </div>

      <div className="-mx-1">{children}</div>

      {note && (
        <p className="text-mist/50 mt-3 border-l-2 border-white/10 pl-2.5 text-[11px] leading-snug">
          {note}
        </p>
      )}

      <div className="mt-3 border-t border-white/[0.06] pt-2.5">
        <SourceBadge sourceId={sourceId} status={status} />
      </div>
    </GlassCard>
  );
}

/**
 * Recharts types its tooltip formatter against a union that includes
 * undefined; this wraps a plain number formatter into that shape once so the
 * charts stay readable.
 */
type RechartsFormatter = React.ComponentProps<typeof import("recharts").Tooltip>["formatter"];

export function fmt(render: (value: number) => string): RechartsFormatter {
  return ((value: unknown) => [render(Number(value)), ""]) as RechartsFormatter;
}

/** Same, for charts whose label comes from the whole row rather than one value. */
export function fmtRange<T>(render: (row: T) => string): RechartsFormatter {
  return ((_value: unknown, _name: unknown, item: { payload?: T }) =>
    item?.payload ? [render(item.payload), ""] : null) as RechartsFormatter;
}

/** Shared Recharts tooltip so every chart reads the same. */
export function chartTooltipStyle() {
  return {
    contentStyle: {
      background: "rgba(9,19,28,0.92)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 12,
      backdropFilter: "blur(16px)",
      fontSize: 12,
      padding: "8px 10px",
    },
    labelStyle: { color: CHART_INK.primary, fontWeight: 600, marginBottom: 4 },
    itemStyle: { color: CHART_INK.secondary, padding: 0 },
    cursor: { stroke: "rgba(226,232,240,0.25)", strokeWidth: 1 },
  };
}
