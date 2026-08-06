"use client";

import { GeoJsonLayer, ScatterplotLayer, TextLayer, LineLayer, PolygonLayer } from "@deck.gl/layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import type { Layer, PickingInfo } from "@deck.gl/core";
import type { Locale } from "@/shared/lib/i18n";
import type { AirReading, WindPoint } from "./use-map-data";
import type { PlumeFacility, PlumeFrame } from "@/entities/plume/use-plume";

type RGB = [number, number, number];
const CYAN: RGB = [29, 111, 208];   // accent blue
const AMBER: RGB = [194, 65, 12];   // exposed seabed
const ROSE: RGB = [190, 24, 93];    // industry
const RED: RGB = [159, 18, 57];     // Koshkar-Ata
const TEAL: RGB = [15, 143, 102];
const FOAM: RGB = [10, 10, 10];

/** European AQI bands → colour, used by both the map and the legend. */
export function aqiColor(eaqi: number | null): RGB {
  if (eaqi === null) return [100, 116, 139];
  if (eaqi <= 20) return [15, 143, 102];
  if (eaqi <= 40) return [132, 160, 22];
  if (eaqi <= 60) return [161, 98, 7];
  if (eaqi <= 80) return [194, 65, 12];
  return [159, 18, 57];
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
  /** Dispersion cones for the hour currently being shown. */
  plume?: { facility: PlumeFacility; frame: PlumeFrame; detected: boolean }[];
  onHover: (info: PickingInfo, kind: string) => void;
  onClick: (kind: string, payload: Record<string, unknown>) => void;
};

const HABITAT_COLORS: Record<string, RGB> = {
  seal: [29, 111, 208],
  sturgeon: [91, 33, 182],
  bird: [15, 143, 102],
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
        getFillColor: [244, 244, 240, 255],
        getLineColor: [198, 198, 192, 255],
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
        getFillColor: [207, 226, 248, 255],
        parameters: { depthTest: false },
      })
    );
    // wide soft stroke under a crisp one gives the coast a printed edge
    layers.push(
      new GeoJsonLayer({
        id: "base-sea-halo",
        data: args.basemapCaspian,
        filled: false,
        stroked: true,
        getLineColor: [29, 111, 208, 45],
        getLineWidth: 5,
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
        getLineColor: [29, 111, 208, 220],
        getLineWidth: 1,
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
        getFillColor: [223, 235, 248, 255],
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
        getLineColor: [120, 150, 175, 190],
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
        getFillColor: [240, 226, 214, 255] as [number, number, number, number],
        parameters: { depthTest: false },
      })
    );
    layers.push(
      new GeoJsonLayer({
        id: "exposed-bed-mask",
        data: args.coastline,
        filled: true,
        stroked: false,
        getFillColor: [207, 226, 248, 255] as [number, number, number, number],
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
          getLineColor: [150, 150, 145, 210],
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
          getLineColor: [29, 111, 208, 255] as [number, number, number, number],
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
          [15, 143, 102, 35],
          [132, 160, 22, 70],
          [161, 98, 7, 110],
          [194, 65, 12, 150],
          [159, 18, 57, 190],
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

  /* --- pollution: modelled dispersion cone, one per facility ---
     Colour carries meaning and is not decorative: a solid red cone is only
     drawn where the air-quality reading actually shows elevated pollution.
     Otherwise it is a dashed blue "this is simply where the wind would carry
     it" sector — drawing a red plume out of a named company on a clean day
     would be both wrong and unfair. */
  if (active.has("plume") && args.plume?.length) {
    layers.push(
      new PolygonLayer({
        id: "plume-fill",
        data: args.plume,
        pickable: true,
        getPolygon: (d) => d.frame.cone,
        filled: true,
        stroked: false,
        getFillColor: (d) =>
          d.detected
            ? ([239, 68, 68, 60] as [number, number, number, number])
            : ([56, 165, 235, 46] as [number, number, number, number]),
        parameters: { depthTest: false },
        transitions: { getPolygon: 380 },
        updateTriggers: { getPolygon: args.plume.map((p) => p.frame.time).join(), getFillColor: args.plume.map((p) => p.detected).join() },
        onHover: (info) => onHover(info, "plume"),
        onClick: (info) => info.object && onClick("plume", info.object as Record<string, unknown>),
      })
    );
    // A narrow F-class cone reads better as an outline than as a fill, so the
    // outline stays fully opaque even when the sector is only a few degrees.
    layers.push(
      new PolygonLayer({
        id: "plume-edge",
        data: args.plume,
        getPolygon: (d) => d.frame.cone,
        filled: false,
        stroked: true,
        getLineColor: (d) =>
          d.detected
            ? ([225, 29, 72, 255] as [number, number, number, number])
            : ([14, 116, 190, 235] as [number, number, number, number]),
        getLineWidth: 2.2,
        lineWidthUnits: "pixels",
        parameters: { depthTest: false },
        transitions: { getPolygon: 380 },
        updateTriggers: { getPolygon: args.plume.map((p) => p.frame.time).join(), getLineColor: args.plume.map((p) => p.detected).join() },
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
          (d.kind === "gas" ? [29, 111, 208, 120] : [161, 98, 7, 120]) as [number, number, number, number],
        stroked: true,
        lineWidthUnits: "pixels",
        getLineWidth: 1.2,
        getLineColor: (d) =>
          (d.kind === "gas" ? [29, 111, 208, 240] : [161, 98, 7, 240]) as [number, number, number, number],
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
        getColor: [10, 10, 10, 235],
        getPixelOffset: [0, -12],
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 500,
        outlineColor: [255, 255, 255, 255],
        outlineWidth: 3,
        fontSettings: { sdf: true, buffer: 8 },
        characterSet: "auto",
      })
    );
  }

  return layers;
}
