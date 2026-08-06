"use client";

import { cn } from "@/shared/lib/cn";
import { SourceBadge, type SourceStatus } from "./source-badge";
import { Label, Plain } from "./primitives";
import { CHART_INK } from "@/shared/config/chart-palette";

/**
 * Every chart sits in this frame: a title, a plain sentence saying how to read
 * it, the chart, any caveat from the data owner, and the source. Same order
 * every time, so the page is learnable after the first chart.
 */
export function ChartFrame({
  title,
  subtitle,
  howToRead,
  note,
  sourceId,
  status,
  children,
  className,
  action,
}: {
  title: string;
  subtitle?: string;
  /** One sentence: what the reader is looking at. */
  howToRead?: string;
  note?: string;
  sourceId: string;
  status?: SourceStatus;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("rule-t pt-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-ink text-[15px] font-semibold tracking-tight">{title}</h3>
          {subtitle && <Label className="mt-1">{subtitle}</Label>}
        </div>
        {action}
      </div>

      {howToRead && <Plain className="mt-2">{howToRead}</Plain>}

      <div className="-mx-1 mt-4">{children}</div>

      {note && (
        <p className="text-ink-2 border-rule mt-3 border-l-2 pl-3 text-[12px] leading-relaxed">
          {note}
        </p>
      )}

      <div className="mt-3">
        <SourceBadge sourceId={sourceId} status={status} />
      </div>
    </section>
  );
}

type RechartsFormatter = React.ComponentProps<typeof import("recharts").Tooltip>["formatter"];

export function fmt(render: (value: number) => string): RechartsFormatter {
  return ((value: unknown) => [render(Number(value)), ""]) as RechartsFormatter;
}

/** Same, for charts whose label comes from the whole row rather than one value. */
export function fmtRange<T>(render: (row: T) => string): RechartsFormatter {
  return ((_value: unknown, _name: unknown, item: { payload?: T }) =>
    item?.payload ? [render(item.payload), ""] : null) as RechartsFormatter;
}

export function chartTooltipStyle() {
  return {
    contentStyle: {
      background: CHART_INK.surface,
      border: "1px solid #e6e6e3",
      borderRadius: 8,
      fontSize: 12,
      padding: "8px 10px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    },
    labelStyle: { color: CHART_INK.primary, fontWeight: 600, marginBottom: 4 },
    itemStyle: { color: CHART_INK.secondary, padding: 0 },
    cursor: { stroke: "#c9c9c5", strokeWidth: 1 },
  };
}
