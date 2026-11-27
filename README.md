# Maexplainer — map-explainer video studio

A reusable studio for vertical (**1080×1920, 30 fps**) geography explainer shorts, packaged as the
Claude Code skill **`/map-explainer-pro`**. Claude writes a storyboard; scripts fetch real geometry and
satellite tiles, voice it, score it, render it CPU-only, and QA the result.

![pipeline](https://img.shields.io/badge/pipeline-storyboard→geo/tiles→audio→render→QA-2A9BB0)

## Repo layout

```
.claude/skills/map-explainer-pro/     the skill (auto-loaded by Claude Code in this repo)
├── SKILL.md                          6-stage pipeline instructions
├── references/country-colors.json    LOCKED palette (fills, 0.55 tints, borders, glows, inheritance)
├── references/storyboard-schema.md   storyboard.json reference
├── templates/spain-borders/          7-scene "Spain's Strangest Borders" reference storyboard
└── scripts/
    ├── init_project.py               1  workspace setup
    ├── fetch_geo_and_tiles.py        3  Natural Earth 10m + OSM/Overpass/Nominatim geometry, Esri tile cache, fonts
    ├── sound_engine.py               4  VO + word timestamps, SFX, 112 BPM bed, ducking, −15 LUFS mix
    ├── render_chunks.mjs             5  resumable 150-frame chunk render + FFmpeg concat + audio mux
    ├── preview_stills.mjs               fast visual previews
    ├── qa_check.py                   6  container / loudness / locked-color pixel QA
    └── mxp_common.py                    shared camera + projection + timing math (mirrors the engine)
engine/                               Remotion 4 template: pre-cached tiles + d3-geo Mercator SVG, no WebGL
projects/<slug>/                      one folder per video (storyboard.json, assets/, out/)
Magexplainer/                         earlier MapLibre-based engine + its videos (legacy, untouched)
```

## Setup

```bash
cd engine && npm ci && cd ..
pip install -r .claude/skills/map-explainer-pro/scripts/requirements.txt
# needs ffmpeg + ffprobe on PATH
```

### Environment variables

| variable | required | purpose |
|---|---|---|
| `ELEVENLABS_API_KEY` | optional | ElevenLabs voiceover with character-level timestamps. If unset, the free **edge-tts** voice `en-US-AndrewNeural` (word boundaries) is used automatically. |
| `MXP_NO_OVERPASS` | optional | `1` skips Overpass and uses Nominatim directly (useful behind restrictive proxies). |
| `MXP_ENGINE` | optional | path to `engine/` when the skill is used from another repo. |
| `MXP_CACHE` | optional | cache dir for Natural Earth downloads and render bundles (default `~/.cache/map-explainer-pro`). |

## Using it from Claude Code

The skill loads automatically in this repo. Example prompts:

- `/map-explainer-pro Make "Italy's Strangest Borders": San Marino, Vatican, Campione d'Italia, Livigno. ~60 s.`
- `/map-explainer-pro True-size short: how many Luxembourgs fit inside Texas? dark cutaway counter, then satellite.`
- `/map-explainer-pro Re-render the spain-borders-sample project with a slower Pheasant Island scene and push it.`
- `/map-explainer-pro Baarle-Nassau vs Baarle-Hertog enclaves, 45 s, edge-tts voice, render scenes 1-2 as a test first.`

To use the skill in **another** Claude Code setup, copy `.claude/skills/map-explainer-pro/` into that
project's (or your user) `.claude/skills/`, and either keep this repo's `engine/` next to it or set `MXP_ENGINE`.

## Manual pipeline

```bash
SK=.claude/skills/map-explainer-pro
python3 $SK/scripts/init_project.py my-video --template spain-borders     # 1 workspace
$EDITOR projects/my-video/storyboard.json                                 # 2 storyboard
python3 $SK/scripts/fetch_geo_and_tiles.py projects/my-video              # 3 geo + tiles
python3 $SK/scripts/sound_engine.py projects/my-video                     # 4 audio
node $SK/scripts/render_chunks.mjs projects/my-video --out out/my-video.mp4   # 5 render (re-run to resume)
python3 $SK/scripts/qa_check.py projects/my-video out/my-video.mp4        # 6 QA
git add -f projects/my-video/out/my-video.mp4                             # deliverable only
```

Preview in Remotion Studio: `cd engine && npx remotion studio src/index.ts --public-dir=../projects/my-video`.

## Sample

`projects/spain-borders-sample/out/test-spain-borders.mp4` — the first two scenes (0–12.6 s) of the
Spain template: satellite hook with locked Spain/France/Portugal tints, then the dark-cutaway neighbour
counter. QA report next to it (`.qa.json`).

## Credits

Imagery © Esri, Maxar, Earthstar Geographics and the GIS User Community (World Imagery tiles, cached
locally for rendering). Boundaries © Natural Earth (public domain) and © OpenStreetMap contributors (ODbL).
Montserrat font (SIL OFL).
