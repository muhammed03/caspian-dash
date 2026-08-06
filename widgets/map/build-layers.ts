"use client";

import { GeoJsonLayer, ScatterplotLayer, TextLayer, LineLayer, PathLayer } from "@deck.gl/layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import type { Layer, PickingInfo } from "@deck.gl/core";
import type { Locale } from "@/shared/lib/i18n";
import type { AirReading, WindPoint } from "./use-map-data";

type RGB = [number, number, number];
const CYAN: RGB = [34, 211, 238];
const AMBER: RGB = [245, 158, 11];
const ROSE: RGB = [251, 113, 133];
const RED: RGB = [239, 68, 68];
const TEAL: RGB = [45, 212, 191];
const FOAM: RGB = [226, 232, 240];

/** European AQI bands → colour, used by both the map and the legend. */
export function aqiColor(eaqi: number | null): RGB {
  if (eaqi === null) return [100, 116, 139];
  if (eaqi <= 20) return [52, 211, 153];
  if (eaqi <= 40) return [163, 230, 53];
  if (eaqi <= 60) return [251, 191, 36];
  if (eaqi <= 80) return [251, 146, 60];
  return [239, 68, 68];
}

type BuildArgs = {
  active: Set<string>;
  locale: Locale;
  year: number;
  basemapCountries?: GeoJSON.FeatureCollection;
  basemapCaspian?: GeoJSON.FeatureCollection;
  basemapLakes?: GeoJSON.FeatureCollection;
  basemapRivers?: GeoJSON.FeatureCollection;
  coastline?: GeoJSON.FeatureCollection;
  baseCoastline?: GeoJSON.FeatureCollection;
  caspian?: GeoJSON.FeatureCollection;
  cities?: GeoJSON.FeatureCollection;
  countries?: GeoJSON.FeatureCollection;
  factories?: GeoJSON.FeatureCollection;
  koshkar?: { coordinates: [number, number]; name_kk: string; name_ru: string; waste_mt: number };
  air?: AirReading[];
  wind?: WindPoint[];
  wildlife?: {
    habitats: {
      id: string;
      kind: string;
      name_kk: string;
      name_ru: string;
      coords: [number, number];
      population: number;
      threat: string;
    }[];
  };
  resources?: {
    fields: { id: string; name_kk: string; name_ru: string; coords: [number, number]; kind: string; reserves_bbl: number }[];
  };
  availability?: { countries: { iso3: string; name_kk: string; name_ru: string; score: number }[] };
  onHover: (info: PickingInfo, kind: string) => void;
  onClick: (kind: string, payload: Record<string, unknown>) => void;
};

const HABITAT_COLORS: Record<string, RGB> = {
  seal: [56, 189, 248],
  sturgeon: [167, 139, 250],
  bird: [52, 211, 153],
};

export function buildLayers(args: BuildArgs): Layer[] {
  const { active, locale, year, onHover, onClick } = args;
  const nameOf = (o: Record<string, unknown>) =>
    String((locale === "ru" ? o.name_ru : o.name_kk) ?? o.name_en ?? "");
  const layers: Layer[] = [];

  /* --- basemap: land, sea and the lit shoreline, all from committed data --- */
  if (args.basemapCountries) {
    layers.push(
      new GeoJsonLayer({
        id: "base-land",
        data: args.basemapCountries,
        filled: true,
        stroked: true,
        getFillColor: [13, 23, 34, 255],
        getLineColor: [34, 54, 74, 190],
        getLineWidth: 1,
        lineWidthUnits: "pixels",
        parameters: { depthTest: false },
      })
    );
  }
  if (args.basemapCaspian) {
    layers.push(
      new GeoJsonLayer({
        id: "base-sea",
        data: args.basemapCaspian,
        filled: true,
        stroked: false,
        getFillColor: [7, 26, 38, 255],
        parameters: { depthTest: false },
      })
    );
    // wide, soft stroke under a crisp one reads as a glow without a shader
    layers.push(
      new GeoJsonLayer({
        id: "base-sea-halo",
        data: args.basemapCaspian,
        filled: false,
        stroked: true,
        getLineColor: [...CYAN, 45] as [number, number, number, number],
        getLineWidth: 6,
        lineWidthUnits: "pixels",
        parameters: { depthTest: false },
      })
    );
    layers.push(
      new GeoJsonLayer({
        id: "base-sea-edge",
        data: args.basemapCaspian,
        filled: false,
        stroked: true,
        getLineColor: [...CYAN, 130] as [number, number, number, number],
        getLineWidth: 1.2,
        lineWidthUnits: "pixels",
        parameters: { depthTest: false },
      })
    );
  }
  if (args.basemapLakes) {
    layers.push(
      new GeoJsonLayer({
        id: "base-lakes",
        data: args.basemapLakes,
        filled: true,
        stroked: false,
        getFillColor: [10, 26, 36, 220],
        parameters: { depthTest: false },
      })
    );
  }
  if (args.basemapRivers) {
    layers.push(
      new GeoJsonLayer({
        id: "base-rivers",
        data: args.basemapRivers,
        filled: false,
        stroked: true,
        getLineColor: [...TEAL, 70] as [number, number, number, number],
        getLineWidth: 1,
        lineWidthUnits: "pixels",
        parameters: { depthTest: false },
      })
    );
  }

  /* --- water: exposed seabed between the 1992 shore and the current one --- */
  if (active.has("exposed-bed") && args.baseCoastline && args.coastline) {
    layers.push(
      new GeoJsonLayer({
        id: "exposed-bed",
        data: args.baseCoastline,
        filled: true,
        stroked: false,
        getFillColor: [...AMBER, 55] as [number, number, number, number],
        parameters: { depthTest: false },
      })
    );
    layers.push(
      new GeoJsonLayer({
        id: "exposed-bed-mask",
        data: args.coastline,
        filled: true,
        stroked: false,
        getFillColor: [7, 26, 38, 255] as [number, number, number, number],
        parameters: { depthTest: false },
      })
    );
  }

  /* --- water: shoreline for the selected year over the 1992 reference --- */
  if (active.has("coastline-year")) {
    if (args.baseCoastline) {
      layers.push(
        new GeoJsonLayer({
          id: "coastline-base",
          data: args.baseCoastline,
          filled: false,
          stroked: true,
          getLineColor: [100, 116, 139, 150],
          getLineWidth: 1,
          lineWidthUnits: "pixels",
          lineWidthMinPixels: 1,
        })
      );
    }
    if (args.coastline) {
      layers.push(
        new GeoJsonLayer({
          id: `coastline-${year}`,
          data: args.coastline,
          filled: false,
          stroked: true,
          getLineColor: [...CYAN, 235] as [number, number, number, number],
          getLineWidth: 2,
          lineWidthUnits: "pixels",
          lineWidthMinPixels: 1.5,
          transitions: { getLineColor: 400 },
          updateTriggers: { getLineColor: year },
        })
      );
    }
  }

  /* --- water: rivers sized by annual flow --- */
  if (active.has("rivers-flow") && args.wildlife === undefined) {
    // handled by the basemap style; nothing extra needed here
  }

  /* --- pollution: live AQI heat + station dots --- */
  if (active.has("air-quality") && args.air?.length) {
    layers.push(
      new HeatmapLayer<AirReading>({
        id: "air-heat",
        data: args.air,
        getPosition: (d) => [d.lon, d.lat],
        getWeight: (d) => d.eaqi ?? d.pm2_5 ?? 1,
        radiusPixels: 90,
        intensity: 1.1,
        threshold: 0.06,
        colorRange: [
          [52, 211, 153, 40],
          [163, 230, 53, 80],
          [251, 191, 36, 120],
          [251, 146, 60, 160],
          [239, 68, 68, 200],
        ],
      })
    );
    layers.push(
      new ScatterplotLayer<AirReading>({
        id: "air-stations",
        data: args.air,
        pickable: true,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: 6,
        radiusUnits: "pixels",
        radiusMinPixels: 5,
        getFillColor: (d) => aqiColor(d.eaqi),
        stroked: true,
        lineWidthUnits: "pixels",
        getLineWidth: 1.5,
        getLineColor: [5, 7, 11, 220],
        onHover: (info) => onHover(info, "air"),
        onClick: (info) => info.object && onClick("air", info.object as unknown as Record<string, unknown>),
      })
    );
  }

  /* --- pollution: live wind arrows --- */
  if (active.has("wind") && args.wind?.length) {
    layers.push(
      new LineLayer<WindPoint>({
        id: "wind-arrows",
        data: args.wind,
        getSourcePosition: (d) => [d.lon, d.lat],
        getTargetPosition: (d) => {
          // direction is where the wind comes FROM, so add 180°
          const rad = ((d.direction + 180) * Math.PI) / 180;
          const len = Math.min(d.speed / 18, 1.2);
          return [d.lon + Math.sin(rad) * len, d.lat + Math.cos(rad) * len];
        },
        getColor: [...CYAN, 170] as [number, number, number, number],
        getWidth: 1.6,
        widthUnits: "pixels",
      })
    );
  }

  /* --- pollution: industry, radius by reported emissions --- */
  if (active.has("factories") && args.factories) {
    const feats = args.factories.features;
    layers.push(
      new ScatterplotLayer<GeoJSON.Feature>({
        id: "factories",
        data: feats,
        pickable: true,
        getPosition: (f) => (f.geometry as GeoJSON.Point).coordinates as [number, number],
        getRadius: (f) => Math.sqrt(Number(f.properties?.emissions_t ?? 1000)) * 55,
        radiusMinPixels: 5,
        radiusMaxPixels: 34,
        getFillColor: [...ROSE, 110] as [number, number, number, number],
        stroked: true,
        lineWidthUnits: "pixels",
        getLineWidth: 1.2,
        getLineColor: [...ROSE, 220] as [number, number, number, number],
        onHover: (info) => onHover(info, "factory"),
        onClick: (info) =>
          info.object && onClick("factory", (info.object as GeoJSON.Feature).properties ?? {}),
      })
    );
  }

  /* --- pollution: Koshkar-Ata gets its own pulsing marker --- */
  if (active.has("koshkar-ata") && args.koshkar) {
    layers.push(
      new ScatterplotLayer({
        id: "koshkar-ata",
        data: [args.koshkar],
        pickable: true,
        getPosition: (d: typeof args.koshkar) => d!.coordinates,
        getRadius: 9000,
        radiusMinPixels: 10,
        radiusMaxPixels: 40,
        getFillColor: [...RED, 90] as [number, number, number, number],
        stroked: true,
        lineWidthUnits: "pixels",
        getLineWidth: 2,
        getLineColor: [...RED, 255] as [number, number, number, number],
        onHover: (info) => onHover(info, "koshkar"),
        onClick: (info) => info.object && onClick("koshkar", info.object as Record<string, unknown>),
      })
    );
  }

  /* --- life: habitats coloured by species --- */
  if (active.has("habitats") && args.wildlife?.habitats) {
    layers.push(
      new ScatterplotLayer({
        id: "habitats",
        data: args.wildlife.habitats,
        pickable: true,
        getPosition: (d) => d.coords,
        getRadius: (d) => Math.sqrt(Math.max(d.population, 5000)) * 45,
        radiusMinPixels: 6,
        radiusMaxPixels: 40,
        getFillColor: (d) => [...(HABITAT_COLORS[d.kind] ?? TEAL), 105] as [number, number, number, number],
        stroked: true,
        lineWidthUnits: "pixels",
        getLineWidth: 1.2,
        getLineColor: (d) => [...(HABITAT_COLORS[d.kind] ?? TEAL), 230] as [number, number, number, number],
        onHover: (info) => onHover(info, "habitat"),
        onClick: (info) => info.object && onClick("habitat", info.object as Record<string, unknown>),
      })
    );
  }

  /* --- resources: oil and gas fields --- */
  if (active.has("fields") && args.resources?.fields) {
    layers.push(
      new ScatterplotLayer({
        id: "fields",
        data: args.resources.fields,
        pickable: true,
        getPosition: (d) => d.coords,
        getRadius: (d) => Math.sqrt(d.reserves_bbl) * 9000,
        radiusMinPixels: 6,
        radiusMaxPixels: 42,
        getFillColor: (d) =>
          (d.kind === "gas" ? [96, 165, 250, 105] : [245, 158, 11, 105]) as [number, number, number, number],
        stroked: true,
        lineWidthUnits: "pixels",
        getLineWidth: 1.2,
        getLineColor: (d) =>
          (d.kind === "gas" ? [96, 165, 250, 235] : [245, 158, 11, 235]) as [number, number, number, number],
        onHover: (info) => onHover(info, "field"),
        onClick: (info) => info.object && onClick("field", info.object as Record<string, unknown>),
      })
    );
  }

  /* --- index: how open each country's environmental data actually is --- */
  if (active.has("data-availability") && args.countries && args.availability) {
    const byIso = new Map(args.availability.countries.map((c) => [c.iso3, c]));
    layers.push(
      new GeoJsonLayer({
        id: "data-availability",
        data: args.countries,
        pickable: true,
        filled: true,
        stroked: true,
        getFillColor: (f: GeoJSON.Feature) => {
          const entry = byIso.get(String(f.properties?.iso3));
          if (!entry) return [15, 23, 32, 0];
          const t = entry.score / 100;
          return [
            Math.round(239 - 187 * t),
            Math.round(68 + 143 * t),
            Math.round(68 + 85 * t),
            70,
          ] as [number, number, number, number];
        },
        getLineColor: [148, 163, 184, 70],
        getLineWidth: 1,
        lineWidthUnits: "pixels",
        onHover: (info) => onHover(info, "availability"),
        onClick: (info) => {
          const iso = String((info.object as GeoJSON.Feature)?.properties?.iso3 ?? "");
          const entry = byIso.get(iso);
          if (entry) onClick("availability", entry as unknown as Record<string, unknown>);
        },
      })
    );
  }

  /* --- city labels, always last so they sit on top --- */
  if (active.has("cities") && args.cities) {
    layers.push(
      new TextLayer<GeoJSON.Feature>({
        id: "city-labels",
        data: args.cities.features,
        getPosition: (f) => (f.geometry as GeoJSON.Point).coordinates as [number, number],
        getText: (f) => nameOf(f.properties ?? {}),
        getSize: 11,
        sizeUnits: "pixels",
        getColor: [...FOAM, 200] as [number, number, number, number],
        getPixelOffset: [0, -12],
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 500,
        outlineColor: [5, 7, 11, 255],
        outlineWidth: 3,
        fontSettings: { sdf: true, buffer: 8 },
        characterSet: "auto",
      })
    );
  }

  return layers;
}
