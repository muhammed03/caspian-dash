/**
 * Gaussian plume dispersion — the model behind the smoke cone on the pollution map.
 *
 * This is a physical model, not a decoration. Three rules hold everywhere in
 * this file and in everything that consumes it:
 *
 *  1. Wind must be measured. There is no synthetic wind anywhere here; if the
 *     upstream data is missing, the caller shows nothing and says why.
 *  2. Concentration is RELATIVE (0…1). Emission rate in g/s is unknown, so an
 *     absolute µg/m³ figure would be a fabrication.
 *  3. The cone is a probable dispersion sector, not a measured pollution field.
 *
 * Sources:
 *  · Pasquill F. (1961), Meteorological Magazine 90, 33–49 — stability classes
 *  · Turner D.B. (1964), J. Appl. Meteorology 3(1), 83–91 — operational table
 *  · Briggs G.A. (1973), ATDL Contribution 79 — σy/σz open-country coefficients
 *  · Mardia & Jupp, Directional Statistics — circular standard deviation
 */

export type StabilityClass = "A" | "B" | "C" | "D" | "E" | "F";

/**
 * Pasquill–Turner class from wind speed and insolation (day) or cloud
 * cover (night). Same wind gives a very different plume: a stable night
 * layer (F) stays narrow and travels far, an unstable afternoon (A/B)
 * spreads wide and dilutes fast — more than a threefold difference.
 */
export function stabilityClass(
  windMs: number,
  solarRadiation: number | null,
  cloudCover: number | null,
  isDay: boolean
): StabilityClass {
  const u = windMs;

  if (isDay) {
    const s = solarRadiation ?? 0;
    const insolation: 0 | 1 | 2 = s >= 700 ? 0 : s >= 350 ? 1 : 2; // strong | moderate | slight
    if (u < 2) return (["A", "A", "B"] as const)[insolation];
    if (u < 3) return (["A", "B", "C"] as const)[insolation];
    if (u < 5) return (["B", "B", "C"] as const)[insolation];
    if (u < 6) return (["C", "C", "D"] as const)[insolation];
    return (["C", "D", "D"] as const)[insolation];
  }

  const cloudy = (cloudCover ?? 0) >= 50;
  if (u < 3) return cloudy ? "E" : "F";
  if (u < 5) return cloudy ? "D" : "E";
  return "D";
}

const SIGMA_Y_K: Record<StabilityClass, number> = {
  A: 0.22,
  B: 0.16,
  C: 0.11,
  D: 0.08,
  E: 0.06,
  F: 0.04,
};

/** Crosswind spread at downwind distance x (metres). */
export function sigmaY(x: number, cls: StabilityClass): number {
  return (SIGMA_Y_K[cls] * x) / Math.sqrt(1 + 0.0001 * x);
}

/** Vertical spread at downwind distance x (metres). */
export function sigmaZ(x: number, cls: StabilityClass): number {
  switch (cls) {
    case "A":
      return 0.2 * x;
    case "B":
      return 0.12 * x;
    case "C":
      return (0.08 * x) / Math.sqrt(1 + 0.0002 * x);
    case "D":
      return (0.06 * x) / Math.sqrt(1 + 0.0015 * x);
    case "E":
      return (0.03 * x) / (1 + 0.0003 * x);
    case "F":
      return (0.016 * x) / (1 + 0.0003 * x);
  }
}

/**
 * Circular standard deviation of a set of bearings (Mardia).
 * A plain arithmetic mean is wrong here: the gap between 350° and 10° is 20°,
 * not 340°.
 */
export function bearingStdDev(bearings: number[]): number {
  if (bearings.length === 0) return 0;
  let sx = 0;
  let sy = 0;
  for (const b of bearings) {
    const r = (b * Math.PI) / 180;
    sx += Math.cos(r);
    sy += Math.sin(r);
  }
  const R = Math.hypot(sx, sy) / bearings.length;
  return R >= 1 ? 0 : (Math.sqrt(-2 * Math.log(R)) * 180) / Math.PI;
}

const PLUME_BASE_KM: Record<StabilityClass, number> = {
  A: 12,
  B: 16,
  C: 22,
  D: 30,
  E: 40,
  F: 50,
};

export function plumeLengthKm(cls: StabilityClass, windMs: number): number {
  const raw = PLUME_BASE_KM[cls] * (0.6 + 0.12 * windMs);
  return Math.min(60, Math.max(8, raw));
}

export type ConeAngle = {
  /** Half-angle from the physical spread of the plume, degrees. */
  physical: number;
  /** Half-angle added by how much the wind direction has been swinging. */
  wind: number;
  /** What the cone actually uses, capped at 60°. */
  total: number;
};

/**
 * Half-angle of the cone, kept as two separate numbers on purpose.
 * The physical part is dispersion; the wind part is uncertainty about where
 * the plume will point. The UI states both, because they mean different things.
 */
export function coneHalfAngle(
  lengthKm: number,
  cls: StabilityClass,
  dirSigmaDeg: number
): ConeAngle {
  const L = lengthKm * 1000;
  // 2σy covers ~95% of the plume mass
  const physical = (Math.atan((2 * sigmaY(L, cls)) / L) * 180) / Math.PI;
  const wind = dirSigmaDeg;
  return {
    physical: Number(physical.toFixed(2)),
    wind: Number(wind.toFixed(2)),
    total: Number(Math.min(60, physical + wind).toFixed(2)),
  };
}

/**
 * Relative concentration along the plume axis at distance x, normalised to
 * its own maximum by the caller. Deliberately the real Gaussian form —
 * an exp(−d/30) falloff would not be a Gaussian plume.
 */
export function relativeConcentration(
  xMetres: number,
  yMetres: number,
  cls: StabilityClass,
  windMs: number
): number {
  if (xMetres <= 0) return 0;
  const sy = sigmaY(xMetres, cls);
  const sz = sigmaZ(xMetres, cls);
  const u = Math.max(windMs, 0.5);
  return Math.exp(-(yMetres * yMetres) / (2 * sy * sy)) / (Math.PI * sy * sz * u);
}

/** Destination point from a bearing and distance. [lng, lat] — GeoJSON order. */
export function destPoint(
  lat: number,
  lng: number,
  bearingDeg: number,
  distKm: number
): [number, number] {
  const b = (bearingDeg * Math.PI) / 180;
  const dLat = (distKm / 111) * Math.cos(b);
  const dLng = (distKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(b);
  return [lng + dLng, lat + dLat];
}

/**
 * The cone ring as a closed polygon.
 *
 * `minVisualDeg` is a DRAWING concession only: at class F the true half-angle
 * drops to 2–3° and the cone renders as a hairline. Every number the UI
 * reports, and every calculation, uses the true angle — this parameter is 0
 * on the server side of the numbers.
 */
export function plumeCone(
  src: { lat: number; lng: number },
  toBearing: number,
  lengthKm: number,
  halfAngleDeg: number,
  minVisualDeg = 0
): [number, number][] {
  const half = Math.max(minVisualDeg, halfAngleDeg);
  const ring: [number, number][] = [[src.lng, src.lat]];
  const STEPS = 12;
  for (let i = 0; i <= STEPS; i++) {
    ring.push(destPoint(src.lat, src.lng, toBearing - half + (2 * half * i) / STEPS, lengthKm));
  }
  ring.push([src.lng, src.lat]);
  return ring;
}

/** Wind blows FROM this bearing, so the plume travels to the opposite one. */
export function toBearing(fromBearing: number): number {
  return (fromBearing + 180) % 360;
}

const COMPASS_KK = ["С", "ССШ", "СШ", "ШСШ", "Ш", "ОШШ", "ОШ", "ОСШ", "О", "ОБО", "ОБ", "БОБ", "Б", "БСБ", "СБ", "ССБ"];
const COMPASS_RU = ["С", "ССВ", "СВ", "ВСВ", "В", "ВЮВ", "ЮВ", "ЮЮВ", "Ю", "ЮЮЗ", "ЮЗ", "ЗЮЗ", "З", "ЗСЗ", "СЗ", "ССЗ"];

export function compassLabel(bearing: number, locale: "kk" | "ru"): string {
  const i = Math.round(((bearing % 360) / 22.5)) % 16;
  return (locale === "ru" ? COMPASS_RU : COMPASS_KK)[i];
}

export const STABILITY_TEXT: Record<StabilityClass, { kk: string; ru: string }> = {
  A: {
    kk: "A — қатты орнықсыз: шлейф кең жайылып, тез сұйылады",
    ru: "A — сильно неустойчиво: шлейф широкий, быстро разбавляется",
  },
  B: {
    kk: "B — орнықсыз: күндізгі кең жайылу",
    ru: "B — неустойчиво: дневное широкое рассеивание",
  },
  C: {
    kk: "C — әлсіз орнықсыз: орташа жайылу",
    ru: "C — слабо неустойчиво: умеренное рассеивание",
  },
  D: {
    kk: "D — бейтарап: желмен тікелей тасымал",
    ru: "D — нейтрально: перенос по ветру без сильного рассеивания",
  },
  E: {
    kk: "E — әлсіз орнықты: шлейф тарылып, алысқа жетеді",
    ru: "E — слабо устойчиво: шлейф сужается и уходит дальше",
  },
  F: {
    kk: "F — түнгі орнықты қабат: шлейф жіңішке әрі алысқа жетеді",
    ru: "F — ночной устойчивый слой: шлейф узкий и уходит далеко",
  },
};
