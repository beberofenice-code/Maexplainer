"""Shared helpers for the /map-explainer-pro Python pipeline.

Everything here mirrors engine/src/lib/{timing,camera,mercator}.ts so that tile
pre-caching, SFX timing and QA probes line up with what Remotion renders.
"""
from __future__ import annotations

import json
import math
import os
import re
import unicodedata
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
COLORS_PATH = SKILL_DIR / "references" / "country-colors.json"
PERSPECTIVE = 2200.0
W_DEFAULT, H_DEFAULT = 1080, 1920
USER_AGENT = "map-explainer-pro/1.0 (Claude Code skill; offline tile cache)"

# Element type -> default SFX (an element can override with "sfx": "<name>" or disable with "sfx": null)
AUTO_SFX = {
    "CalloutArrow": "paper_slide",
    "QuestionMarks": "pop_marimba",
    "DistanceRuler": "paper_slide",
    "TravelArc": "whoosh_deep",
    "FlagWithTugArms": "tug_stretch",
    "ShiftingBorderSpline": "border_flip",
    "TrueScaleCityCompare": "paper_slide",
    "StatBadge": "chime_reveal",
    "HotspotPin": "pop_marimba",
    "GlowingBorderBar": "chime_reveal",
    "Counter": "pop_marimba",
}


# ----------------------------------------------------------------------------- io
def load_json(path, default=None):
    p = Path(path)
    if not p.exists():
        if default is not None:
            return default
        raise FileNotFoundError(p)
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data, indent=None):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=indent)


def project_paths(project_dir):
    root = Path(project_dir).resolve()
    return {
        "root": root,
        "storyboard": root / "storyboard.json",
        "geo": root / "assets" / "geo",
        "tiles": root / "assets" / "tiles",
        "audio": root / "assets" / "audio",
        "fonts": root / "assets" / "fonts",
        "colors": root / "assets" / "country-colors.json",
        "timestamps": root / "assets" / "audio" / "timestamps.json",
        "out": root / "out",
        "chunks": root / "chunks",
    }


# ----------------------------------------------------------------------------- words / timing
def norm_word(w: str) -> str:
    """Must match engine normWord()."""
    w = unicodedata.normalize("NFD", w)
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", w.lower())


def estimate_timestamps(sb):
    """Same fallback as engine estimateTimestamps() (used before audio exists)."""
    t, scenes, words = 0.0, [], []
    for sc in sb["scenes"]:
        toks = sc["narration"].split()
        per = 0.36
        vo_len = len(toks) * per
        dur = max(sc.get("min_duration_s", 0), vo_len + sc.get("tail_s", 0.5) + 0.15)
        for i, w in enumerate(toks):
            words.append({"word": w, "start": t + 0.15 + i * per, "end": t + 0.15 + (i + 1) * per - 0.04, "scene": sc["id"]})
        scenes.append({"id": sc["id"], "start": t, "end": t + dur, "vo_start": t + 0.15, "vo_end": t + 0.15 + vo_len})
        t += dur
    return {"fps": sb["meta"].get("fps", 30), "total_s": t, "provider": "estimate", "scenes": scenes, "words": words}


class SceneClock:
    """Mirror of engine SceneClock: resolves t / at_word specs to scene-local seconds."""

    def __init__(self, scene, timing, all_words):
        self.scene = scene
        self.timing = timing
        self.words = [w for w in all_words if w["scene"] == scene["id"]]

    @property
    def duration(self):
        return self.timing["end"] - self.timing["start"]

    def word_time(self, word, occurrence=1):
        target = norm_word(word)
        n = 0
        for w in self.words:
            nw = norm_word(w["word"])
            if nw == target or (len(target) > 3 and nw.startswith(target)):
                n += 1
                if n == occurrence:
                    return w["start"] - self.timing["start"]
        return None

    def at(self, spec, fallback=0.0):
        off = spec.get("offset", 0) or 0
        if spec.get("at_word"):
            wt = self.word_time(spec["at_word"], spec.get("occurrence", 1))
            if wt is not None:
                return max(0.0, wt + off)
        if isinstance(spec.get("t"), (int, float)):
            return spec["t"] + off
        return fallback + off

    def until(self, spec):
        start = self.at(spec)
        if isinstance(spec.get("duration"), (int, float)):
            return start + spec["duration"]
        if spec.get("until_word"):
            wt = self.word_time(spec["until_word"], spec.get("until_occurrence", 1))
            if wt is not None:
                return wt + spec.get("until_offset", 0)
        if isinstance(spec.get("until_t"), (int, float)):
            return spec["until_t"]
        return self.duration + 1


# ----------------------------------------------------------------------------- mercator / camera
def lnglat_to_norm(lng, lat):
    lat = max(-85.0511, min(85.0511, lat))
    s = math.sin(math.radians(lat))
    return (lng + 180.0) / 360.0, 0.5 - math.log((1 + s) / (1 - s)) / (4 * math.pi)


def norm_to_lnglat(u, v):
    lng = u * 360.0 - 180.0
    n = math.pi - 2 * math.pi * v
    return lng, math.degrees(math.atan(math.sinh(n)))


def world_size(zoom):
    return 512.0 * 2 ** zoom


def tile_zoom_for(zoom, max_zoom):
    """Must match engine tileZoomFor()."""
    return max(1, min(max_zoom, int(math.floor(zoom + 1 + 0.35))))


def tile_levels(zoom, max_zoom):
    """Tile levels the engine's TileLayer draws for a camera zoom."""
    zt = tile_zoom_for(zoom, max_zoom)
    return sorted({max(1, zt - 3), max(1, zt - 1), zt})


def kf_state(k):
    u, v = lnglat_to_norm(*k["center"])
    return {"u": u, "v": v, "zoom": k["zoom"], "pitch": k.get("pitch", 0), "bearing": k.get("bearing", 0)}


def interp_camera(a, b, e):
    """Must match engine interpCamera(): constant screen-speed center during zooms."""
    zoom = a["zoom"] + (b["zoom"] - a["zoom"]) * e
    sA, sB, s = 2 ** a["zoom"], 2 ** b["zoom"], 2 ** zoom
    if abs(b["zoom"] - a["zoom"]) < 1e-3:
        u = a["u"] + (b["u"] - a["u"]) * e
        v = a["v"] + (b["v"] - a["v"]) * e
    elif b["zoom"] > a["zoom"]:
        k = sA * (1 - e) / s
        u = b["u"] - (b["u"] - a["u"]) * k
        v = b["v"] - (b["v"] - a["v"]) * k
    else:
        k = sB * e / s
        u = a["u"] + (b["u"] - a["u"]) * k
        v = a["v"] + (b["v"] - a["v"]) * k
    return {
        "u": u,
        "v": v,
        "zoom": zoom,
        "pitch": a["pitch"] + (b["pitch"] - a["pitch"]) * e,
        "bearing": a["bearing"] + (b["bearing"] - a["bearing"]) * e,
    }


EASE = {
    "linear": lambda x: x,
    "easeInOutCubic": lambda x: 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2,
    "easeOutQuart": lambda x: 1 - (1 - x) ** 4,
    "easeInOutQuart": lambda x: 8 * x ** 4 if x < 0.5 else 1 - (-2 * x + 2) ** 4 / 2,
    "easeOutBack": lambda x: 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2,
}


def camera_at(keys, clock, t):
    if not keys:
        return {"u": 0.5, "v": 0.5, "zoom": 2, "pitch": 0, "bearing": 0}
    times = [clock.at(k, 0 if i == 0 else clock.duration) for i, k in enumerate(keys)]
    if t <= times[0]:
        return kf_state(keys[0])
    for i in range(1, len(keys)):
        if t <= times[i]:
            span = max(1e-6, times[i] - times[i - 1])
            x = (t - times[i - 1]) / span
            e = EASE.get(keys[i].get("easing", "easeInOutCubic"), EASE["easeInOutCubic"])(x)
            return interp_camera(kf_state(keys[i - 1]), kf_state(keys[i]), e)
    return kf_state(keys[-1])


def camera_path_states(keys, steps_per_segment=48):
    """Timing-independent sampling of every camera state a scene can show.
    (Easing only changes *when* a state is reached, never *which* states exist.)"""
    if not keys:
        return []
    states = [kf_state(keys[0])]
    for i in range(1, len(keys)):
        a, b = kf_state(keys[i - 1]), kf_state(keys[i])
        n = max(4, int(steps_per_segment * (1 + abs(b["zoom"] - a["zoom"]) / 2)))
        ease = keys[i].get("easing", "easeInOutCubic")
        for j in range(1, n + 1):
            e = j / n
            states.append(interp_camera(a, b, e))
            if ease == "easeOutBack":  # overshoot
                states.append(interp_camera(a, b, min(1.12, e * 1.1)))
    return states


def plane_bounds(cam, W=W_DEFAULT, H=H_DEFAULT, margin=64.0):
    """Mirror of makeViewport().planeBounds: visible map-plane bbox in plane px."""
    a = math.radians(cam["pitch"])
    b = math.radians(-cam["bearing"])
    cx, cy, d = W / 2, H / 2, PERSPECTIVE
    pts = []
    for fx in (0, 0.5, 1):
        for fy in (0, 0.5, 1):
            X, Y = fx * W - cx, fy * H - cy
            yr = Y * d / (d * math.cos(a) + Y * math.sin(a))
            xr = X * (d - yr * math.sin(a)) / d
            x = xr * math.cos(-b) - yr * math.sin(-b)
            y = xr * math.sin(-b) + yr * math.cos(-b)
            pts.append((x + cx, y + cy))
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return min(xs) - margin, min(ys) - margin, max(xs) + margin, max(ys) + margin


def visible_tiles(cam, z, W=W_DEFAULT, H=H_DEFAULT, ring=1):
    """Mirror of engine visibleTiles() plus a safety ring of `ring` tiles."""
    world = world_size(cam["zoom"])
    x0, y0, x1, y1 = plane_bounds(cam, W, H)
    n = 2 ** z
    u0 = cam["u"] + (x0 - W / 2) / world
    v0 = cam["v"] + (y0 - H / 2) / world
    u1 = cam["u"] + (x1 - W / 2) / world
    v1 = cam["v"] + (y1 - H / 2) / world
    tx0, tx1 = math.floor(u0 * n) - ring, math.floor(u1 * n) + ring
    ty0, ty1 = max(0, math.floor(v0 * n) - ring), min(n - 1, math.floor(v1 * n) + ring)
    for y in range(ty0, ty1 + 1):
        for x in range(tx0, tx1 + 1):
            yield (x % n, y)


def screen_point(cam, lng, lat, W=W_DEFAULT, H=H_DEFAULT):
    """Mirror of viewport.screen(): lng/lat -> output pixel (used by qa_check)."""
    world = world_size(cam["zoom"])
    u, v = lnglat_to_norm(lng, lat)
    px, py = (u - cam["u"]) * world + W / 2, (v - cam["v"]) * world + H / 2
    a, b = math.radians(cam["pitch"]), math.radians(-cam["bearing"])
    x, y = px - W / 2, py - H / 2
    xr = x * math.cos(b) - y * math.sin(b)
    yr = x * math.sin(b) + y * math.cos(b)
    k = PERSPECTIVE / (PERSPECTIVE - yr * math.sin(a))
    return W / 2 + xr * k, H / 2 + yr * math.cos(a) * k


def scene_modes(scene):
    modes = {scene.get("mode", "satellite")}
    for m in scene.get("mode_at", []) or []:
        modes.add(m.get("mode"))
    return modes


def haversine_km(a, b):
    R = 6371.0088
    la1, la2 = math.radians(a[1]), math.radians(b[1])
    dla, dln = la2 - la1, math.radians(b[0] - a[0])
    h = math.sin(dla / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(dln / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def selected_scenes(sb, scenes_arg):
    """--scenes "1-2" | "hook,neighbors" | None -> list of scene dicts."""
    if not scenes_arg:
        return list(sb["scenes"])
    ids = [s["id"] for s in sb["scenes"]]
    out = []
    for part in scenes_arg.split(","):
        part = part.strip()
        if re.fullmatch(r"\d+-\d+", part):
            a, b = map(int, part.split("-"))
            out += sb["scenes"][a - 1 : b]
        elif part.isdigit():
            out.append(sb["scenes"][int(part) - 1])
        elif part in ids:
            out.append(sb["scenes"][ids.index(part)])
    return out


def env_flag(name):
    return os.environ.get(name, "").strip().lower() in ("1", "true", "yes")
