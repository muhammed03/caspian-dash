/**
 * Captures the live endpoints once and commits the result, so the platform
 * still shows air quality and wind with the network cable pulled out. The UI
 * labels these as a snapshot rather than passing them off as live.
 *
 * Usage: npx tsx scripts/pipeline/snapshot-live.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dryStreak, nesterovIndex, scoreLand } from "../../shared/lib/land-indices";
import { join } from "node:path";

const DATA = join(process.cwd(), "data");
const OUT = join(DATA, "snapshots");
mkdirSync(OUT, { recursive: true });

type City = { id: string; lat: number; lon: number; name_kk: string; name_ru: string };

const AQ_FIELDS = "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi";

async function snapshotAir() {
  const cities = JSON.parse(readFileSync(join(DATA, "monitored-cities.json"), "utf8")).cities as City[];
  const lat = cities.map((c) => c.lat).join(",");
  const lon = cities.map((c) => c.lon).join(",");
  const res = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=${AQ_FIELDS}&timezone=UTC`
  );
  if (!res.ok) throw new Error(`air ${res.status}`);
  const list = await res.json();
  const arr = Array.isArray(list) ? list : [list];

  const readings = cities.map((city, i) => {
    const c = arr[i]?.current ?? {};
    return {
      city_id: city.id,
      name_kk: city.name_kk,
      name_ru: city.name_ru,
      lat: city.lat,
      lon: city.lon,
      time: c.time ?? null,
      pm2_5: c.pm2_5 ?? null,
      pm10: c.pm10 ?? null,
      no2: c.nitrogen_dioxide ?? null,
      so2: c.sulphur_dioxide ?? null,
      co: c.carbon_monoxide ?? null,
      o3: c.ozone ?? null,
      eaqi: c.european_aqi ?? null,
    };
  });

  writeFileSync(
    join(OUT, "air.json"),
    JSON.stringify({ fetched_at: new Date().toISOString(), source_id: "open_meteo_aq", readings }, null, 2)
  );
  console.log(`air.json ✓ (${readings.length} cities)`);
}

async function snapshotWind() {
  const grid: [number, number][] = [];
  for (let la = 36.5; la <= 47.5; la += 1.2) {
    for (let lo = 46.5; lo <= 54.5; lo += 1.15) grid.push([Number(la.toFixed(2)), Number(lo.toFixed(2))]);
  }
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${grid.map((g) => g[0]).join(",")}&longitude=${grid
      .map((g) => g[1])
      .join(",")}&current=wind_speed_10m,wind_direction_10m,temperature_2m&timezone=UTC`
  );
  if (!res.ok) throw new Error(`wind ${res.status}`);
  const list = await res.json();
  const arr = Array.isArray(list) ? list : [list];

  const points = grid
    .map(([la, lo], i) => {
      const c = arr[i]?.current ?? {};
      return { lat: la, lon: lo, speed: c.wind_speed_10m ?? null, direction: c.wind_direction_10m ?? null, temp: c.temperature_2m ?? null };
    })
    .filter((p) => p.speed !== null);

  writeFileSync(
    join(OUT, "wind.json"),
    JSON.stringify(
      {
        fetched_at: new Date().toISOString(),
        source_id: "open_meteo",
        unit: { speed: "km/h", direction: "° (from)" },
        points,
      },
      null,
      2
    )
  );
  console.log(`wind.json ✓ (${points.length} points)`);
}

async function snapshotLand() {
  const regions = [
    { id: "mangystau", name_kk: "Маңғыстау", name_ru: "Мангистау", lat: 43.65, lon: 51.16 },
    { id: "atyrau", name_kk: "Атырау", name_ru: "Атырау", lat: 47.09, lon: 51.88 },
    { id: "north-caspian", name_kk: "Солтүстік Каспий", name_ru: "Северный Каспий", lat: 46.35, lon: 48.04 },
    { id: "dagestan", name_kk: "Дағыстан", name_ru: "Дагестан", lat: 42.98, lon: 47.5 },
    { id: "absheron", name_kk: "Апшерон", name_ru: "Апшерон", lat: 40.41, lon: 49.87 },
  ];
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${regions.map((r) => r.lat).join(",")}` +
      `&longitude=${regions.map((r) => r.lon).join(",")}` +
      `&current=soil_moisture_0_to_7cm,soil_temperature_0cm` +
      `&daily=temperature_2m_max,relative_humidity_2m_mean,precipitation_sum` +
      `&past_days=92&forecast_days=1&timezone=UTC`
  );
  if (!res.ok) throw new Error(`land ${res.status}`);
  const payload = await res.json();
  const list = Array.isArray(payload) ? payload : [payload];

  const out = regions.map((region, i) => {
    const cur = list[i]?.current ?? {};
    const daily = list[i]?.daily ?? {};
    const precip: (number | null)[] = daily.precipitation_sum ?? [];
    const tmax: (number | null)[] = daily.temperature_2m_max ?? [];
    const rh: (number | null)[] = daily.relative_humidity_2m_mean ?? [];
    const days = tmax
      .map((t, k) => ({ tempMax: t ?? 0, rhMean: rh[k] ?? 50, precip: precip[k] ?? 0 }))
      .filter((d) => d.tempMax !== 0);

    return {
      id: region.id,
      name_kk: region.name_kk,
      name_ru: region.name_ru,
      lat: region.lat,
      lon: region.lon,
      soilTemperature: cur.soil_temperature_0cm ?? null,
      ...scoreLand({
        soilMoisture: cur.soil_moisture_0_to_7cm ?? 0,
        precip90mm: precip.reduce<number>((s, v) => s + (v ?? 0), 0),
        dryDays: dryStreak(precip),
        nesterov: nesterovIndex(days),
      }),
    };
  });

  const mean = (pick: (r: (typeof out)[number]) => number) =>
    Math.round(out.reduce((s, r) => s + pick(r), 0) / out.length);
  const summary = {
    soil: mean((r) => r.soil.score),
    drought: mean((r) => r.drought.score),
    fire: mean((r) => r.fire.score),
  };

  const body = {
    fetched_at: new Date().toISOString(),
    source_id: "open_meteo",
    method: "Nesterov fire index · topsoil moisture · 90-day rainfall",
    regions: out,
    summary,
  };
  writeFileSync(join(OUT, "land.json"), JSON.stringify(body, null, 2));
  // The eco index reads this copy so it still scores with the network down.
  writeFileSync(join(DATA, "land-indices.json"), JSON.stringify(body, null, 2));
  console.log(`land.json ✓ (${out.length} regions, summary ${JSON.stringify(summary)})`);
}

Promise.all([snapshotAir(), snapshotWind(), snapshotLand()]).catch((err) => {
  console.error(err);
  process.exit(1);
});
