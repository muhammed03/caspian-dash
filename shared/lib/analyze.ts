import { linearFit } from "./forecast";
import type { Insight } from "@/entities/ai-insight/schema";

/**
 * Deterministic analysis engine. Every field the dashboards show — trend,
 * anomalies, risk level, forecast — is computed here from the datasets using
 * the thresholds documented on /methodology.
 *
 * This is the part that must be defensible: it runs with no API key, no
 * network, and produces the same answer every time. The LLM layer only
 * rephrases these numbers into prose; it never produces them.
 */

export const RISK_THRESHOLDS = {
  /** |deviation from norm| in percent */
  medium: 25,
  high: 50,
  critical: 75,
} as const;

export type RiskLevel = Insight["risk_level"];

export function riskFromDeviation(deviationPercent: number): RiskLevel {
  const d = Math.abs(deviationPercent);
  if (d >= RISK_THRESHOLDS.critical) return "critical";
  if (d >= RISK_THRESHOLDS.high) return "high";
  if (d >= RISK_THRESHOLDS.medium) return "medium";
  return "low";
}

export function escalate(a: RiskLevel, b: RiskLevel): RiskLevel {
  const order: RiskLevel[] = ["low", "medium", "high", "critical"];
  return order[Math.max(order.indexOf(a), order.indexOf(b))];
}

export type Trend = { direction: "up" | "down" | "stable"; ratePercent: number; period: string };

/** Trend as percent change per year of the mean, plus its direction. */
export function trendOf(series: { year: number; value: number }[]): Trend {
  const fit = linearFit(series.map((r) => ({ x: r.year, y: r.value })));
  const mean = series.reduce((s, r) => s + r.value, 0) / series.length;
  const ratePercent = mean === 0 ? 0 : (fit.slope / Math.abs(mean)) * 100;
  const direction = Math.abs(ratePercent) < 0.2 ? "stable" : ratePercent > 0 ? "up" : "down";
  return {
    direction,
    ratePercent: Number(ratePercent.toFixed(2)),
    period: `${series[0].year}–${series.at(-1)!.year}`,
  };
}

export type Anomaly = { metric: string; value: number; norm: number; deviationPercent: number };

export function anomaly(metric: string, value: number, norm: number): Anomaly {
  return {
    metric,
    value: Number(value.toFixed(2)),
    norm: Number(norm.toFixed(2)),
    deviationPercent: Number((((value - norm) / Math.abs(norm)) * 100).toFixed(1)),
  };
}

export type Analysis = {
  trend: Trend;
  anomalies: Anomaly[];
  risk: RiskLevel;
  forecast: { horizonYears: number; expectedValue: number; unit: string; confidence: "low" | "medium" | "high" };
  /** Which sources fed this, so the card can state data quality honestly. */
  dataStatus: ("real" | "semi" | "mock")[];
};

/** Confidence falls when the fit is weak or the inputs are not observations. */
export function confidenceFrom(r2: number, statuses: Analysis["dataStatus"]): "low" | "medium" | "high" {
  const hasMock = statuses.includes("mock");
  if (hasMock || r2 < 0.5) return "low";
  if (statuses.every((s) => s === "real") && r2 >= 0.85) return "high";
  return "medium";
}
