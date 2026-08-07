"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { TrendingDown, TrendingUp, Minus, ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { byLocale, formatFixed, formatNumber, pick, type Locale } from "@/shared/lib/i18n";
import { Label, Plain } from "@/shared/ui/primitives";
import { computeAnalysis, type LabeledAnomaly } from "@/entities/ai-insight/compute";
import { ANOMALY_LABELS, ANOMALY_UNITS } from "@/entities/ai-insight/labels";
import type { InsightModule } from "@/entities/ai-insight/schema";
import { NARRATIVES } from "./narratives";
import type { RiskLevel } from "@/shared/lib/analyze";

const RISK_STYLE: Record<RiskLevel, string> = {
  low: "text-good border-good/40",
  medium: "text-warn border-warn/40",
  high: "text-orange-700 border-orange-500/40",
  critical: "text-bad border-bad/40",
};

/**
 * The engine emits keys; the reader's language is applied here. Metrics that
 * name a place carry the dataset row along, so the region name is read in the
 * same locale as the rest of the label.
 */
function anomalyLabel(a: LabeledAnomaly, locale: Locale): string {
  const trio = ANOMALY_LABELS[a.metric];
  if (!trio) return a.metric;
  const text = byLocale(locale, trio);
  return a.region ? text.replace("{region}", pick(a.region, "name", locale)) : text;
}

/** Reveals the summary as it is written, so the analysis reads as live. */
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

  const forecastUnit = ANOMALY_UNITS[analysis.forecast.unit];
  const unitLabel = forecastUnit ? byLocale(locale, forecastUnit) : analysis.forecast.unit;

  const TrendIcon =
    analysis.trend.direction === "down"
      ? TrendingDown
      : analysis.trend.direction === "up"
        ? TrendingUp
        : Minus;

  return (
    <section className="bg-tint border-rule rounded-lg border p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Label className="text-ink">{t.common.aiLabel}</Label>
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
            RISK_STYLE[analysis.risk]
          )}
        >
          {t.common.riskLevel[analysis.risk]}
        </span>
      </div>

      <p className="text-ink min-h-[4rem] text-[14px] leading-relaxed">
        {typed}
        <motion.span
          animate={{ opacity: [1, 0.15, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          className="bg-ink ml-0.5 inline-block h-3.5 w-0.5 align-middle"
        />
      </p>

      <div className="rule-t mt-4 grid grid-cols-2 gap-6 pt-3">
        <div>
          <Label>{byLocale(locale, { kk: "Тренд", ru: "Тренд", en: "Trend" })}</Label>
          <div className="mt-1 flex items-center gap-1.5">
            <TrendIcon
              className={cn("size-3.5", analysis.trend.direction === "down" ? "text-bad" : "text-ink-2")}
            />
            <span className="tabular text-ink text-sm font-medium">
              {formatFixed(Math.abs(analysis.trend.ratePercent), locale, 2)}%
            </span>
            <span className="text-ink-3 text-[11px]">
              {byLocale(locale, { kk: "жылына", ru: "в год", en: "per year" })}
            </span>
          </div>
          <div className="text-ink-3 mt-0.5 text-[11px]">{analysis.trend.period}</div>
        </div>

        <div>
          <Label>{t.water.forecast}</Label>
          <div className="tabular text-ink mt-1 text-sm font-medium">
            {formatNumber(analysis.forecast.expectedValue, locale)}
          </div>
          <div className="text-ink-3 mt-0.5 line-clamp-1 text-[11px]">
            {unitLabel} · {t.common.confidence[analysis.forecast.confidence]}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-ink-2 hover:text-ink rule-t mt-3 flex w-full items-center justify-between pt-3 text-[12px] transition-colors"
      >
        {byLocale(locale, {
          kk: "Ауытқулар мен ұсыныстар",
          ru: "Отклонения и рекомендации",
          en: "Deviations and recommendations",
        })}
        <ChevronDown className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")} />
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.35 }}
        className="overflow-hidden"
      >
        <div className="space-y-4 pt-4">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-ink-3 rule-b text-left">
                <th className="pb-1.5 font-normal">
                  {byLocale(locale, { kk: "Көрсеткіш", ru: "Показатель", en: "Indicator" })}
                </th>
                <th className="pb-1.5 text-right font-normal">
                  {byLocale(locale, {
                    kk: "нақты / норма",
                    ru: "факт / норма",
                    en: "actual / baseline",
                  })}
                </th>
              </tr>
            </thead>
            <tbody>
              {analysis.anomalies.map((a) => (
                <tr key={a.metric} className="border-rule border-b last:border-0">
                  <td className="text-ink-2 py-2 pr-3">{anomalyLabel(a, locale)}</td>
                  <td className="tabular py-2 text-right whitespace-nowrap">
                    <span className="text-ink">{formatNumber(a.value, locale)}</span>
                    <span className="text-ink-3"> / {formatNumber(a.norm, locale)}</span>
                    <span
                      className={cn(
                        "ml-2 font-medium",
                        Math.abs(a.deviationPercent) >= 50 ? "text-bad" : "text-warn"
                      )}
                    >
                      {a.deviationPercent > 0 ? "+" : ""}
                      {formatNumber(a.deviationPercent, locale, { maximumFractionDigits: 1 })}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="space-y-2">
            {narrative.recommendations.map((rec) => (
              <li key={rec} className="text-ink-2 flex gap-2.5 text-[12px] leading-relaxed">
                <span className="bg-ink-3 mt-[7px] size-1 shrink-0 rounded-full" />
                {rec}
              </li>
            ))}
          </ul>

          <Plain className="rule-t pt-3">{narrative.dataQuality}</Plain>
        </div>
      </motion.div>
    </section>
  );
}
