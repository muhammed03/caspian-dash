/**
 * Generates the AI analysis for every dashboard, offline, and caches it in
 * data/ai/{module}.{locale}.json.
 *
 * The model never sees prose or images — only the aggregated numbers already
 * on the page — and is forced through a tool schema, so it summarises and
 * classifies rather than inventing figures. Because the results are committed,
 * the demo needs no API key and no network.
 *
 * Usage: ANTHROPIC_API_KEY=… npx tsx scripts/pipeline/gen-insights.ts
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { insightSchema, INSIGHT_MODULES, type InsightModule } from "../../entities/ai-insight/schema";

const DATA = join(process.cwd(), "data");
const OUT = join(DATA, "ai");
mkdirSync(OUT, { recursive: true });

const MODEL = "claude-sonnet-4-6";
const LOCALES = ["kk", "ru"] as const;

function load<T>(name: string): T {
  return JSON.parse(readFileSync(join(DATA, name), "utf8"));
}

/** Aggregates each dashboard down to the numbers a reviewer would quote. */
function payloadFor(module: InsightModule): Record<string, unknown> {
  const seaLevel = load<{ series: { year: number; level_m: number; area_km2: number; volume_km3: number }[] }>("sea-level.json");
  const series = seaLevel.series;
  const last = series.at(-1)!;

  switch (module) {
    case "water": {
      const y2015 = series.find((r) => r.year === 2015)!;
      const rate = ((last.level_m - y2015.level_m) / (last.year - 2015)) * 100;
      return {
        indicator: "Caspian Sea level and volume",
        level_m_now: last.level_m,
        level_m_1992: series[0].level_m,
        area_km2_now: last.area_km2,
        area_lost_km2: series[0].area_km2 - last.area_km2,
        volume_km3_now: last.volume_km3,
        decline_rate_cm_per_year_since_2015: Number(rate.toFixed(1)),
        historic_minimum_threshold_m: -29,
        rivers: load<{ rivers: { name_ru: string; current: number; historic_1930: number }[] }>("rivers.json").rivers.map((r) => ({
          river: r.name_ru,
          flow_now_km3: r.current,
          flow_1930s_km3: r.historic_1930,
        })),
        water_balance: load("water-balance.json"),
        coastline_retreat: load<{ years: { year: number; max_retreat_m: number }[] }>("coastline-index.json").years
          .filter((y) => [2015, 2020, 2025, 2035].includes(y.year))
          .map((y) => ({ year: y.year, max_retreat_m: y.max_retreat_m })),
        data_status: { sea_level: "semi (reconstructed from published rates)", coastline: "semi (model)" },
      };
    }
    case "pollution": {
      const pollution = load<Record<string, unknown>>("pollution.json");
      const factories = load<{ features: { properties: Record<string, unknown> }[] }>("factories.geojson");
      return {
        indicator: "Pollution and air quality around the Caspian",
        structure_percent: pollution.structure,
        water_purity_index: pollution.purity_index,
        health_estimate: pollution.health,
        koshkar_ata: load("koshkar-ata.json"),
        top_emitters: factories.features
          .map((f) => ({ name: f.properties.name_ru, emissions_t_per_year: f.properties.emissions_t }))
          .sort((a, b) => Number(b.emissions_t_per_year) - Number(a.emissions_t_per_year))
          .slice(0, 5),
        note: "AQI is fetched live from Open-Meteo/CAMS at runtime and is not part of this payload.",
        data_status: { emissions: "semi", purity_index: "model", health: "model (WHO methodology)" },
      };
    }
    case "life": {
      const wildlife = load<Record<string, Record<string, unknown>>>("wildlife.json");
      return {
        indicator: "Caspian flora and fauna",
        seal: {
          iucn_status: wildlife.seal.iucn_status,
          decline_percent_since_1900: wildlife.seal.decline_percent,
          population_estimates: wildlife.seal.estimates,
          aerial_counts: wildlife.seal.aerial_counts,
          mass_mortality_events: wildlife.seal.mass_mortality,
        },
        sturgeon: {
          iucn_status: wildlife.sturgeon.iucn_status,
          catch_series_tonnes: wildlife.sturgeon.catch_series,
          illegal_catch_multiplier: wildlife.sturgeon.iuu_multiplier,
        },
        greening_ndvi: wildlife.greening,
        data_status: {
          seal: "semi — sources disagree by a factor of four, report the range",
          sturgeon: "semi — official catch statistics understate reality due to IUU fishing",
        },
      };
    }
    case "resources": {
      const resources = load<Record<string, unknown>>("resources.json");
      return {
        indicator: "Caspian hydrocarbon reserves and production",
        ...resources,
        data_status: { iran_turkmenistan: "effectively closed, estimates only" },
      };
    }
    case "index": {
      const pollution = load<{ purity_index: { value: number }[] }>("pollution.json");
      const wildlife = load<Record<string, Record<string, unknown>>>("wildlife.json");
      return {
        indicator: "Composite Caspian ecological index",
        sea_level_m: last.level_m,
        area_lost_km2_since_1992: series[0].area_km2 - last.area_km2,
        mean_water_purity: Math.round(
          pollution.purity_index.reduce((s, r) => s + r.value, 0) / pollution.purity_index.length
        ),
        seal_decline_percent: wildlife.seal.decline_percent,
        sturgeon_catch_collapse: "30000 t (1977) → 120 t (2020)",
        data_availability: load("data-availability.json"),
      };
    }
  }
}

const SYSTEM = `You are the analysis engine of Caspian Watch, an environmental monitoring platform for the Caspian Sea.

Hard rules:
1. You NEVER invent numbers. Every figure you cite must be present in the JSON payload you are given.
2. You classify and explain; you do not measure. The measurements come from the platform's deterministic models.
3. If the payload marks data as "semi", "model" or otherwise uncertain, you MUST say so in data_quality_note.
4. Risk level thresholds: low = indicator within historical norm; medium = deviation up to 25% from norm or a slow adverse trend; high = deviation 25-50%, or an accelerating adverse trend, or a protected species declining; critical = deviation over 50%, an irreversible loss, or a direct threat to human settlements.
5. Causal claims are allowed ONLY between variables present in the payload. No speculation.
6. Never accuse a named company, official or country of wrongdoing. Describe statistical deviations neutrally.
7. Recommendations must be concrete and addressed to authorities, scientists or the public.
8. Write in the requested language, in a precise, non-alarmist register.`;

type ToolInput = Record<string, unknown>;

async function generate(module: InsightModule, locale: (typeof LOCALES)[number], payload: unknown) {
  const language = locale === "kk" ? "Kazakh (қазақша)" : "Russian (по-русски)";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      tool_choice: { type: "tool", name: "report" },
      tools: [
        {
          name: "report",
          description: "Return the structured analysis of this dashboard.",
          input_schema: {
            type: "object",
            required: [
              "summary",
              "trend",
              "anomalies",
              "risk_level",
              "risk_reason",
              "forecast",
              "recommendations",
              "data_quality_note",
            ],
            properties: {
              summary: { type: "string", description: "1-2 sentence conclusion" },
              trend: {
                type: "object",
                required: ["direction", "rate_percent", "period"],
                properties: {
                  direction: { type: "string", enum: ["up", "down", "stable"] },
                  rate_percent: { type: "number" },
                  period: { type: "string" },
                },
              },
              anomalies: {
                type: "array",
                maxItems: 5,
                items: {
                  type: "object",
                  required: ["metric", "value", "norm", "deviation_percent"],
                  properties: {
                    metric: { type: "string" },
                    value: { type: "number" },
                    norm: { type: "number" },
                    deviation_percent: { type: "number" },
                  },
                },
              },
              risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
              risk_reason: { type: "string" },
              forecast: {
                type: "object",
                required: ["horizon_years", "expected_value", "unit", "confidence"],
                properties: {
                  horizon_years: { type: "integer" },
                  expected_value: { type: "number" },
                  unit: { type: "string" },
                  confidence: { type: "string", enum: ["low", "medium", "high"] },
                },
              },
              recommendations: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
              data_quality_note: { type: "string" },
            },
          },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Analyse this dashboard payload and call the report tool. Write all text fields in ${language}.\n\n${JSON.stringify(
            payload,
            null,
            2
          )}`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
  const body = await res.json();
  const toolUse = body.content?.find((c: { type: string }) => c.type === "tool_use");
  if (!toolUse) throw new Error("model did not call the tool");
  return insightSchema.parse(toolUse.input as ToolInput);
}

async function main() {
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  if (!hasKey) {
    console.error(
      "ANTHROPIC_API_KEY is not set — nothing to do.\n" +
        "The committed files in data/ai/ are what the app serves; this script only refreshes them."
    );
    process.exit(1);
  }

  for (const module of INSIGHT_MODULES) {
    const payload = payloadFor(module);
    const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 16);

    for (const locale of LOCALES) {
      const file = join(OUT, `${module}.${locale}.json`);
      if (existsSync(file)) {
        const prev = JSON.parse(readFileSync(file, "utf8"));
        if (prev.data_hash === hash) {
          console.log(`${module}.${locale}: unchanged (${hash}), skipped`);
          continue;
        }
      }
      const insight = await generate(module, locale, payload);
      writeFileSync(
        file,
        JSON.stringify(
          {
            module,
            locale,
            model: MODEL,
            data_hash: hash,
            generated_at: new Date().toISOString(),
            insight,
          },
          null,
          2
        )
      );
      console.log(`${module}.${locale}: written (risk=${insight.risk_level})`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
