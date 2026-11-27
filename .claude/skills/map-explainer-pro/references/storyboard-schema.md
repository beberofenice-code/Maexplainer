# storyboard.json schema (v1)

```jsonc
{
  "schema_version": 1,
  "meta": {
    "slug": "spain-borders", "title": "Spain's Strangest Borders",
    "fps": 30, "width": 1080, "height": 1920,
    "lufs": -15,                      // final mix target
    "max_tile_zoom": 18,              // Esri tile zoom cap
    "voice": { "provider": "auto",    // auto | elevenlabs | edge | silent
               "elevenlabs_voice": "Brian", "elevenlabs_voice_id": "<optional>",
               "elevenlabs_model": "eleven_multilingual_v2",
               "stability": 0.42, "similarity_boost": 0.8, "style": 0.3,
               "edge_voice": "en-US-AndrewNeural", "edge_rate": "+6%" },
    "music": { "bpm": 112, "bed_db": -25, "duck_db": -9 },
    "subtitles": { "max_words": 3, "y_pct": 76 }
  },
  "geo": {
    "context": ["ESP", "FRA", "..."],  // NE adm0 codes drawn as backdrop land/borders
    "context_simplify_deg": 0.004,
    "features": [
      { "id": "spain", "source": "natural_earth", "adm0_a3": "ESP" },
      { "id": "pyrenees_border", "source": "ne_boundary", "between": ["ESP", "FRA"], "color": "highlight" },
      { "id": "llivia", "source": "osm", "osm": "R356747", "nominatim": "Llívia, Girona, Spain", "parent": "spain" },
      { "id": "nyc", "source": "nominatim", "nominatim": "New York City", "color": "nyc_size_overlay" },
      { "id": "x", "source": "inline", "type": "Polygon", "coordinates": [[[lng, lat], "..."]] }
      // any osm/nominatim feature may add "fallback_coordinates"; "label": [lng,lat] sets the QA probe point
    ]
  },
  "scenes": [ {
    "id": "llivia",
    "mode": "satellite",               // satellite | dark_cutaway
    "mode_at": [{ "at_word": "Peñón", "mode": "satellite" }],   // optional hard cuts
    "narration": "High in the Pyrenees sits Llívia, ...",
    "min_duration_s": 6.5, "tail_s": 0.5, "vo_lead_s": 0.18,
    "show_context_borders": true,
    "transition_sfx": "whoosh_deep",   // default for scenes after the first; null to mute
    "camera": [ { "t": 0, "center": [0.9, 42.7], "zoom": 7, "pitch": 12, "bearing": 0 },
                { "at_word": "Spanish", "center": [1.975, 42.463], "zoom": 12.4, "pitch": 28, "easing": "easeInOutCubic" } ],
    "layers":   [ { "feature": "llivia", "style": "highlight", "at_word": "Llivia", "until_word": "France" } ],
    "elements": [ { "type": "HotspotPin", "at_word": "Llivia", "at": [1.981, 42.466], "label": "Llívia" } ],
    "sfx":      [ { "name": "chime_reveal", "at_word": "surrounded", "gain_db": -4 } ]
  } ]
}
```

## Timing (all layers, elements, keyframes, cues)
Start: `t` (seconds from scene start) **or** `at_word` (+ `occurrence`, `offset`). Words match case/accent-insensitively; prefixes of 4+ letters match ("Llivia" ⇢ "Llívia,").
End: `duration` | `until_word` (+ `until_occurrence`, `until_offset`) | `until_t` | default = scene end.
Easing on a keyframe applies to the segment *into* it: `linear`, `easeInOutCubic` (default), `easeOutQuart`, `easeInOutQuart`, `easeOutBack`.

## Layer styles
| style | mode | look |
|---|---|---|
| `tint` | satellite | locked 0.55 RGBA tint, glow + white border |
| `highlight` | satellite | tint + yellow `#FFE600` glow border |
| `outline` | any | border + glow only |
| `hatch` | dark_cutaway | lifted (`lift` px) locked fill + diagonal white hatch + drop shadow |
| `flat` | any | solid locked fill + white border |
| `silhouette` | dark_cutaway | dark mystery shape with dashed white outline |
| `line` | any | line features (borders, routes) with glow |
Optional: `color` (palette key or hex), `width`, `opacity`, `lift`.

## Elements
| type | key fields |
|---|---|
| `HookTitle` | `accent`, `text`, `y_pct`, `size` |
| `Label` | `at`/`at_pct`, `text`, `size`, `text_color`, `uppercase` |
| `CalloutArrow` | `from`/`from_pct`, `to`/`to_pct`, `curve`, `label`, `gap` |
| `QuestionMarks` | `at`, `count`, `radius`, `size` |
| `DistanceRuler` | `from`, `to`, `label` (default auto "x km (y mi)"), `label_offset`, `badge_color` |
| `TravelArc` | `from`, `to`, `height`, `side`, `draw_s`, `label` (`"auto"` = distance) |
| `FlagWithTugArms` | `at`/`at_pct`, `left`, `right` (ES FR PT AD GB MA US MC), `spread`, `scale` |
| `ShiftingBorderSpline` | `feature`, `colors: [a, b]`, `flips`, `period_s`, `sweep_s` |
| `TrueScaleCityCompare` | `feature`, `target` or `target_feature`, `color`, `slide_s` |
| `StatBadge` | `at_pct`, `value` (+`prefix`,`suffix`,`decimals`, count-up) or `text`, `label`, `size` |
| `HotspotPin` | `at`, `label`, `size`, `label_size`, `label_dx/dy` |
| `GlowingBorderBar` | `feature` (line) or `coordinates`, `width`, `draw_s` |
| `Counter` | `steps: [{at_word, value}]`, `label`, `y_pct`, `size` |
Every element accepts `color` (palette key), `sfx` (name or `null`), `sfx_gain_db`.
