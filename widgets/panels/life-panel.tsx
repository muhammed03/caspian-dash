"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Fish, Bird, Sprout, ShieldAlert } from "lucide-react";

import { useLocale, useT } from "@/shared/lib/i18n/client";
import { AXIS_PROPS, CHART_INK, SERIES } from "@/shared/config/chart-palette";
import { ChartFrame, chartTooltipStyle, fmt, fmtRange } from "@/shared/ui/chart-frame";
import { MetricCard } from "@/shared/ui/metric-card";
import { GlassCard } from "@/shared/ui/glass-card";
import { SourceBadge } from "@/shared/ui/source-badge";
import { AiInsightCard } from "@/widgets/ai-insight/ai-insight-card";
import { PanelShell, PanelItem } from "./panel-shell";

import wildlife from "@/data/wildlife.json";

const MONTHS_KK = ["Қаң", "Ақп", "Нау", "Сәу", "Мам", "Мау", "Шіл", "Там", "Қыр", "Қаз", "Қар", "Жел"];
const MONTHS_RU = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

export function LifePanel() {
  const t = useT();
  const locale = useLocale();
  const tip = chartTooltipStyle();

  const seal = wildlife.seal;
  const sturgeon = wildlife.sturgeon;

  /** Estimates disagree fourfold, so the chart shows every source as a range. */
  const estimateRanges = seal.estimates.map((e) => ({
    name: locale === "ru" ? e.source_ru : e.source_kk,
    low: e.low,
    span: e.high - e.low,
    high: e.high,
    year: e.year,
  }));

  const catchData = sturgeon.catch_series.map((r) => ({
    year: r.year,
    tonnes: r.tonnes,
    // The IUU multiplier turns the reported catch into a plausible real range.
    realLow: r.tonnes * sturgeon.iuu_multiplier.min,
    realHigh: r.tonnes * sturgeon.iuu_multiplier.max,
  }));

  const months = locale === "ru" ? MONTHS_RU : MONTHS_KK;
  const greening = wildlife.greening.regions.map((r) => ({
    name: locale === "ru" ? r.name_ru : r.name_kk,
    first: r.series[0].value,
    last: r.series.at(-1)!.value,
    change: r.series.at(-1)!.value - r.series[0].value,
  }));

  return (
    <PanelShell title={t.life.title}>
      <PanelItem className="grid grid-cols-2 gap-3">
        <MetricCard
          label={t.life.seal}
          value={seal.decline_percent}
          unit="%"
          decimals={0}
          tone="bad"
          icon={ShieldAlert}
          delta={locale === "ru" ? "спад с начала XX века" : "XX ғасыр басынан азаю"}
        />
        <MetricCard
          label={t.life.sturgeon}
          value={sturgeon.catch_series.at(-1)!.tonnes}
          unit={locale === "ru" ? "т/год" : "т/жыл"}
          tone="bad"
          icon={Fish}
          delta={`${sturgeon.catch_series[0].tonnes.toLocaleString("ru-RU")} т в ${sturgeon.catch_series[0].year}`}
        />
        <MetricCard
          label={t.life.birds}
          value={wildlife.birds.species.length}
          tone="neutral"
          icon={Bird}
          delta={locale === "ru" ? "ключевых видов в мониторинге" : "мониторингтегі негізгі түрлер"}
        />
        <MetricCard
          label={t.life.greening}
          value={greening[0].last}
          unit="NDVI×100"
          tone="warn"
          icon={Sprout}
          delta={`${greening[0].name}: ${greening[0].change > 0 ? "+" : ""}${greening[0].change} ${
            locale === "ru" ? "с 2015" : "2015 жылдан"
          }`}
        />
      </PanelItem>

      <PanelItem>
        <AiInsightCard module="life" />
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.life.seal}
          subtitle={t.life.sealRange}
          note={locale === "ru" ? seal.note_ru : seal.note_kk}
          sourceId="iucn_seal"
        >
          <ResponsiveContainer width="100%" height={175}>
            <BarChart
              data={estimateRanges}
              layout="vertical"
              margin={{ top: 0, right: 24, bottom: 0, left: 4 }}
              barCategoryGap={9}
            >
              <CartesianGrid stroke={CHART_INK.grid} horizontal={false} />
              <XAxis
                type="number"
                {...AXIS_PROPS}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                {...AXIS_PROPS}
                width={132}
                tick={{ fill: CHART_INK.secondary, fontSize: 9 }}
              />
              <Tooltip
                {...tip}
                formatter={fmtRange<(typeof estimateRanges)[number]>((row) =>
                  `${row.low.toLocaleString("ru-RU")} – ${row.high.toLocaleString("ru-RU")}`
                )}
              />
              {/* invisible offset bar puts the visible span at its true position */}
              <Bar dataKey="low" stackId="range" fill="transparent" />
              <Bar dataKey="span" stackId="range" radius={4} fill={SERIES[0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-mist/50 mt-2 text-[11px]">{t.life.sealStatus}</p>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={locale === "ru" ? "Авиаучёты тюленя" : "Итбалық әуе есептеуі"}
          subtitle={locale === "ru" ? "особей" : "дана"}
          sourceId="ncoc"
        >
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={seal.aerial_counts} margin={{ top: 4, right: 8, bottom: 0, left: -6 }}>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis dataKey="year" {...AXIS_PROPS} />
              <YAxis
                {...AXIS_PROPS}
                width={44}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip {...tip} formatter={fmt((v) => v.toLocaleString("ru-RU"))} />
              <Line type="monotone" dataKey="count" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 3, fill: SERIES[0] }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.life.sturgeon}
          subtitle={locale === "ru" ? "вылов, тонн в год (лог. шкала)" : "аулау, жылына тонна (лог. шкала)"}
          note={locale === "ru" ? sturgeon.note_ru : sturgeon.note_kk}
          sourceId="cites_fao"
        >
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={catchData} margin={{ top: 4, right: 8, bottom: 0, left: -6 }}>
              <defs>
                <linearGradient id="iuuBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES[2]} stopOpacity={0.24} />
                  <stop offset="100%" stopColor={SERIES[2]} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis dataKey="year" {...AXIS_PROPS} />
              <YAxis
                {...AXIS_PROPS}
                scale="log"
                domain={[50, 400_000]}
                width={48}
                tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))}
              />
              <Tooltip {...tip} formatter={fmt((v) => `${Math.round(v).toLocaleString("ru-RU")} т`)} />
              <Area
                type="monotone"
                dataKey="realHigh"
                stroke="none"
                fill="url(#iuuBand)"
                name={locale === "ru" ? "с учётом IUU (макс.)" : "IUU ескергенде (макс.)"}
              />
              <Area
                type="monotone"
                dataKey="tonnes"
                stroke={SERIES[1]}
                strokeWidth={2}
                fill="none"
                dot={false}
                name={locale === "ru" ? "Официальный вылов" : "Ресми аулау"}
              />
            </AreaChart>
          </ResponsiveContainer>
          <ul className="text-mist/60 mt-2 flex flex-wrap gap-x-4 text-[11px]">
            <li className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded" style={{ background: SERIES[1] }} />
              {locale === "ru" ? "Официальный вылов" : "Ресми аулау"}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-sm" style={{ background: `${SERIES[2]}44` }} />
              {locale === "ru" ? "Оценка с учётом IUU (×4–10)" : "IUU ескергендегі баға (×4–10)"}
            </li>
          </ul>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <GlassCard className="p-4">
          <div className="mb-2.5 flex items-center gap-2">
            <Bird className="text-alive size-4" strokeWidth={1.5} />
            <h3 className="text-foam text-sm font-medium">{t.life.birds}</h3>
          </div>
          <ul className="space-y-2.5">
            {wildlife.birds.species.map((sp) => {
              const arrive = sp.arrive_month - 1;
              const depart = sp.depart_month - 1;
              const present = (m: number) =>
                arrive <= depart ? m >= arrive && m <= depart : m >= arrive || m <= depart;
              return (
                <li key={sp.id}>
                  <div className="text-mist/75 mb-1 text-[11px]">
                    {locale === "ru" ? sp.name_ru : sp.name_kk}
                  </div>
                  <div className="flex gap-0.5">
                    {months.map((m, i) => (
                      <span
                        key={m}
                        title={m}
                        className="h-4 flex-1 rounded-[2px] transition-colors"
                        style={{
                          background: present(i) ? SERIES[4] : "rgba(226,232,240,0.06)",
                        }}
                      />
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="text-mist/40 mt-1.5 flex justify-between text-[9px]">
            {months.map((m) => (
              <span key={m}>{m[0]}</span>
            ))}
          </div>
          <div className="mt-3 border-t border-white/[0.06] pt-2.5">
            <SourceBadge sourceId="gbif" status="real" />
          </div>
        </GlassCard>
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.life.greening}
          subtitle={wildlife.greening.unit}
          sourceId="jrc_gsw"
        >
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={greening} margin={{ top: 4, right: 8, bottom: 0, left: -14 }} barCategoryGap={12}>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis dataKey="name" {...AXIS_PROPS} interval={0} tick={{ fill: CHART_INK.secondary, fontSize: 9 }} />
              <YAxis {...AXIS_PROPS} width={34} />
              <Tooltip {...tip} />
              <Bar dataKey="first" fill="rgba(226,232,240,0.16)" radius={[3, 3, 0, 0]} name="2015" />
              <Bar dataKey="last" radius={[3, 3, 0, 0]} name="2024">
                {greening.map((g) => (
                  <Cell key={g.name} fill={g.change < 0 ? SERIES[1] : SERIES[4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </PanelItem>
    </PanelShell>
  );
}
