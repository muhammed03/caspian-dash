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
import { byLocale, formatNumber, pick, type Locale } from "@/shared/lib/i18n";
import { AXIS_PROPS, CHART_INK, SERIES } from "@/shared/config/chart-palette";
import { ChartFrame, chartTooltipStyle, fmt, fmtRange } from "@/shared/ui/chart-frame";
import { MetricCard } from "@/shared/ui/metric-card";
import { Panel } from "@/shared/ui/primitives";
import { SourceBadge } from "@/shared/ui/source-badge";
import { AiInsightCard } from "@/widgets/ai-insight/ai-insight-card";
import { PanelShell, PanelItem } from "./panel-shell";

import wildlife from "@/data/wildlife.json";

/** Three-letter month labels; only the first character is shown on the axis strip. */
const MONTHS: Record<Locale, string[]> = {
  kk: ["Қаң", "Ақп", "Нау", "Сәу", "Мам", "Мау", "Шіл", "Там", "Қыр", "Қаз", "Қар", "Жел"],
  ru: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

export function LifePanel() {
  const t = useT();
  const locale = useLocale();
  const tip = chartTooltipStyle();

  const seal = wildlife.seal;
  const sturgeon = wildlife.sturgeon;

  const unitTonnes = byLocale(locale, { kk: "т", ru: "т", en: "t" });
  const labelReportedCatch = byLocale(locale, {
    kk: "Ресми аулау",
    ru: "Официальный вылов",
    en: "Reported catch",
  });

  /** Estimates disagree fourfold, so the chart shows every source as a range. */
  const estimateRanges = seal.estimates.map((e) => ({
    name: pick(e, "source", locale),
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

  const firstCatch = sturgeon.catch_series[0];
  const firstCatchLabel = `${formatNumber(firstCatch.tonnes, locale)} ${byLocale(locale, {
    kk: "т в",
    ru: "т в",
    en: "t in",
  })} ${firstCatch.year}`;

  const months = MONTHS[locale];
  const greening = wildlife.greening.regions.map((r) => ({
    name: pick(r, "name", locale),
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
          delta={byLocale(locale, {
            kk: "XX ғасыр басынан азаю",
            ru: "спад с начала XX века",
            en: "decline since the early 20th century",
          })}
        />
        <MetricCard
          label={t.life.sturgeon}
          value={sturgeon.catch_series.at(-1)!.tonnes}
          unit={byLocale(locale, { kk: "т/жыл", ru: "т/год", en: "t/year" })}
          tone="bad"
          delta={firstCatchLabel}
        />
        <MetricCard
          label={t.life.birds}
          value={wildlife.birds.species.length}
          tone="neutral"
          delta={byLocale(locale, {
            kk: "мониторингтегі негізгі түрлер",
            ru: "ключевых видов в мониторинге",
            en: "key species monitored",
          })}
        />
        <MetricCard
          label={t.life.greening}
          value={greening[0].last}
          unit="NDVI×100"
          tone="warn"
          delta={`${greening[0].name}: ${greening[0].change > 0 ? "+" : ""}${greening[0].change} ${byLocale(
            locale,
            { kk: "2015 жылдан", ru: "с 2015", en: "since 2015" }
          )}`}
        />
      </PanelItem>

      <PanelItem>
        <AiInsightCard module="life" />
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.life.seal}
          subtitle={t.life.sealRange}
          note={pick(seal, "note", locale)}
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
                  `${formatNumber(row.low, locale)} – ${formatNumber(row.high, locale)}`
                )}
              />
              {/* invisible offset bar puts the visible span at its true position */}
              <Bar dataKey="low" stackId="range" fill="transparent" />
              <Bar dataKey="span" stackId="range" radius={4} fill={SERIES[0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-ink-2 mt-2 text-[11px]">{t.life.sealStatus}</p>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={byLocale(locale, {
            kk: "Итбалық әуе есептеуі",
            ru: "Авиаучёты тюленя",
            en: "Seal aerial surveys",
          })}
          subtitle={byLocale(locale, { kk: "дана", ru: "особей", en: "individuals" })}
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
              <Tooltip {...tip} formatter={fmt((v) => formatNumber(v, locale))} />
              <Line type="monotone" dataKey="count" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 3, fill: SERIES[0] }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.life.sturgeon}
          subtitle={byLocale(locale, {
            kk: "аулау, жылына тонна (лог. шкала)",
            ru: "вылов, тонн в год (лог. шкала)",
            en: "catch, tonnes per year (log scale)",
          })}
          note={pick(sturgeon, "note", locale)}
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
              <Tooltip
                {...tip}
                formatter={fmt((v) => `${formatNumber(Math.round(v), locale)} ${unitTonnes}`)}
              />
              <Area
                type="monotone"
                dataKey="realHigh"
                stroke="none"
                fill="url(#iuuBand)"
                name={byLocale(locale, {
                  kk: "IUU ескергенде (макс.)",
                  ru: "с учётом IUU (макс.)",
                  en: "incl. IUU (max)",
                })}
              />
              <Area
                type="monotone"
                dataKey="tonnes"
                stroke={SERIES[1]}
                strokeWidth={2}
                fill="none"
                dot={false}
                name={labelReportedCatch}
              />
            </AreaChart>
          </ResponsiveContainer>
          <ul className="text-ink-2 mt-2 flex flex-wrap gap-x-4 text-[11px]">
            <li className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded" style={{ background: SERIES[1] }} />
              {labelReportedCatch}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-sm" style={{ background: `${SERIES[2]}44` }} />
              {byLocale(locale, {
                kk: "IUU ескергендегі баға (×4–10)",
                ru: "Оценка с учётом IUU (×4–10)",
                en: "Estimate incl. IUU (×4–10)",
              })}
            </li>
          </ul>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <Panel className="p-4">
          <div className="mb-2.5 flex items-center gap-2">
            <Bird className="text-good size-4" strokeWidth={1.5} />
            <h3 className="text-ink text-sm font-medium">{t.life.birds}</h3>
          </div>
          <ul className="space-y-2.5">
            {wildlife.birds.species.map((sp) => {
              const arrive = sp.arrive_month - 1;
              const depart = sp.depart_month - 1;
              const present = (m: number) =>
                arrive <= depart ? m >= arrive && m <= depart : m >= arrive || m <= depart;
              return (
                <li key={sp.id}>
                  <div className="text-ink-2 mb-1 text-[11px]">{pick(sp, "name", locale)}</div>
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
          <div className="text-ink-2 mt-1.5 flex justify-between text-[9px]">
            {months.map((m) => (
              <span key={m}>{m[0]}</span>
            ))}
          </div>
          <div className="mt-3 border-t border-rule pt-2.5">
            <SourceBadge sourceId="gbif" status="real" />
          </div>
        </Panel>
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.life.greening}
          subtitle={pick(wildlife.greening, "unit", locale)}
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
