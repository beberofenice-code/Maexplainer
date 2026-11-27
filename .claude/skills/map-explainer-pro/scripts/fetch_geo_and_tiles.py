#!/usr/bin/env python3
"""Stage 3 of /map-explainer-pro: GeoJSON + satellite tile cacher.

Reads a project's storyboard.json and produces everything the Remotion engine needs
to render fully OFFLINE (no WebGL, no network during render):

  assets/geo/features.geojson   storyboard features (+ context countries), rewound for d3-geo,
                                each tagged with its LOCKED color_key from country-colors.json
  assets/tiles/{z}/{x}/{y}.jpg  Esri World Imagery tiles covering every camera state of every
                                satellite scene (timing-independent path sampling)
  assets/tiles/manifest.json    list of cached tiles (engine only requests what exists)
  assets/fonts/*.woff2          Montserrat 700/900 for titles & subtitles
  assets/country-colors.json    copy of the locked palette

Geometry sources, in order of preference per feature:
  natural_earth  Natural Earth 10m admin-0 countries (by adm0_a3)
  ne_boundary    Natural Earth 10m land boundary lines between two adm0 codes
  osm            Overpass (relation/way geometry, rings stitched) -> Nominatim lookup by OSM id
                 -> Nominatim search -> fallback_coordinates
  nominatim      Nominatim search (polygon_geojson) -> fallback_coordinates
  inline         coordinates written in the storyboard

Usage:
  python3 fetch_geo_and_tiles.py projects/<slug> [--scenes 1-2] [--max-zoom 18] [--workers 16]
                                 [--skip-geo] [--skip-tiles] [--skip-fonts] [--dry-run]
"""
from __future__ import annotations

import argparse
import concurrent.futures as cf
import json
import os
import re
import shutil
import sys
import time
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
import mxp_common as mx  # noqa: E402

NE_BASE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"
NE_COUNTRIES = "ne_10m_admin_0_countries.geojson"
NE_BOUNDARIES = "ne_10m_admin_0_boundary_lines_land.geojson"
OVERPASS_URLS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]
NOMINATIM = "https://nominatim.openstreetmap.org"
ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
CACHE = Path(os.environ.get("MXP_CACHE", Path.home() / ".cache" / "map-explainer-pro"))

session = requests.Session()
session.headers["User-Agent"] = mx.USER_AGENT
_last_nominatim = [0.0]
# circuit breaker: once every Overpass mirror has failed, go straight to Nominatim for the rest of the run
_overpass_down = [mx.env_flag("MXP_NO_OVERPASS")]


def log(*a):
    print("[fetch]", *a, flush=True)


# ----------------------------------------------------------------------------- downloads
def cached_download(url, dest: Path, timeout=180):
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    log(f"downloading {url}")
    r = session.get(url, timeout=timeout)
    r.raise_for_status()
    tmp = dest.with_suffix(dest.suffix + ".part")
    tmp.write_bytes(r.content)
    tmp.replace(dest)
    return dest


_ne = {}


def natural_earth(name):
    if name not in _ne:
        p = cached_download(NE_BASE + name, CACHE / "natural_earth" / name)
        _ne[name] = json.loads(p.read_text(encoding="utf-8"))
    return _ne[name]


def ne_country(adm0):
    for f in natural_earth(NE_COUNTRIES)["features"]:
        p = f["properties"]
        if adm0 in (p.get("ADM0_A3"), p.get("ISO_A3"), p.get("SU_A3"), p.get("GU_A3")):
            return f
    return None


def nominatim_get(path, params, raw_dir: Path, key):
    raw = raw_dir / f"{key}.json"
    if raw.exists():
        return json.loads(raw.read_text(encoding="utf-8"))
    wait = 1.1 - (time.time() - _last_nominatim[0])  # usage policy: max 1 req/s
    if wait > 0:
        time.sleep(wait)
    _last_nominatim[0] = time.time()
    r = session.get(f"{NOMINATIM}/{path}", params={**params, "format": "jsonv2", "polygon_geojson": 1, "polygon_threshold": 0.00002}, timeout=60)
    r.raise_for_status()
    data = r.json()
    raw.parent.mkdir(parents=True, exist_ok=True)
    raw.write_text(json.dumps(data), encoding="utf-8")
    return data


def stitch_rings(ways):
    """Join OSM way geometries (lists of [lng,lat]) into closed rings."""
    ways = [list(w) for w in ways if len(w) >= 2]
    rings = []
    while ways:
        ring = ways.pop(0)
        changed = True
        while ring[0] != ring[-1] and changed:
            changed = False
            for i, w in enumerate(ways):
                if w[0] == ring[-1]:
                    ring += w[1:]
                elif w[-1] == ring[-1]:
                    ring += w[::-1][1:]
                elif w[-1] == ring[0]:
                    ring = w[:-1] + ring
                elif w[0] == ring[0]:
                    ring = w[::-1][:-1] + ring
                else:
                    continue
                ways.pop(i)
                changed = True
                break
        if ring[0] != ring[-1]:
            ring.append(ring[0])
        if len(ring) >= 4:
            rings.append(ring)
    return rings


def overpass_geometry(osm_ref, raw_dir: Path):
    kind = {"R": "relation", "W": "way", "N": "node"}[osm_ref[0].upper()]
    oid = osm_ref[1:]
    raw = raw_dir / f"overpass_{osm_ref}.json"
    if raw.exists():
        data = json.loads(raw.read_text(encoding="utf-8"))
    else:
        if _overpass_down[0]:
            return None
        q = f"[out:json][timeout:60];{kind}({oid});out geom;"
        data = None
        for url in OVERPASS_URLS:
            try:
                r = session.post(url, data={"data": q}, timeout=(8, 30))
                r.raise_for_status()
                data = r.json()
                break
            except Exception as e:  # noqa: BLE001
                log(f"  overpass {url} failed: {type(e).__name__}")
        if data is None:
            log("  overpass unreachable -> using Nominatim for remaining OSM features")
            _overpass_down[0] = True
            return None
        raw.parent.mkdir(parents=True, exist_ok=True)
        raw.write_text(json.dumps(data), encoding="utf-8")
    els = data.get("elements", [])
    if not els:
        return None
    el = els[0]
    if el["type"] == "way":
        ring = [[p["lon"], p["lat"]] for p in el.get("geometry", [])]
        if ring and ring[0] == ring[-1]:
            return {"type": "Polygon", "coordinates": [ring]}
        return {"type": "LineString", "coordinates": ring}
    outer, inner = [], []
    for m in el.get("members", []):
        if m.get("type") != "way" or "geometry" not in m:
            continue
        g = [[p["lon"], p["lat"]] for p in m["geometry"]]
        (inner if m.get("role") == "inner" else outer).append(g)
    outers, inners = stitch_rings(outer), stitch_rings(inner)
    if not outers:
        return None
    # assign each hole to the first outer whose bbox contains it (good enough for admin areas)
    polys = [[o] for o in outers]
    for h in inners:
        hx, hy = h[0]
        for poly in polys:
            xs = [p[0] for p in poly[0]]
            ys = [p[1] for p in poly[0]]
            if min(xs) <= hx <= max(xs) and min(ys) <= hy <= max(ys):
                poly.append(h)
                break
    return {"type": "MultiPolygon", "coordinates": polys}


def nominatim_geometry(spec, raw_dir):
    try:
        if spec.get("osm"):
            ref = spec["osm"].upper()
            data = nominatim_get("lookup", {"osm_ids": ref}, raw_dir, f"nominatim_lookup_{ref}")
            for r in data:
                if r.get("geojson", {}).get("type") in ("Polygon", "MultiPolygon", "LineString", "MultiLineString"):
                    return r["geojson"]
        if spec.get("nominatim"):
            key = "nominatim_search_" + re.sub(r"[^a-z0-9]+", "_", mx.norm_word(spec["nominatim"]) or "q")
            data = nominatim_get("search", {"q": spec["nominatim"], "limit": 5}, raw_dir, key)
            for r in data:
                if r.get("geojson", {}).get("type") in ("Polygon", "MultiPolygon"):
                    return r["geojson"]
    except Exception as e:  # noqa: BLE001
        log(f"  nominatim failed for {spec['id']}: {type(e).__name__}: {e}")
    return None


def ne_boundary(between):
    a, b = between
    lines = []
    for f in natural_earth(NE_BOUNDARIES)["features"]:
        p = f["properties"]
        if {p.get("ADM0_A3_L"), p.get("ADM0_A3_R")} == {a, b}:
            g = f["geometry"]
            lines += [g["coordinates"]] if g["type"] == "LineString" else g["coordinates"]
    return {"type": "MultiLineString", "coordinates": lines} if lines else None


# ----------------------------------------------------------------------------- geometry utils
def ring_area(r):
    return sum(r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1] for i in range(len(r) - 1)) / 2


def rewind(geom):
    """d3-geo spherical convention: exterior rings clockwise, holes counter-clockwise."""
    def fix_poly(poly):
        out = []
        for i, ring in enumerate(poly):
            if ring[0] != ring[-1]:
                ring = ring + [ring[0]]
            a = ring_area(ring)
            want_cw = i == 0
            if (want_cw and a > 0) or (not want_cw and a < 0):
                ring = ring[::-1]
            out.append(ring)
        return out

    if geom["type"] == "Polygon":
        return {"type": "Polygon", "coordinates": fix_poly(geom["coordinates"])}
    if geom["type"] == "MultiPolygon":
        return {"type": "MultiPolygon", "coordinates": [fix_poly(p) for p in geom["coordinates"]]}
    return geom


def simplify_line(pts, tol):
    """Iterative Douglas-Peucker in lng/lat degrees."""
    if len(pts) < 5 or tol <= 0:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]
        bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        L = (dx * dx + dy * dy) ** 0.5 or 1e-12
        dmax, idx = 0.0, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            d = abs(dy * px - dx * py + bx * ay - by * ax) / L
            if d > dmax:
                dmax, idx = d, i
        if dmax > tol and idx > 0:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    out = [p for p, k in zip(pts, keep) if k]
    return out if len(out) >= 4 else pts


def map_rings(geom, fn):
    t = geom["type"]
    c = geom["coordinates"]
    if t == "Polygon":
        return {"type": t, "coordinates": [fn(r) for r in c]}
    if t == "MultiPolygon":
        return {"type": t, "coordinates": [[fn(r) for r in p] for p in c]}
    if t == "LineString":
        return {"type": t, "coordinates": fn(c)}
    if t == "MultiLineString":
        return {"type": t, "coordinates": [fn(r) for r in c]}
    return geom


def round_geom(geom, nd=6):
    return map_rings(geom, lambda r: [[round(x, nd), round(y, nd)] for x, y in r])


# ----------------------------------------------------------------------------- colors
def resolve_color_key(spec, props, colors):
    keys = {**colors["countries"], **colors["territories"], **colors["overlays"]}
    if spec.get("color"):
        return spec["color"]
    if spec["id"] in keys:
        return spec["id"]
    if spec.get("parent") in keys:
        return spec["parent"]  # enclave / overseas territory inherits parent's locked color
    adm0 = (props or {}).get("ADM0_A3") or spec.get("adm0_a3")
    if adm0 and adm0 in colors.get("adm0_overrides", {}):
        return colors["adm0_overrides"][adm0]
    for k, v in colors["countries"].items():
        if adm0 and v.get("adm0_a3") == adm0:
            return k
    sov = (props or {}).get("SOV_A3")
    if sov and sov in colors.get("sovereign_codes", {}):
        return colors["sovereign_codes"][sov]
    return None


# ----------------------------------------------------------------------------- stage: geo
def build_geo(sb, paths):
    colors = mx.load_json(mx.COLORS_PATH)
    raw_dir = paths["geo"] / "raw"
    feats = []
    report = []
    for spec in sb["geo"]["features"]:
        src = spec.get("source", "natural_earth")
        geom, props, used = None, {}, None
        if src == "natural_earth":
            f = ne_country(spec.get("adm0_a3", spec["id"]).upper())
            if f:
                geom, props, used = f["geometry"], f["properties"], "natural_earth_10m"
        elif src == "ne_boundary":
            geom, used = ne_boundary(spec["between"]), "natural_earth_10m_boundary_lines"
        elif src == "osm":
            if spec.get("osm"):
                geom = overpass_geometry(spec["osm"], raw_dir)
                used = "overpass" if geom else None
            if not geom:
                geom = nominatim_geometry(spec, raw_dir)
                used = "nominatim" if geom else None
        elif src == "nominatim":
            geom = nominatim_geometry(spec, raw_dir)
            used = "nominatim" if geom else None
        elif src == "inline":
            geom, used = {"type": spec.get("type", "Polygon"), "coordinates": spec["coordinates"]}, "inline"
        if not geom and spec.get("fallback_coordinates"):
            geom = {"type": spec.get("type", "Polygon"), "coordinates": spec["fallback_coordinates"]}
            used = "fallback_coordinates"
        if not geom:
            log(f"  !! could not resolve feature '{spec['id']}' ({src})")
            report.append((spec["id"], "MISSING"))
            continue
        geom = round_geom(rewind(geom))
        ck = resolve_color_key(spec, props, colors)
        feats.append({
            "type": "Feature",
            "properties": {"id": spec["id"], "role": "feature", "source": used, "adm0_a3": props.get("ADM0_A3", spec.get("adm0_a3")), "color_key": ck, "name": props.get("NAME", spec.get("name", spec["id"])),
                           "label": spec.get("label") or ([props["LABEL_X"], props["LABEL_Y"]] if "LABEL_X" in props else None)},
            "geometry": geom,
        })
        report.append((spec["id"], f"{used} -> color {ck}"))

    feats = inherit_enclave_parts(feats, colors, report)

    tol = sb["geo"].get("context_simplify_deg", 0.004)
    for code in sb["geo"].get("context", []):
        f = ne_country(code)
        if not f:
            log(f"  context {code} not found in Natural Earth")
            continue
        # reuse the storyboard feature when it exists, so context borders also get precise enclave parts
        same = next((x for x in feats if x["properties"].get("adm0_a3") == code and x["properties"].get("source") == "natural_earth_10m"), None)
        g = map_rings(same["geometry"] if same else f["geometry"], lambda r: simplify_line(r, tol) if len(r) > 400 else r)
        g = round_geom(rewind(g), 5)
        feats.append({
            "type": "Feature",
            "properties": {"id": f"ctx_{code}", "role": "context", "adm0_a3": code, "color_key": resolve_color_key({"id": f"ctx_{code}"}, f["properties"], colors), "name": f["properties"]["NAME"]},
            "geometry": g,
        })
    mx.save_json(paths["geo"] / "features.geojson", {"type": "FeatureCollection", "features": feats})
    shutil.copyfile(mx.COLORS_PATH, paths["colors"])
    for fid, how in report:
        log(f"  {fid:<18} {how}")
    log(f"wrote {paths['geo'] / 'features.geojson'} ({(paths['geo'] / 'features.geojson').stat().st_size / 1e6:.2f} MB, {len(feats)} features)")


def _root_country(key, colors):
    seen = 0
    while key in colors["territories"] and seen < 6:
        key = colors["territories"][key]["parent"]
        seen += 1
    return key


def _polys(geom):
    if geom["type"] == "Polygon":
        return [geom["coordinates"]]
    if geom["type"] == "MultiPolygon":
        return list(geom["coordinates"])
    return []


def inherit_enclave_parts(feats, colors, report):
    """Parent-country inheritance for enclaves / exclaves / overseas territories:
    Natural Earth draws e.g. Llívia, Ceuta and Melilla as coarse parts of Spain. Replace every
    coarse part that falls inside a precise child feature (OSM / inline, whose color resolves to
    the parent) with the child's precise geometry, so the parent fill matches the child exactly."""
    by_root = {}
    for f in feats:
        p = f["properties"]
        if p["source"] in ("natural_earth_10m",) or not p.get("color_key") or f["geometry"]["type"] not in ("Polygon", "MultiPolygon"):
            continue
        root = _root_country(p["color_key"], colors)
        if root != p["color_key"] or p["id"] != root:
            by_root.setdefault(root, []).append(f)
    for f in feats:
        p = f["properties"]
        kids = by_root.get(p["id"]) if p["source"] == "natural_earth_10m" else None
        if not kids:
            continue
        parts = _polys(f["geometry"])
        for kid in kids:
            xs = [c[0] for poly in _polys(kid["geometry"]) for c in poly[0]]
            ys = [c[1] for poly in _polys(kid["geometry"]) for c in poly[0]]
            pad_x, pad_y = (max(xs) - min(xs)) * 0.35 + 0.01, (max(ys) - min(ys)) * 0.35 + 0.01
            keep = []
            for part in parts:
                cx = sum(c[0] for c in part[0]) / len(part[0])
                cy = sum(c[1] for c in part[0]) / len(part[0])
                inside = min(xs) - pad_x <= cx <= max(xs) + pad_x and min(ys) - pad_y <= cy <= max(ys) + pad_y
                if not inside:
                    keep.append(part)
            removed = len(parts) - len(keep)
            parts = keep + _polys(kid["geometry"])
            report.append((p["id"], f"inherits precise '{kid['properties']['id']}' part (replaced {removed} coarse NE part(s))"))
        f["geometry"] = {"type": "MultiPolygon", "coordinates": parts}
    # surrounding countries: swap coarse NE holes (e.g. France's hole for Llívia) for the precise ring
    kids_all = [k for ks in by_root.values() for k in ks]
    for f in feats:
        p = f["properties"]
        if p["source"] != "natural_earth_10m" or f["geometry"]["type"] not in ("Polygon", "MultiPolygon"):
            continue
        parts = _polys(f["geometry"])
        changed = False
        for kid in kids_all:
            if _root_country(kid["properties"]["color_key"], colors) == p["id"]:
                continue
            kp = _polys(kid["geometry"])
            xs = [c[0] for poly in kp for c in poly[0]]
            ys = [c[1] for poly in kp for c in poly[0]]
            pad_x, pad_y = (max(xs) - min(xs)) * 0.35 + 0.01, (max(ys) - min(ys)) * 0.35 + 0.01
            for part in parts:
                holes = [h for h in part[1:] if not (min(xs) - pad_x <= sum(c[0] for c in h) / len(h) <= max(xs) + pad_x and min(ys) - pad_y <= sum(c[1] for c in h) / len(h) <= max(ys) + pad_y)]
                if len(holes) != len(part) - 1:
                    part[1:] = holes + [poly[0][::-1] for poly in kp]
                    changed = True
                    report.append((p["id"], f"hole for '{kid['properties']['id']}' replaced by precise ring"))
        if changed:
            f["geometry"] = {"type": "MultiPolygon", "coordinates": parts}
    return feats


# ----------------------------------------------------------------------------- stage: fonts
def fetch_fonts(paths):
    out = paths["fonts"]
    out.mkdir(parents=True, exist_ok=True)
    for w in (700, 900):
        dest = out / f"Montserrat-{w}.woff2"
        if dest.exists():
            continue
        try:
            css = session.get(
                f"https://fonts.googleapis.com/css2?family=Montserrat:wght@{w}&display=swap",
                headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36"},
                timeout=30,
            ).text
            # the last @font-face block is the "latin" subset
            urls = re.findall(r"url\((https://[^)]+\.woff2)\)", css)
            if not urls:
                raise RuntimeError("no woff2 url")
            dest.write_bytes(session.get(urls[-1], timeout=60).content)
            log(f"font cached: {dest.name}")
        except Exception as e:  # noqa: BLE001
            log(f"font download failed ({e}); engine falls back to Inter/system sans")


# ----------------------------------------------------------------------------- stage: tiles
def plan_tiles(sb, scenes, max_zoom):
    W, H = sb["meta"].get("width", 1080), sb["meta"].get("height", 1920)
    need = set()
    for sc in scenes:
        if "satellite" not in mx.scene_modes(sc):
            continue
        for cam in mx.camera_path_states(sc["camera"]):
            for z in mx.tile_levels(cam["zoom"], max_zoom):
                for x, y in mx.visible_tiles(cam, z, W, H, ring=1):
                    need.add((z, x, y))
    return need


def download_tile(tdir: Path, z, x, y, retries=4):
    dest = tdir / str(z) / str(x) / f"{y}.jpg"
    if dest.exists() and dest.stat().st_size > 100:
        return "cached"
    dest.parent.mkdir(parents=True, exist_ok=True)
    url = ESRI.format(z=z, x=x, y=y)
    for i in range(retries):
        try:
            r = session.get(url, timeout=30)
            if r.status_code == 404:
                return "missing"
            r.raise_for_status()
            if not r.content.startswith(b"\xff\xd8"):
                return "missing"
            tmp = dest.with_suffix(".part")
            tmp.write_bytes(r.content)
            tmp.replace(dest)
            return "downloaded"
        except Exception:  # noqa: BLE001
            time.sleep(0.5 * 2 ** i)
    return "failed"


def write_manifest(tdir: Path, max_zoom):
    tiles = []
    for p in tdir.rglob("*.jpg"):
        rel = p.relative_to(tdir).with_suffix("")
        if len(rel.parts) == 3:
            tiles.append("/".join(rel.parts))
    tiles.sort()
    mx.save_json(tdir / "manifest.json", {"source": "Esri World Imagery", "attribution": "Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community", "max_zoom": max_zoom, "tiles": tiles})
    return len(tiles)


def fetch_tiles(sb, scenes, paths, max_zoom, workers, dry_run=False):
    need = plan_tiles(sb, scenes, max_zoom)
    by_z = {}
    for z, _, _ in need:
        by_z[z] = by_z.get(z, 0) + 1
    log(f"tile plan: {len(need)} tiles across zooms {dict(sorted(by_z.items()))}")
    if dry_run:
        return
    tdir = paths["tiles"]
    tdir.mkdir(parents=True, exist_ok=True)
    stats = {}
    t0 = time.time()
    with cf.ThreadPoolExecutor(max_workers=workers) as ex:
        futs = [ex.submit(download_tile, tdir, z, x, y) for z, x, y in sorted(need)]
        for i, f in enumerate(cf.as_completed(futs), 1):
            stats[f.result()] = stats.get(f.result(), 0) + 1
            if i % 500 == 0:
                log(f"  {i}/{len(need)} tiles ({time.time() - t0:.0f}s)")
    n = write_manifest(tdir, max_zoom)
    size = sum(p.stat().st_size for p in tdir.rglob("*.jpg")) / 1e6
    log(f"tiles: {stats} -> manifest has {n} tiles ({size:.0f} MB) in {time.time() - t0:.0f}s")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("project", help="project dir containing storyboard.json")
    ap.add_argument("--storyboard", help="explicit storyboard path (default <project>/storyboard.json)")
    ap.add_argument("--scenes", help='subset for tiles, e.g. "1-2" or "hook,neighbors"')
    ap.add_argument("--max-zoom", type=int)
    ap.add_argument("--workers", type=int, default=16)
    ap.add_argument("--skip-geo", action="store_true")
    ap.add_argument("--skip-tiles", action="store_true")
    ap.add_argument("--skip-fonts", action="store_true")
    ap.add_argument("--dry-run", action="store_true", help="only print the tile plan")
    a = ap.parse_args()

    paths = mx.project_paths(a.project)
    sb = mx.load_json(a.storyboard or paths["storyboard"])
    max_zoom = a.max_zoom or sb["meta"].get("max_tile_zoom", 18)
    scenes = mx.selected_scenes(sb, a.scenes)
    if not a.skip_geo:
        build_geo(sb, paths)
    if not a.skip_fonts:
        fetch_fonts(paths)
    if not a.skip_tiles:
        fetch_tiles(sb, scenes, paths, max_zoom, a.workers, a.dry_run)


if __name__ == "__main__":
    main()
