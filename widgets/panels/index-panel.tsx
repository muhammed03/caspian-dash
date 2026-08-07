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
import { byLocale, pick, type Trio } from "@/shared/lib/i18n";
import { COMPONENT_LABELS } from "@/shared/config/eco-index";
import { AXIS_PROPS, CHART_INK, SERIES } from "@/shared/config/chart-palette";
import { ChartFrame, chartTooltipStyle, fmt } from "@/shared/ui/chart-frame";
import { Label, Panel } from "@/shared/ui/primitives";
import { AnimatedNumber } from "@/shared/ui/animated-number";
import { SourceBadge } from "@/shared/ui/source-badge";
import { AiInsightCard } from "@/widgets/ai-insight/ai-insight-card";
import { ecoIndexComponents, ecoIndexScore } from "@/entities/ai-insight/compute";
import { PanelShell, PanelItem } from "./panel-shell";

import availability from "@/data/data-availability.json";
import { useLandIndices } from "@/entities/land/use-land";
import { FIRE_CLASS_TEXT } from "@/shared/lib/land-indices";

function scoreTone(score: number): { color: string; label: Trio } {
  if (score >= 60)
    return { color: SERIES[4], label: { kk: "Қанағаттанарлық", ru: "Удовлетворительно", en: "Fair" } };
  if (score >= 40) return { color: SERIES[2], label: { kk: "Нашар", ru: "Плохо", en: "Poor" } };
  return { color: SERIES[1], label: { kk: "Дағдарыс", ru: "Кризис", en: "Critical" } };
}

export function IndexPanel() {
  const t = useT();
  const locale = useLocale();
  const tip = chartTooltipStyle();

  const score = ecoIndexScore();
  const tone = scoreTone(score);
  const components = ecoIndexComponents().map((c) => ({
    id: c.id,
    name: byLocale(locale, COMPONENT_LABELS[c.id]),
    score: c.score,
    weight: Math.round(c.weight * 100),
  }));

  const countries = [...availability.countries]
    .sort((a, b) => b.score - a.score)
    .map((c) => ({ name: pick(c, "name", locale), score: c.score }));

  return (
    <PanelShell title={t.index.title}>
      <PanelItem>
        <Panel className="p-5">
          <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-ink-2 uppercase">
            <Gauge className="size-3.5" strokeWidth={1.5} />
            {t.home.ecoIndex}
          </div>
          <div className="mt-3 flex items-end gap-3">
            <AnimatedNumber
              value={score}
              className="font-display text-6xl font-semibold tracking-tight"
            />
            <span className="text-ink-2 pb-2 text-lg">/ 100</span>
            <span
              className="mb-2.5 ml-auto rounded-full border px-3 py-1 text-[11px] font-medium"
              style={{ color: tone.color, borderColor: `${tone.color}55`, background: `${tone.color}18` }}
            >
              {byLocale(locale, tone.label)}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-tint">
            <div
              className="h-full rounded-full transition-[width] duration-1000"
              style={{ width: `${score}%`, background: tone.color, boxShadow: `0 0 16px ${tone.color}90` }}
            />
          </div>
          <div className="mt-3 border-t border-rule pt-2.5">
            <SourceBadge sourceId="model" />
          </div>
        </Panel>
      </PanelItem>

      <PanelItem>
        <AiInsightCard module="index" />
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.index.components}
          subtitle={byLocale(locale, {
            kk: "әр құраушы бойынша 0–100",
            ru: "0–100 по каждой компоненте",
            en: "0–100 for each component",
          })}
          note={byLocale(locale, {
            kk: "Қорытынды — құраушылардың салмақталған қосындысы. Салмақтар мен формулалар «Әдістеме» бетінде.",
            ru: "Итог — взвешенная сумма компонент. Веса и формулы приведены на странице «Методика».",
            en: "The total is a weighted sum of the components. Weights and formulas are given on the Methodology page.",
          })}
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
                <span className="text-ink-2 flex-1">{c.name}</span>
                <span className="text-ink-2">
                  {byLocale(locale, { kk: "салмақ", ru: "вес", en: "weight" })} {c.weight}%
                </span>
                <span className="text-ink tabular w-8 text-right font-medium">{c.score}</span>
              </li>
            ))}
          </ul>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <LandBlock />
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.index.dataAvailability}
          subtitle={pick(availability, "scale", locale)}
          note={pick(availability, "satellite_note", locale)}
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
        <Panel className="p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <Database className="text-accent size-4" strokeWidth={1.5} />
            <h3 className="text-ink text-sm font-medium">{t.index.dataAvailability}</h3>
          </div>
          <p className="text-ink-2 text-[11px] leading-snug">{t.index.availabilityNote}</p>
        </Panel>
      </PanelItem>
    </PanelShell>
  );
}

/**
 * The three land indices, shown live. The eco index above scores from the
 * committed snapshot so it works offline; this block says which reading the
 * viewer is actually looking at.
 */
function LandBlock() {
  const t = useT();
  const locale = useLocale();
  const land = useLandIndices(true);

  if (land.isLoading) {
    return (
      <section className="rule-t pt-4">
        <Label>
          {byLocale(locale, { kk: "Жағалау жері", ru: "Земля побережья", en: "Coastal land" })}
        </Label>
        <div className="bg-tint mt-3 h-24 animate-pulse rounded" />
      </section>
    );
  }

  const regions = land.data?.regions ?? [];
  if (!regions.length) return null;

  const worstFire = regions.reduce((a, b) => (a.fire.nesterov > b.fire.nesterov ? a : b));
  const worstNesterov = worstFire.fire.nesterov;
  const worstFireClass = FIRE_CLASS_TEXT[worstFire.fire.class];

  return (
    <ChartFrame
      title={byLocale(locale, {
        kk: "Топырақ, құрғақшылық және өрт қаупі",
        ru: "Почва, засуха и пожарная опасность",
        en: "Soil, drought and fire danger",
      })}
      subtitle={land.data?.live ? "live — Open-Meteo" : t.common.offline}
      howToRead={byLocale(locale, {
        kk: "Жағалаудағы құрлықтың үш көрсеткіші. Өрт қаупі Қазақстанда қабылданған Нестеров индексі бойынша есептеледі. Барлық шкала 0–100, мұнда 100 — қолайлы жағдай.",
        ru: "Три показателя состояния суши у берега. Пожарная опасность считается по индексу Нестерова — методике, принятой в Казахстане. Шкала везде 0–100, где 100 — благополучное состояние.",
        en: "Three indicators of land condition along the shore. Fire danger follows the Nesterov index, the method used in Kazakhstan. Every scale runs 0–100, where 100 is a healthy state.",
      })}
      note={byLocale(locale, {
        kk: `Қазіргі ең жоғары өрт қаупі: ${worstFire.name_kk}, Нестеров индексі ${worstNesterov} — ${worstFireClass.kk}. «Ылғалдылық» көрсеткіші жеңілдетілген: толыққанды SPI отыз жылдық бақылау қатарын талап етеді.`,
        ru: `Наибольшая пожарная опасность сейчас: ${worstFire.name_ru}, индекс Нестерова ${worstNesterov} — ${worstFireClass.ru}. Показатель «увлажнение» — упрощённый: полноценный SPI требует тридцатилетнего ряда наблюдений.`,
        en: `Highest fire danger right now: ${worstFire.name_en}, Nesterov index ${worstNesterov} — ${worstFireClass.en}. The moisture indicator is simplified: a full SPI needs a thirty-year record of observations.`,
      })}
      sourceId="open_meteo"
      status="real"
    >
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-ink-3 rule-b text-left">
            <th className="pb-1.5 font-normal">
              {byLocale(locale, { kk: "Учаске", ru: "Участок", en: "Site" })}
            </th>
            <th className="pb-1.5 text-right font-normal">
              {byLocale(locale, { kk: "Топырақ", ru: "Почва", en: "Soil" })}
            </th>
            <th className="pb-1.5 text-right font-normal">
              {byLocale(locale, { kk: "Ылғал", ru: "Увлажн.", en: "Moist." })}
            </th>
            <th className="pb-1.5 text-right font-normal">
              {byLocale(locale, { kk: "Өрт", ru: "Пожар", en: "Fire" })}
            </th>
          </tr>
        </thead>
        <tbody>
          {regions.map((r) => (
            <tr key={r.id} className="border-rule border-b last:border-0">
              <td className="text-ink-2 py-2 pr-2">{pick(r, "name", locale)}</td>
              <td className="tabular text-ink py-2 text-right">{r.soil.score}</td>
              <td className="tabular text-ink py-2 text-right">{r.drought.score}</td>
              <td className="py-2 text-right">
                <span
                  className={
                    r.fire.class >= 4 ? "text-bad font-medium" : r.fire.class === 3 ? "text-warn" : "text-ink"
                  }
                >
                  {r.fire.score}
                </span>
                <span className="text-ink-3 ml-1">
                  {byLocale(locale, { kk: "кл.", ru: "кл.", en: "cl." })}
                  {r.fire.class}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ChartFrame>
  );
}
