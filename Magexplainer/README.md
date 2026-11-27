# Magexplainer

A programmatic, **GeoGlobe Tales-style** vertical (`1080×1920 @ 30fps`) geography explainer video engine built with **Remotion** and **MapLibre GL JS**.

Pre-loaded with a full 96.6-second reference recreation of **Spain's Strangest Borders** covering all 6 beats:
1. **Intro & Neighbor Counter** — Satellite zoom into Iberia, dark charcoal vector cut, diagonal hatched country fills, and animated `1 → 2 → 4 → 5` counter.
2. **Llívia Enclave** — Pyrenees glowing border, popping `?` icons, `2 km (1.24 mi)` dashed measurement bar, and French/Spanish flag callouts.
3. **Pheasant Island** — Street-level satellite zoom, playful stick-arm flag tug-of-war, and animated 6-month ownership border shift.
4. **Andorra vs. New York City** — Microstate highlight, `80,000` population badge, and true-scale NYC polygon slide-over comparison.
5. **United Kingdom & Gibraltar** — `706 km (438 mi)` dashed line, animated red arc to Gibraltar, and Europe/Africa continental split.
6. **Ceuta, Melilla & Peñón de Vélez de la Gomera** — Morocco teal overlay, pulsing orange beacons, and the `85 m (279 ft)` shortest land border in the world.

## Quick Start

```bash
npm install
npm run studio
```

Open the Remotion Studio URL in your browser to preview and scrub through the `SpainsStrangestBorders` composition.

### Render to MP4 (`1080×1920 @ 30fps`, H.264)

```bash
npm run render
```

The output video is written to `out/spains-strangest-borders.mp4`.

## Architecture

- `src/engine/MapCanvas.tsx` — Deterministic MapLibre GL JS canvas using Remotion's `delayRender` / `continueRender` so every frame waits for satellite tiles and GeoJSON layers before capturing. Supports zero-API-key Esri Satellite + Carto Dark basemaps, diagonal hatched fills, glowing borders, and pulsing beacons.
- `src/engine/camera.ts` — Smooth eased interpolation of `center`, `zoom`, `pitch`, `bearing`, and `basemap` between keyframes.
- `src/engine/OverlayLayer.tsx` — React/SVG motion graphics (country labels, pin-and-stem markers, hand-drawn arrows, distance badges, counters, flags, and the Pheasant Island tug-of-war animation).
- `src/engine/Captions.tsx` — Synced 2–4 word vertical captions.
- `src/data/spainBordersStoryboard.ts` & `src/data/spainBordersGeo.ts` — Declarative storyboard timeline and GeoJSON shapes.

## Creating Your Own Video

1. Duplicate `src/data/spainBordersGeo.ts` and `src/data/spainBordersStoryboard.ts`.
2. Define your `cameraKeyframes`, `polygons`, `lines`, `beacons`, `callouts`, and `captions`.
3. Register a new `<Composition />` in `src/Root.tsx` pointing to `<GeoExplainerVideo />`.
4. (Optional) Drop `narration.mp3`, `bgm.mp3`, and SFX clips into `public/audio/` and set `enableAudio={true}`.

## License

MIT
