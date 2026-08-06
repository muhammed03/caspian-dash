import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

import { dryStreak, nesterovIndex, scoreLand, type LandIndices } from "@/shared/lib/land-indices";

/**
 * Soil, dryness and fire danger for the coastal regions, from measured
 * weather. Falls back to the committed snapshot when the network is gone, the
 * same way the air and wind routes do.
 */
export const dynamic = "force-dynamic";

/** Coastal points the indices are averaged over — one per stretch of coast. */
const REGIONS = [
  { id: "mangystau", name_kk: "Маңғыстау", name_ru: "Мангистау", lat: 43.65, lon: 51.16 },
  { id: "atyrau", name_kk: "Атырау", name_ru: "Атырау", lat: 47.09, lon: 51.88 },
  { id: "north-caspian", name_kk: "Солтүстік Каспий", name_ru: "Северный Каспий", lat: 46.35, lon: 48.04 },
  { id: "dagestan", name_kk: "Дағыстан", name_ru: "Дагестан", lat: 42.98, lon: 47.5 },
  { id: "absheron", name_kk: "Апшерон", name_ru: "Апшерон", lat: 40.41, lon: 49.87 },
];

const DAILY = "temperature_2m_max,relative_humidity_2m_mean,precipitation_sum";
const CURRENT = "soil_moisture_0_to_7cm,soil_temperature_0cm";

export async function GET() {
  if (process.env.CASPIAN_OFFLINE === "1") return snapshot();

  try {
    const lat = REGIONS.map((r) => r.lat).join(",");
    const lon = REGIONS.map((r) => r.lon).join(",");
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=${CURRENT}&daily=${DAILY}&past_days=92&forecast_days=1&timezone=UTC`;

    const res = await fetch(url, { signal: AbortSignal.timeout(9000), next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);

    const payload = await res.json();
    const list = Array.isArray(payload) ? payload : [payload];

    const regions = REGIONS.map((region, i) => {
      const cur = list[i]?.current ?? {};
      const daily = list[i]?.daily ?? {};
      const precip: (number | null)[] = daily.precipitation_sum ?? [];
      const tmax: (number | null)[] = daily.temperature_2m_max ?? [];
      const rh: (number | null)[] = daily.relative_humidity_2m_mean ?? [];

      const days = tmax
        .map((t, k) => ({
          tempMax: t ?? 0,
          rhMean: rh[k] ?? 50,
          precip: precip[k] ?? 0,
        }))
        .filter((d) => d.tempMax !== 0);

      const indices = scoreLand({
        soilMoisture: cur.soil_moisture_0_to_7cm ?? 0,
        precip90mm: precip.reduce<number>((s, v) => s + (v ?? 0), 0),
        dryDays: dryStreak(precip),
        nesterov: nesterovIndex(days),
      });

      return {
        id: region.id,
        name_kk: region.name_kk,
        name_ru: region.name_ru,
        lat: region.lat,
        lon: region.lon,
        soilTemperature: cur.soil_temperature_0cm ?? null,
        ...indices,
      };
    });

    return NextResponse.json({
      live: true,
      fetched_at: new Date().toISOString(),
      source_id: "open_meteo",
      method: "Nesterov fire index · topsoil moisture · 90-day rainfall",
      regions,
      summary: summarise(regions),
    });
  } catch {
    return snapshot();
  }
}

type Region = { soil: LandIndices["soil"]; drought: LandIndices["drought"]; fire: LandIndices["fire"] };

/** Coast-wide averages — what the eco index consumes. */
function summarise(regions: Region[]) {
  const mean = (pick: (r: Region) => number) =>
    Math.round(regions.reduce((s, r) => s + pick(r), 0) / Math.max(regions.length, 1));
  return {
    soil: mean((r) => r.soil.score),
    drought: mean((r) => r.drought.score),
    fire: mean((r) => r.fire.score),
  };
}

async function snapshot() {
  try {
    const raw = await readFile(join(process.cwd(), "data", "snapshots", "land.json"), "utf8");
    return NextResponse.json({ ...JSON.parse(raw), live: false });
  } catch {
    return NextResponse.json(
      { live: false, regions: [], summary: null, source_id: "open_meteo" },
      { status: 503 }
    );
  }
}
