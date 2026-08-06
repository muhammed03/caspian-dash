"use client";

import {
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
import { Fuel, Flame, Hourglass } from "lucide-react";

import { useLocale, useT } from "@/shared/lib/i18n/client";
import { AXIS_PROPS, CHART_INK, SERIES } from "@/shared/config/chart-palette";
import { ChartFrame, chartTooltipStyle, fmt } from "@/shared/ui/chart-frame";
import { MetricCard } from "@/shared/ui/metric-card";
import { depletionYears } from "@/shared/lib/forecast";
import { AiInsightCard } from "@/widgets/ai-insight/ai-insight-card";
import { PanelShell, PanelItem } from "./panel-shell";

import resources from "@/data/resources.json";

export function ResourcesPanel() {
  const t = useT();
  const locale = useLocale();
  const tip = chartTooltipStyle();

  const oil = resources.reserves.find((r) => r.id === "oil")!;
  const gas = resources.reserves.find((r) => r.id === "gas")!;
  const oilYears = depletionYears(oil.value, oil.production_per_year);
  const gasYears = depletionYears(gas.value, gas.production_per_year);

  const fieldsByCountry = Object.values(
    resources.fields.reduce<Record<string, { name: string; oil: number; gas: number }>>((acc, f) => {
      acc[f.country] ??= { name: f.country, oil: 0, gas: 0 };
      if (f.kind === "gas") acc[f.country].gas += f.reserves_bbl;
      else acc[f.country].oil += f.reserves_bbl;
      return acc;
    }, {})
  ).sort((a, b) => b.oil + b.gas - (a.oil + a.gas));

  const topFields = [...resources.fields]
    .sort((a, b) => b.reserves_bbl - a.reserves_bbl)
    .slice(0, 6)
    .map((f) => ({
      name: locale === "ru" ? f.name_ru : f.name_kk,
      value: f.reserves_bbl,
      kind: f.kind,
    }));

  return (
    <PanelShell title={t.resources.title}>
      <PanelItem className="grid grid-cols-2 gap-3">
        <MetricCard
          label={locale === "ru" ? "Запасы нефти" : "Мұнай қоры"}
          value={oil.value}
          unit={locale === "ru" ? "млрд барр." : "млрд барр."}
          tone="warn"
          icon={Fuel}
        />
        <MetricCard
          label={locale === "ru" ? "Запасы газа" : "Газ қоры"}
          value={gas.value}
          decimals={1}
          unit={locale === "ru" ? "трлн м³" : "трлн м³"}
          tone="neutral"
          icon={Flame}
        />
        <MetricCard
          label={`${t.resources.depletion} — ${locale === "ru" ? "нефть" : "мұнай"}`}
          value={Math.round(oilYears)}
          unit={locale === "ru" ? "лет" : "жыл"}
          tone={oilYears < 40 ? "bad" : "warn"}
          icon={Hourglass}
          delta={locale === "ru" ? "при текущем темпе" : "қазіргі қарқынмен"}
        />
        <MetricCard
          label={`${t.resources.depletion} — ${locale === "ru" ? "газ" : "газ"}`}
          value={Math.round(gasYears)}
          unit={locale === "ru" ? "лет" : "жыл"}
          tone={gasYears < 40 ? "bad" : "warn"}
          icon={Hourglass}
          delta={locale === "ru" ? "при текущем темпе" : "қазіргі қарқынмен"}
        />
      </PanelItem>

      <PanelItem>
        <AiInsightCard module="resources" />
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.resources.production}
          subtitle={locale === "ru" ? "нефть, млн т/год" : "мұнай, млн т/жыл"}
          sourceId="industry_reports"
        >
          <ResponsiveContainer width="100%" height={155}>
            <LineChart data={resources.production_series} margin={{ top: 4, right: 8, bottom: 0, left: -14 }}>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis dataKey="year" {...AXIS_PROPS} />
              <YAxis {...AXIS_PROPS} width={40} domain={["dataMin - 8", "dataMax + 8"]} />
              <Tooltip {...tip} formatter={fmt((v) => `${v} млн т`)} />
              <Line type="monotone" dataKey="oil_mt" stroke={SERIES[2]} strokeWidth={2} dot={{ r: 3, fill: SERIES[2] }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={t.resources.fields}
          subtitle={locale === "ru" ? "запасы, млрд барр. н.э." : "қоры, млрд барр. м.э."}
          note={locale === "ru" ? resources.note_ru : resources.note_kk}
          sourceId="industry_reports"
        >
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={topFields} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 4 }} barCategoryGap={8}>
              <CartesianGrid stroke={CHART_INK.grid} horizontal={false} />
              <XAxis type="number" {...AXIS_PROPS} />
              <YAxis type="category" dataKey="name" {...AXIS_PROPS} width={112} tick={{ fill: CHART_INK.secondary, fontSize: 10 }} />
              <Tooltip {...tip} formatter={fmt((v) => `${v} млрд барр.`)} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {topFields.map((f) => (
                  <Cell key={f.name} fill={f.kind === "gas" ? SERIES[5] : SERIES[2]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <ul className="text-mist/60 mt-2 flex gap-4 text-[11px]">
            <li className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm" style={{ background: SERIES[2] }} />
              {locale === "ru" ? "Нефть" : "Мұнай"}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm" style={{ background: SERIES[5] }} />
              {locale === "ru" ? "Газ" : "Газ"}
            </li>
          </ul>
        </ChartFrame>
      </PanelItem>

      <PanelItem>
        <ChartFrame
          title={locale === "ru" ? "Запасы по странам" : "Ел бойынша қорлар"}
          subtitle={locale === "ru" ? "млрд барр. н.э." : "млрд барр. м.э."}
          note={t.resources.depletionNote}
          sourceId="industry_reports"
        >
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={fieldsByCountry} margin={{ top: 4, right: 8, bottom: 0, left: -14 }} barCategoryGap={14}>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis dataKey="name" {...AXIS_PROPS} />
              <YAxis {...AXIS_PROPS} width={34} />
              <Tooltip {...tip} />
              <Bar dataKey="oil" stackId="r" fill={SERIES[2]} radius={[0, 0, 3, 3]} name={locale === "ru" ? "Нефть" : "Мұнай"} />
              <Bar dataKey="gas" stackId="r" fill={SERIES[5]} radius={[3, 3, 0, 0]} name={locale === "ru" ? "Газ" : "Газ"} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </PanelItem>
    </PanelShell>
  );
}
