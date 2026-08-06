/**
 * Derives a coastline for every year from the sea-level series.
 *
 * Method (documented on /methodology, mirrors the standard cross-shore
 * translation used in coastal geomorphology):
 *
 *   retreat_horizontal = Δlevel / tan(β)
 *
 * where β is the local nearshore bed slope. Each vertex of the reference
 * shoreline is assigned a slope from the segment it falls in (the northern
 * shelf is near-flat, the Mangystau cliffs are steep), then displaced along
 * the inward normal of the shoreline by that distance.
 *
 * This is a MODEL, not a satellite observation — the UI labels it as such.
 * The reference shoreline is Natural Earth at ~2015 level (−27.85 m).
 *
 * Usage: npx tsx scripts/pipeline/build-coastlines.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DATA = join(process.cwd(), "data");
const OUT = join(DATA, "coastlines");
mkdirSync(OUT, { recursive: true });

const REFERENCE_YEAR = 2015;

type Pt = [number, number];

/**
 * Nearshore bed slope by sector. Values are order-of-magnitude figures from
 * the literature on Caspian bathymetry: the north-east shelf has gradients
 * below 0.001 (1 cm of level ≈ 10+ m of shoreline), while the Mangystau and
 * Iranian coasts drop off steeply.
 */
// Order matters: the first matching box wins, so narrow sectors are listed
// before the broad shelf they sit inside.
const SECTORS = [
  { id: "ural-delta", bbox: [50.5, 46.2, 53.5, 47.6], slope: 0.00025, name_ru: "Дельта Урала", name_kk: "Жайық атырауы" },
  { id: "volga-delta", bbox: [46.5, 45.6, 49.5, 47.6], slope: 0.0003, name_ru: "Дельта Волги", name_kk: "Еділ атырауы" },
  { id: "buzachi", bbox: [50.0, 44.6, 53.5, 46.2], slope: 0.0008, name_ru: "Бузачи / Каражанбас", name_kk: "Бозашы / Қаражанбас" },
  { id: "north-shelf", bbox: [46.5, 45.6, 54.0, 48.2], slope: 0.0004, name_ru: "Северный шельф", name_kk: "Солтүстік қайраң" },
  { id: "mangystau", bbox: [50.2, 42.6, 53.0, 44.6], slope: 0.006, name_ru: "Мангистау (Актау, Курык)", name_kk: "Маңғыстау (Ақтау, Құрық)" },
  { id: "kendirli", bbox: [51.5, 41.4, 54.5, 42.6], slope: 0.004, name_ru: "Кендерли", name_kk: "Кендірлі" },
  { id: "turkmen", bbox: [51.5, 37.5, 55.5, 41.4], slope: 0.003, name_ru: "Туркменское побережье", name_kk: "Түркмен жағалауы" },
  { id: "iran", bbox: [48.5, 36.0, 54.5, 38.5], slope: 0.012, name_ru: "Иранское побережье", name_kk: "Иран жағалауы" },
  { id: "azerbaijan", bbox: [47.5, 38.5, 51.5, 41.9], slope: 0.01, name_ru: "Азербайджанское побережье", name_kk: "Әзербайжан жағалауы" },
  { id: "dagestan", bbox: [45.5, 41.9, 49.5, 45.6], slope: 0.008, name_ru: "Дагестанское побережье", name_kk: "Дағыстан жағалауы" },
];
const DEFAULT_SLOPE = 0.005;

function slopeAt([lon, lat]: Pt): { slope: number; sector: string } {
  for (const s of SECTORS) {
    const [minX, minY, maxX, maxY] = s.bbox;
    if (lon >= minX && lon <= maxX && lat >= minY && lat <= maxY) {
      return { slope: s.slope, sector: s.id };
    }
  }
  return { slope: DEFAULT_SLOPE, sector: "other" };
}

/** metres per degree at a given latitude */
function metresPerDegree(lat: number) {
  const latRad = (lat * Math.PI) / 180;
  return { x: 111_320 * Math.cos(latRad), y: 110_574 };
}

const seaLevel = JSON.parse(readFileSync(join(DATA, "sea-level.json"), "utf8")) as {
  series: { year: number; level_m: number }[];
};
const levelByYear = new Map(seaLevel.series.map((r) => [r.year, r.level_m]));
const refLevel = levelByYear.get(REFERENCE_YEAR)!;

const caspian = JSON.parse(readFileSync(join(DATA, "geo", "caspian.geojson"), "utf8"));
const shore = caspian.features[0].geometry.coordinates[0] as Pt[];

/** Centroid — used to orient the normal so the offset always moves seaward. */
const centroid: Pt = shore
  .reduce<[number, number]>((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0])
  .map((v) => v / shore.length) as Pt;

/**
 * Offsets a closed ring inward (toward the sea centroid) by a per-vertex
 * distance in metres.
 */
function offsetRing(ring: Pt[], distanceAt: (p: Pt) => number): Pt[] {
  const n = ring.length;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p = ring[i];
    const prev = ring[(i - 1 + n) % n];
    const next = ring[(i + 1) % n];
    const m = metresPerDegree(p[1]);

    // tangent in metres
    let tx = (next[0] - prev[0]) * m.x;
    let ty = (next[1] - prev[1]) * m.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;

    // both normals; pick the one pointing at the sea interior
    let nx = -ty;
    let ny = tx;
    const towardCentre = [(centroid[0] - p[0]) * m.x, (centroid[1] - p[1]) * m.y];
    if (nx * towardCentre[0] + ny * towardCentre[1] < 0) {
      nx = -nx;
      ny = -ny;
    }

    const d = distanceAt(p);
    out.push([
      Number((p[0] + (nx * d) / m.x).toFixed(5)),
      Number((p[1] + (ny * d) / m.y).toFixed(5)),
    ]);
  }
  return out;
}

/** Light smoothing so steep slope changes between sectors don't create spikes. */
function smooth(ring: Pt[], passes = 2): Pt[] {
  let cur = ring;
  for (let p = 0; p < passes; p++) {
    const n = cur.length;
    cur = cur.map((pt, i) => {
      const a = cur[(i - 1 + n) % n];
      const b = cur[(i + 1) % n];
      return [
        Number(((a[0] + 2 * pt[0] + b[0]) / 4).toFixed(5)),
        Number(((a[1] + 2 * pt[1] + b[1]) / 4).toFixed(5)),
      ] as Pt;
    });
  }
  return cur;
}

const YEARS = [1992, 1995, 2000, 2005, 2010, 2015, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2030, 2035];
const index: Record<string, unknown>[] = [];

// 2030/2035 use the linear trend of the last decade, same as the forecast card.
function projectedLevel(year: number): number {
  if (levelByYear.has(year)) return levelByYear.get(year)!;
  const recent = seaLevel.series.filter((r) => r.year >= 2015);
  const n = recent.length;
  const meanX = recent.reduce((s, r) => s + r.year, 0) / n;
  const meanY = recent.reduce((s, r) => s + r.level_m, 0) / n;
  const slope =
    recent.reduce((s, r) => s + (r.year - meanX) * (r.level_m - meanY), 0) /
    recent.reduce((s, r) => s + (r.year - meanX) ** 2, 0);
  return meanY + slope * (year - meanX);
}

for (const year of YEARS) {
  const level = projectedLevel(year);
  const dz = refLevel - level; // positive when the sea is lower than reference
  let maxRetreat = 0;
  const sectorRetreat: Record<string, number> = {};

  const ring = smooth(
    offsetRing(shore, (p) => {
      const { slope, sector } = slopeAt(p);
      const d = dz / slope; // metres of horizontal translation
      if (Math.abs(d) > Math.abs(maxRetreat)) maxRetreat = d;
      sectorRetreat[sector] = Math.round(d);
      return d;
    })
  );

  const fc = {
    type: "FeatureCollection",
    meta: {
      year,
      level_m: Number(level.toFixed(3)),
      reference_year: REFERENCE_YEAR,
      reference_level_m: refLevel,
      status: "semi",
      model: "cross-shore translation: retreat = Δlevel / tan(β)",
      source_id: "model",
      projected: !levelByYear.has(year),
    },
    features: [
      {
        type: "Feature",
        properties: { year, level_m: Number(level.toFixed(3)) },
        geometry: { type: "Polygon", coordinates: [ring] },
      },
    ],
  };
  writeFileSync(join(OUT, `${year}.geojson`), JSON.stringify(fc));
  // .json twin so the hero scene can import a shoreline directly
  writeFileSync(join(OUT, `${year}.json`), JSON.stringify(fc));
  index.push({
    year,
    level_m: Number(level.toFixed(3)),
    max_retreat_m: Math.round(maxRetreat),
    projected: !levelByYear.has(year),
    sector_retreat_m: sectorRetreat,
  });
  console.log(
    `${year}: level ${level.toFixed(2)} m, max retreat ${(maxRetreat / 1000).toFixed(1)} km${
      levelByYear.has(year) ? "" : " (projected)"
    }`
  );
}

writeFileSync(
  join(DATA, "coastline-index.json"),
  JSON.stringify(
    {
      status: "semi",
      source_id: "model",
      reference_year: REFERENCE_YEAR,
      method_ru:
        "Горизонтальное отступание = падение уровня / уклон дна. Уклон задан по секторам из литературы по батиметрии Каспия; линия смещается по внутренней нормали. Это модель, а не спутниковое наблюдение.",
      method_kk:
        "Көлденең шегіну = деңгейдің төмендеуі / түп еңісі. Еңіс Каспий батиметриясы бойынша әдебиеттен секторлар бойынша берілген; сызық ішкі нормаль бойымен жылжиды. Бұл модель, спутниктік бақылау емес.",
      sectors: SECTORS.map(({ id, slope, name_ru, name_kk }) => ({ id, slope, name_ru, name_kk })),
      years: index,
    },
    null,
    2
  )
);
console.log("\ncoastline-index.json ✓");
