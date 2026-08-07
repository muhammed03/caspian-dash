"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Droplets, Ruler, Waves, TrendingDown } from "lucide-react";

import { useLocale, useT } from "@/shared/lib/i18n/client";
import { byLocale, formatFixed, formatNumber, pick } from "@/shared/lib/i18n";
import { useMapStore } from "@/shared/store/map-store";
import { buildForecast } from "@/shared/lib/forecast";
import { AXIS_PROPS, CHART_INK, SERIES } from "@/shared/config/chart-palette";
import { ChartFrame, chartTooltipStyle, fmt } from "@/shared/ui/chart-frame";
import { MetricCard } from "@/shared/ui/metric-card";
import { AiInsightCard } from "@/widgets/ai-insight/ai-insight-card";
import { PanelShell, PanelItem } from "./panel-shell";

import seaLevel from "@/data/sea-level.json";
import coastlineIndex from "@/data/coastline-index.json";
import rivers from "@/data/rivers.json";
import consumption from "@/data/water-consumption.json";
import waterBalance from "@/data/water-balance.json";

type LevelRow = { year: number; level_m: number; area_km2: number; volume_km3: number };
const SERIES_DATA = seaLevel.series as LevelRow[];

export function WaterPanel() {
  const t = useT();
  const locale = useLocale();
  const year = useMapStore((s) => s.year);
  const tip = chartTooltipStyle();

  const current = SERIES_DATA.at(-1)!;
  const first = SERIES_DATA[0];

  /** Units read as text, so they need a translation like any other label. */
  const unit = {
    m: byLocale(locale, { kk: "м", ru: "м", en: "m" }),
    km: byLocale(locale, { kk: "км", ru: "км", en: "km" }),
    km2: byLocale(locale, { kk: "км²", ru: "км²", en: "km²" }),
    km3: byLocale(locale, { kk: "км³", ru: "км³", en: "km³" }),
    cmPerYear: byLocale(locale, { kk: "см/жыл", ru: "см/год", en: "cm/year" }),
    km3PerYear: byLocale(locale, { kk: "км³/жыл", ru: "км³/год", en: "km³/year" }),
  };

  /** Fit on 2015→ because that is where the acceleration starts. */
  const forecast = useMemo(
    () =>
      buildForecast(
        SERIES_DATA.map((r) => ({ year: r.year, value: r.level_m })),
        { fitFrom: 2015, horizon: 10 }
      ),
    []
  );

  const ratePerYear = forecast.linear.slope * 100; // cm/yr
  const level2035 = forecast.points.at(-1)!;
  const coastYear = coastlineIndex.years.find((y) => y.year === year);
  const maxRetreatKm = (coastYear?.max_retreat_m ?? 0) / 1000;

  const riverData = rivers.rivers.map((r) => ({
    name: pick(r, "name", locale),
    current: r.current,
    historic: r.historic_1930,
    lost: Number((r.historic_1930 - r.current).toFixed(1)),
  }));

  const consumptionData = consumption.countries
    .map((c) => ({
      name: pick(c, "name", locale),
      withdrawal: c.withdrawal,
      irrigation: Math.round((c.withdrawal * c.irrigation_percent) / 100),
      share: c.basin_share_percent,
    }))
    .sort((a, b) => b.withdrawal - a.withdrawal);

  return (
    <PanelShell title={t.water.title}>
      <PanelItem className="grid grid-cols-2 gap-3">
        <MetricCard
          label={t.water.seaLevel.split("(")[0].trim()}
          value={current.level_m}
          decimals={2}
          unit={unit.m}
          tone="bad"
          delta={byLocale(locale, {
            kk: `${formatFixed(current.level_m - first.level_m, locale, 2)} м, ${first.year} жылдан бері`,
            ru: `${formatFixed(current.level_m - first.level_m, locale, 2)} м с ${first.year}`,
            en: `${formatFixed(current.level_m - first.level_m, locale, 2)} m since ${first.year}`,
          })}
        />
        <MetricCard
          label={t.home.metricRate}
          value={Math.abs(ratePerYear)}
          decimals={1}
          unit={unit.cmPerYear}
          tone="bad"
          delta={`R² = ${formatFixed(forecast.linear.r2, locale, 2)}`}
        />
        <MetricCard
          label={t.water.area}
          value={current.area_km2}
          unit={unit.km2}
          tone="warn"
          delta={`−${formatNumber(first.area_km2 - current.area_km2, locale)} ${unit.km2}`}
        />
        <MetricCard
          label={t.water.retreat}
          value={maxRetreatKm}
          decimals={1}
          unit={unit.km}
          tone="warn"
          delta={`${year} · ${byLocale(locale, {
            kk: "секторлар бойынша макс.",
            ru: "макс. по секторам",
            en: "max across sectors",
          })}`}
        />
      </PanelItem>

      <PanelItem>
        <AiInsightCard module="water" />
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.water.levelChart}
          subtitle={`${t.water.forecast} → ${level2035.year}`}
          note={pick(waterBalance, "note", locale)}
          sourceId="grealm"
        >
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={forecast.points} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES[2]} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={SERIES[2]} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis dataKey="year" {...AXIS_PROPS} interval="preserveStartEnd" minTickGap={28} />
              <YAxis
                {...AXIS_PROPS}
                domain={["dataMin - 0.3", "dataMax + 0.3"]}
                width={54}
                tickFormatter={(v: number) => v.toFixed(1)}
              />
              <Tooltip {...tip} formatter={fmt((v) => `${formatFixed(v, locale, 2)} ${unit.m}`)} />
              <ReferenceLine
                y={-29}
                stroke={CHART_INK.muted}
                strokeDasharray="4 4"
                label={{
                  value: byLocale(locale, {
                    kk: "тарихи минимум",
                    ru: "истор. минимум",
                    en: "historic minimum",
                  }),
                  fill: CHART_INK.muted,
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="url(#bandGrad)"
                isAnimationActive={false}
              />
              <Area type="monotone" dataKey="lower" stroke="none" fill={CHART_INK.surface} isAnimationActive={false} />
              <Area
                type="monotone"
                dataKey="observed"
                stroke={SERIES[0]}
                strokeWidth={2}
                fill="none"
                dot={false}
                name={byLocale(locale, { kk: "Бақылау", ru: "Наблюдения", en: "Observed" })}
              />
              <Area
                type="monotone"
                dataKey="linear"
                stroke={SERIES[2]}
                strokeWidth={2}
                strokeDasharray="5 4"
                fill="none"
                dot={false}
                name={byLocale(locale, {
                  kk: "Сызықтық болжам",
                  ru: "Линейный прогноз",
                  en: "Linear forecast",
                })}
              />
              <Area
                type="monotone"
                dataKey="exponential"
                stroke={SERIES[1]}
                strokeWidth={1.5}
                strokeDasharray="2 4"
                fill="none"
                dot={false}
                name={byLocale(locale, {
                  kk: "Экспоненциалды",
                  ru: "Экспоненциальный",
                  en: "Exponential",
                })}
              />
            </AreaChart>
          </ResponsiveContainer>

          <ul className="text-ink-2 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
            <li className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded" style={{ background: SERIES[0] }} />
              {byLocale(locale, { kk: "Бақылау", ru: "Наблюдения", en: "Observed" })}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded" style={{ background: SERIES[2] }} />
              {byLocale(locale, { kk: "Сызықтық", ru: "Линейный", en: "Linear" })}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded" style={{ background: SERIES[1] }} />
              {byLocale(locale, { kk: "Экспоненциалды", ru: "Экспоненциальный", en: "Exponential" })}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-sm" style={{ background: `${SERIES[2]}44` }} />
              95% CI
            </li>
          </ul>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.water.volume}
          subtitle={unit.km3}
          sourceId="grealm"
        >
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={SERIES_DATA} margin={{ top: 4, right: 8, bottom: 0, left: -14 }}>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis dataKey="year" {...AXIS_PROPS} interval="preserveStartEnd" minTickGap={30} />
              <YAxis {...AXIS_PROPS} domain={["dataMin - 100", "dataMax + 100"]} width={54} />
              <Tooltip {...tip} formatter={fmt((v) => `${formatNumber(v, locale)} ${unit.km3}`)} />
              <Line
                type="monotone"
                dataKey="volume_km3"
                stroke={SERIES[0]}
                strokeWidth={2}
                dot={false}
                name={t.water.volume}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.water.rivers}
          subtitle={t.water.riverInflow}
          note={byLocale(locale, {
            kk: "Бағанның сұр бөлігі — 1930 жылдардан бері жоғалған ағын.",
            ru: "Серая часть столбца — сток, потерянный с 1930-х годов.",
            en: "The grey part of each bar is the inflow lost since the 1930s.",
          })}
          sourceId="grid_arendal"
        >
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={riverData} margin={{ top: 4, right: 8, bottom: 0, left: -14 }} barCategoryGap={10}>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis dataKey="name" {...AXIS_PROPS} interval={0} angle={-18} textAnchor="end" height={46} />
              <YAxis {...AXIS_PROPS} width={40} />
              <Tooltip {...tip} formatter={fmt((v) => `${formatNumber(v, locale)} ${unit.km3PerYear}`)} />
              <Bar
                dataKey="current"
                stackId="flow"
                fill={SERIES[0]}
                radius={[0, 0, 4, 4]}
                name={byLocale(locale, { kk: "Қазір", ru: "Сейчас", en: "Now" })}
              />
              <Bar
                dataKey="lost"
                stackId="flow"
                fill="rgba(226,232,240,0.16)"
                radius={[4, 4, 0, 0]}
                name={byLocale(locale, { kk: "Жоғалған", ru: "Потеряно", en: "Lost" })}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.water.consumption}
          subtitle={pick(consumption, "unit", locale)}
          note={byLocale(locale, {
            // The Russian text named only Iran, and found it by array position
            // so reordering the dataset would have mislabelled it. Two profiles
            // here are stale, not one; all three locales now say the same thing.
            kk: "AQUASTAT профильдері ескірген (Иран — 2008, Түрікменстан — 2012).",
            ru: "Профили AQUASTAT устарели (Иран — 2008, Туркменистан — 2012).",
            en: "The AQUASTAT profiles are out of date (Iran — 2008, Turkmenistan — 2012).",
          })}
          sourceId="aquastat"
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={consumptionData}
              layout="vertical"
              margin={{ top: 4, right: 16, bottom: 0, left: 4 }}
              barCategoryGap={8}
            >
              <CartesianGrid stroke={CHART_INK.grid} horizontal={false} />
              <XAxis type="number" {...AXIS_PROPS} />
              <YAxis type="category" dataKey="name" {...AXIS_PROPS} width={86} />
              <Tooltip {...tip} formatter={fmt((v) => `${formatNumber(v, locale)} ${unit.km3PerYear}`)} />
              <Bar
                dataKey="withdrawal"
                radius={[0, 4, 4, 0]}
                name={byLocale(locale, { kk: "Су алу", ru: "Водозабор", en: "Water abstraction" })}
              >
                {consumptionData.map((row) => (
                  <Cell key={row.name} fill={SERIES[0]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </PanelItem>
    </PanelShell>
  );
}
