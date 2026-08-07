"use client";

import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Wind, Factory, Radiation, HeartPulse } from "lucide-react";

import { useLocale, useT } from "@/shared/lib/i18n/client";
import { byLocale, formatNumber, intlTag, pick, type Locale } from "@/shared/lib/i18n";
import { AXIS_PROPS, CHART_INK, SERIES } from "@/shared/config/chart-palette";
import { ChartFrame, chartTooltipStyle, fmt } from "@/shared/ui/chart-frame";
import { MetricCard } from "@/shared/ui/metric-card";
import { Panel } from "@/shared/ui/primitives";
import { SourceBadge } from "@/shared/ui/source-badge";
import { AiInsightCard } from "@/widgets/ai-insight/ai-insight-card";
import { PlumePanel, DriftPanel } from "@/widgets/plume/plume-panel";
import { useAirQuality } from "@/widgets/map/use-map-data";
import { aqiColor } from "@/widgets/map/build-layers";
import { PanelShell, PanelItem } from "./panel-shell";

import pollution from "@/data/pollution.json";
import koshkar from "@/data/koshkar-ata.json";
import factories from "@/data/factories.json";

/** The one list-shaped translation on this panel: `pick` returns a string, these are arrays. */
const KOSHKAR_FACTS: Record<Locale, string[]> = {
  kk: koshkar.facts_kk,
  ru: koshkar.facts_ru,
  en: koshkar.facts_en,
};

export function PollutionPanel() {
  const t = useT();
  const locale = useLocale();
  const tip = chartTooltipStyle();
  const air = useAirQuality(true);

  const structure = pollution.structure.map((s, i) => ({
    name: pick(s, "name", locale),
    value: s.percent,
    fill: SERIES[i % SERIES.length],
  }));

  const purity = pollution.purity_index.map((p) => ({
    name: pick(p, "name", locale),
    value: p.value,
  }));

  const emitters = (factories.features as { properties: Record<string, unknown> }[])
    .map((f) => ({
      name: pick(f.properties, "name", locale),
      value: Number(f.properties.emissions_t),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const readings = air.data?.readings ?? [];
  const worst = readings.filter((r) => r.eaqi !== null).sort((a, b) => (b.eaqi ?? 0) - (a.eaqi ?? 0))[0];

  return (
    <PanelShell title={t.pollution.title}>
      <PanelItem className="grid grid-cols-2 gap-3">
        <MetricCard
          label={t.pollution.aqi}
          value={worst?.eaqi ?? 0}
          tone={(worst?.eaqi ?? 0) > 60 ? "bad" : (worst?.eaqi ?? 0) > 40 ? "warn" : "good"}
          delta={
            worst
              ? `${pick(worst, "name", locale)} · ${
                  air.data?.live ? t.pollution.aqiLive : t.common.offline
                }`
              : t.common.loading
          }
        />
        <MetricCard
          label={t.pollution.purity}
          value={Math.round(purity.reduce((s, p) => s + p.value, 0) / purity.length)}
          unit="%"
          tone="warn"
          delta={byLocale(locale, {
            kk: "секторлар бойынша орташа",
            ru: "среднее по секторам",
            en: "sector average",
          })}
        />
        <MetricCard
          label={t.pollution.koshkarAta}
          value={koshkar.waste_mt}
          unit={byLocale(locale, { kk: "млн т", ru: "млн т", en: "Mt" })}
          tone="bad"
          delta={`${koshkar.radioactive_mt} ${byLocale(locale, {
            kk: "млн т радиоактивті",
            ru: "млн т радиоактивны",
            en: "Mt radioactive",
          })}`}
        />
        <MetricCard
          label={t.pollution.health}
          value={pollution.health.annual_estimate}
          tone="warn"
          delta={`${formatNumber(pollution.health.range[0], locale)}–${formatNumber(
            pollution.health.range[1],
            locale
          )} ${byLocale(locale, { kk: "жылына", ru: "в год", en: "per year, modelled" })}`}
        />
      </PanelItem>

      <PanelItem>
        <AiInsightCard module="pollution" />
      </PanelItem>

      <PanelItem>
        <PlumePanel />
      </PanelItem>

      <PanelItem>
        <DriftPanel />
      </PanelItem>

      {/* live AQI table — the one genuinely real-time part of the platform */}
      <PanelItem>
        <ChartFrame
          title={t.pollution.aqi}
          subtitle={
            air.data?.live
              ? `${t.pollution.aqiLive} · ${
                  air.data.fetched_at ? new Date(air.data.fetched_at).toLocaleString(intlTag(locale)) : ""
                }`
              : t.common.offline
          }
          sourceId="open_meteo_aq"
          status="real"
        >
          {air.isLoading ? (
            <div className="space-y-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-7 animate-pulse rounded bg-tint" />
              ))}
            </div>
          ) : (
            <ul className="space-y-1">
              {readings.map((r) => {
                const [cr, cg, cb] = aqiColor(r.eaqi);
                return (
                  <li
                    key={r.city_id}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-tint"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: `rgb(${cr},${cg},${cb})`, boxShadow: `0 0 8px rgba(${cr},${cg},${cb},0.6)` }}
                    />
                    <span className="text-ink flex-1 truncate">{pick(r, "name", locale)}</span>
                    <span className="text-ink-2 tabular w-14 text-right">
                      PM2.5 {r.pm2_5?.toFixed(0) ?? "—"}
                    </span>
                    <span className="text-ink tabular w-8 text-right font-medium">{r.eaqi ?? "—"}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <ChartFrame title={t.pollution.structure} subtitle="%" sourceId="grid_arendal">
          <div className="flex items-center gap-3">
            <ResponsiveContainer width="45%" height={150}>
              <PieChart>
                <Pie
                  data={structure}
                  dataKey="value"
                  innerRadius={38}
                  outerRadius={62}
                  paddingAngle={2}
                  stroke={CHART_INK.surface}
                  strokeWidth={2}
                >
                  {structure.map((s) => (
                    <Cell key={s.name} fill={s.fill} />
                  ))}
                </Pie>
                <Tooltip {...tip} formatter={fmt((v) => `${v}%`)} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex-1 space-y-1.5">
              {structure.map((s) => (
                <li key={s.name} className="flex items-center gap-2 text-[11px]">
                  <span className="size-2 shrink-0 rounded-sm" style={{ background: s.fill }} />
                  <span className="text-ink-2 flex-1 truncate">{s.name}</span>
                  <span className="text-ink tabular font-medium">{s.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.pollution.purity}
          subtitle={byLocale(locale, {
            kk: "0–100, жоғары — тазарақ",
            ru: "0–100, выше — чище",
            en: "0–100, higher is cleaner",
          })}
          note={pick(pollution, "purity_note", locale)}
          sourceId="model"
        >
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={purity} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 4 }} barCategoryGap={7}>
              <CartesianGrid stroke={CHART_INK.grid} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} {...AXIS_PROPS} />
              <YAxis type="category" dataKey="name" {...AXIS_PROPS} width={110} />
              <Tooltip {...tip} formatter={fmt((v) => `${v} / 100`)} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {purity.map((p) => (
                  <Cell key={p.name} fill={p.value < 55 ? SERIES[1] : p.value < 70 ? SERIES[2] : SERIES[4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <ChartFrame title={t.pollution.factories} subtitle={t.pollution.emissions} sourceId="osm">
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={emitters} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 4 }} barCategoryGap={7}>
              <CartesianGrid stroke={CHART_INK.grid} horizontal={false} />
              <XAxis type="number" {...AXIS_PROPS} />
              <YAxis type="category" dataKey="name" {...AXIS_PROPS} width={124} tick={{ fill: CHART_INK.secondary, fontSize: 10 }} />
              <Tooltip
                {...tip}
                formatter={fmt(
                  (v) =>
                    `${formatNumber(v, locale)} ${byLocale(locale, {
                      kk: "т/жыл",
                      ru: "т/год",
                      en: "t/year",
                    })}`
                )}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={SERIES[1]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <Panel className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Radiation className="text-bad size-4" strokeWidth={1.5} />
            <h3 className="text-ink text-sm font-medium">{pick(koshkar, "name", locale)}</h3>
          </div>
          <ul className="space-y-1.5">
            {KOSHKAR_FACTS[locale].map((fact) => (
              <li key={fact} className="text-ink-2 flex gap-2 text-[11px] leading-snug">
                <span className="bg-bad/10 mt-1.5 size-1 shrink-0 rounded-full" />
                {fact}
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-rule pt-2.5">
            <SourceBadge sourceId="koshkar_pub" />
          </div>
        </Panel>
      </PanelItem>

      <PanelItem>
        <Panel className="p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <HeartPulse className="text-warn size-4" strokeWidth={1.5} />
            <h3 className="text-ink text-sm font-medium">{t.pollution.health}</h3>
          </div>
          <p className="text-ink-2 text-[11px] leading-snug">
            {pick(pollution.health, "method", locale)}
          </p>
          <div className="mt-3 border-t border-rule pt-2.5">
            <SourceBadge sourceId="model" />
          </div>
        </Panel>
      </PanelItem>
    </PanelShell>
  );
}
