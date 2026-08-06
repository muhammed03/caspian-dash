import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

import {
  bearingStdDev,
  coneHalfAngle,
  compassLabel,
  plumeCone,
  plumeLengthKm,
  stabilityClass,
  toBearing,
  type ConeAngle,
  type StabilityClass,
} from "@/shared/lib/plume";

/**
 * Computes the dispersion cone for every facility, hour by hour, from measured
 * wind — 24 hours of history plus 24 hours of forecast.
 *
 * Everything geometric is decided here. The client draws the `cone` rings it
 * receives and never recomputes a position from "current" wind: doing that on
 * an hour when the wind turns puts the drawing and the caption kilometres
 * apart while the reader is looking at both.
 */
export const dynamic = "force-dynamic";

type Facility = {
  properties: {
    id: string;
    name_kk: string;
    name_ru: string;
    short: string;
    kind_kk: string;
    kind_ru: string;
    country: string;
    source: string;
    approx: boolean;
    emissions_t: number;
    profile: { so2: number; no2: number; pm: number; voc: number };
  };
  geometry: { coordinates: [number, number] };
};

type Frame = {
  time: string;
  hour: string;
  fromBearing: number;
  toBearing: number;
  fromLabel_kk: string;
  fromLabel_ru: string;
  speedMs: number;
  stability: StabilityClass;
  lengthKm: number;
  angle: ConeAngle;
  cone: [number, number][];
};

const HOURLY =
  "wind_speed_10m,wind_direction_10m,shortwave_radiation,cloud_cover,is_day";

export async function GET() {
  const raw = await readFile(join(process.cwd(), "data", "factories.geojson"), "utf8");
  const facilities = (JSON.parse(raw).features ?? []) as Facility[];

  // One request covering every facility, past day + forecast day.
  const lat = facilities.map((f) => f.geometry.coordinates[1]).join(",");
  const lon = facilities.map((f) => f.geometry.coordinates[0]).join(",");
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=${HOURLY}&past_days=1&forecast_days=2&timezone=UTC`;

  let payload: unknown;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(9000), next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);
    payload = await res.json();
  } catch {
    // Rule 1: no measured wind, no animation. The UI says so rather than
    // inventing a direction.
    return NextResponse.json(
      {
        available: false,
        reason: "wind_unavailable",
        source_id: "open_meteo",
        facilities: [],
      },
      { status: 200 }
    );
  }

  const list = (Array.isArray(payload) ? payload : [payload]) as {
    hourly?: {
      time: string[];
      wind_speed_10m: (number | null)[];
      wind_direction_10m: (number | null)[];
      shortwave_radiation: (number | null)[];
      cloud_cover: (number | null)[];
      is_day: (number | null)[];
    };
  }[];

  const nowIso = new Date().toISOString().slice(0, 13);

  const out = facilities.map((facility, i) => {
    const hourly = list[i]?.hourly;
    const p = facility.properties;
    const [lng, latitude] = facility.geometry.coordinates;

    if (!hourly?.time?.length) {
      return { id: p.id, available: false as const };
    }

    const nowIdx = Math.max(
      0,
      hourly.time.findIndex((t) => t.slice(0, 13) >= nowIso)
    );

    /** Directional spread over the last 12 hours — this is uncertainty, not spread. */
    const recentDirs = hourly.wind_direction_10m
      .slice(Math.max(0, nowIdx - 12), nowIdx + 1)
      .filter((d): d is number => d !== null);
    const dirSigma = bearingStdDev(recentDirs);

    function frameAt(idx: number): Frame | null {
      const speedKmh = hourly!.wind_speed_10m[idx];
      const from = hourly!.wind_direction_10m[idx];
      if (speedKmh === null || from === null) return null;

      const speedMs = speedKmh / 3.6;
      const cls = stabilityClass(
        speedMs,
        hourly!.shortwave_radiation[idx],
        hourly!.cloud_cover[idx],
        (hourly!.is_day[idx] ?? 0) === 1
      );
      const lengthKm = plumeLengthKm(cls, speedMs);
      const angle = coneHalfAngle(lengthKm, cls, dirSigma);
      const to = toBearing(from);

      return {
        time: hourly!.time[idx],
        hour: hourly!.time[idx].slice(11, 16),
        fromBearing: Number(from.toFixed(1)),
        toBearing: Number(to.toFixed(1)),
        fromLabel_kk: compassLabel(from, "kk"),
        fromLabel_ru: compassLabel(from, "ru"),
        speedMs: Number(speedMs.toFixed(1)),
        stability: cls,
        lengthKm: Number(lengthKm.toFixed(1)),
        angle,
        // minVisualDeg is a drawing concession only; every number above is true
        cone: plumeCone({ lat: latitude, lng }, to, lengthKm, angle.total, 3),
      };
    }

    const build = (from: number, to: number) =>
      Array.from({ length: to - from }, (_, k) => frameAt(from + k)).filter(
        (f): f is Frame => f !== null
      );

    const past = build(Math.max(0, nowIdx - 24), nowIdx);
    const forecast = build(nowIdx, Math.min(hourly.time.length, nowIdx + 24));

    if (past.length === 0 && forecast.length === 0) {
      return { id: p.id, available: false as const };
    }

    return {
      id: p.id,
      available: true as const,
      name_kk: p.name_kk,
      name_ru: p.name_ru,
      short: p.short,
      kind_kk: p.kind_kk,
      kind_ru: p.kind_ru,
      country: p.country,
      source: p.source,
      approx: p.approx,
      profile: p.profile,
      lat: latitude,
      lng,
      dirSigma: Number(dirSigma.toFixed(2)),
      frames: past,
      forecastFrames: forecast,
      current: forecast[0] ?? past.at(-1) ?? null,
    };
  });

  return NextResponse.json({
    available: true,
    fetched_at: new Date().toISOString(),
    source_id: "open_meteo",
    model: "Gaussian plume · Pasquill-Turner stability · Briggs 1973 open-country",
    facilities: out,
  });
}
