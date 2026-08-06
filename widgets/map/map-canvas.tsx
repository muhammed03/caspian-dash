"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DeckGL from "@deck.gl/react";
import { MapView, FlyToInterpolator, type PickingInfo, type MapViewState } from "@deck.gl/core";

import { useMapStore, type ModuleId } from "@/shared/store/map-store";
import { useLocale } from "@/shared/lib/i18n/client";
import { buildLayers } from "./build-layers";
import { useAirQuality, useCoastline, useDataset, useWind } from "./use-map-data";

// Basemap geometry is bundled, not fetched: the map draws with no network.
import countries from "@/data/geo/countries.json";
import caspian from "@/data/geo/caspian.json";
import lakes from "@/data/geo/lakes.json";
import riversGeo from "@/data/geo/rivers-geo.json";

type FC = GeoJSON.FeatureCollection;

const BASE_YEAR = 1992;

/** Where each module frames the sea, and how much room the chrome needs. */
const FRAMES: Record<ModuleId, { longitude: number; latitude: number; zoom: number }> = {
  water: { longitude: 50.2, latitude: 44.6, zoom: 5.0 },
  pollution: { longitude: 50.0, latitude: 43.0, zoom: 5.1 },
  life: { longitude: 49.6, latitude: 42.8, zoom: 4.7 },
  resources: { longitude: 50.2, latitude: 43.4, zoom: 4.9 },
  index: { longitude: 49.8, latitude: 42.4, zoom: 4.4 },
};

export function MapCanvas({ module }: { module: ModuleId }) {
  const locale = useLocale();
  const { view, setView, year, activeLayers, setHover, select } = useMapStore();
  const firstFrame = useRef(true);

  const [viewState, setViewState] = useState<MapViewState>({
    longitude: FRAMES[module].longitude,
    latitude: FRAMES[module].latitude,
    zoom: FRAMES[module].zoom,
    pitch: view.pitch,
    bearing: view.bearing,
    minZoom: 3.2,
    maxZoom: 11,
  });

  const needs = useCallback((id: string) => activeLayers.has(id), [activeLayers]);

  const coastline = useCoastline(year, needs("coastline-year") || needs("exposed-bed"));
  const baseCoastline = useCoastline(BASE_YEAR, needs("coastline-year") || needs("exposed-bed"));
  const cities = useDataset<FC>("geo/cities", needs("cities"));
  const factories = useDataset<FC>("factories", needs("factories"));
  const koshkar = useDataset<Parameters<typeof buildLayers>[0]["koshkar"]>("koshkar-ata", needs("koshkar-ata"));
  const wildlife = useDataset<Parameters<typeof buildLayers>[0]["wildlife"]>("wildlife", needs("habitats"));
  const resources = useDataset<Parameters<typeof buildLayers>[0]["resources"]>("resources", needs("fields"));
  const availability = useDataset<Parameters<typeof buildLayers>[0]["availability"]>(
    "data-availability",
    needs("data-availability")
  );
  const air = useAirQuality(needs("air-quality"));
  const wind = useWind(needs("wind"));

  const handleHover = useCallback(
    (info: PickingInfo, kind: string) => {
      if (!info.object) {
        setHover(null);
        return;
      }
      const raw = info.object as Record<string, unknown>;
      const payload = (raw.properties as Record<string, unknown>) ?? raw;
      setHover({ x: info.x, y: info.y, kind, payload });
    },
    [setHover]
  );

  const handleClick = useCallback(
    (kind: string, payload: Record<string, unknown>) => select({ kind, payload }),
    [select]
  );

  const layers = useMemo(
    () =>
      buildLayers({
        active: activeLayers,
        locale,
        year,
        basemapCountries: countries as FC,
        basemapCaspian: caspian as FC,
        basemapLakes: lakes as FC,
        basemapRivers: riversGeo as FC,
        coastline: coastline.data,
        baseCoastline: baseCoastline.data,
        cities: cities.data,
        countries: countries as FC,
        factories: factories.data,
        koshkar: koshkar.data,
        wildlife: wildlife.data,
        resources: resources.data,
        availability: availability.data,
        air: air.data?.readings,
        wind: wind.data?.points,
        onHover: handleHover,
        onClick: handleClick,
      }),
    [
      activeLayers,
      locale,
      year,
      coastline.data,
      baseCoastline.data,
      cities.data,
      factories.data,
      koshkar.data,
      wildlife.data,
      resources.data,
      availability.data,
      air.data,
      wind.data,
      handleHover,
      handleClick,
    ]
  );

  /* Switching module flies the camera to that module's framing. */
  useEffect(() => {
    const frame = FRAMES[module];
    setViewState((prev) => ({
      ...prev,
      ...frame,
      transitionDuration: firstFrame.current ? 0 : 1500,
      transitionInterpolator: firstFrame.current ? undefined : new FlyToInterpolator({ speed: 1.4 }),
    }));
    firstFrame.current = false;
  }, [module]);

  /* Persist the camera so it survives navigation between dashboards. */
  useEffect(() => {
    setView({
      longitude: viewState.longitude,
      latitude: viewState.latitude,
      zoom: viewState.zoom,
      pitch: viewState.pitch ?? 0,
      bearing: viewState.bearing ?? 0,
    });
  }, [viewState, setView]);

  return (
    <DeckGL
      views={new MapView({ repeat: false })}
      viewState={viewState}
      onViewStateChange={({ viewState: next }) => setViewState(next as MapViewState)}
      controller={{ dragRotate: false, touchRotate: false }}
      layers={layers}
      onHover={(info) => {
        if (!info.picked) setHover(null);
      }}
      style={{ position: "absolute", top: "0", left: "0", right: "0", bottom: "0" }}
      getCursor={({ isDragging, isHovering }) =>
        isDragging ? "grabbing" : isHovering ? "pointer" : "grab"
      }
    />
  );
}
