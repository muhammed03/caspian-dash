/**
 * Land-condition indices for the coastal strip: soil, dryness and fire danger.
 *
 * All three run on measured weather (Open-Meteo, keyless) rather than on a
 * stored table, and each is deliberately a named published method so it can be
 * checked rather than taken on trust. Where a method needs more history than
 * we have, the honest weaker version is used and labelled as such.
 */

import type { Trio } from "./i18n/pick";

export type LandIndices = {
  /** Topsoil water content, m³/m³, and its 0–100 score. */
  soil: { moisture: number; score: number };
  /** Simplified dryness: rainfall over 90 days and the current dry spell. */
  drought: { precip90mm: number; dryDays: number; score: number };
  /** Nesterov fire-danger index and its class, 1–5. */
  fire: { nesterov: number; class: 1 | 2 | 3 | 4 | 5; score: number };
};

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

/**
 * Dew point from temperature and relative humidity (Magnus). Needed because
 * the Nesterov index is a temperature/dew-point deficit sum and Open-Meteo
 * publishes humidity rather than dew point at daily resolution.
 */
export function dewPoint(tempC: number, rhPercent: number): number {
  const a = 17.27;
  const b = 237.7;
  const rh = Math.max(1, Math.min(100, rhPercent));
  const alpha = (a * tempC) / (b + tempC) + Math.log(rh / 100);
  return (b * alpha) / (a - alpha);
}

/**
 * Nesterov fire-danger index — the method used operationally in Kazakhstan
 * and neighbouring countries, which is why it is preferred here over a
 * generic dryness score.
 *
 *   G = Σ T·(T − Td) over consecutive days without significant rain
 *
 * A day with 3 mm or more resets the accumulation.
 */
export function nesterovIndex(
  days: { tempMax: number; rhMean: number; precip: number }[]
): number {
  let g = 0;
  for (const d of days) {
    if (d.precip >= 3) {
      g = 0;
      continue;
    }
    const td = dewPoint(d.tempMax, d.rhMean);
    g += Math.max(0, d.tempMax * (d.tempMax - td));
  }
  return Math.round(g);
}

/** Official Nesterov danger classes. */
export function nesterovClass(g: number): 1 | 2 | 3 | 4 | 5 {
  if (g < 300) return 1;
  if (g < 1000) return 2;
  if (g < 4000) return 3;
  if (g < 10000) return 4;
  return 5;
}

export const FIRE_CLASS_TEXT: Record<1 | 2 | 3 | 4 | 5, Trio> = {
  1: { kk: "I — қауіп жоқ", ru: "I — опасности нет", en: "I — no danger" },
  2: { kk: "II — шағын қауіп", ru: "II — малая опасность", en: "II — low danger" },
  3: { kk: "III — орташа қауіп", ru: "III — средняя опасность", en: "III — moderate danger" },
  4: { kk: "IV — жоғары қауіп", ru: "IV — высокая опасность", en: "IV — high danger" },
  5: { kk: "V — төтенше қауіп", ru: "V — чрезвычайная опасность", en: "V — extreme danger" },
};

/**
 * Scores each measurement on the platform's shared 0–100 scale, where 100 is
 * the healthy end. Reference points are stated so they can be argued with:
 *
 *  · soil — 0.30 m³/m³ is taken as well-watered topsoil for this semi-arid
 *    coast; below roughly 0.05 the ground is effectively dry.
 *  · dryness — 90 mm of rain over 90 days is treated as an adequate season
 *    for the region, and a dry spell beyond 30 days pulls the score down.
 *  · fire — the Nesterov class maps straight onto the score.
 */
export function scoreLand(input: {
  soilMoisture: number;
  precip90mm: number;
  dryDays: number;
  nesterov: number;
}): LandIndices {
  const soilScore = clamp((input.soilMoisture / 0.3) * 100);

  const rainScore = clamp((input.precip90mm / 90) * 100);
  const spellPenalty = clamp((input.dryDays / 60) * 100, 0, 100);
  const droughtScore = clamp(rainScore * 0.65 + (100 - spellPenalty) * 0.35);

  const cls = nesterovClass(input.nesterov);
  const fireScore = clamp(100 - (cls - 1) * 25);

  return {
    soil: { moisture: Number(input.soilMoisture.toFixed(3)), score: Math.round(soilScore) },
    drought: {
      precip90mm: Number(input.precip90mm.toFixed(1)),
      dryDays: input.dryDays,
      score: Math.round(droughtScore),
    },
    fire: { nesterov: input.nesterov, class: cls, score: Math.round(fireScore) },
  };
}

/** Consecutive days at the end of the series without significant rain. */
export function dryStreak(precip: (number | null)[], threshold = 1): number {
  let n = 0;
  for (let i = precip.length - 1; i >= 0; i--) {
    if ((precip[i] ?? 0) >= threshold) break;
    n++;
  }
  return n;
}
