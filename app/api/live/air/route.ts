import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

/**
 * Live air quality from Open-Meteo (CAMS) — free, keyless, real.
 * If the network is down (jury machine, offline demo) the last committed
 * snapshot is returned instead, flagged so the UI can say so.
 */
type City = { id: string; lat: number; lon: number; name_kk: string; name_ru: string; name_en: string };

const FIELDS = "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi";

// The route itself must always run (otherwise Next serves a response
// frozen at build time and the "live" reading stops being live).
// Upstream calls are still cached, so Open-Meteo is not hammered.
export const dynamic = "force-dynamic";

export async function GET() {
  const citiesRaw = await readFile(join(process.cwd(), "data", "monitored-cities.json"), "utf8");
  const cities = (JSON.parse(citiesRaw).cities ?? []) as City[];

  // CASPIAN_OFFLINE=1 forces the snapshot path — for demoing on a machine with
  // no network without waiting for a fetch to time out.
  if (process.env.CASPIAN_OFFLINE === "1") return snapshot();

  try {
    const lat = cities.map((c) => c.lat).join(",");
    const lon = cities.map((c) => c.lon).join(",");
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=${FIELDS}&timezone=UTC`;

    const res = await fetch(url, { signal: AbortSignal.timeout(6000), next: { revalidate: 900 } });
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);

    const payload = await res.json();
    const list = Array.isArray(payload) ? payload : [payload];

    const readings = cities.map((city, i) => {
      const current = list[i]?.current ?? {};
      return {
        city_id: city.id,
        name_kk: city.name_kk,
        name_ru: city.name_ru,
        name_en: city.name_en,
        lat: city.lat,
        lon: city.lon,
        time: current.time ?? null,
        pm2_5: current.pm2_5 ?? null,
        pm10: current.pm10 ?? null,
        no2: current.nitrogen_dioxide ?? null,
        so2: current.sulphur_dioxide ?? null,
        co: current.carbon_monoxide ?? null,
        o3: current.ozone ?? null,
        eaqi: current.european_aqi ?? null,
      };
    });

    return NextResponse.json({
      live: true,
      fetched_at: new Date().toISOString(),
      source_id: "open_meteo_aq",
      readings,
    });
  } catch {
    return snapshot();
  }
}

/** Last committed reading, clearly flagged as not live. */
async function snapshot() {
  try {
    const raw = await readFile(join(process.cwd(), "data", "snapshots", "air.json"), "utf8");
    return NextResponse.json({ ...JSON.parse(raw), live: false });
  } catch {
    return NextResponse.json(
      { live: false, readings: [], source_id: "open_meteo_aq", error: "no data" },
      { status: 503 }
    );
  }
}
