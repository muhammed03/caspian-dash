"use client";

import {
  BitmapLayer,
  GeoJsonLayer,
  IconLayer,
  ScatterplotLayer,
  TextLayer,
  LineLayer,
  PathLayer,
  PolygonLayer,
} from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import {
  FACILITY_ICON,
  FACILITY_ICON_APPROX,
  HAZARD_ICON,
  PIN,
} from "@/shared/config/map-icons";
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
  rivers?: {
    rivers: { id: string; name_kk: string; name_ru: string; current: number; historic_1930: number; share_percent: number }[];
  };
  /** Dispersion cones for the hour currently being shown. */
  plume?: { facility: PlumeFacility; frame: PlumeFrame; detected: boolean }[];
  /** Advected cloud positions at +30 min, +1 h and +3 h. */
  drift?: {
    facility: { short: string; lat: number; lng: number };
    marks: { minutes: number; label: string; lat: number; lng: number; distanceKm: number; radiusKm: number }[];
  }[];
  /** Onshore/offshore breeze arrows, only where confidence is medium or high. */
  breeze?: {
    id: string;
    name: string;
    lat: number;
    lon: number;
    coastNormal: number;
    onshore: number;
    confidence: "high" | "medium";
  }[];
  /** Loops 0→1; drives the wind streak phase. */
  time?: number;
  /** Which backdrop the map is drawn on. */
  basemap?: BasemapMode;
  onHover: (info: PickingInfo, kind: string) => void;
  onClick: (kind: string, payload: Record<string, unknown>) => void;
};

const HABITAT_COLORS: Record<string, RGB> = {
  seal: [29, 111, 208],
  sturgeon: [91, 33, 182],
  bird: [15, 143, 102],
};

export type BasemapMode = "default" | "satellite" | "terrain";

/**
 * Raster backdrops. Both need the network, so the drawn vector basemap stays
 * the default and the only one guaranteed to work during an offline demo.
 */
const RASTER_BASEMAPS: Record<
  Exclude<BasemapMode, "default">,
  { url: string; attribution: string; opacity: number }
> = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Esri, Maxar, Earthstar Geographics",
    opacity: 1,
  },
  terrain: {
    url: "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "© OpenTopoMap (CC-BY-SA), © OpenStreetMap contributors",
    opacity: 0.95,
  },
};

export function buildLayers(args: BuildArgs): Layer[] {
  const { active, locale, year, onHover, onClick } = args;
  const nameOf = (o: Record<string, unknown>) =>
    String((locale === "ru" ? o.name_ru : o.name_kk) ?? o.name_en ?? "");
  const layers: Layer[] = [];
  const mode: BasemapMode = args.basemap ?? "default";
  const raster = mode !== "default" ? RASTER_BASEMAPS[mode] : null;

  /* --- basemap: raster imagery when asked for, otherwise the drawn one --- */
  if (raster) {
    layers.push(
      new TileLayer({
        id: `basemap-${mode}`,
        data: raster.url,
        minZoom: 0,
        maxZoom: 17,
        tileSize: 256,
        opacity: raster.opacity,
        renderSubLayers: (props) => {
          const { boundingBox } = props.tile;
          return new BitmapLayer(props, {
            data: undefined,
            image: props.data,
            bounds: [
              boundingBox[0][0],
              boundingBox[0][1],
              boundingBox[1][0],
              boundingBox[1][1],
            ],
          });
        },
      })
    );
    // the shoreline still needs to read against imagery
    if (args.basemapCaspian) {
      layers.push(
        new GeoJsonLayer({
          id: "raster-shoreline",
          data: args.basemapCaspian,
          filled: false,
          stroked: true,
          getLineColor: [255, 255, 255, 190],
          getLineWidth: 1.4,
          lineWidthUnits: "pixels",
          parameters: { depthTest: false },
        })
      );
    }
  }

  /* --- basemap: land, sea and the lit shoreline, all from committed data --- */
  if (!raster && args.basemapCountries) {
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
  if (!raster && args.basemapCaspian) {
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
  if (!raster && args.basemapLakes) {
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
  if (!raster && args.basemapRivers) {
    layers.push(
      new GeoJsonLayer({
        id: "base-rivers",
        data: args.basemapRivers,
        filled: false,
        stroked: true,
        getLineColor: [96, 138, 176, 235],
        getLineWidth: 1.4,
        lineWidthUnits: "pixels",
        lineWidthMinPixels: 1.2,
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

  /* --- water: inflowing rivers, drawn at a width proportional to their flow ---
     The Volga carries about 80% of everything reaching the sea, so a linear
     width would leave the others invisible; sqrt keeps the contrast readable
     while still showing that one river dominates. */
  if (active.has("rivers-flow") && args.basemapRivers && args.rivers) {
    const flowByName = new Map(
      args.rivers.rivers.map((r) => [r.id, r])
    );
    // Natural Earth names → the ids used in the flow dataset
    const NE_TO_ID: Record<string, string> = {
      Volga: "volga",
      Ural: "ural",
      Kura: "kura",
      Terek: "terek",
      Emba: "emba",
    };

    const named = args.basemapRivers.features.filter(
      (f) => NE_TO_ID[String(f.properties?.name ?? "")]
    );

    layers.push(
      new GeoJsonLayer({
        id: "rivers-flow",
        data: { type: "FeatureCollection", features: named } as GeoJSON.FeatureCollection,
        pickable: true,
        filled: false,
        stroked: true,
        getLineColor: [...CYAN, 235] as [number, number, number, number],
        getLineWidth: (f: GeoJSON.Feature) => {
          const river = flowByName.get(NE_TO_ID[String(f.properties?.name ?? "")]);
          return river ? 1.5 + Math.sqrt(river.current) * 0.85 : 1.5;
        },
        lineWidthUnits: "pixels",
        lineWidthMinPixels: 1.5,
        lineWidthMaxPixels: 16,
        parameters: { depthTest: false },
        onHover: (info) => {
          const f = info.object as GeoJSON.Feature | undefined;
          const river = f && flowByName.get(NE_TO_ID[String(f.properties?.name ?? "")]);
          onHover(
            river ? ({ ...info, object: river } as PickingInfo) : info,
            "river"
          );
        },
      })
    );

    // one label per river, placed at the mouth so it sits by the sea
    const labels = named
      .map((f) => {
        const river = flowByName.get(NE_TO_ID[String(f.properties?.name ?? "")]);
        if (!river) return null;
        const geom = f.geometry as Exclude<GeoJSON.Geometry, GeoJSON.GeometryCollection>;
        const coords =
          geom.type === "MultiLineString"
            ? (geom.coordinates as [number, number][][]).flat()
            : (geom.coordinates as [number, number][]);
        // the vertex closest to the sea centre reads as the mouth
        let mouth = coords[0];
        let best = Infinity;
        for (const c of coords) {
          const d = Math.hypot(c[0] - 50.9, c[1] - 42.2);
          if (d < best) {
            best = d;
            mouth = c;
          }
        }
        return { river, position: mouth };
      })
      .filter((x): x is { river: NonNullable<ReturnType<typeof flowByName.get>>; position: [number, number] } => x !== null);

    layers.push(
      new TextLayer({
        id: "river-labels",
        data: labels,
        getPosition: (d) => d.position,
        getText: (d) =>
          `${locale === "ru" ? d.river.name_ru : d.river.name_kk}  ${d.river.current} км³/год`,
        getSize: 11,
        sizeUnits: "pixels",
        getColor: [...CYAN, 255] as [number, number, number, number],
        getPixelOffset: [0, 14],
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 600,
        outlineColor: [255, 255, 255, 255],
        outlineWidth: 3,
        fontSettings: { sdf: true, buffer: 8 },
        characterSet: "auto",
      })
    );
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
    // The dirtier the air, the stronger the station pulses — motion carries
    // the magnitude, so the reader notices the bad ones without reading numbers.
    const airPulse = args.time ?? 0;
    layers.push(
      new ScatterplotLayer<AirReading>({
        id: "air-stations",
        data: args.air,
        pickable: true,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: (d) => {
          const severity = Math.min((d.eaqi ?? 0) / 80, 1);
          return 6 + severity * 3 * (0.5 + 0.5 * Math.sin(airPulse * Math.PI * 2));
        },
        radiusUnits: "pixels",
        radiusMinPixels: 5,
        updateTriggers: { getRadius: airPulse },
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

  /* --- pollution: live wind, drawn as streaks that flow along the wind ---
     Three staggered copies of the same field, each at a different phase of the
     loop, read as continuous movement: a streak fades in at the tail of the
     vector, travels its length, and fades out as the next one appears. */
  if (active.has("wind") && args.wind?.length) {
    const phase = args.time ?? 0;
    const TRAILS = 3;
    const STREAK = 0.55; // length of one streak, in degrees of travel
    const SPAN = 3.4; // how far a streak travels before looping

    for (let k = 0; k < TRAILS; k++) {
      const t = (phase + k / TRAILS) % 1;
      layers.push(
        new LineLayer<WindPoint>({
          id: `wind-streak-${k}`,
          data: args.wind,
          getSourcePosition: (d) => {
            // direction is where the wind comes FROM, so the streak runs the opposite way
            const rad = ((d.direction + 180) * Math.PI) / 180;
            const reach = Math.min(d.speed / 22, 1) * SPAN;
            const travelled = t * reach;
            return [d.lon + Math.sin(rad) * travelled, d.lat + Math.cos(rad) * travelled];
          },
          getTargetPosition: (d) => {
            const rad = ((d.direction + 180) * Math.PI) / 180;
            const reach = Math.min(d.speed / 22, 1) * SPAN;
            const travelled = t * reach;
            const tail = Math.min(travelled + STREAK, reach);
            return [d.lon + Math.sin(rad) * tail, d.lat + Math.cos(rad) * tail];
          },
          // fades in at the start of the loop and out at the end
          getColor: [
            ...CYAN,
            Math.round(210 * Math.sin(Math.PI * t)),
          ] as [number, number, number, number],
          getWidth: 2.2,
          widthUnits: "pixels",
          updateTriggers: {
            getSourcePosition: t,
            getTargetPosition: t,
            getColor: t,
          },
        })
      );
    }
  }

  /* --- pollution: industry ---
     Two marks per site: a translucent disc whose area carries the reported
     emissions, and a pin on top so the point is identifiable as a plant
     rather than a generic dot. A dashed hollow pin means the coordinate is
     not confirmed. */
  if (active.has("factories") && args.factories) {
    const feats = args.factories.features;
    layers.push(
      new ScatterplotLayer<GeoJSON.Feature>({
        id: "factories-magnitude",
        data: feats,
        pickable: true,
        getPosition: (f) => (f.geometry as GeoJSON.Point).coordinates as [number, number],
        getRadius: (f) => Math.sqrt(Number(f.properties?.emissions_t ?? 1000)) * 55,
        radiusMinPixels: 5,
        radiusMaxPixels: 34,
        getFillColor: [...ROSE, 55] as [number, number, number, number],
        stroked: true,
        lineWidthUnits: "pixels",
        getLineWidth: 1,
        getLineColor: [...ROSE, 130] as [number, number, number, number],
        onHover: (info) => onHover(info, "factory"),
        onClick: (info) =>
          info.object && onClick("factory", (info.object as GeoJSON.Feature).properties ?? {}),
      })
    );
    layers.push(
      new IconLayer<GeoJSON.Feature>({
        id: "factories-icons",
        data: feats,
        pickable: true,
        getPosition: (f) => (f.geometry as GeoJSON.Point).coordinates as [number, number],
        getIcon: (f) => ({
          ...PIN,
          url: f.properties?.approx ? FACILITY_ICON_APPROX : FACILITY_ICON,
          id: f.properties?.approx ? "approx" : "exact",
        }),
        getSize: 30,
        sizeUnits: "pixels",
        sizeMinPixels: 22,
        sizeMaxPixels: 40,
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
        getFillColor: [...RED, 80] as [number, number, number, number],
        stroked: true,
        lineWidthUnits: "pixels",
        getLineWidth: 2,
        getLineColor: [...RED, 255] as [number, number, number, number],
        onHover: (info) => onHover(info, "koshkar"),
        onClick: (info) => info.object && onClick("koshkar", info.object as Record<string, unknown>),
      })
    );
    layers.push(
      new IconLayer({
        id: "koshkar-ata-icon",
        data: [args.koshkar],
        pickable: true,
        getPosition: (d: typeof args.koshkar) => d!.coordinates,
        getIcon: () => ({ ...PIN, url: HAZARD_ICON, id: "hazard" }),
        getSize: 30,
        sizeUnits: "pixels",
        sizeMinPixels: 22,
        sizeMaxPixels: 40,
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

  /* --- pollution: where the cloud released now will be later ---
     Positions come from the server, which stepped through the hourly forecast
     wind; the client only draws them. Recomputing here from "current" wind
     would put these circles kilometres away from the caption beside them on
     any hour the wind turns. */
  if (active.has("plume") && args.drift?.length) {
    const pulse = 0.85 + 0.15 * Math.sin((args.time ?? 0) * Math.PI * 2);

    // the track from the stack to the three-hour mark
    layers.push(
      new PathLayer<NonNullable<BuildArgs["drift"]>[number]>({
        id: "drift-track",
        data: args.drift,
        getPath: (d) =>
          [
            [d.facility.lng, d.facility.lat] as [number, number],
            ...d.marks.map((m) => [m.lng, m.lat] as [number, number]),
          ] as [number, number][],
        getColor: [190, 24, 93, 150],
        getWidth: 1.6,
        widthUnits: "pixels",
      })
    );

    const marks = args.drift.flatMap((d) =>
      d.marks.map((m) => ({ ...m, short: d.facility.short }))
    );

    // the cloud itself: radius is 2σy at the distance travelled
    layers.push(
      new ScatterplotLayer({
        id: "drift-clouds",
        data: marks,
        pickable: true,
        getPosition: (d) => [d.lng, d.lat],
        getRadius: (d) => d.radiusKm * 1000,
        radiusMinPixels: 4,
        stroked: true,
        lineWidthUnits: "pixels",
        getLineWidth: 1.4,
        // fades with time ahead, and breathes so it reads as a forecast
        getFillColor: (d) =>
          [190, 24, 93, Math.round((d.minutes === 30 ? 70 : d.minutes === 60 ? 50 : 32) * pulse)] as [
            number, number, number, number,
          ],
        getLineColor: (d) =>
          [190, 24, 93, Math.round((d.minutes === 30 ? 230 : d.minutes === 60 ? 190 : 150) * pulse)] as [
            number, number, number, number,
          ],
        updateTriggers: { getFillColor: pulse, getLineColor: pulse },
        onHover: (info) => onHover(info, "drift"),
      })
    );

    layers.push(
      new TextLayer({
        id: "drift-labels",
        data: marks,
        getPosition: (d) => [d.lng, d.lat],
        getText: (d) => d.label,
        getSize: 10,
        sizeUnits: "pixels",
        getColor: [190, 24, 93, 255],
        getPixelOffset: [0, -12],
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 700,
        outlineColor: [255, 255, 255, 255],
        outlineWidth: 3,
        fontSettings: { sdf: true, buffer: 8 },
        characterSet: "auto",
      })
    );
  }

  /* --- pollution: sea-breeze arrows, drawn only where the evidence supports
     it. The arrow animates along the coast normal so the direction of the
     flow is readable without a legend. */
  if (active.has("breeze") && args.breeze?.length) {
    const t = args.time ?? 0;
    for (let k = 0; k < 3; k++) {
      const phase = (t + k / 3) % 1;
      layers.push(
        new LineLayer({
          id: `breeze-arrow-${k}`,
          data: args.breeze,
          getSourcePosition: (d) => {
            // onshore blows toward the land, offshore away from it
            const heading = d.onshore > 0 ? d.coastNormal : (d.coastNormal + 180) % 360;
            const start = -0.55 + phase * 1.1;
            const rad = (heading * Math.PI) / 180;
            return [d.lon + Math.sin(rad) * start, d.lat + Math.cos(rad) * start];
          },
          getTargetPosition: (d) => {
            const heading = d.onshore > 0 ? d.coastNormal : (d.coastNormal + 180) % 360;
            const start = -0.55 + phase * 1.1;
            const rad = (heading * Math.PI) / 180;
            return [
              d.lon + Math.sin(rad) * (start + 0.3),
              d.lat + Math.cos(rad) * (start + 0.3),
            ];
          },
          getColor: (d) =>
            [
              14,
              116,
              190,
              Math.round((d.confidence === "high" ? 235 : 165) * Math.sin(Math.PI * phase)),
            ] as [number, number, number, number],
          getWidth: 3,
          widthUnits: "pixels",
          updateTriggers: {
            getSourcePosition: phase,
            getTargetPosition: phase,
            getColor: phase,
          },
        })
      );
    }
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
