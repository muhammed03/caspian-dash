import { z } from "zod";

/**
 * The output contract from the project spec (§5.3). The generator forces the
 * model into this shape and validates before writing to disk, so a malformed
 * answer never reaches the UI.
 */
export const insightSchema = z.object({
  summary: z.string().min(10).max(400),
  trend: z.object({
    direction: z.enum(["up", "down", "stable"]),
    rate_percent: z.number(),
    period: z.string(),
  }),
  anomalies: z
    .array(
      z.object({
        metric: z.string(),
        value: z.number(),
        norm: z.number(),
        deviation_percent: z.number(),
      })
    )
    .max(5),
  risk_level: z.enum(["low", "medium", "high", "critical"]),
  risk_reason: z.string().min(5).max(400),
  forecast: z.object({
    horizon_years: z.number().int(),
    expected_value: z.number(),
    unit: z.string(),
    confidence: z.enum(["low", "medium", "high"]),
  }),
  recommendations: z.array(z.string()).min(1).max(5),
  data_quality_note: z.string().max(400),
});

export type Insight = z.infer<typeof insightSchema>;

export const INSIGHT_MODULES = ["water", "pollution", "life", "resources", "index"] as const;
export type InsightModule = (typeof INSIGHT_MODULES)[number];
