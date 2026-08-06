import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

/**
 * Live wind field over the Caspian from Open-Meteo — drives the smoke plume
 * direction on the pollution map. Falls back to the committed snapshot offline.
 */
const GRID: [number, number][] = [];
for (let lat = 37; lat <= 47; lat += 2.5) {
  for (let lon = 47; lon <= 54; lon += 2.33) {
    GRID.push([Number(lat.toFixed(2)), Number(lon.toFixed(2))]);
  }
}

export const revalidate = 1800;

export async function GET() {
  try {
    const lat = GRID.map((g) => g[0]).join(",");
    const lon = GRID.map((g) => g[1]).join(",");
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_direction_10m,temperature_2m&timezone=UTC`;

    const res = await fetch(url, { signal: AbortSignal.timeout(6000), next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);

    const payload = await res.json();
    const list = Array.isArray(payload) ? payload : [payload];

    const points = GRID.map(([la, lo], i) => {
      const c = list[i]?.current ?? {};
      return {
        lat: la,
        lon: lo,
        speed: c.wind_speed_10m ?? null,
        direction: c.wind_direction_10m ?? null,
        temp: c.temperature_2m ?? null,
      };
    }).filter((p) => p.speed !== null);

    return NextResponse.json({
      live: true,
      fetched_at: new Date().toISOString(),
      source_id: "open_meteo",
      unit: { speed: "km/h", direction: "° (from)" },
      points,
    });
  } catch {
    try {
      const snap = await readFile(join(process.cwd(), "data", "snapshots", "wind.json"), "utf8");
      return NextResponse.json({ ...JSON.parse(snap), live: false });
    } catch {
      return NextResponse.json({ live: false, points: [], source_id: "open_meteo" }, { status: 503 });
    }
  }
}
