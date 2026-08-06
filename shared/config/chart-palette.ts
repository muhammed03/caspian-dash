/**
 * Series colours for every chart.
 *
 * Validated against the white chart surface on all six checks — lightness
 * band, chroma floor, CVD separation on adjacent pairs, normal-vision floor
 * and contrast. Order is deliberate: warm and green hues are never adjacent,
 * which is where red-green colour blindness fails. Assign slots in order and
 * never cycle past the end.
 */
export const SERIES = [
  "#1d6fd0", // 1 blue
  "#c2410c", // 2 orange
  "#0f8f66", // 3 aqua
  "#a16207", // 4 amber
  "#be185d", // 5 magenta
  "#5b21b6", // 6 violet
] as const;

/** Magnitude ramp, single hue, light → dark. */
export const SEQUENTIAL = ["#cfe2f8", "#8fbdf0", "#4a90dd", "#1d6fd0", "#124a8c"] as const;

/** Reserved state colours — never reused as a series. */
export const STATUS = {
  good: "#0f8f66",
  warning: "#a16207",
  serious: "#c2410c",
  critical: "#be185d",
} as const;

export const CHART_INK = {
  primary: "#0a0a0a",
  secondary: "#595959",
  muted: "#6f6f6f",
  grid: "#eeeeec",
  surface: "#ffffff",
} as const;

export const AXIS_PROPS = {
  stroke: CHART_INK.muted,
  tick: { fill: CHART_INK.secondary, fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;
