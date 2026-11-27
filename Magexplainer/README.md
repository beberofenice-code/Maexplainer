# Map Explainer Studio (Magexplainer)

A programmatic, **GeoGlobe Tales-style** vertical (`1080×1920 @ 30fps`) geography explainer video engine built with **Remotion** and **MapLibre GL JS**.

Pre-loaded with a full 96.6-second reference recreation of **Spain's Strangest Borders** covering all 6 beats:
1. **Intro & Neighbor Counter** — Satellite zoom into Iberia, dark charcoal vector cut, diagonal hatched country fills, and animated `1 → 2 → 4 → 5` counter.
2. **Llívia Enclave** — Pyrenees glowing border, popping `?` icons, `2 km (1.24 mi)` dashed measurement bar, and French/Spanish flag callouts.
3. **Pheasant Island** — Street-level satellite zoom, playful stick-arm flag tug-of-war, and animated 6-month ownership border shift.
4. **Andorra vs. New York City** — Microstate highlight, `80,000` population badge, and true-scale NYC polygon slide-over comparison.
5. **United Kingdom & Gibraltar** — `706 km (438 mi)` dashed line, animated red arc to Gibraltar, and Europe/Africa continental split.
6. **Ceuta, Melilla & Peñón de Vélez de la Gomera** — Morocco teal overlay, pulsing orange beacons, and the `85 m (279 ft)` shortest land border in the world.

## Layout

```
Magexplainer/
├── SKILL.md                  # Agent skill instructions (symlinked from .claude/skills/magexplainer)
├── package.json
├── remotion.config.ts        # public dir = projects/
├── scripts/
│   ├── fetch-geojson.ts      # Pulls country/enclave polygons from OSM/Natural Earth → geo.json
│   ├── generate-voice.ts     # ElevenLabs TTS → voice.mp3 + word-level captions.json
│   └── render.ts             # Orchestrates the full build → out/<slug>.mp4
├── src/
│   ├── Root.tsx              # Auto-registers one composition per project (1080x1920, 30fps)
│   ├── MapVideo.tsx          # Master timeline reading storyboard.json
│   ├── project.ts            # Project discovery + geo.json reference resolution
│   └── components/
│       ├── MapCanvas.tsx     # MapLibre camera interpolator + GeoJSON layers
│       ├── CalloutLayer.tsx  # Animated arrows, flags, labels, badges, counters
│       ├── AreaCompare.tsx   # Overlays one polygon onto another at true scale
│       └── Captions.tsx      # Word-synced subtitle renderer
└── projects/
    ├── _shared/audio/        # Shared bgm / sfx
    └── spain-borders/        # Reference project
        ├── storyboard.json   # Scene timings, camera coords, overlays, script
        ├── geo.json          # Real Llívia + NYC outlines (OSM)
        ├── voice.mp3
        └── captions.json
```

Other projects: `italy-borders`, `france-borders`, `germany-borders`, `switzerland-borders` (captions only, no voice yet).

## Quick Start

```bash
npm install
npm run studio                          # scrub every project in Remotion Studio
npm run render -- spain-borders         # → out/spain-borders.mp4 (H.264, 1080x1920@30)
npm run render -- spain-borders --still 1540   # → out/spain-borders-1540.png
```

On a headless server set `REMOTION_GL=swangle`; behind a TLS-intercepting proxy also set
`REMOTION_BROWSER_EXECUTABLE` to a Chrome/Chromium that trusts the proxy CA.

## Creating Your Own Video

1. Copy `projects/spain-borders/storyboard.json` to `projects/<slug>/storyboard.json` and give it a new `id`.
2. Edit `cameraKeyframes`, `polygons`, `areaCompares`, `lines`, `beacons`, `callouts`, `captions` (all times in frames @ 30fps).
3. For real borders, add `geoSources` (Natural Earth country codes, OSM searches or ids), reference them as `"geo": "<id>"`, and run `npm run fetch-geo -- <slug>`.
4. Narrate: `ELEVENLABS_API_KEY=… npm run voice -- <slug>` writes `voice.mp3` and word-level `captions.json`
   (one TTS request per sentence, each placed at its caption cue; reports any drift). `--timing-only` skips audio.
5. `npm run render -- <slug>`.

See `SKILL.md` for the full storyboard reference and style rules.

## Credits

Satellite imagery © Esri, Maxar, Earthstar Geographics; dark basemap © CARTO; OSM-derived outlines © OpenStreetMap contributors (ODbL); country shapes from Natural Earth.

## License

MIT
