/**
 * Captures the live endpoints once and commits the result, so the platform
 * still shows air quality and wind with the network cable pulled out. The UI
 * labels these as a snapshot rather than passing them off as live.
 *
 * Usage: npx tsx scripts/pipeline/snapshot-live.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
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
  for (let la = 37; la <= 47; la += 2.5) {
    for (let lo = 47; lo <= 54; lo += 2.33) grid.push([Number(la.toFixed(2)), Number(lo.toFixed(2))]);
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

Promise.all([snapshotAir(), snapshotWind()]).catch((err) => {
  console.error(err);
  process.exit(1);
});
