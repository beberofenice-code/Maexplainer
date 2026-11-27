---
name: magexplainer
description: Create a new vertical (1080x1920 @ 30fps) GeoGlobe Tales-style geography explainer video with the Magexplainer Remotion + MapLibre engine in this repo. Use when the user asks for a map explainer, geography short, "strangest borders"-style video, or wants to add a new storyboard/composition, edit camera moves, map overlays, callouts or captions, or render one of these videos.
---

# Magexplainer: geography explainer videos

The engine lives in `Magexplainer/` (relative to the repo root). Every video is **pure data**: a `StoryboardConfig` (see `src/types/scene.ts`) that is rendered by `<GeoExplainerVideo />`. To make a new video you normally only write data files and register a composition; don't touch `src/engine/` unless a new visual is needed.

The reference video is "Spain's Strangest Borders" (`src/data/spainBordersStoryboard.ts` + `src/data/spainBordersGeo.ts`). Read it before writing a new one; copy its pacing and style.

## Workflow

1. **Script first.** Write the narration as 2–4 beats (≈10–25 s each, total 45–100 s). Each beat = one place/fact with a camera move, a highlight and 1–3 callouts.
2. **Geo file** — create `src/data/<slug>Geo.ts` exporting coordinates:
   - Polygons: `[number, number][][]` (rings of `[lng, lat]`, first point repeated at the end).
   - Lines: `[number, number][]`.
   - Simplified shapes (10–30 points) are fine; it's a stylised look. Use real coordinates — double-check lng/lat order (lng first!).
3. **Storyboard file** — create `src/data/<slug>Storyboard.ts` exporting a `StoryboardConfig`. Use the helper `const s = (sec: number) => Math.round(sec * 30)` and write every frame value as `s(seconds)`. Set `durationInFrames` to `s(totalSeconds)`.
4. **Register** a `<Composition />` in `src/Root.tsx` (copy the existing one; set `id`, duration/fps/size from the storyboard, `defaultProps={{ storyboard: ... }}`). Composition ids must be letters/digits/hyphens.
5. **Verify**: `cd Magexplainer && npm run typecheck`, then render a still at a few key frames:
   `npx remotion still src/index.ts <CompositionId> out/f.png --frame=<n>` and look at the PNGs.
6. **Render**: `npx remotion render src/index.ts <CompositionId> out/<slug>.mp4 --codec=h264 --pixel-format=yuv420p` (or add an npm script like the existing `render`).

`npm run studio` opens Remotion Studio for scrubbing (needs `npm install` first).

## StoryboardConfig fields

- **cameraKeyframes** `{ frame, center:[lng,lat], zoom, pitch?, bearing?, basemap?, easing? }`
  - Interpolated between consecutive keyframes; the `easing` on the *later* keyframe applies to the segment leading into it (default `easeInOutCubic`; also `linear`, `easeOutQuart`, `easeInOutQuart`).
  - `basemap`: `"satellite"` (Esri imagery) or `"dark"` (Carto dark vector). It switches at the midpoint of a segment — use it as a stylistic cut (e.g. satellite zoom-in → dark map for a counter/overview).
  - Zoom guide: 3–4 continent, 5–6 country, 9–12 region/town, 15–17 street level. Hold shots by repeating a keyframe with a tiny drift in center/zoom so the frame never feels frozen.
  - Typical beat: wide establishing shot → fast zoom (2–3 s) → slow drift while callouts play.
- **polygons** `{ id, startFrame, endFrame, fillColor, fillOpacity, strokeColor?, strokeWidth?, glowColor?, hatched?, slideFromOffset?, coordinates }`
  - `hatched: true` = diagonal-hatched fill (looks best on the dark basemap).
  - `glowColor` adds a glowing border. `slideFromOffset` slides the shape in from `dLng/dLat` offset (used for true-scale size comparisons, e.g. NYC over Andorra).
  - Over satellite use `fillOpacity` ≈ 0.4–0.7; over dark ≈ 0.85.
- **lines** `{ id, startFrame, endFrame, color, width, glowColor?, dashed?, drawRange?, coordinates }` — `dashed` for distance measurements, `drawRange:[from,to]` animates the line drawing on (arcs/routes).
- **beacons** `{ id, lngLat, startFrame, endFrame, color, radius? }` — pulsing dots for small places.
- **callouts** — screen-space React/SVG graphics positioned by `xPct`/`yPct` (0–100 of the 1080×1920 frame; keep y within ~15–80 so captions at the bottom stay clear). Kinds:
  - `countryLabel` (`text`, `scale`), `pinLabel` (pin-and-stem marker, `text`), `hookBanner` (`accentWord` + `text`), `counter` (`counterSteps: [{frame, value}]`), `questionMarks`, `distanceBadge` (`text`, `subtext`, `rotationDeg`), `populationBadge` (`text`), `flag` (`flagCode`: only `ES | FR | UK | AD | MA` are drawn), `curvedArrow` (`targetXPct/targetYPct`), `pheasantTugOfWar` (specific to the Spain video).
  - Callout positions don't follow the map; place them where the target appears **at that point in the camera move** (check with stills).
  - A new flag or callout kind needs code: add to `CalloutKind`/`flagCode` in `src/types/scene.ts` and a render branch in `src/engine/OverlayLayer.tsx` (flags: `FlagGraphic`).
- **captions** `{ startFrame, endFrame, text }` — short phrases, contiguous, roughly 1–4 s each, matching the narration.
- **audio** (optional) — `narration`, `bgm` (volume ≈ 0.15–0.2), `sfx[]` (whoosh on big zooms, pop on counters/labels). Paths are relative to `public/`. Audio only plays if the composition passes `enableAudio: true` in `defaultProps` and the files exist in `public/audio/`.

## Style rules (GeoGlobe Tales look)

- Colours come from `src/styles/theme.ts` (`THEME.colors`); add new country colours there instead of hard-coding hex everywhere. Highlight = bold saturated fill + white stroke; accent = `accentYellow` glow / `accentRed`.
- Open with a hook in the first 3 s (question caption + `hookBanner` + `curvedArrow`).
- Something new should appear every 1–3 s: a label, number, flag, line or camera move.
- Show numbers with units in both systems where relevant (`"2 km"` / `"(1.24 mi)"`).
- End on the most surprising fact, at the tightest zoom.

## Notes

- MapCanvas uses `delayRender` to wait for tiles, so renders need network access to Esri/Carto tile servers (no API key).
- Keep ids unique within each array.
- Leave the Spain storyboard intact as the reference unless asked to change it.
