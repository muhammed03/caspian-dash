"use client";

import { ExternalLink, ShieldCheck, FileText, FlaskConical } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import sourcesFile from "@/data/sources.json";

export type SourceStatus = "real" | "semi" | "mock";

type Source = {
  id: string;
  name: string;
  url: string;
  license: string;
  attribution: string;
  status: string;
  coverage_years?: string;
  note_kk?: string;
  note_ru?: string;
  last_checked: string;
};

const SOURCES = sourcesFile.sources as Source[];

export function getSource(id: string): Source | undefined {
  return SOURCES.find((s) => s.id === id);
}

const STYLES: Record<SourceStatus, { dot: string; text: string; Icon: typeof ShieldCheck }> = {
  real: { dot: "bg-alive", text: "text-alive/90", Icon: ShieldCheck },
  semi: { dot: "bg-warn", text: "text-warn/90", Icon: FileText },
  mock: { dot: "bg-danger", text: "text-danger/90", Icon: FlaskConical },
};

/**
 * Required under every chart and layer by the hackathon spec: where the number
 * comes from and how much to trust it.
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
  const style = STYLES[resolved] ?? STYLES.semi;
  const label = resolved === "real" ? t.common.real : resolved === "mock" ? t.common.mock : t.common.semi;
  const note = locale === "ru" ? source?.note_ru : source?.note_kk;

  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-tight", className)}>
      <span className={cn("inline-flex items-center gap-1.5", style.text)}>
        <span className={cn("size-1.5 rounded-full", style.dot)} />
        {label}
      </span>
      <span className="text-mist/40">·</span>
      {source ? (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer noopener"
          className="text-mist/70 hover:text-glow inline-flex items-center gap-1 transition-colors"
        >
          {source.name}
          <ExternalLink className="size-3" />
        </a>
      ) : (
        <span className="text-mist/60">{sourceId}</span>
      )}
      {note && <span className="text-mist/45 basis-full">{note}</span>}
    </div>
  );
}

/** Loud label for anything the spec classifies as demonstration data. */
export function MockBadge({ className }: { className?: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        "border-danger/40 bg-danger/10 text-danger inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        className
      )}
    >
      <FlaskConical className="size-3" />
      {t.common.mock}
    </span>
  );
}
