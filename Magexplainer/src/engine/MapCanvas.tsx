import React, { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { continueRender, delayRender, useCurrentFrame } from "remotion";
import { interpolateCamera } from "./camera";
import {
  BeaconConfig,
  LineOverlayConfig,
  PolygonOverlayConfig,
  StoryboardConfig,
} from "../types/scene";

const BASE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "esri-satellite": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "Esri, Maxar, Earthstar Geographics",
    },
    "carto-dark": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "CARTO",
    },
  },
  layers: [
    {
      id: "basemap-satellite",
      type: "raster",
      source: "esri-satellite",
      paint: { "raster-opacity": 1 },
    },
    {
      id: "basemap-dark",
      type: "raster",
      source: "carto-dark",
      paint: { "raster-opacity": 0 },
    },
  ],
};

function createHatchImageData(baseHex: string): ImageData {
  const size = 24;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-size, size);
  ctx.lineTo(size, -size);
  ctx.moveTo(0, size * 2);
  ctx.lineTo(size * 2, 0);
  ctx.stroke();
  return ctx.getImageData(0, 0, size, size);
}

function buildPolygonGeoJSON(polygons: PolygonOverlayConfig[], frame: number) {
  const features = polygons
    .filter((p) => frame >= p.startFrame && frame <= p.endFrame)
    .map((p) => {
      let coords = p.coordinates;
      if (p.slideFromOffset) {
        const { startFrame, endFrame, dLng, dLat } = p.slideFromOffset;
        const progress = Math.max(
          0,
          Math.min(1, (frame - startFrame) / Math.max(1, endFrame - startFrame))
        );
        const eased = 1 - Math.pow(1 - progress, 3);
        const curLng = dLng * (1 - eased);
        const curLat = dLat * (1 - eased);
        coords = p.coordinates.map((ring) =>
          ring.map(([lng, lat]) => [lng + curLng, lat + curLat] as [number, number])
        );
      }
      return {
        type: "Feature" as const,
        properties: {
          id: p.id,
          fillColor: p.fillColor,
          fillOpacity: p.fillOpacity,
          strokeColor: p.strokeColor ?? "#FFFFFF",
          strokeWidth: p.strokeWidth ?? 3,
          glowColor: p.glowColor ?? p.fillColor,
          hatched: p.hatched ? 1 : 0,
          hatchImage: `hatch-${p.fillColor.replace("#", "")}`,
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: coords,
        },
      };
    });

  return { type: "FeatureCollection" as const, features };
}

function buildLineGeoJSON(lines: LineOverlayConfig[], frame: number) {
  const features = lines
    .filter((l) => frame >= l.startFrame && frame <= l.endFrame)
    .map((l) => {
      let coords = l.coordinates;
      if (l.drawRange && coords.length >= 2) {
        const [s, e] = l.drawRange;
        const t = Math.max(0, Math.min(1, (frame - s) / Math.max(1, e - s)));
        const maxIdx = Math.max(1, Math.floor(t * (coords.length - 1)));
        coords = coords.slice(0, maxIdx + 1);
      }
      return {
        type: "Feature" as const,
        properties: {
          id: l.id,
          color: l.color,
          width: l.width,
          glowColor: l.glowColor ?? l.color,
          dashed: l.dashed ? 1 : 0,
        },
        geometry: {
          type: "LineString" as const,
          coordinates: coords,
        },
      };
    });

  return { type: "FeatureCollection" as const, features };
}

function buildBeaconGeoJSON(beacons: BeaconConfig[], frame: number) {
  const pulse = 0.65 + 0.35 * Math.sin(frame * 0.28);
  const features = beacons
    .filter((b) => frame >= b.startFrame && frame <= b.endFrame)
    .map((b) => ({
      type: "Feature" as const,
      properties: {
        id: b.id,
        color: b.color,
        radius: (b.radius ?? 10) * (0.9 + 0.25 * pulse),
        haloRadius: (b.radius ?? 10) * (2.2 + 0.8 * pulse),
      },
      geometry: {
        type: "Point" as const,
        coordinates: b.lngLat,
      },
    }));

  return { type: "FeatureCollection" as const, features };
}

export const MapCanvas: React.FC<{ storyboard: StoryboardConfig }> = ({ storyboard }) => {
  const frame = useCurrentFrame();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const initHandle = delayRender("Initializing MapLibre GL canvas");

    const initialCam = interpolateCamera(0, storyboard.cameraKeyframes);
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      center: initialCam.center,
      zoom: initialCam.zoom,
      pitch: initialCam.pitch,
      bearing: initialCam.bearing,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      fadeDuration: 0,
    });

    map.on("load", () => {
      const uniqueHatchColors = new Set(
        storyboard.polygons.filter((p) => p.hatched).map((p) => p.fillColor)
      );
      uniqueHatchColors.forEach((hex) => {
        const imageName = `hatch-${hex.replace("#", "")}`;
        if (!map.hasImage(imageName)) {
          map.addImage(imageName, createHatchImageData(hex), { pixelRatio: 2 });
        }
      });

      map.addSource("story-polygons", {
        type: "geojson",
        data: buildPolygonGeoJSON(storyboard.polygons, 0),
      });
      map.addSource("story-lines", {
        type: "geojson",
        data: buildLineGeoJSON(storyboard.lines, 0),
      });
      map.addSource("story-beacons", {
        type: "geojson",
        data: buildBeaconGeoJSON(storyboard.beacons, 0),
      });

      map.addLayer({
        id: "polygons-fill",
        type: "fill",
        source: "story-polygons",
        filter: ["==", ["get", "hatched"], 0],
        paint: {
          "fill-color": ["get", "fillColor"],
          "fill-opacity": ["get", "fillOpacity"],
        },
      });

      map.addLayer({
        id: "polygons-hatch",
        type: "fill",
        source: "story-polygons",
        filter: ["==", ["get", "hatched"], 1],
        paint: {
          "fill-pattern": ["get", "hatchImage"],
          "fill-opacity": ["get", "fillOpacity"],
        },
      });

      map.addLayer({
        id: "polygons-glow",
        type: "line",
        source: "story-polygons",
        paint: {
          "line-color": ["get", "glowColor"],
          "line-width": 10,
          "line-blur": 8,
          "line-opacity": 0.65,
        },
      });

      map.addLayer({
        id: "polygons-stroke",
        type: "line",
        source: "story-polygons",
        paint: {
          "line-color": ["get", "strokeColor"],
          "line-width": ["get", "strokeWidth"],
        },
      });

      map.addLayer({
        id: "lines-glow",
        type: "line",
        source: "story-lines",
        paint: {
          "line-color": ["get", "glowColor"],
          "line-width": 14,
          "line-blur": 10,
          "line-opacity": 0.75,
        },
      });

      map.addLayer({
        id: "lines-solid",
        type: "line",
        source: "story-lines",
        filter: ["==", ["get", "dashed"], 0],
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["get", "width"],
        },
      });

      map.addLayer({
        id: "lines-dashed",
        type: "line",
        source: "story-lines",
        filter: ["==", ["get", "dashed"], 1],
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["get", "width"],
          "line-dasharray": [2.2, 1.8],
        },
      });

      map.addLayer({
        id: "beacons-halo",
        type: "circle",
        source: "story-beacons",
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": ["get", "haloRadius"],
          "circle-blur": 0.85,
          "circle-opacity": 0.65,
        },
      });

      map.addLayer({
        id: "beacons-core",
        type: "circle",
        source: "story-beacons",
        paint: {
          "circle-color": "#FFFBEB",
          "circle-radius": ["get", "radius"],
          "circle-stroke-color": ["get", "color"],
          "circle-stroke-width": 3,
        },
      });

      mapRef.current = map;
      setMapReady(true);
      continueRender(initHandle);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [storyboard]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const frameHandle = delayRender(`Rendering map frame ${frame}`);
    const cam = interpolateCamera(frame, storyboard.cameraKeyframes);

    map.jumpTo({
      center: cam.center,
      zoom: cam.zoom,
      pitch: cam.pitch,
      bearing: cam.bearing,
    });

    map.setPaintProperty("basemap-satellite", "raster-opacity", cam.basemap === "satellite" ? 1 : 0);
    map.setPaintProperty("basemap-dark", "raster-opacity", cam.basemap === "dark" ? 1 : 0);

    const polySource = map.getSource("story-polygons") as maplibregl.GeoJSONSource | undefined;
    polySource?.setData(buildPolygonGeoJSON(storyboard.polygons, frame));

    const lineSource = map.getSource("story-lines") as maplibregl.GeoJSONSource | undefined;
    lineSource?.setData(buildLineGeoJSON(storyboard.lines, frame));

    const beaconSource = map.getSource("story-beacons") as maplibregl.GeoJSONSource | undefined;
    beaconSource?.setData(buildBeaconGeoJSON(storyboard.beacons, frame));

    let finished = false;
    const done = () => {
      if (!finished) {
        finished = true;
        continueRender(frameHandle);
      }
    };

    map.once("idle", done);
    const fallbackTimer = setTimeout(done, 1500);
    return () => {
      clearTimeout(fallbackTimer);
      done();
    };
  }, [frame, mapReady, storyboard]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "#0B0D12",
      }}
    />
  );
};
