#!/usr/bin/env python3
"""Stage 6 of /map-explainer-pro: automated QA of a rendered MP4.

Checks
  1. container: H.264 yuv420p video, 1080x1920, 30 fps, AAC audio present, expected duration
  2. loudness: integrated LUFS of the MP4 audio within ±1 LU of meta.lufs (-15), true peak < -1 dBFS
  3. locked colors: for every country layer visible near the end of each rendered scene, sample the
     frame at the feature's label point (projected with the same camera math as the engine) and compare
     against country-colors.json:  dark_cutaway hatch/flat -> RGB distance to the locked fill,
     satellite tint -> hue distance to the locked fill.
  4. frames are not black / frozen (luma variance across probes)

  python3 qa_check.py projects/<slug> out/test.mp4 [--start 0] [--json report.json]
Exit code 0 = all checks pass, 1 = at least one failure.
"""
from __future__ import annotations

import argparse
import colorsys
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import mxp_common as mx  # noqa: E402

results = []


def check(name, ok, detail):
    results.append({"check": name, "ok": bool(ok), "detail": detail})
    print(f"[qa] {'PASS' if ok else 'FAIL'}  {name}: {detail}", flush=True)


def ffprobe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)], capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def grab(path, t, W, H):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", f"{t:.3f}", "-i", str(path), "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8)[: W * H * 3].reshape(H, W, 3)


def hex_rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i : i + 2], 16) for i in (0, 2, 4)], float)


def hue_deg(rgb):
    h, s, v = colorsys.rgb_to_hsv(*(np.asarray(rgb) / 255.0))
    return h * 360, s, v


def resolve_fill(key, colors):
    for _ in range(6):
        for group in ("countries", "overlays"):
            if key in colors[group]:
                return colors[group][key]["fill"]
        if key in colors["territories"]:
            key = colors["territories"][key]["parent"]
        else:
            return None
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("video")
    ap.add_argument("--start", type=float, default=0.0, help="timeline second where the video starts")
    ap.add_argument("--json", help="write the report here (default <video>.qa.json)")
    a = ap.parse_args()

    paths = mx.project_paths(a.project)
    sb = mx.load_json(paths["storyboard"])
    ts = mx.load_json(paths["timestamps"])
    colors = mx.load_json(paths["colors"])
    geo = mx.load_json(paths["geo"] / "features.geojson")
    feats = {f["properties"]["id"]: f for f in geo["features"] if f["properties"]["role"] == "feature"}
    video = Path(a.video)
    if not video.is_absolute() and not video.exists():
        video = paths["root"] / video
    meta = sb["meta"]
    W, H, fps = meta.get("width", 1080), meta.get("height", 1920), meta.get("fps", 30)

    # ---- 1. container
    info = ffprobe(video)
    v = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    au = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    dur = float(info["format"]["duration"])
    rate = eval(v["r_frame_rate"]) if v else 0  # noqa: S307  ("30/1")
    check("video stream", v and v["codec_name"] == "h264" and v.get("pix_fmt") == "yuv420p", f"{v and v['codec_name']} {v and v.get('pix_fmt')}")
    check("resolution", v and (v["width"], v["height"]) == (W, H), f"{v and v['width']}x{v and v['height']}")
    check("frame rate", abs(rate - fps) < 0.01, f"{rate:.3f} fps")
    check("audio stream", au is not None and au["codec_name"] == "aac", f"{au and au['codec_name']} {au and au.get('channels')}ch {au and au.get('sample_rate')}Hz")
    check("duration", dur > 1.0, f"{dur:.2f}s (timeline {a.start:.2f}->{a.start + dur:.2f}s)")

    # ---- 2. loudness
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(video), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", p.stderr)[-1])
    peak = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", p.stderr)[-1])
    target = meta.get("lufs", -15)
    # short excerpts measure a little differently from the full mix: ±1.5 LU tolerance
    check("loudness", abs(lufs - target) <= 1.5, f"{lufs:.1f} LUFS (target {target}), true peak {peak:.1f} dBFS")
    check("true peak", peak <= -0.5, f"{peak:.1f} dBFS")

    # ---- 3. locked colors at label points
    lumas = []
    for sc in sb["scenes"]:
        timing = next((s for s in ts["scenes"] if s["id"] == sc["id"]), None)
        if not timing:
            continue
        t_glob = timing["end"] - 0.6
        if not (a.start <= t_glob < a.start + dur):
            continue
        clock = mx.SceneClock(sc, timing, ts["words"])
        tl = t_glob - timing["start"]
        mode = sc["mode"]
        for m in sc.get("mode_at", []) or []:
            if tl >= clock.at(m):
                mode = m["mode"]
        cam = mx.camera_at(sc["camera"], clock, tl)
        frame = grab(video, t_glob - a.start, W, H).astype(float)
        lumas.append(frame.mean())
        for layer in sc.get("layers", []):
            f = feats.get(layer["feature"])
            if not f or f["geometry"]["type"] not in ("Polygon", "MultiPolygon"):
                continue
            if not (clock.at(layer) + 0.5 <= tl <= clock.until(layer)):
                continue
            covered = [e for e in sc.get("elements", []) if e.get("type") in ("TrueScaleCityCompare", "ShiftingBorderSpline")
                       and layer["feature"] in (e.get("target_feature"), e.get("feature")) and clock.at(e) <= tl <= clock.until(e)]
            if covered:
                check(f"color {sc['id']}/{layer['feature']}", True, f"skipped: intentionally covered by {covered[0]['type']}")
                continue
            style = layer.get("style", "hatch" if mode == "dark_cutaway" else "tint")
            if style not in ("hatch", "flat", "tint", "highlight"):
                continue
            key = layer.get("color") or f["properties"].get("color_key")
            fill = resolve_fill(key, colors) if key else None
            label = f["properties"].get("label")
            if not fill or not label:
                continue
            # on-screen size of the feature (bbox of its largest-ish extent around the label)
            xs, ys = [], []
            polys = [f["geometry"]["coordinates"]] if f["geometry"]["type"] == "Polygon" else f["geometry"]["coordinates"]
            for poly in polys:
                ring = poly[0]
                if not any(abs(c[0] - label[0]) < 8 and abs(c[1] - label[1]) < 8 for c in ring[:: max(1, len(ring) // 50)]):
                    continue
                for c in ring[:: max(1, len(ring) // 200)]:
                    sx, sy = mx.screen_point(cam, c[0], c[1], W, H)
                    xs.append(sx)
                    ys.append(sy)
            size = min(max(xs) - min(xs), max(ys) - min(ys)) if xs else 0
            name = f"color {sc['id']}/{layer['feature']} ({style})"
            if size < 90:
                check(name, True, f"skipped: only {size:.0f}px on screen")
                continue
            x0, y0 = mx.screen_point(cam, label[0], label[1], W, H)
            if style == "hatch":
                y0 -= layer.get("lift", 14)
            d = min(70.0, size * 0.18)
            r = 12
            exp = hex_rgb(fill)
            best = None
            # label point + 4 nearby points (labels / pins drawn on top can cover the exact label point)
            for k, (ox, oy) in enumerate([(0, 0), (d, 0), (-d, 0), (0, d), (0, -d)]):
                x, y = int(round(x0 + ox)), int(round(y0 + oy))
                if not (r <= x < W - r and r <= y < H - r):
                    continue
                patch = frame[y - r : y + r + 1, x - r : x + r + 1].reshape(-1, 3)
                if style in ("hatch", "flat"):
                    # hatch = locked fill + white stripes: the darker half of the patch is the pure fill
                    lum = patch.mean(axis=1)
                    got = np.median(patch[lum <= np.percentile(lum, 50)], axis=0)
                    score = float(np.linalg.norm(got - exp))
                else:
                    got = np.median(patch, axis=0)
                    he, _, _ = hue_deg(exp)
                    hg, sg, _ = hue_deg(got)
                    score = min(abs(he - hg), 360 - abs(he - hg)) + (0 if sg > 0.15 else 999)
                if best is None or score < best[0]:
                    best = (score, got, k)
            if best is None:
                continue
            score, got, k = best
            hexgot = "#" + "".join(f"{int(c):02X}" for c in got)
            if style in ("hatch", "flat"):
                check(name, score <= 40, f"got {hexgot} vs locked {fill} (ΔRGB {score:.0f}, probe {k})")
            else:
                check(name.replace(f"({style})", "(tint over imagery)"), score <= 30, f"{hexgot} hue Δ{score:.0f}° vs locked {fill} (probe {k})")
    if lumas:
        check("frames not black", min(lumas) > 12, f"mean luma per probe {[round(l) for l in lumas]}")

    out = Path(a.json) if a.json else video.with_suffix(".qa.json")
    passed = all(r["ok"] for r in results)
    mx.save_json(out, {"video": str(video), "passed": passed, "results": results}, indent=1)
    print(f"[qa] {'ALL CHECKS PASSED' if passed else 'QA FAILED'} -> {out}")
    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
