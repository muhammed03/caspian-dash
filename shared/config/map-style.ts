import type { StyleSpecification } from "maplibre-gl";

/**
 * Basemap built entirely from data committed to the repo — no tile server, no
 * API key, works with the network cable pulled out. Deep navy land, lit
 * shoreline, everything else stays out of the way of the data layers.
 */
export const CASPIAN_CENTER: [number, number] = [50.9, 42.6];
export const CASPIAN_BOUNDS: [[number, number], [number, number]] = [
  [40.0, 33.0],
  [62.0, 50.5],
];

export function buildMapStyle(): StyleSpecification {
  return {
    version: 8,
    name: "Caspian Watch Dark",
    // No glyphs entry: all labels are drawn by deck.gl's TextLayer, which
    // rasterises system fonts instead of needing PBF glyph packs.
    sources: {
      countries: { type: "geojson", data: "/api/data/geo%2Fcountries" },
      caspian: { type: "geojson", data: "/api/data/geo%2Fcaspian" },
      lakes: { type: "geojson", data: "/api/data/geo%2Flakes" },
      riversGeo: { type: "geojson", data: "/api/data/geo%2Frivers-geo" },
      cities: { type: "geojson", data: "/api/data/geo%2Fcities" },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": "#05070b" },
      },
      {
        id: "land",
        type: "fill",
        source: "countries",
        paint: { "fill-color": "#0d1722", "fill-opacity": 1 },
      },
      {
        id: "land-border",
        type: "line",
        source: "countries",
        paint: {
          "line-color": "#22364a",
          "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.4, 8, 1.2],
        },
      },
      {
        id: "sea",
        type: "fill",
        source: "caspian",
        paint: { "fill-color": "#071a26", "fill-opacity": 0.95 },
      },
      {
        id: "sea-glow",
        type: "line",
        source: "caspian",
        paint: {
          "line-color": "#22d3ee",
          "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.6, 9, 2.4],
          "line-opacity": 0.35,
          "line-blur": ["interpolate", ["linear"], ["zoom"], 3, 2, 9, 6],
        },
      },
      {
        id: "lakes",
        type: "fill",
        source: "lakes",
        paint: { "fill-color": "#0a1a24", "fill-opacity": 0.8 },
      },
      {
        id: "rivers",
        type: "line",
        source: "riversGeo",
        paint: {
          "line-color": "#2dd4bf",
          "line-opacity": 0.28,
          "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 9, 2],
        },
      },
      {
        id: "city-dot",
        type: "circle",
        source: "cities",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 2.5, 9, 5],
          "circle-color": "#e2e8f0",
          "circle-opacity": 0.85,
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(34,211,238,0.5)",
        },
      },
    ],
  };
}
