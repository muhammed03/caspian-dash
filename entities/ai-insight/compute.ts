import {
  anomaly,
  confidenceFrom,
  escalate,
  riskFromDeviation,
  trendOf,
  type Analysis,
  type Anomaly,
} from "@/shared/lib/analyze";
import { linearFit } from "@/shared/lib/forecast";
import type { InsightModule } from "./schema";

import seaLevel from "@/data/sea-level.json";
import coastlineIndex from "@/data/coastline-index.json";
import rivers from "@/data/rivers.json";
import pollution from "@/data/pollution.json";
import wildlife from "@/data/wildlife.json";
import resources from "@/data/resources.json";
import availability from "@/data/data-availability.json";
import landIndices from "@/data/land-indices.json";

type LevelRow = { year: number; level_m: number; area_km2: number; volume_km3: number };
const LEVELS = seaLevel.series as LevelRow[];

/**
 * An anomaly whose `metric` is a key into ANOMALY_LABELS, not display text.
 *
 * `region` is set only for the metrics whose label names a place: the engine
 * hands over the raw dataset row so the caller can read the name in the
 * reader's language with `pick(region, "name", locale)`. Reaching for
 * `name_ru` here is what made this file Russian-only in the first place.
 */
export type LabeledAnomaly = Anomaly & { region?: Record<string, unknown> };

/** Same as `Analysis`, but every string it carries is a key, not a sentence. */
export type LabeledAnalysis = Omit<Analysis, "anomalies"> & { anomalies: LabeledAnomaly[] };

/**
 * Runs the deterministic analysis for one dashboard. No network, no key, same
 * answer every run — this is what the "AI analysis" card is built on.
 *
 * The engine produces numbers and keys only. Metric names and forecast units
 * are resolved against entities/ai-insight/labels.ts at render time, so the
 * same computation serves all three locales.
 */
export function computeAnalysis(module: InsightModule): LabeledAnalysis {
  switch (module) {
    case "water": {
      const recent = LEVELS.filter((r) => r.year >= 2015);
      const trend = trendOf(recent.map((r) => ({ year: r.year, value: r.level_m })));
      const fit = linearFit(recent.map((r) => ({ x: r.year, y: r.level_m })));

      const rateCm = fit.slope * 100;
      // Norm: the long-run 1992–2014 rate, which the current one is compared against.
      const baseline = linearFit(
        LEVELS.filter((r) => r.year < 2015).map((r) => ({ x: r.year, y: r.level_m }))
      );
      const baselineCm = baseline.slope * 100;

      const anomalies = [
        anomaly("waterLevelRate", rateCm, baselineCm),
        anomaly(
          "seaLevel",
          LEVELS.at(-1)!.level_m,
          -29 // historic minimum used as the reference threshold
        ),
        anomaly(
          "volgaFlow",
          rivers.rivers[0].current,
          rivers.rivers[0].historic_1930
        ),
      ];

      const risk = anomalies.reduce(
        (acc, a) => escalate(acc, riskFromDeviation(a.deviationPercent)),
        "low" as ReturnType<typeof riskFromDeviation>
      );

      const expected = coastlineIndex.years.find((y) => y.year === 2035)?.level_m ?? fit.predict(2035);
      return {
        trend,
        anomalies,
        risk,
        forecast: {
          horizonYears: 10,
          expectedValue: Number(expected.toFixed(2)),
          unit: "mBS",
          confidence: confidenceFrom(fit.r2, ["semi", "semi"]),
        },
        dataStatus: ["semi", "semi"],
      };
    }

    case "pollution": {
      const purity = pollution.purity_index.map((p) => p.value);
      const meanPurity = purity.reduce((s, v) => s + v, 0) / purity.length;
      const oilShare = pollution.structure.find((s) => s.id === "oil")!.percent;

      const worstRegion = pollution.purity_index.reduce((a, b) => (a.value < b.value ? a : b));
      const anomalies = [
        // 70 = the index value the platform treats as "acceptable" (see /methodology)
        anomaly("waterPurityMean", meanPurity, 70),
        { ...anomaly("waterPurityWorstRegion", worstRegion.value, 70), region: worstRegion },
        anomaly("oilShare", oilShare, 20),
      ];
      const risk = anomalies.reduce(
        (acc, a) => escalate(acc, riskFromDeviation(a.deviationPercent)),
        "low" as ReturnType<typeof riskFromDeviation>
      );

      return {
        trend: { direction: "stable", ratePercent: 0, period: "2015–2025" },
        anomalies,
        risk,
        forecast: {
          horizonYears: 5,
          expectedValue: pollution.health.annual_estimate,
          unit: "casesPerYearWho",
          confidence: "low",
        },
        dataStatus: ["semi", "real"],
      };
    }

    case "life": {
      const catches = wildlife.sturgeon.catch_series.map((r) => ({ year: r.year, value: r.tonnes }));
      const trend = trendOf(catches);
      const aerial = wildlife.seal.aerial_counts.map((r) => ({ year: r.year, value: r.count }));
      const fit = linearFit(aerial.map((r) => ({ x: r.year, y: r.value })));

      const anomalies = [
        anomaly("sturgeonCatch", catches.at(-1)!.value, catches[0].value),
        anomaly(
          "sealPopulation",
          aerial.at(-1)!.value,
          wildlife.seal.historic_1900
        ),
        anomaly("mangystauNdvi", 8, 12),
      ];
      const risk = anomalies.reduce(
        (acc, a) => escalate(acc, riskFromDeviation(a.deviationPercent)),
        "low" as ReturnType<typeof riskFromDeviation>
      );

      return {
        trend,
        anomalies,
        risk,
        forecast: {
          horizonYears: 10,
          expectedValue: Math.max(Math.round(fit.predict(2035)), 0),
          unit: "sealIndividuals",
          confidence: confidenceFrom(fit.r2, ["semi", "semi"]),
        },
        dataStatus: ["semi", "semi"],
      };
    }

    case "resources": {
      const production = resources.production_series.map((r) => ({ year: r.year, value: r.oil_mt }));
      const trend = trendOf(production);
      const oil = resources.reserves.find((r) => r.id === "oil")!;
      const gas = resources.reserves.find((r) => r.id === "gas")!;
      const oilYears = oil.value / oil.production_per_year;

      const anomalies = [
        anomaly("oilProduction", production.at(-1)!.value, production[0].value),
        // 50 years of supply is the industry benchmark for a healthy R/P ratio
        anomaly("oilDepletionYears", oilYears, 50),
        anomaly("gasDepletionYears", gas.value / gas.production_per_year, 50),
      ];
      const risk = anomalies.reduce(
        (acc, a) => escalate(acc, riskFromDeviation(a.deviationPercent)),
        "low" as ReturnType<typeof riskFromDeviation>
      );

      return {
        trend,
        anomalies,
        risk,
        forecast: {
          horizonYears: Math.round(oilYears),
          expectedValue: Number(oilYears.toFixed(1)),
          unit: "yearsAtCurrentRate",
          confidence: "low",
        },
        dataStatus: ["semi"],
      };
    }

    case "index": {
      const meanPurity =
        pollution.purity_index.reduce((s, p) => s + p.value, 0) / pollution.purity_index.length;
      const meanAvailability =
        availability.countries.reduce((s, c) => s + c.score, 0) / availability.countries.length;

      const land = landIndices.summary;
      const anomalies = [
        anomaly("seaArea", LEVELS.at(-1)!.area_km2, LEVELS[0].area_km2),
        anomaly("waterPurityIndex", meanPurity, 70),
        // 70 is the platform's "acceptable" mark on its own 0-100 scale
        anomaly("topsoilMoisture", land.soil, 70),
        anomaly("fireDanger", land.fire, 70),
        anomaly("dataOpenness", meanAvailability, 70),
      ];
      const risk = anomalies.reduce(
        (acc, a) => escalate(acc, riskFromDeviation(a.deviationPercent)),
        "low" as ReturnType<typeof riskFromDeviation>
      );

      return {
        trend: trendOf(LEVELS.map((r) => ({ year: r.year, value: r.area_km2 }))),
        anomalies,
        risk,
        forecast: {
          horizonYears: 10,
          expectedValue: ecoIndexScore(),
          unit: "indexPoints",
          confidence: "low",
        },
        dataStatus: ["semi", "semi", "real"],
      };
    }
  }
}

/**
 * Composite ecological index, 0–100, over eight weighted components.
 *
 * Five describe the sea itself and its data; three describe the coastal land —
 * topsoil moisture, dryness and fire danger — because a drying shoreline is
 * part of what the receding sea produces, not a separate subject.
 *
 * The land three come from the committed snapshot rather than a live call, so
 * the index still scores with the network down. The dashboard shows the live
 * reading alongside it when there is one.
 *
 * Weights are stated on /methodology and every score can be recomputed by hand.
 */
export function ecoIndexComponents() {
  const levels = LEVELS;
  const areaLoss = ((levels[0].area_km2 - levels.at(-1)!.area_km2) / levels[0].area_km2) * 100;
  const meanPurity =
    pollution.purity_index.reduce((s, p) => s + p.value, 0) / pollution.purity_index.length;
  const sturgeon = wildlife.sturgeon.catch_series;
  const sturgeonLoss = ((sturgeon[0].tonnes - sturgeon.at(-1)!.tonnes) / sturgeon[0].tonnes) * 100;
  const meanAvailability =
    availability.countries.reduce((s, c) => s + c.score, 0) / availability.countries.length;
  const land = landIndices.summary;

  return [
    { id: "water", score: Math.max(0, Math.round(100 - areaLoss * 6)), weight: 0.2 },
    { id: "purity", score: Math.round(meanPurity), weight: 0.15 },
    { id: "biodiversity", score: Math.max(0, Math.round(100 - sturgeonLoss)), weight: 0.2 },
    { id: "seal", score: Math.max(0, Math.round(100 - wildlife.seal.decline_percent)), weight: 0.15 },
    { id: "soil", score: land.soil, weight: 0.09 },
    { id: "drought", score: land.drought, weight: 0.08 },
    { id: "fire", score: land.fire, weight: 0.08 },
    { id: "transparency", score: Math.round(meanAvailability), weight: 0.05 },
  ];
}

export function ecoIndexScore(): number {
  const parts = ecoIndexComponents();
  return Math.round(parts.reduce((s, p) => s + p.score * p.weight, 0));
}
