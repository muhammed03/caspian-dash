"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Gauge, Database } from "lucide-react";

import { useLocale, useT } from "@/shared/lib/i18n/client";
import { AXIS_PROPS, CHART_INK, SERIES } from "@/shared/config/chart-palette";
import { ChartFrame, chartTooltipStyle, fmt } from "@/shared/ui/chart-frame";
import { GlassCard } from "@/shared/ui/glass-card";
import { AnimatedNumber } from "@/shared/ui/animated-number";
import { SourceBadge } from "@/shared/ui/source-badge";
import { AiInsightCard } from "@/widgets/ai-insight/ai-insight-card";
import { ecoIndexComponents, ecoIndexScore } from "@/entities/ai-insight/compute";
import { PanelShell, PanelItem } from "./panel-shell";

import availability from "@/data/data-availability.json";

const COMPONENT_LABELS: Record<string, { kk: string; ru: string }> = {
  water: { kk: "Су айдыны", ru: "Акватория" },
  purity: { kk: "Су тазалығы", ru: "Чистота воды" },
  biodiversity: { kk: "Балық қоры", ru: "Рыбные запасы" },
  seal: { kk: "Итбалық", ru: "Тюлень" },
  transparency: { kk: "Дерек ашықтығы", ru: "Открытость данных" },
};

function scoreTone(score: number) {
  if (score >= 60) return { color: SERIES[4], label: { kk: "Қанағаттанарлық", ru: "Удовлетворительно" } };
  if (score >= 40) return { color: SERIES[2], label: { kk: "Нашар", ru: "Плохо" } };
  return { color: SERIES[1], label: { kk: "Дағдарыс", ru: "Кризис" } };
}

export function IndexPanel() {
  const t = useT();
  const locale = useLocale();
  const tip = chartTooltipStyle();

  const score = ecoIndexScore();
  const tone = scoreTone(score);
  const components = ecoIndexComponents().map((c) => ({
    id: c.id,
    name: COMPONENT_LABELS[c.id][locale === "ru" ? "ru" : "kk"],
    score: c.score,
    weight: Math.round(c.weight * 100),
  }));

  const countries = [...availability.countries]
    .sort((a, b) => b.score - a.score)
    .map((c) => ({ name: locale === "ru" ? c.name_ru : c.name_kk, score: c.score }));

  return (
    <PanelShell title={t.index.title}>
      <PanelItem>
        <GlassCard accent className="p-5">
          <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-mist/70 uppercase">
            <Gauge className="size-3.5" strokeWidth={1.5} />
            {t.home.ecoIndex}
          </div>
          <div className="mt-3 flex items-end gap-3">
            <AnimatedNumber
              value={score}
              className="font-display text-6xl font-semibold tracking-tight"
            />
            <span className="text-mist/50 pb-2 text-lg">/ 100</span>
            <span
              className="mb-2.5 ml-auto rounded-full border px-3 py-1 text-[11px] font-medium"
              style={{ color: tone.color, borderColor: `${tone.color}55`, background: `${tone.color}18` }}
            >
              {tone.label[locale === "ru" ? "ru" : "kk"]}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full transition-[width] duration-1000"
              style={{ width: `${score}%`, background: tone.color, boxShadow: `0 0 16px ${tone.color}90` }}
            />
          </div>
          <div className="mt-3 border-t border-white/[0.06] pt-2.5">
            <SourceBadge sourceId="model" />
          </div>
        </GlassCard>
      </PanelItem>

      <PanelItem>
        <AiInsightCard module="index" />
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.index.components}
          subtitle={locale === "ru" ? "0–100 по каждой компоненте" : "әр құраушы бойынша 0–100"}
          note={
            locale === "ru"
              ? "Итог — взвешенная сумма компонент. Веса и формулы приведены на странице «Методика»."
              : "Қорытынды — құраушылардың салмақталған қосындысы. Салмақтар мен формулалар «Әдістеме» бетінде."
          }
          sourceId="model"
        >
          <ResponsiveContainer width="100%" height={205}>
            <RadarChart data={components} outerRadius="72%">
              <PolarGrid stroke={CHART_INK.grid} />
              <PolarAngleAxis dataKey="name" tick={{ fill: CHART_INK.secondary, fontSize: 10 }} />
              <Radar
                dataKey="score"
                stroke={SERIES[0]}
                strokeWidth={2}
                fill={SERIES[0]}
                fillOpacity={0.22}
              />
              <Tooltip {...tip} formatter={fmt((v) => `${v} / 100`)} />
            </RadarChart>
          </ResponsiveContainer>

          <ul className="mt-1 space-y-1">
            {components.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-[11px]">
                <span className="text-mist/65 flex-1">{c.name}</span>
                <span className="text-mist/40">{locale === "ru" ? "вес" : "салмақ"} {c.weight}%</span>
                <span className="text-foam tabular w-8 text-right font-medium">{c.score}</span>
              </li>
            ))}
          </ul>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.index.dataAvailability}
          subtitle={availability.scale}
          note={locale === "ru" ? availability.satellite_note_ru : availability.satellite_note_kk}
          sourceId="model"
        >
          <ResponsiveContainer width="100%" height={155}>
            <BarChart data={countries} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 4 }} barCategoryGap={8}>
              <CartesianGrid stroke={CHART_INK.grid} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} {...AXIS_PROPS} />
              <YAxis type="category" dataKey="name" {...AXIS_PROPS} width={96} />
              <Tooltip {...tip} formatter={fmt((v) => `${v} / 100`)} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {countries.map((c) => (
                  <Cell key={c.name} fill={c.score >= 60 ? SERIES[4] : c.score >= 30 ? SERIES[2] : SERIES[1]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <GlassCard className="p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <Database className="text-glow size-4" strokeWidth={1.5} />
            <h3 className="text-foam text-sm font-medium">{t.index.dataAvailability}</h3>
          </div>
          <p className="text-mist/65 text-[11px] leading-snug">{t.index.availabilityNote}</p>
        </GlassCard>
      </PanelItem>
    </PanelShell>
  );
}
