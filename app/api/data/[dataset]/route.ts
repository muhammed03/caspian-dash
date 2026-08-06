import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

/**
 * Serves the precomputed datasets from data/. Everything the demo needs is on
 * disk, so the platform runs with no network at all.
 */
const ALLOWED = new Set([
  "sources",
  "sea-level",
  "water-balance",
  "rivers",
  "water-consumption",
  "pollution",
  "koshkar-ata",
  "factories",
  "monitored-cities",
  "wildlife",
  "resources",
  "data-availability",
  "coastline-index",
  "geo/caspian",
  "geo/coastline",
  "geo/countries",
  "geo/cities",
  "geo/lakes",
  "geo/rivers-geo",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dataset: string }> }
) {
  const { dataset } = await params;
  const name = decodeURIComponent(dataset);

  const isCoastlineYear = /^coastlines\/\d{4}$/.test(name);
  if (!ALLOWED.has(name) && !isCoastlineYear) {
    return NextResponse.json({ error: "unknown dataset" }, { status: 404 });
  }

  const ext = name === "factories" || name.startsWith("geo/") || isCoastlineYear ? "geojson" : "json";

  try {
    const raw = await readFile(join(process.cwd(), "data", `${name}.${ext}`), "utf8");
    return new NextResponse(raw, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "dataset not found" }, { status: 404 });
  }
}
