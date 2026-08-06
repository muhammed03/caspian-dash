"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import Map, { type MapRef } from "react-map-gl/maplibre";
import { DeckGLOverlay } from "./deckgl-overlay";
import type { PickingInfo } from "@deck.gl/core";
import "maplibre-gl/dist/maplibre-gl.css";

import { buildMapStyle } from "@/shared/config/map-style";
import { useMapStore, type ModuleId } from "@/shared/store/map-store";
import { useLocale } from "@/shared/lib/i18n/client";
import { buildLayers } from "./build-layers";
import { useAirQuality, useCoastline, useDataset, useWind } from "./use-map-data";

const BASE_YEAR = 1992;

export function MapCanvas({ module }: { module: ModuleId }) {
  const mapRef = useRef<MapRef>(null);
  const locale = useLocale();
  const { view, setView, year, activeLayers, setHover, select } = useMapStore();

  const style = useMemo(() => buildMapStyle(), []);
  const needs = useCallback((id: string) => activeLayers.has(id), [activeLayers]);

  const coastline = useCoastline(year, needs("coastline-year") || needs("exposed-bed"));
  const baseCoastline = useCoastline(BASE_YEAR, needs("coastline-year") || needs("exposed-bed"));
  const cities = useDataset<GeoJSON.FeatureCollection>("geo/cities", needs("cities"));
  const countries = useDataset<GeoJSON.FeatureCollection>("geo/countries", needs("data-availability"));
  const factories = useDataset<GeoJSON.FeatureCollection>("factories", needs("factories"));
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
        coastline: coastline.data,
        baseCoastline: baseCoastline.data,
        cities: cities.data,
        countries: countries.data,
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
      countries.data,
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

  /* Each module frames the part of the sea it is about. */
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const FRAMES: Record<ModuleId, { center: [number, number]; zoom: number }> = {
      water: { center: [51.4, 45.4], zoom: 5.1 },
      pollution: { center: [51.0, 43.4], zoom: 5.3 },
      life: { center: [50.4, 43.2], zoom: 4.8 },
      resources: { center: [51.4, 43.6], zoom: 5.0 },
      index: { center: [50.9, 42.6], zoom: 4.5 },
    };
    const frame = FRAMES[module];
    // The right panel covers ~440px on desktop and the layer rail ~290px on the
    // left, so the sea is offset to stay centred in what the user can see.
    const wide = window.innerWidth >= 768;
    map.easeTo({
      center: frame.center,
      zoom: frame.zoom,
      duration: 1600,
      essential: true,
      padding: wide ? { top: 90, bottom: 90, left: 300, right: 460 } : { top: 60, bottom: 60, left: 0, right: 0 },
    });
  }, [module]);

  return (
    <Map
      ref={mapRef}
      initialViewState={view}
      onMoveEnd={(e) =>
        setView({
          longitude: e.viewState.longitude,
          latitude: e.viewState.latitude,
          zoom: e.viewState.zoom,
          pitch: e.viewState.pitch,
          bearing: e.viewState.bearing,
        })
      }
      mapStyle={style}
      attributionControl={false}
      dragRotate={false}
      maxZoom={11}
      minZoom={3.2}
      style={{ position: "absolute", inset: 0 }}
    >
      <DeckGLOverlay layers={layers} interleaved={false} />
    </Map>
  );
}
