import { anomaly, confidenceFrom, escalate, riskFromDeviation, trendOf, type Analysis } from "@/shared/lib/analyze";
import { linearFit } from "@/shared/lib/forecast";
import type { InsightModule } from "./schema";

import seaLevel from "@/data/sea-level.json";
import coastlineIndex from "@/data/coastline-index.json";
import rivers from "@/data/rivers.json";
import pollution from "@/data/pollution.json";
import wildlife from "@/data/wildlife.json";
import resources from "@/data/resources.json";
import availability from "@/data/data-availability.json";

type LevelRow = { year: number; level_m: number; area_km2: number; volume_km3: number };
const LEVELS = seaLevel.series as LevelRow[];

/**
 * Runs the deterministic analysis for one dashboard. No network, no key, same
 * answer every run — this is what the "AI analysis" card is built on.
 */
export function computeAnalysis(module: InsightModule): Analysis {
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
        anomaly("Скорость падения уровня, см/год", rateCm, baselineCm),
        anomaly(
          "Уровень моря, м БС",
          LEVELS.at(-1)!.level_m,
          -29 // historic minimum used as the reference threshold
        ),
        anomaly(
          "Сток Волги, км³/год",
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
          unit: "м БС",
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
        anomaly("Индекс чистоты воды (среднее), %", meanPurity, 70),
        anomaly(`Индекс чистоты воды — ${worstRegion.name_ru}, %`, worstRegion.value, 70),
        anomaly("Доля нефтепродуктов в структуре загрязнения, %", oilShare, 20),
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
          unit: "случаев/год (модельная оценка ВОЗ)",
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
        anomaly("Вылов осетровых, т/год", catches.at(-1)!.value, catches[0].value),
        anomaly(
          "Популяция тюленя (авиаучёт)",
          aerial.at(-1)!.value,
          wildlife.seal.historic_1900
        ),
        anomaly("NDVI побережья Мангистау", 8, 12),
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
          unit: "особей (линейная экстраполяция авиаучётов)",
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
        anomaly("Добыча нефти, млн т/год", production.at(-1)!.value, production[0].value),
        // 50 years of supply is the industry benchmark for a healthy R/P ratio
        anomaly("Срок исчерпания нефти, лет", oilYears, 50),
        anomaly("Срок исчерпания газа, лет", gas.value / gas.production_per_year, 50),
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
          unit: "лет при текущем темпе добычи",
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

      const anomalies = [
        anomaly("Площадь акватории, км²", LEVELS.at(-1)!.area_km2, LEVELS[0].area_km2),
        anomaly("Индекс чистоты воды, %", meanPurity, 70),
        anomaly("Открытость экологических данных, %", meanAvailability, 70),
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
          unit: "баллов сводного индекса",
          confidence: "low",
        },
        dataStatus: ["semi", "semi", "real"],
      };
    }
  }
}

/**
 * Composite ecological index, 0–100. Equal weights across five components,
 * each normalised to its own reference — the formula is printed on
 * /methodology so any number here can be recomputed by hand.
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

  return [
    { id: "water", score: Math.max(0, Math.round(100 - areaLoss * 6)), weight: 0.25 },
    { id: "purity", score: Math.round(meanPurity), weight: 0.2 },
    { id: "biodiversity", score: Math.max(0, Math.round(100 - sturgeonLoss)), weight: 0.25 },
    { id: "seal", score: Math.max(0, Math.round(100 - wildlife.seal.decline_percent)), weight: 0.2 },
    { id: "transparency", score: Math.round(meanAvailability), weight: 0.1 },
  ];
}

export function ecoIndexScore(): number {
  const parts = ecoIndexComponents();
  return Math.round(parts.reduce((s, p) => s + p.score * p.weight, 0));
}
