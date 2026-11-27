import React from "react";
import { Img, staticFile } from "remotion";
import { tileZoomFor, TILE_PX, visibleTiles, type Viewport } from "../lib/mercator";

/**
 * Pre-cached Esri World Imagery slippy tiles (assets/tiles/{z}/{x}/{y}.jpg), drawn as plain <img>.
 * A low-zoom underlay (z-2) fills any gaps, so missing tiles never show black holes.
 */
export const TileLayer: React.FC<{ vp: Viewport; tiles: Set<string>; maxZoom: number }> = ({ vp, tiles, maxZoom }) => {
  if (maxZoom <= 0) return null;
  const zTop = tileZoomFor(vp.cam.zoom, maxZoom);
  const levels = Array.from(new Set([Math.max(1, zTop - 3), Math.max(1, zTop - 1), zTop]));
  const imgs: React.ReactNode[] = [];
  for (const z of levels) {
    const n = Math.pow(2, z);
    const size = vp.world / n; // px per tile at this camera zoom
    for (const t of visibleTiles(vp, z)) {
      const key = `${z}/${t.x}/${t.y}`;
      if (!tiles.has(key)) continue;
      const left = (t.xu / n - vp.cam.u) * vp.world + vp.W / 2;
      const top = (t.y / n - vp.cam.v) * vp.world + vp.H / 2;
      imgs.push(
        <Img
          key={key}
          src={staticFile(`assets/tiles/${key}.jpg`)}
          maxRetries={2}
          style={{
            position: "absolute",
            left,
            top,
            width: size + 0.75,
            height: size + 0.75,
            imageRendering: size > TILE_PX * 1.3 ? "auto" : undefined,
          }}
        />,
      );
    }
  }
  return <>{imgs}</>;
};
