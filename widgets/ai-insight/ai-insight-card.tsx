"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Sparkles, TrendingDown, TrendingUp, Minus, AlertTriangle, ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { GlassCard } from "@/shared/ui/glass-card";
import { computeAnalysis } from "@/entities/ai-insight/compute";
import type { InsightModule } from "@/entities/ai-insight/schema";
import { NARRATIVES } from "./narratives";
import type { RiskLevel } from "@/shared/lib/analyze";

const RISK_STYLE: Record<RiskLevel, { text: string; bg: string; border: string }> = {
  low: { text: "text-alive", bg: "bg-alive/10", border: "border-alive/30" },
  medium: { text: "text-warn", bg: "bg-warn/10", border: "border-warn/30" },
  high: { text: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30" },
  critical: { text: "text-danger", bg: "bg-danger/10", border: "border-danger/30" },
};

/** Reveals the summary character by character so the analysis reads as live. */
function useTypewriter(text: string, speed = 12) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text);
      return;
    }
    setShown("");
    let i = 0;
    const timer = setInterval(() => {
      i += 2;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return shown;
}

export function AiInsightCard({ module }: { module: InsightModule }) {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const analysis = useMemo(() => computeAnalysis(module), [module]);
  const narrative = NARRATIVES[module][locale];
  const typed = useTypewriter(narrative.summary);

  const risk = RISK_STYLE[analysis.risk];
  const TrendIcon =
    analysis.trend.direction === "down" ? TrendingDown : analysis.trend.direction === "up" ? TrendingUp : Minus;

  return (
    <GlassCard accent className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-glow inline-flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
          <Sparkles className="size-3.5" strokeWidth={1.75} />
          {t.common.aiLabel}
        </span>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] font-medium",
            risk.text,
            risk.bg,
            risk.border
          )}
        >
          {t.common.riskLevel[analysis.risk]}
        </span>
      </div>

      <p className="text-foam/90 min-h-[3.5rem] text-[13px] leading-relaxed">
        {typed}
        <motion.span
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          className="bg-glow ml-0.5 inline-block h-3.5 w-0.5 align-middle"
        />
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/[0.03] px-3 py-2">
          <div className="text-mist/55 text-[10px] tracking-wide uppercase">
            {locale === "ru" ? "Тренд" : "Тренд"}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[13px]">
            <TrendIcon className={cn("size-3.5", analysis.trend.direction === "down" ? "text-danger" : "text-mist")} />
            <span className="text-foam tabular">{Math.abs(analysis.trend.ratePercent).toFixed(2)}%</span>
            <span className="text-mist/50 text-[11px]">{locale === "ru" ? "в год" : "жылына"}</span>
          </div>
          <div className="text-mist/40 mt-0.5 text-[10px]">{analysis.trend.period}</div>
        </div>

        <div className="rounded-lg bg-white/[0.03] px-3 py-2">
          <div className="text-mist/55 text-[10px] tracking-wide uppercase">{t.water.forecast}</div>
          <div className="text-foam tabular mt-0.5 text-[13px]">
            {analysis.forecast.expectedValue.toLocaleString("ru-RU")}
          </div>
          <div className="text-mist/40 mt-0.5 line-clamp-1 text-[10px]">
            {t.common.confidence[analysis.forecast.confidence]}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-mist/60 hover:text-foam mt-3 flex w-full items-center justify-between text-[11px] transition-colors"
      >
        {locale === "ru" ? "Отклонения и рекомендации" : "Ауытқулар мен ұсыныстар"}
        <ChevronDown className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")} />
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden"
      >
        <div className="space-y-2.5 pt-3">
          <ul className="space-y-1.5">
            {analysis.anomalies.map((a) => (
              <li key={a.metric} className="flex items-start justify-between gap-3 text-[11px]">
                <span className="text-mist/65 min-w-0 flex-1">{a.metric}</span>
                <span className="tabular shrink-0">
                  <span className="text-foam">{a.value.toLocaleString("ru-RU")}</span>
                  <span className="text-mist/40"> / {a.norm.toLocaleString("ru-RU")}</span>
                  <span
                    className={cn(
                      "ml-1.5 font-medium",
                      Math.abs(a.deviationPercent) >= 50 ? "text-danger" : "text-warn"
                    )}
                  >
                    {a.deviationPercent > 0 ? "+" : ""}
                    {a.deviationPercent}%
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <ul className="space-y-1.5 border-t border-white/[0.06] pt-2.5">
            {narrative.recommendations.map((rec) => (
              <li key={rec} className="text-mist/70 flex gap-2 text-[11px] leading-snug">
                <span className="text-glow mt-1.5 size-1 shrink-0 rounded-full bg-current" />
                {rec}
              </li>
            ))}
          </ul>

          <p className="text-mist/45 flex gap-2 border-t border-white/[0.06] pt-2.5 text-[11px] leading-snug">
            <AlertTriangle className="mt-0.5 size-3 shrink-0" />
            {narrative.dataQuality}
          </p>
        </div>
      </motion.div>
    </GlassCard>
  );
}
