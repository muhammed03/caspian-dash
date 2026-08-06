/**
 * Sea-breeze detection for the coastal cities.
 *
 * A breeze matters here for one reason: it is the most dangerous wind regime
 * for a coastal refinery. It pushes the plume inland toward the town, and the
 * stable air that sat over cold water meets a hot shore, where a thermal
 * internal boundary layer grows underneath the plume and brings the whole
 * elevated plume down at once — the classic coastal fumigation episode.
 *
 * The detection is deliberately conservative. Onshore wind alone is NOT a
 * breeze: an ordinary westerly cyclone also blows off the sea. What separates
 * a breeze from any other wind is the daily cycle, so the code never states
 * that a breeze is present — only how much of the evidence lines up.
 *
 * Sources:
 *  · Simpson J.E. (1994) Sea Breeze and Local Winds, CUP
 *  · Miller S.T.K. et al. (2003) Rev. Geophysics 41(3) — detection criteria
 *  · Lyons W.A., Cole H.S. (1973) J. Appl. Meteorology 12 — lake-breeze fumigation
 *  · Venkatram A. (1977) Boundary-Layer Meteorology 11 — TIBL growth
 */

export type BreezeConfidence = "high" | "medium" | "low" | "none";

export type BreezeCity = {
  id: string;
  name_kk: string;
  name_ru: string;
  lat: number;
  lon: number;
  /** Bearing pointing FROM the sea TOWARD the land, degrees. */
  coastNormal: number;
  /** Paired open-water point; verified at −28 m, the Caspian surface. */
  sea: { lat: number; lon: number };
  /** Straight-line distance to open water, km. */
  distanceKm: number;
  /**
   * Whether a breeze can reach this city at all. A breeze penetrates roughly
   * 20–50 km inland; showing one further inland than that would be fiction.
   */
  applicable: boolean;
  /** Why the city is limited or excluded — shown to the reader, never hidden. */
  caveat_kk?: string;
  caveat_ru?: string;
};

/**
 * The coastal cities, with the reasons each one is or is not suitable.
 * Distances and coast normals were read off the map and are checkable.
 */
export const BREEZE_CITIES: BreezeCity[] = [
  {
    id: "aqtau",
    name_kk: "Ақтау",
    name_ru: "Актау",
    lat: 43.641,
    lon: 51.198,
    coastNormal: 90, // sea lies west, breeze blows east onto the land
    sea: { lat: 43.641, lon: 50.75 },
    distanceKm: 0,
    applicable: true,
  },
  {
    id: "baku",
    name_kk: "Баку",
    name_ru: "Баку",
    lat: 40.409,
    lon: 49.867,
    coastNormal: 270, // sea lies east
    sea: { lat: 40.35, lon: 50.3 },
    distanceKm: 0,
    applicable: true,
    caveat_kk: "Күшті синоптикалық солтүстік жел («хазри») бризді жиі басып кетеді.",
    caveat_ru: "Сильный синоптический северный ветер («хазри») часто подавляет бриз.",
  },
  {
    id: "sumqayit",
    name_kk: "Сумқайыт",
    name_ru: "Сумгаит",
    lat: 40.589,
    lon: 49.668,
    coastNormal: 270,
    sea: { lat: 40.6, lon: 50.1 },
    distanceKm: 2,
    applicable: true,
  },
  {
    id: "turkmenbasy",
    name_kk: "Түркменбашы",
    name_ru: "Туркменбаши",
    lat: 40.023,
    lon: 52.96,
    coastNormal: 90, // bay lies west
    sea: { lat: 40.02, lon: 52.5 },
    distanceKm: 0,
    applicable: true,
    caveat_kk: "Шығанақ геометриясы жел бағытын бұрмалауы мүмкін.",
    caveat_ru: "Геометрия залива может искажать направление ветра.",
  },
  {
    id: "anzali",
    name_kk: "Бендер-Энзели",
    name_ru: "Бендер-Энзели",
    lat: 37.472,
    lon: 49.462,
    coastNormal: 180, // sea lies north
    sea: { lat: 37.85, lon: 49.46 },
    distanceKm: 0,
    applicable: true,
    caveat_kk: "Албурз тауы тау-аңғар циркуляциясын қосады — екі режим араласады.",
    caveat_ru: "Хребет Албурз добавляет горно-долинную циркуляцию — режимы смешиваются.",
  },
  {
    id: "makhachkala",
    name_kk: "Махачкала",
    name_ru: "Махачкала",
    lat: 42.976,
    lon: 47.502,
    coastNormal: 270, // sea lies east
    sea: { lat: 42.98, lon: 47.95 },
    distanceKm: 2,
    applicable: true,
    caveat_kk: "Кавказ бөктері қосылады — аралас режим.",
    caveat_ru: "Добавляется влияние предгорий Кавказа — смешанный режим.",
  },
  {
    id: "atyrau",
    name_kk: "Атырау",
    name_ru: "Атырау",
    lat: 47.117,
    lon: 51.883,
    coastNormal: 0, // sea lies south, breeze blows north onto the land
    sea: { lat: 46.8, lon: 51.8 },
    distanceKm: 30,
    applicable: true,
    caveat_kk:
      "Теңізден ~30 км — бриздің ену шегінің шетінде, сондықтан сенімділік әрқашан бір деңгейге төмендетіледі. Солтүстік Каспий таяз: жазда су тез қызып, контраст жоғалуы мүмкін.",
    caveat_ru:
      "~30 км от моря — на самом краю зоны проникновения бриза, поэтому уверенность всегда понижается на уровень. Северный Каспий мелкий: летом вода быстро прогревается и контраст может исчезать.",
  },
  {
    id: "astrakhan",
    name_kk: "Астрахан",
    name_ru: "Астрахань",
    lat: 46.35,
    lon: 48.041,
    coastNormal: 180,
    sea: { lat: 45.6, lon: 48.3 },
    distanceKm: 70,
    applicable: false,
    caveat_kk: "Теңізге дейін ~70 км — бриз бұл жерге жетпейді, сондықтан есептелмейді.",
    caveat_ru: "~70 км до моря — бриз сюда не доходит, поэтому не рассчитывается.",
  },
];

/** Wind blows FROM this bearing, so it travels toward the opposite one. */
export function travelBearing(fromBearing: number): number {
  return (fromBearing + 180) % 360;
}

/**
 * How square-on the wind is to the coast.
 * +1 is straight off the sea onto the land, −1 is straight out to sea.
 */
export function onshoreComponent(toBearing: number, coastNormal: number): number {
  return Math.cos(((toBearing - coastNormal) * Math.PI) / 180);
}

export type BreezeHour = {
  time: string;
  hour: number;
  onshore: number;
  windMs: number;
  tempLand: number;
  tempSea: number;
  deltaT: number;
};

export type BreezeCriteria = {
  onshoreWind: boolean;
  thermalContrast: boolean;
  weakSynoptic: boolean;
  daytimeWindow: boolean;
  diurnalReversal: boolean;
};

/** The five criteria, evaluated for one hour plus that day's night hours. */
export function evaluateCriteria(
  now: BreezeHour,
  nightHours: BreezeHour[],
  localHour: number
): BreezeCriteria {
  return {
    onshoreWind: now.onshore > 0.5,
    thermalContrast: now.deltaT > 3,
    weakSynoptic: now.windMs < 6,
    daytimeWindow: localHour >= 10 && localHour <= 20,
    // the decisive one: the wind actually reversed overnight
    diurnalReversal: nightHours.some((h) => h.onshore < -0.3),
  };
}

export function confidenceFrom(criteria: BreezeCriteria, downgrade = false): BreezeConfidence {
  const met = Object.values(criteria).filter(Boolean).length;
  // Criterion 1 on its own means nothing: an ordinary westerly also blows onshore.
  if (!criteria.onshoreWind) return "none";
  let level: BreezeConfidence = met >= 5 ? "high" : met >= 3 ? "medium" : "low";
  if (downgrade) {
    level = level === "high" ? "medium" : level === "medium" ? "low" : "none";
  }
  return level;
}

export const CONFIDENCE_TEXT: Record<BreezeConfidence, { kk: string; ru: string }> = {
  high: { kk: "бриз белгілері айқын", ru: "признаки бриза выражены" },
  medium: { kk: "бриз болуы ықтимал", ru: "бриз вероятен" },
  low: {
    kk: "жел теңіз жағынан, бірақ бриз екені расталмады",
    ru: "ветер со стороны моря, но бриз не подтверждён",
  },
  none: { kk: "бриз белгілері жоқ", ru: "признаков бриза нет" },
};

/** Night land breeze: the weaker, rarer reverse flow. */
export function isLandBreeze(now: BreezeHour, localHour: number): boolean {
  return now.onshore < -0.3 && -now.deltaT > 2 && (localHour >= 22 || localHour <= 7);
}

/**
 * Distance from the shore at which the growing thermal internal boundary layer
 * reaches the plume and mixes it to the ground.
 *
 *   h(x) ≈ A·√x,  A ≈ 1…3
 *
 * The stack height is unknown, so the plume's effective height H is unknown
 * too. The answer is therefore a RANGE over plausible H, and it is labelled an
 * estimate everywhere it appears. A single number here would be invented.
 */
export function fumigationRangeKm(): { min: number; max: number } {
  // plausible effective plume heights for this kind of plant, metres
  const H_MIN = 60;
  const H_MAX = 150;
  // A is the TIBL growth coefficient: larger means the layer climbs faster and
  // the plume touches down closer to the shore
  const A_FAST = 2.5;
  const A_SLOW = 1.5;
  const distanceKm = (H: number, A: number) => (H / A) ** 2 / 1000;
  return {
    min: Math.max(1, Math.round(distanceKm(H_MIN, A_FAST))),
    max: Math.min(15, Math.round(distanceKm(H_MAX, A_SLOW))),
  };
}

/**
 * The falsifiable test: average the onshore component by hour of day over the
 * past month. A real breeze draws a clean sine — positive at midday, negative
 * at night. A flat line means there is no breeze at this city, however
 * plausible one might seem.
 */
export function diurnalSignature(hours: BreezeHour[]): {
  byHour: { hour: number; onshore: number; n: number }[];
  amplitude: number;
  hasSignature: boolean;
} {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, sum: 0, n: 0 }));
  for (const h of hours) {
    const b = buckets[h.hour];
    b.sum += h.onshore;
    b.n += 1;
  }
  const byHour = buckets.map((b) => ({
    hour: b.hour,
    onshore: b.n ? Number((b.sum / b.n).toFixed(3)) : 0,
    n: b.n,
  }));

  const values = byHour.filter((b) => b.n > 0).map((b) => b.onshore);
  const amplitude = values.length ? Number((Math.max(...values) - Math.min(...values)).toFixed(3)) : 0;

  // 0.6 of the −1…+1 range is a swing that random weather does not produce
  return { byHour, amplitude, hasSignature: amplitude >= 0.6 };
}
