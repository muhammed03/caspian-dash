/**
 * Series colours for every chart on the site.
 *
 * Validated for the dark chart surface (#09131c) against the six checks —
 * lightness band, chroma floor, CVD separation on adjacent pairs, normal-vision
 * floor, and contrast — so the order below is deliberate: green and rose are
 * never neighbours, which is where deuteranopia fails. Assign slots in order;
 * never cycle past the end, never re-colour on filter.
 *
 * UI chrome keeps the brighter brand cyan; only data marks use these.
 */
export const SERIES = [
  "#0e94ad", // 1 aqua
  "#c04a72", // 2 rose
  "#a86f00", // 3 amber
  "#7a6fd6", // 4 violet
  "#12855f", // 5 green
  "#2f74c4", // 6 blue
] as const;

/** Magnitude ramp, single hue, light → dark. */
export const SEQUENTIAL = ["#8fe3f0", "#4fc4dc", "#0e94ad", "#0a6a7d", "#07444f"] as const;

/** Reserved state colours — never reused as a series. */
export const STATUS = {
  good: "#12855f",
  warning: "#a86f00",
  serious: "#c05621",
  critical: "#c04a72",
} as const;

export const CHART_INK = {
  primary: "#e2e8f0",
  secondary: "rgba(226,232,240,0.62)",
  muted: "rgba(226,232,240,0.38)",
  grid: "rgba(226,232,240,0.07)",
  surface: "#09131c",
} as const;

export const AXIS_PROPS = {
  stroke: CHART_INK.muted,
  tick: { fill: CHART_INK.secondary, fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;
