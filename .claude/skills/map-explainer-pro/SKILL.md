---
name: map-explainer-pro
description: Produce a finished vertical (1080x1920, 30 fps) geography / map explainer video end-to-end — storyboard JSON, Natural Earth + OSM geometry, offline Esri satellite tiles, ElevenLabs (or free edge-tts) voiceover with word timestamps, synthesized SFX + 112 BPM music bed at -15 LUFS, and a CPU-fast WebGL-free Remotion render in resumable chunks, then automated QA and git push. Use for "map explainer", "strangest borders", enclave/exclave, true-size comparison or any country/territory short, or when the user types /map-explainer-pro.
---

# /map-explainer-pro — map-explainer video studio

Six-stage pipeline. Every stage is a script in `scripts/`; every video is **data**
(`projects/<slug>/storyboard.json`). Only touch `engine/` when a genuinely new visual is needed.

Paths below are relative to the repo root (the folder containing `engine/` and `.claude/`).
`SK=.claude/skills/map-explainer-pro`. If `engine/` is missing (skill imported into another repo),
clone `https://github.com/beberofenice-code/Maexplainer` and point `MXP_ENGINE=<clone>/engine`.

| # | Stage | Command | Output |
|---|-------|---------|--------|
| 1 | Workspace setup | `python3 $SK/scripts/init_project.py <slug> [--template spain-borders]` | `projects/<slug>/`, engine `node_modules` |
| 2 | Storyboard JSON | write `projects/<slug>/storyboard.json` (schema: `references/storyboard-schema.md`) | — |
| 3 | Geo + tiles | `python3 $SK/scripts/fetch_geo_and_tiles.py projects/<slug>` | `assets/geo/features.geojson`, `assets/tiles/**`, fonts |
| 4 | Audio | `python3 $SK/scripts/sound_engine.py projects/<slug>` | `assets/audio/{vo,mix}.wav`, `timestamps.json`, `sfx/*.wav` |
| 5 | Render | `node $SK/scripts/render_chunks.mjs projects/<slug> --out out/<slug>.mp4` | `projects/<slug>/out/<slug>.mp4` |
| 6 | QA + push | `python3 $SK/scripts/qa_check.py projects/<slug> out/<slug>.mp4` then commit/push | `out/<slug>.qa.json` |

Preview stills any time after stage 3: `node $SK/scripts/preview_stills.mjs projects/<slug> [--per-scene 2 | --frames 30,200]`
(→ `projects/<slug>/out/stills/`). **Look at them** before a full render.

## Stage 1 — workspace
- `init_project.py` creates `assets/{geo,tiles,audio,fonts}`, `out/`, copies the locked palette and runs `npm ci` in `engine/` if needed.
- Requirements: Node ≥ 18, Python 3.10+ with `numpy scipy requests` (`edge-tts` optional), `ffmpeg`/`ffprobe`, Chromium (Remotion downloads its headless shell if absent).

## Stage 2 — storyboard (the creative work)
Read `templates/spain-borders/storyboard.json` first and copy its pacing. Rules:
- **5–8 scenes, 4–11 s each, 45–75 s total.** One fact per scene; open with a hook (`HookTitle` + `CalloutArrow`) in the first 2 s.
- Narration is written per scene; **time everything with `at_word`** (`{"at_word": "Llívia", "offset": 0.2}`) so visuals land on the spoken word. Spell numbers as words in narration ("eighty-five metres") and show digits on screen (`StatBadge`).
- Something new every 1–3 s: a layer, label, pin, counter step, arc, or camera move.
- Alternate `satellite` scenes with at least one `dark_cutaway` scene (counter / overview / mystery silhouettes). `mode_at` can hard-cut modes inside a scene (dark overview → satellite street-level zoom).
- **Colors are locked**: never write ad-hoc hex for countries. Use keys from `references/country-colors.json`; enclaves/territories set `"parent"` and inherit automatically. Add a new country there (fill, 0.55 tint, white border, glow) before using it.
- Camera zoom guide (512-px world): 3–4 continent, 4.5–5.5 country, 7–9 region, 11–13 town, 15–17.5 street. Big zooms take 2–3 s; hold shots drift slightly (`easing: "linear"`). Pitch ≤ 32°.
- Screen-space elements use `at` (lng,lat — follows the map), `at_pct` ([x%, y%] of frame) or `at_feature`. Keep text between y 10–70 %; subtitles live at 76 %.

## Stage 3 — geometry & tiles
- Countries: Natural Earth 10m (`source: natural_earth`, `adm0_a3`). Shared borders: `ne_boundary` with `between`.
- Micro-geography (enclaves, islands, cities): `source: osm` + `osm: "R123"/"W456"` → Overpass, then Nominatim lookup/search, then `fallback_coordinates`. If OSM only has a point, trace an `inline` polygon from imagery (see the Peñón in the template).
- Coarse Natural Earth parts/holes for an enclave are **replaced by the precise child geometry** automatically (parent and neighbours stay seamless).
- Tiles are planned from the camera path itself (timing-independent), so they can be fetched before audio. `--scenes 1-2` limits tiles for a test; `--dry-run` prints the plan. Typical: 3–5k tiles, ~60 MB, < 30 s.
- Set `MXP_NO_OVERPASS=1` if Overpass is blocked (sandboxed networks) to skip straight to Nominatim.

## Stage 4 — audio
- `ELEVENLABS_API_KEY` set → ElevenLabs `with-timestamps` (default voice "Brian", `eleven_multilingual_v2`, scene-to-scene context stitching). Otherwise free `edge-tts` `en-US-AndrewNeural` with WordBoundary timing. `--allow-silent` for layout work without any TTS.
- VO is cached per scene by content hash in `assets/audio/vo/` → re-runs cost no credits; only edited scenes are re-voiced.
- Scene length = max(`min_duration_s`, VO + `tail_s`). SFX are cued automatically per element type (override with `"sfx": "<name>"`, mute with `"sfx": null`): whoosh_deep (transitions/arcs), pop_marimba (pins/counter/question marks), paper_slide (arrows/rulers/true-scale), tug_stretch (flags), border_flip (sovereignty flips), chime_reveal (stat badges/border bars).
- Bed: 112 BPM marimba + plucked pulse, side-chain ducked under VO. **Off by default in the template** (`meta.music.enabled: false` — the user prefers VO + SFX only); enable only if asked. Final mix: two-pass loudnorm to `meta.lufs` (−15 LUFS, −1.5 dBTP).
- Audio-only edits (voice settings, music, SFX cues, loudness) don't invalidate rendered chunks: re-run `sound_engine.py` then `render_chunks.mjs` and it only re-muxes.

## Stage 5 — render
- `render_chunks.mjs` bundles once (cached), renders 150-frame chunks with all CPU cores and joins them losslessly; **re-run the same command to resume** after a crash/timeout. Chunks auto-invalidate when storyboard, timestamps, tiles or engine change. `--scenes 1-2` or `--seconds 0-12` for tests, `--fresh` to force.
- Pure DOM/SVG + `<img>` tiles: no WebGL, ~5 s of video per 20–30 s of 4-core CPU.

## Stage 6 — QA & delivery
- `qa_check.py` must print `ALL CHECKS PASSED`: H.264/yuv420p 1080×1920@30, AAC, loudness ±1.5 LU of target, true peak, and pixel probes that compare every visible country layer with its **locked color** (hatch ΔRGB ≤ 40, satellite tint hue Δ ≤ 30°).
- Also eyeball 3–4 frames (`ffmpeg -ss <t> -i video.mp4 -frames:v 1 f.png`).
- Commit sources (storyboard, geo, timestamps, VO mp3 cache); tiles/chunks/out are git-ignored — force-add only the final MP4: `git add -f projects/<slug>/out/<slug>.mp4`. Push to the working branch.

## Engine reference (`engine/`)
Layers (`scene.layers[]`, styles): `tint` · `highlight` · `outline` · `hatch` (lifted, diagonal white hatch) · `flat` · `silhouette` (mystery) · `line`.
Elements (`scene.elements[]`): `HookTitle`, `Label`, `CalloutArrow`, `QuestionMarks`, `DistanceRuler` (auto km/mi), `TravelArc` (`label: "auto"`), `FlagWithTugArms` (ES FR PT AD GB MA US MC), `ShiftingBorderSpline`, `TrueScaleCityCompare`, `StatBadge` (count-up), `HotspotPin`, `GlowingBorderBar`, `Counter` (top yellow, dark_cutaway). Subtitles (2–4 words, active-word highlight) are automatic from `timestamps.json`.
New element = component in `engine/src/components/`, registered in `SCREEN_ELEMENTS` / `PLANE_ELEMENTS` (`engine/src/MapExplainer.tsx`), plus an `AUTO_SFX` entry in `scripts/mxp_common.py`. Camera/projection math is mirrored in `engine/src/lib/{camera,mercator,timing}.ts` ↔ `scripts/mxp_common.py` — change both together.
