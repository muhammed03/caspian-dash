import { ecoIndexScore } from "@/entities/ai-insight/compute";
import seaLevel from "@/data/sea-level.json";
import rivers from "@/data/rivers.json";
import wildlife from "@/data/wildlife.json";
import pollution from "@/data/pollution.json";
import koshkar from "@/data/koshkar-ata.json";
import resources from "@/data/resources.json";
import coastline from "@/data/coastline-index.json";
import availability from "@/data/data-availability.json";

import type { MetricId } from "./types";

/**
 * Every number a lesson shows is resolved here, from the same committed
 * datasets the dashboards read. No figure is ever typed into lesson prose.
 *
 * The point is not tidiness. A teaching module that restates numbers by hand
 * will eventually teach a figure the platform no longer shows, and on a project
 * whose whole claim is that its data is checkable, that would be the worst
 * possible bug. Here it cannot happen: update the dataset and the lessons move.
 */

export type Metric = {
  value: number;
  /** Decimal places for display. */
  decimals: number;
  /** Which source badge belongs under it. */
  sourceId: string;
};

const series = seaLevel.series as { year: number; level_m: number; area_km2: number }[];
const first = series[0];
const last = series[series.length - 1];

const sturgeon = wildlife.sturgeon.catch_series as { year: number; tonnes: number }[];
const estimates = wildlife.seal.estimates as { low: number; high: number }[];

const purity = pollution.purity_index as { value: number }[];
const coastYears = coastline.years as { year: number; max_retreat_m: number }[];

/** Mean of the last five years of decline, in cm/year — the headline rate. */
function recentDeclineCm(): number {
  const window = series.slice(-6);
  const span = window[window.length - 1].year - window[0].year;
  if (span <= 0) return 0;
  return Math.abs(((window[window.length - 1].level_m - window[0].level_m) / span) * 100);
}

const REGISTRY: Record<MetricId, Metric> = {
  seaLevelNow: { value: last.level_m, decimals: 2, sourceId: "grealm" },
  seaLevelDrop: { value: Math.abs(last.level_m - first.level_m), decimals: 2, sourceId: "grealm" },
  areaLost: { value: first.area_km2 - last.area_km2, decimals: 0, sourceId: "grealm" },
  declineRate: { value: recentDeclineCm(), decimals: 0, sourceId: "grealm" },

  volgaShare: { value: rivers.rivers[0].share_percent, decimals: 0, sourceId: "grid_arendal" },
  riversTotal: {
    value: rivers.rivers.reduce((sum, r) => sum + r.current, 0),
    decimals: 0,
    sourceId: "grid_arendal",
  },
  retreatMax: {
    value: Math.abs(Math.min(...coastYears.map((y) => y.max_retreat_m))) / 1000,
    decimals: 1,
    sourceId: "model",
  },

  sealDeclinePercent: { value: wildlife.seal.decline_percent, decimals: 0, sourceId: "iucn_seal" },
  sealLow: { value: Math.min(...estimates.map((e) => e.low)), decimals: 0, sourceId: "iucn_seal" },
  sealHigh: { value: Math.max(...estimates.map((e) => e.high)), decimals: 0, sourceId: "iucn_seal" },
  sturgeonThen: { value: sturgeon[0].tonnes, decimals: 0, sourceId: "cites_fao" },
  sturgeonNow: { value: sturgeon[sturgeon.length - 1].tonnes, decimals: 0, sourceId: "cites_fao" },

  koshkarWaste: { value: koshkar.waste_mt, decimals: 0, sourceId: "koshkar_pub" },
  oilShare: { value: pollution.structure[0].percent, decimals: 0, sourceId: "grid_arendal" },
  purityWorst: { value: Math.min(...purity.map((p) => p.value)), decimals: 0, sourceId: "model" },
  healthLow: { value: pollution.health.range[0], decimals: 0, sourceId: "model" },

  oilReserves: { value: resources.reserves[0].value, decimals: 0, sourceId: "industry_reports" },
  gasReserves: { value: resources.reserves[1].value, decimals: 1, sourceId: "industry_reports" },
  oilDepletion: {
    value: resources.reserves[0].value / resources.reserves[0].production_per_year,
    decimals: 0,
    sourceId: "industry_reports",
  },

  ecoIndex: { value: ecoIndexScore(), decimals: 0, sourceId: "model" },
  openDataShare: {
    value: Math.round(
      availability.countries.reduce((sum, c) => sum + c.score, 0) / availability.countries.length
    ),
    decimals: 0,
    sourceId: "model",
  },
};

export function metric(id: MetricId): Metric {
  return REGISTRY[id];
}

/** The shoreline years the compare card may reference, for validation. */
export const COASTLINE_YEARS = coastYears.map((y) => y.year);
