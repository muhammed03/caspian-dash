import { NextResponse } from "next/server";

import {
  BREEZE_CITIES,
  confidenceFrom,
  diurnalSignature,
  evaluateCriteria,
  fumigationRangeKm,
  isLandBreeze,
  onshoreComponent,
  travelBearing,
  type BreezeHour,
} from "@/shared/lib/breeze";

/**
 * Sea-breeze state for the coastal cities.
 *
 * Each city is measured at two points — itself and a verified open-water point
 * about 20–40 km offshore — so the thermal contrast that drives the breeze is
 * observed rather than assumed.
 *
 * `?validate=true` returns the falsifiable test instead: the average onshore
 * component by hour of day over the past month. A real breeze traces a clean
 * daily sine; a flat curve means there is no breeze here, and the interface
 * must then say so rather than reporting one.
 */
export const dynamic = "force-dynamic";

const HOURLY = "temperature_2m,wind_speed_10m,wind_direction_10m";

export async function GET(request: Request) {
  const validate = new URL(request.url).searchParams.get("validate") === "true";
  const pastDays = validate ? 30 : 2;

  // Cities a breeze cannot physically reach are never queried, so no number
  // can accidentally be produced for them.
  const cities = BREEZE_CITIES.filter((c) => c.applicable);

  // land points first, then the paired sea points, in the same order
  const lat = [...cities.map((c) => c.lat), ...cities.map((c) => c.sea.lat)].join(",");
  const lon = [...cities.map((c) => c.lon), ...cities.map((c) => c.sea.lon)].join(",");

  let list: {
    utc_offset_seconds?: number;
    elevation?: number;
    hourly?: {
      time: string[];
      temperature_2m: (number | null)[];
      wind_speed_10m: (number | null)[];
      wind_direction_10m: (number | null)[];
    };
  }[];

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&hourly=${HOURLY}&past_days=${pastDays}&forecast_days=1&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000), next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);
    const payload = await res.json();
    list = Array.isArray(payload) ? payload : [payload];
  } catch {
    // No measured wind means no claim about the wind.
    return NextResponse.json({
      available: false,
      reason: "wind_unavailable",
      source_id: "open_meteo",
      cities: [],
      excluded: excludedCities(),
    });
  }

  const results = cities.map((city, i) => {
    const land = list[i];
    const sea = list[cities.length + i];
    const lh = land?.hourly;
    const sh = sea?.hourly;
    if (!lh?.time?.length || !sh?.time?.length) {
      return { id: city.id, available: false as const };
    }

    const offsetHours = (land.utc_offset_seconds ?? 0) / 3600;

    const hours: BreezeHour[] = lh.time.map((time, k) => {
      const dir = lh.wind_direction_10m[k] ?? 0;
      const to = travelBearing(dir);
      const tempLand = lh.temperature_2m[k] ?? 0;
      const tempSea = sh.temperature_2m[k] ?? 0;
      return {
        time,
        // `timezone=auto` already returns local time, so the hour is local
        hour: Number(time.slice(11, 13)),
        onshore: Number(onshoreComponent(to, city.coastNormal).toFixed(3)),
        windMs: Number((((lh.wind_speed_10m[k] ?? 0) as number) / 3.6).toFixed(1)),
        tempLand,
        tempSea,
        deltaT: Number((tempLand - tempSea).toFixed(1)),
      };
    });

    const signature = diurnalSignature(hours);

    if (validate) {
      return {
        id: city.id,
        available: true as const,
        name_kk: city.name_kk,
        name_ru: city.name_ru,
        name_en: city.name_en,
        distanceKm: city.distanceKm,
        seaElevation: sea.elevation ?? null,
        hoursAnalysed: hours.length,
        ...signature,
      };
    }

    // the hour nearest to now
    const nowIso = new Date(Date.now() + offsetHours * 3600_000).toISOString().slice(0, 13);
    const idx = Math.max(0, hours.findIndex((h) => h.time.slice(0, 13) >= nowIso));
    const now = hours[idx] ?? hours[hours.length - 1];

    // this calendar day's 00:00–06:00, for the reversal test
    const day = now.time.slice(0, 10);
    const nightHours = hours.filter((h) => h.time.slice(0, 10) === day && h.hour <= 6);

    const criteria = evaluateCriteria(now, nightHours, now.hour);
    // Atyrau sits at the very edge of the penetration distance, so its
    // confidence is always knocked down a level.
    const confidence = confidenceFrom(criteria, city.distanceKm >= 25);
    const landBreeze = isLandBreeze(now, now.hour);

    // Winter ice over the shallow north reverses the contrast entirely, so the
    // whole detection is suppressed there rather than reported wrongly.
    const month = Number(now.time.slice(5, 7));
    const northAndFrozen = city.lat > 45 && (month <= 3 || month === 12);

    return {
      id: city.id,
      available: true as const,
      name_kk: city.name_kk,
      name_ru: city.name_ru,
      name_en: city.name_en,
      lat: city.lat,
      lon: city.lon,
      coastNormal: city.coastNormal,
      distanceKm: city.distanceKm,
      seaElevation: sea.elevation ?? null,
      caveat_kk: city.caveat_kk ?? null,
      caveat_ru: city.caveat_ru ?? null,
      caveat_en: city.caveat_en ?? null,
      suppressed: northAndFrozen,
      suppressedReason_kk: northAndFrozen
        ? "Қыста солтүстік Каспий қатады — мұз үсті құрлықтай суық, контраст керісінше. Бриз есептелмейді."
        : null,
      suppressedReason_ru: northAndFrozen
        ? "Зимой северный Каспий замерзает — надо льдом холодно, как над сушей, контраст обратный. Бриз не рассчитывается."
        : null,
      suppressedReason_en: northAndFrozen
        ? "In winter the northern Caspian freezes — over ice it is as cold as over land, so the contrast is reversed. The breeze is not computed."
        : null,
      now: {
        time: now.time,
        hour: now.hour,
        onshore: now.onshore,
        windMs: now.windMs,
        tempLand: now.tempLand,
        tempSea: now.tempSea,
        deltaT: now.deltaT,
      },
      criteria,
      criteriaMet: Object.values(criteria).filter(Boolean).length,
      confidence: northAndFrozen ? ("none" as const) : confidence,
      landBreeze,
      downgraded: city.distanceKm >= 25,
      signature: { amplitude: signature.amplitude, hasSignature: signature.hasSignature },
      byHour: signature.byHour,
      fumigation: fumigationRangeKm(),
    };
  });

  return NextResponse.json({
    available: true,
    validate,
    fetched_at: new Date().toISOString(),
    source_id: "open_meteo",
    method:
      "Two-point land/sea contrast · onshore component vs coast normal · five criteria · diurnal signature test",
    cities: results,
    excluded: excludedCities(),
  });
}

/** Cities deliberately not computed, with the reason kept attached. */
function excludedCities() {
  return BREEZE_CITIES.filter((c) => !c.applicable).map((c) => ({
    id: c.id,
    name_kk: c.name_kk,
    name_ru: c.name_ru,
    name_en: c.name_en,
    distanceKm: c.distanceKm,
    reason_kk: c.caveat_kk,
    reason_ru: c.caveat_ru,
    reason_en: c.caveat_en,
  }));
}
