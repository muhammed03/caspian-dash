/**
 * Builds the offline basemap data from Natural Earth dumps.
 * Input: scratch dir with ne_lakes / ne_countries / ne_places / ne_rivers geojson
 * Output: data/geo/*.geojson clipped to the Caspian region
 *
 * Usage: npx tsx scripts/pipeline/build-geo.ts <scratch-dir>
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SRC = process.argv[2];
if (!SRC) throw new Error("pass scratch dir with ne_*.geojson files");
const OUT = join(process.cwd(), "data", "geo");
mkdirSync(OUT, { recursive: true });

// Caspian region bounding box (lon/lat)
const BBOX = { minX: 43.0, minY: 34.5, maxX: 58.5, maxY: 49.5 };

type Feature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown };
};
type FC = { type: "FeatureCollection"; features: Feature[] };

function load(name: string): FC {
  return JSON.parse(readFileSync(join(SRC, name), "utf8"));
}

function eachCoord(coords: unknown, fn: (pt: [number, number]) => void) {
  if (!Array.isArray(coords)) return;
  if (typeof coords[0] === "number") {
    fn(coords as [number, number]);
  } else {
    for (const c of coords) eachCoord(c, fn);
  }
}

function intersectsBbox(f: Feature): boolean {
  let hit = false;
  eachCoord(f.geometry?.coordinates, ([x, y]) => {
    if (x >= BBOX.minX && x <= BBOX.maxX && y >= BBOX.minY && y <= BBOX.maxY) hit = true;
  });
  return hit;
}

function round(coords: unknown, decimals = 4): unknown {
  if (!Array.isArray(coords)) return coords;
  if (typeof coords[0] === "number") {
    return (coords as number[]).map((n) => Number(n.toFixed(decimals)));
  }
  return coords.map((c) => round(c, decimals));
}

function save(name: string, features: Feature[]) {
  const fc = { type: "FeatureCollection", features };
  writeFileSync(join(OUT, name), JSON.stringify(fc));
  // .json twin: the map style imports these directly so the basemap needs no
  // network at all, and TypeScript only resolves .json imports.
  writeFileSync(join(OUT, name.replace(/\.geojson$/, ".json")), JSON.stringify(fc));
  console.log(`${name}: ${features.length} features, ${(JSON.stringify(fc).length / 1024).toFixed(0)} KB`);
}

// 1. Caspian polygon — assembled from the 10m coastline (NE maps the Caspian
// as coast, not as a lake). Largest closed ring inside the bbox = shoreline,
// smaller rings = islands, stored as holes.
const coast = load("ne_coastline.geojson");
const inBox = ([x, y]: [number, number]) =>
  x >= BBOX.minX && x <= BBOX.maxX && y >= BBOX.minY && y <= BBOX.maxY;
const rings: [number, number][][] = [];
for (const f of coast.features) {
  if (f.geometry.type !== "LineString") continue;
  const pts = f.geometry.coordinates as [number, number][];
  const closed =
    pts.length > 3 &&
    pts[0][0] === pts[pts.length - 1][0] &&
    pts[0][1] === pts[pts.length - 1][1];
  if (closed && pts.every(inBox)) rings.push(pts);
}
rings.sort((a, b) => b.length - a.length);
if (rings.length === 0) throw new Error("Caspian ring not found in coastline");
const [shore, ...islands] = rings;
save("caspian.geojson", [
  {
    type: "Feature",
    properties: { name: "Caspian Sea" },
    geometry: {
      type: "Polygon",
      coordinates: round([shore, ...islands.filter((r) => r.length >= 15)]) as unknown,
    },
  },
]);
save(
  "coastline.geojson",
  [
    {
      type: "Feature",
      properties: { kind: "shoreline" },
      geometry: { type: "LineString", coordinates: round(shore) as unknown },
    },
  ]
);

// Aral & other lakes in region for context
const lakes = load("ne_lakes.geojson");
const otherLakes = lakes.features.filter(
  (f) => f.properties.name !== "Caspian Sea" && intersectsBbox(f) && (f.properties.scalerank as number) <= 5
);
save(
  "lakes.geojson",
  otherLakes.map((f) => ({
    type: "Feature",
    properties: { name: f.properties.name ?? "" },
    geometry: { ...f.geometry, coordinates: round(f.geometry.coordinates) },
  }))
);

// 2. Countries around the Caspian
const KEEP = new Set(["KAZ", "RUS", "AZE", "IRN", "TKM", "UZB", "GEO", "ARM", "TUR", "IRQ", "AFG", "KGZ", "TJK"]);
const countries = load("ne_countries.geojson");
const kept = countries.features.filter((f) => KEEP.has(String(f.properties.ADM0_A3 ?? f.properties.adm0_a3)));
save(
  "countries.geojson",
  kept.map((f) => ({
    type: "Feature",
    properties: {
      iso3: String(f.properties.ADM0_A3 ?? f.properties.adm0_a3),
      name: String(f.properties.NAME ?? f.properties.name),
    },
    geometry: { ...f.geometry, coordinates: round(f.geometry.coordinates, 3) },
  }))
);

// 3. Cities (curated localized names, coordinates verified against NE)
const CITY_NAMES: Record<string, { kk: string; ru: string }> = {
  Aqtau: { kk: "Ақтау", ru: "Актау" },
  Atyrau: { kk: "Атырау", ru: "Атырау" },
  Baku: { kk: "Баку", ru: "Баку" },
  Astrakhan: { kk: "Астрахан", ru: "Астрахань" },
  Makhachkala: { kk: "Махачкала", ru: "Махачкала" },
  Turkmenbasy: { kk: "Түркменбашы", ru: "Туркменбаши" },
  "Bandar-e Anzali": { kk: "Бендер-Энзели", ru: "Бендер-Энзели" },
  Rasht: { kk: "Решт", ru: "Решт" },
  "Zhanga Ozen": { kk: "Жаңаөзен", ru: "Жанаозен" },
  "Fort-Shevchenko": { kk: "Форт-Шевченко", ru: "Форт-Шевченко" },
  Derbent: { kk: "Дербент", ru: "Дербент" },
  Sumqayit: { kk: "Сумгайыт", ru: "Сумгаит" },
};
const places = load("ne_places.geojson");
const cityFeatures: Feature[] = [];
for (const f of places.features) {
  const name = String(f.properties.name ?? "");
  const alias = Object.keys(CITY_NAMES).find(
    (k) => name === k || name.toLowerCase() === k.toLowerCase()
  );
  if (alias && intersectsBbox(f)) {
    cityFeatures.push({
      type: "Feature",
      properties: {
        id: alias.toLowerCase().replace(/[^a-z]+/g, "-"),
        name_en: alias,
        name_kk: CITY_NAMES[alias].kk,
        name_ru: CITY_NAMES[alias].ru,
        pop: Number(f.properties.pop_max ?? 0),
      },
      geometry: { ...f.geometry, coordinates: round(f.geometry.coordinates) },
    });
  }
}
// NE uses different transliterations for a few cities — verified coordinates
const FALLBACK_COORDS: Record<string, [number, number]> = {
  Turkmenbasy: [52.97, 40.02],
  "Bandar-e Anzali": [49.46, 37.47],
  "Zhanga Ozen": [52.86, 43.34],
  "Fort-Shevchenko": [50.26, 44.51],
  Sumqayit: [49.66, 40.59],
};
const found = new Set(cityFeatures.map((f) => f.properties.name_en));
for (const [name, coords] of Object.entries(FALLBACK_COORDS)) {
  if (found.has(name)) continue;
  cityFeatures.push({
    type: "Feature",
    properties: {
      id: name.toLowerCase().replace(/[^a-z]+/g, "-"),
      name_en: name,
      name_kk: CITY_NAMES[name].kk,
      name_ru: CITY_NAMES[name].ru,
      pop: 0,
    },
    geometry: { type: "Point", coordinates: coords },
  });
}
save("cities.geojson", cityFeatures);

// 4. Rivers feeding the Caspian
const RIVER_KEEP = /volga|ural|kura|terek|emba|atrek|sulak|samur|zhem/i;
const rivers = load("ne_rivers.geojson");
const keptRivers = rivers.features.filter(
  (f) => RIVER_KEEP.test(String(f.properties.name ?? "")) && intersectsBbox(f)
);
save(
  "rivers-geo.geojson",
  keptRivers.map((f) => ({
    type: "Feature",
    properties: { name: String(f.properties.name ?? "") },
    geometry: { ...f.geometry, coordinates: round(f.geometry.coordinates) },
  }))
);
