---
name: magexplainer
description: Create a new vertical (1080x1920 @ 30fps) GeoGlobe Tales-style geography explainer video with the Map Explainer Studio (Remotion + MapLibre) engine in this repo. Use when the user asks for a map explainer, geography short, "strangest borders"-style video, or wants to add a new project/storyboard, fetch real borders, generate narration, edit camera moves, map overlays, callouts or captions, or render one of these videos.
---

# Map Explainer Studio: geography explainer videos

The engine lives in `Magexplainer/` (relative to the repo root; run every command from there). Every video is **pure data** in its own folder:

```
projects/<slug>/
├── storyboard.json   # scene timings, camera keyframes, overlays, script (required)
├── geo.json          # real polygons, written by `npm run fetch-geo` (optional)
├── voice.mp3         # narration, written by `npm run voice` (optional)
└── captions.json     # word-level captions, written by `npm run voice` (optional)
```

`src/Root.tsx` auto-registers one composition per `projects/*/storyboard.json` (id = `storyboard.id`). You normally only write `storyboard.json`; don't touch `src/` unless a new visual is needed.

The reference video is `projects/spain-borders/` (it uses every feature: real OSM geometry, a true-scale area comparison, ElevenLabs voice). Read it before writing a new one; copy its pacing and style.

## Workflow

1. **Script first.** Write the narration as 2–6 beats (≈10–25 s each, total 45–100 s). Each beat = one place/fact with a camera move, a highlight and 1–3 callouts.
2. **Create `projects/<slug>/storyboard.json`** (copy Spain's). All times are **frames at 30 fps** (`seconds × 30`). Set `durationInFrames`; `id` must be letters/digits/hyphens and unique.
3. **Geometry.** For real borders, declare `geoSources` and reference them with `"geo": "<id>"` on polygons/lines/areaCompares, then run `npm run fetch-geo -- <slug>`. Hand-drawn `coordinates` (`[[[lng, lat], …]]`, lng first!, first point repeated last) are still fine for stylised shapes.
4. **Voice + captions.** `npm run voice -- <slug>` (needs `ELEVENLABS_API_KEY`; spends ElevenLabs credits — ~1 credit per character of `captions` text, re-runs reuse `.voice-cache/`). Read the drift report: if sentences run late, raise `voice.speed` (max 1.2), shorten lines or move cues. `--timing-only` writes captions.json from the storyboard without audio (free).
5. **Verify**: `npm run typecheck`, then stills at key frames: `npm run render -- <slug> --still <frame>` → `out/<slug>-<frame>.png`, and look at them.
6. **Render**: `npm run render -- <slug>` → `out/<slug>.mp4` (fetches missing geo, generates a missing voice if the key is set, then renders).

`npm run studio` opens Remotion Studio for scrubbing.

Headless/cloud machines: set `REMOTION_GL=swangle`, and if tiles fail with certificate errors behind a proxy, `REMOTION_BROWSER_EXECUTABLE=<system chromium>` (e.g. `/opt/pw-browsers/chromium-*/chrome-linux64/chrome`).

## storyboard.json fields

- **cameraKeyframes** `{ frame, center:[lng,lat], zoom, pitch?, bearing?, basemap?, easing? }`
  - Interpolated between consecutive keyframes; the `easing` on the *later* keyframe applies to the segment leading into it (default `easeInOutCubic`; also `linear`, `easeOutQuart`, `easeInOutQuart`).
  - `basemap`: `"satellite"` (Esri imagery) or `"dark"` (Carto dark). Switches at the midpoint of a segment — use it as a stylistic cut.
  - Zoom guide: 3–4 continent, 5–6 country, 9–12 region/town, 15–17 street level. Hold shots by repeating a keyframe with a tiny drift so the frame never feels frozen.
- **polygons** `{ id, startFrame, endFrame, fillColor, fillOpacity, strokeColor?, strokeWidth?, glowColor?, hatched?, slideFromOffset?, coordinates | geo }`
  - `hatched: true` = diagonal-hatched fill (best on dark basemap). `glowColor` adds a glowing border. Over satellite use `fillOpacity` ≈ 0.4–0.7; over dark ≈ 0.85.
- **areaCompares** `{ id, startFrame, endFrame, targetCenter:[lng,lat], slide?:{startFrame,endFrame,fromCenter?}, fillColor, fillOpacity, …, geo | coordinates }` — moves a real shape onto another place **at true scale** (Mercator-corrected), e.g. NYC over Andorra. Use the shape at its real location; the engine recentres it.
- **lines** `{ id, startFrame, endFrame, color, width, glowColor?, dashed?, drawRange?, coordinates | geo }` — `dashed` for distances, `drawRange:[from,to]` animates drawing. `geo` on a polygon feature traces its outline.
- **beacons** `{ id, lngLat, startFrame, endFrame, color, radius? }` — pulsing dots for tiny places.
- **callouts** — screen-space React/SVG graphics (`src/components/CalloutLayer.tsx`) positioned by `xPct`/`yPct` (0–100 of the frame; keep y within ~15–80 so captions stay clear). Kinds: `countryLabel`, `pinLabel`, `hookBanner` (`accentWord` + `text`), `counter` (`counterSteps`), `questionMarks`, `distanceBadge` (`text`, `subtext`, `rotationDeg`), `populationBadge`, `flag` (`flagCode`, see `CalloutItem` in `src/types/scene.ts` for drawn codes), `curvedArrow` (`targetXPct/targetYPct`), `pheasantTugOfWar` (Spain-specific).
  - Callouts don't follow the map; place them where the target appears **at that point in the camera move** (check with stills).
  - A new flag/callout kind needs code: add to `src/types/scene.ts` and a branch in `CalloutLayer.tsx`.
- **captions** `{ startFrame, endFrame, text }` — the narration script, as short contiguous phrases (1–4 s). End sentences with `.`/`?`/`!` — the voice script synthesises one sentence at a time and places it at its first cue.
- **geoSources** `{ "<id>": { naturalEarth: "ESP", scale?: "50m" } | { osm: "Llívia, Girona" } | { osmId: "R175905" } }`, each with optional `simplify` (degrees, e.g. 0.0003 town / 0.003 city / 0.02 country) and `bbox` [w,s,e,n] to drop far-away parts (e.g. French overseas territories).
- **voice** `{ voiceId?, modelId?, speed? }` — ElevenLabs settings. Pick `voiceId` from `GET https://api.elevenlabs.io/v1/voices`; never invent one.
- **audio** (optional) — `bgm` (volume ≈ 0.15–0.2), `sfx[]`, `narration` override. Paths are relative to `projects/` (shared files go in `projects/_shared/audio/`). Missing files are skipped silently; `<slug>/voice.mp3` plays automatically when present.

## Style rules (GeoGlobe Tales look)

- Colours from `src/styles/theme.ts` (`THEME.colors`) — JSON holds the hex values, so reuse those hexes. Highlight = bold saturated fill + white stroke; accent = yellow `#FACC15` glow / red `#EF4444`.
- Open with a hook in the first 3 s (question caption + `hookBanner` + `curvedArrow`).
- Something new should appear every 1–3 s: a label, number, flag, line or camera move.
- Show numbers with units in both systems where relevant (`"2 km"` / `"(1.24 mi)"`).
- End on the most surprising fact, at the tightest zoom.

## Notes

- Renders need network access to Esri/Carto tile servers (no API key). `fetch-geo` uses Nominatim (1 req/s) and Natural Earth on GitHub (cached in `.cache/`).
- OSM-derived geometry is © OpenStreetMap contributors (ODbL) — credit it in the video description.
- Keep ids unique within each array. Leave `spain-borders` intact as the reference unless asked.
