"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { pick, pickOrNull } from "@/shared/lib/i18n";
import sourcesFile from "@/data/sources.json";

export type SourceStatus = "real" | "semi" | "mock";

/**
 * Names, licences and attributions are localized where they carry prose;
 * purely nominal ones (brand names, SPDX-style licences) stay as a bare field
 * and `pick` falls through to it.
 */
type Source = {
  id: string;
  name?: string;
  name_kk?: string;
  name_ru?: string;
  name_en?: string;
  url: string;
  license?: string;
  license_kk?: string;
  license_ru?: string;
  license_en?: string;
  attribution?: string;
  attribution_kk?: string;
  attribution_ru?: string;
  attribution_en?: string;
  status: string;
  coverage_years?: string;
  note_kk?: string;
  note_ru?: string;
  note_en?: string;
  last_checked: string;
};

const SOURCES = sourcesFile.sources as Source[];

export function getSource(id: string): Source | undefined {
  return SOURCES.find((s) => s.id === id);
}

const DOT: Record<SourceStatus, string> = {
  real: "bg-good",
  semi: "bg-warn",
  mock: "bg-bad",
};

/**
 * Required under every chart and layer: where the number comes from and how
 * much to trust it. Stated in words, not just a colour.
 */
export function SourceBadge({
  sourceId,
  status,
  className,
}: {
  sourceId: string;
  status?: SourceStatus;
  className?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const source = getSource(sourceId);
  const resolved = (status ?? (source?.status as SourceStatus) ?? "semi") as SourceStatus;
  const label = resolved === "real" ? t.common.real : resolved === "mock" ? t.common.mock : t.common.semi;
  const note = pickOrNull(source, "note", locale);

  return (
    <div className={cn("text-[11px] leading-snug", className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-ink-2 inline-flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", DOT[resolved])} />
          {label}
        </span>
        <span className="text-ink-3">·</span>
        {source ? (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-ink-2 hover:text-ink inline-flex items-center gap-0.5 underline decoration-neutral-300 underline-offset-2 transition-colors hover:decoration-current"
          >
            {pick(source, "name", locale)}
            <ArrowUpRight className="size-3" />
          </a>
        ) : (
          <span className="text-ink-3">{sourceId}</span>
        )}
      </div>
      {note && <p className="text-ink-3 mt-1">{note}</p>}
    </div>
  );
}

/** Loud label for anything the spec classifies as demonstration data. */
export function MockBadge({ className }: { className?: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        "border-bad/40 text-bad inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        className
      )}
    >
      <span className="bg-bad size-1.5 rounded-full" />
      {t.common.mock}
    </span>
  );
}
