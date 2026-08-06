import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

/**
 * Basemap geometry. Kept on its own clean path (no encoded slashes) because
 * MapLibre normalises source URLs before fetching them.
 */
const ALLOWED = new Set(["caspian", "coastline", "countries", "cities", "lakes", "rivers-geo"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!ALLOWED.has(name)) {
    return NextResponse.json({ error: "unknown layer" }, { status: 404 });
  }

  try {
    const raw = await readFile(join(process.cwd(), "data", "geo", `${name}.geojson`), "utf8");
    return new NextResponse(raw, {
      headers: {
        "content-type": "application/geo+json; charset=utf-8",
        "cache-control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "layer not found" }, { status: 404 });
  }
}
