/**
 * Regression models behind every forecast on the site. Kept deterministic and
 * small on purpose: the jury can read the formula here and check it against
 * the /methodology page.
 */

export type Point = { x: number; y: number };

export type LinearFit = {
  slope: number;
  intercept: number;
  r2: number;
  /** Standard error of the estimate, used for the confidence band. */
  se: number;
  n: number;
  predict: (x: number) => number;
};

/** Ordinary least squares: y = a + b·x */
export function linearFit(points: Point[]): LinearFit {
  const n = points.length;
  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;
  const sxx = points.reduce((s, p) => s + (p.x - meanX) ** 2, 0);
  const sxy = points.reduce((s, p) => s + (p.x - meanX) * (p.y - meanY), 0);
  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;

  const ssTot = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssRes = points.reduce((s, p) => s + (p.y - (intercept + slope * p.x)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  const se = Math.sqrt(ssRes / Math.max(n - 2, 1));

  return { slope, intercept, r2, se, n, predict: (x) => intercept + slope * x };
}

/**
 * Exponential fit on the *decline* rather than the level itself: the level is
 * negative, so we model the drop below a reference and fit log-linearly.
 */
export function exponentialFit(points: Point[], reference: number) {
  const usable = points
    .map((p) => ({ x: p.x, drop: reference - p.y }))
    .filter((p) => p.drop > 0.001);
  if (usable.length < 3) return null;

  const logFit = linearFit(usable.map((p) => ({ x: p.x, y: Math.log(p.drop) })));
  return {
    r2: logFit.r2,
    rate: logFit.slope,
    predict: (x: number) => reference - Math.exp(logFit.intercept + logFit.slope * x),
  };
}

export type ForecastPoint = {
  year: number;
  observed?: number;
  linear?: number;
  exponential?: number;
  lower?: number;
  upper?: number;
};

/**
 * Builds the series the forecast chart draws: observations, both model curves
 * and a ±1.96·SE band around the linear one.
 */
export function buildForecast(
  series: { year: number; value: number }[],
  {
    fitFrom,
    horizon,
  }: { fitFrom: number; horizon: number }
): { points: ForecastPoint[]; linear: LinearFit; exponential: ReturnType<typeof exponentialFit> } {
  const fitData = series.filter((r) => r.year >= fitFrom).map((r) => ({ x: r.year, y: r.value }));
  const linear = linearFit(fitData);
  const reference = Math.max(...series.map((r) => r.value)) + 0.01;
  const exp = exponentialFit(fitData, reference);

  const lastYear = series.at(-1)!.year;
  const points: ForecastPoint[] = series.map((r) => ({ year: r.year, observed: r.value }));

  for (let year = lastYear + 1; year <= lastYear + horizon; year++) {
    const lin = linear.predict(year);
    points.push({
      year,
      linear: Number(lin.toFixed(3)),
      exponential: exp ? Number(exp.predict(year).toFixed(3)) : undefined,
      lower: Number((lin - 1.96 * linear.se).toFixed(3)),
      upper: Number((lin + 1.96 * linear.se).toFixed(3)),
    });
  }

  // join the curves to the last observation so the chart has no gap
  const joinIdx = points.findIndex((p) => p.year === lastYear);
  if (joinIdx >= 0) {
    const y = series.at(-1)!.value;
    points[joinIdx].linear = y;
    points[joinIdx].exponential = y;
    points[joinIdx].lower = y;
    points[joinIdx].upper = y;
  }

  return { points, linear, exponential: exp };
}

/** Years of supply left at the current extraction rate. */
export function depletionYears(reserves: number, annualProduction: number) {
  if (annualProduction <= 0) return Infinity;
  return reserves / annualProduction;
}
