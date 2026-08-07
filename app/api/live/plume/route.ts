import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

import {
  bearingStdDev,
  coneHalfAngle,
  compassLabel,
  destPoint,
  plumeCone,
  plumeLengthKm,
  sigmaY,
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
    name_en: string;
    short: string;
    kind_kk: string;
    kind_ru: string;
    kind_en: string;
    country: string;
    source: string;
    approx: boolean;
    emissions_t: number;
    profile: { so2: number; no2: number; pm: number; voc: number };
  };
  geometry: { coordinates: [number, number] };
};

/** Where the parcel released now will have drifted to, and how spread out. */
type DriftMark = {
  minutes: number;
  /** Horizon key — "m30" | "h1" | "h3". Localized by the client. */
  label: string;
  lat: number;
  lng: number;
  /** Distance travelled from the source, km. */
  distanceKm: number;
  /** Crosswind spread at that distance, km — the cloud's radius. */
  radiusKm: number;
  /** Bearing of the straight line source → mark, for the connecting path. */
  bearing: number;
};

type Frame = {
  time: string;
  hour: string;
  fromBearing: number;
  toBearing: number;
  fromLabel_kk: string;
  fromLabel_ru: string;
  fromLabel_en: string;
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
    const [lng0, latitude] = facility.geometry.coordinates;

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
        fromLabel_en: compassLabel(from, "en"),
        speedMs: Number(speedMs.toFixed(1)),
        stability: cls,
        lengthKm: Number(lengthKm.toFixed(1)),
        angle,
        // minVisualDeg is a drawing concession only; every number above is true
        cone: plumeCone({ lat: latitude, lng: lng0 }, to, lengthKm, angle.total, 3),
      };
    }

    /**
     * Advects a parcel released now, stepping through the HOURLY FORECAST wind
     * rather than freezing the current wind. When the wind turns during the
     * three hours, the track bends with it — this is the whole point, and it
     * is done here on the server so the client cannot disagree with the text
     * it is drawing next to.
     */
    function drift(): DriftMark[] {
      const STEP_MIN = 5;
      const MARKS = [30, 60, 180];
      const out: DriftMark[] = [];

      let lat = latitude;
      let lng = lng0;
      let travelled = 0;

      for (let minute = STEP_MIN; minute <= 180; minute += STEP_MIN) {
        // which forecast hour this step falls in
        const hourIdx = Math.min(
          hourly!.time.length - 1,
          nowIdx + Math.floor((minute - 1) / 60)
        );
        const speedKmh = hourly!.wind_speed_10m[hourIdx];
        const from = hourly!.wind_direction_10m[hourIdx];
        if (speedKmh === null || from === null) break;

        const stepKm = (speedKmh * STEP_MIN) / 60;
        const heading = toBearing(from);
        [lng, lat] = destPoint(lat, lng, heading, stepKm);
        travelled += stepKm;

        if (MARKS.includes(minute)) {
          const cls = stabilityClass(
            speedKmh / 3.6,
            hourly!.shortwave_radiation[hourIdx],
            hourly!.cloud_cover[hourIdx],
            (hourly!.is_day[hourIdx] ?? 0) === 1
          );
          // 2σy holds ~95% of the plume mass, so it reads as the cloud edge
          const radiusKm = (2 * sigmaY(travelled * 1000, cls)) / 1000;
          const dLat = lat - latitude;
          const dLng = (lng - lng0) * Math.cos((latitude * Math.PI) / 180);
          out.push({
            minutes: minute,
            // A key, not a caption: the wording is chosen by the client at
            // render time so it follows the reader's language.
            label: minute === 30 ? "m30" : minute === 60 ? "h1" : "h3",
            lat: Number(lat.toFixed(5)),
            lng: Number(lng.toFixed(5)),
            distanceKm: Number(travelled.toFixed(1)),
            radiusKm: Number(radiusKm.toFixed(1)),
            bearing: Number((((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360).toFixed(1)),
          });
        }
      }
      return out;
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
      name_en: p.name_en,
      short: p.short,
      kind_kk: p.kind_kk,
      kind_ru: p.kind_ru,
      kind_en: p.kind_en,
      country: p.country,
      source: p.source,
      approx: p.approx,
      profile: p.profile,
      lat: latitude,
      lng: lng0,
      dirSigma: Number(dirSigma.toFixed(2)),
      drift: drift(),
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
