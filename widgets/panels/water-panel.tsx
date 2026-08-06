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
    name: locale === "ru" ? r.name_ru : r.name_kk,
    current: r.current,
    historic: r.historic_1930,
    lost: Number((r.historic_1930 - r.current).toFixed(1)),
  }));

  const consumptionData = consumption.countries
    .map((c) => ({
      name: locale === "ru" ? c.name_ru : c.name_kk,
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
          unit="м"
          tone="bad"
          icon={Waves}
          delta={`${(current.level_m - first.level_m).toFixed(2)} м с ${first.year}`}
        />
        <MetricCard
          label={t.home.metricRate}
          value={Math.abs(ratePerYear)}
          decimals={1}
          unit="см/год"
          tone="bad"
          icon={TrendingDown}
          delta={`R² = ${forecast.linear.r2.toFixed(2)}`}
        />
        <MetricCard
          label={t.water.area}
          value={current.area_km2}
          unit="км²"
          tone="warn"
          icon={Droplets}
          delta={`−${(first.area_km2 - current.area_km2).toLocaleString("ru-RU")} км²`}
        />
        <MetricCard
          label={t.water.retreat}
          value={maxRetreatKm}
          decimals={1}
          unit="км"
          tone="warn"
          icon={Ruler}
          delta={`${year} · ${locale === "ru" ? "макс. по секторам" : "секторлар бойынша макс."}`}
        />
      </PanelItem>

      <PanelItem>
        <AiInsightCard module="water" />
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.water.levelChart}
          subtitle={`${t.water.forecast} → ${level2035.year}`}
          note={locale === "ru" ? waterBalance.note_ru : waterBalance.note_kk}
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
              <YAxis {...AXIS_PROPS} domain={["dataMin - 0.3", "dataMax + 0.3"]} width={46} />
              <Tooltip {...tip} formatter={fmt((v) => `${Number(v).toFixed(2)} м`)} />
              <ReferenceLine
                y={-29}
                stroke={CHART_INK.muted}
                strokeDasharray="4 4"
                label={{
                  value: locale === "ru" ? "истор. минимум" : "тарихи минимум",
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
                name={locale === "ru" ? "Наблюдения" : "Бақылау"}
              />
              <Area
                type="monotone"
                dataKey="linear"
                stroke={SERIES[2]}
                strokeWidth={2}
                strokeDasharray="5 4"
                fill="none"
                dot={false}
                name={locale === "ru" ? "Линейный прогноз" : "Сызықтық болжам"}
              />
              <Area
                type="monotone"
                dataKey="exponential"
                stroke={SERIES[1]}
                strokeWidth={1.5}
                strokeDasharray="2 4"
                fill="none"
                dot={false}
                name={locale === "ru" ? "Экспоненциальный" : "Экспоненциалды"}
              />
            </AreaChart>
          </ResponsiveContainer>

          <ul className="text-mist/60 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
            <li className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded" style={{ background: SERIES[0] }} />
              {locale === "ru" ? "Наблюдения" : "Бақылау"}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded" style={{ background: SERIES[2] }} />
              {locale === "ru" ? "Линейный" : "Сызықтық"}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded" style={{ background: SERIES[1] }} />
              {locale === "ru" ? "Экспоненциальный" : "Экспоненциалды"}
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
          subtitle="км³"
          sourceId="grealm"
        >
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={SERIES_DATA} margin={{ top: 4, right: 8, bottom: 0, left: -14 }}>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis dataKey="year" {...AXIS_PROPS} interval="preserveStartEnd" minTickGap={30} />
              <YAxis {...AXIS_PROPS} domain={["dataMin - 100", "dataMax + 100"]} width={54} />
              <Tooltip {...tip} formatter={fmt((v) => `${Number(v).toLocaleString("ru-RU")} км³`)} />
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
          note={
            locale === "ru"
              ? "Серая часть столбца — сток, потерянный с 1930-х годов."
              : "Бағанның сұр бөлігі — 1930 жылдардан бері жоғалған ағын."
          }
          sourceId="grid_arendal"
        >
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={riverData} margin={{ top: 4, right: 8, bottom: 0, left: -14 }} barCategoryGap={10}>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis dataKey="name" {...AXIS_PROPS} interval={0} angle={-18} textAnchor="end" height={46} />
              <YAxis {...AXIS_PROPS} width={40} />
              <Tooltip {...tip} formatter={fmt((v) => `${v} км³/год`)} />
              <Bar
                dataKey="current"
                stackId="flow"
                fill={SERIES[0]}
                radius={[0, 0, 4, 4]}
                name={locale === "ru" ? "Сейчас" : "Қазір"}
              />
              <Bar
                dataKey="lost"
                stackId="flow"
                fill="rgba(226,232,240,0.16)"
                radius={[4, 4, 0, 0]}
                name={locale === "ru" ? "Потеряно" : "Жоғалған"}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.water.consumption}
          subtitle={consumption.unit}
          note={locale === "ru" ? consumption.countries[1].name_ru + ": профиль AQUASTAT 2008 г., данные устарели." : "AQUASTAT профильдері ескірген (Иран — 2008, Түрікменстан — 2012)."}
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
              <Tooltip {...tip} formatter={fmt((v) => `${v} км³/год`)} />
              <Bar dataKey="withdrawal" radius={[0, 4, 4, 0]} name={locale === "ru" ? "Водозабор" : "Су алу"}>
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
