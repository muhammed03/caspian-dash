import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

/** Modelled shoreline for one year. See /methodology for how it is derived. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const { year } = await params;
  if (!/^\d{4}$/.test(year)) {
    return NextResponse.json({ error: "bad year" }, { status: 400 });
  }

  try {
    const raw = await readFile(join(process.cwd(), "data", "coastlines", `${year}.geojson`), "utf8");
    return new NextResponse(raw, {
      headers: {
        "content-type": "application/geo+json; charset=utf-8",
        "cache-control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "year not available" }, { status: 404 });
  }
}
