#!/usr/bin/env python3
"""Stage 1 of /map-explainer-pro: workspace setup.

Creates projects/<slug>/ (storyboard.json + assets/{geo,tiles,audio,fonts} + out/),
copies the locked palette, and makes sure the Remotion engine has its node_modules.

  python3 init_project.py <slug> [--template spain-borders] [--repo <repo root>] [--no-npm]
"""
import argparse
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import mxp_common as mx  # noqa: E402


def find_repo(start: Path) -> Path:
    for p in [start, *start.parents]:
        if (p / "engine" / "package.json").exists():
            return p
    try:
        out = subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True, check=True).stdout.strip()
        return Path(out)
    except Exception:  # noqa: BLE001
        return Path.cwd()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--template", help="template folder under templates/ (e.g. spain-borders)")
    ap.add_argument("--repo", help="repo root that contains engine/ (auto-detected)")
    ap.add_argument("--no-npm", action="store_true")
    ap.add_argument("--force", action="store_true", help="overwrite an existing storyboard.json")
    a = ap.parse_args()

    repo = Path(a.repo).resolve() if a.repo else find_repo(Path.cwd().resolve())
    proj = repo / "projects" / a.slug
    for sub in ("assets/geo", "assets/tiles", "assets/audio", "assets/fonts", "out"):
        (proj / sub).mkdir(parents=True, exist_ok=True)
    sb_path = proj / "storyboard.json"
    if a.template:
        src = mx.SKILL_DIR / "templates" / a.template / "storyboard.json"
        if not src.exists():
            sys.exit(f"template not found: {src}")
        if sb_path.exists() and not a.force:
            print(f"[init] keeping existing {sb_path} (use --force to overwrite)")
        else:
            sb = mx.load_json(src)
            sb["meta"]["slug"] = a.slug
            mx.save_json(sb_path, sb, indent=2)
            print(f"[init] storyboard from template '{a.template}' -> {sb_path}")
    elif not sb_path.exists():
        print(f"[init] no storyboard yet: write {sb_path} (see references/storyboard-schema.md)")
    shutil.copyfile(mx.COLORS_PATH, proj / "assets" / "country-colors.json")

    engine = repo / "engine"
    if not (engine / "package.json").exists():
        print(f"[init] WARNING: engine/ not found under {repo}. Clone the map-explainer-pro repo or pass --repo.")
    elif not a.no_npm and not (engine / "node_modules" / "remotion").exists():
        print("[init] installing engine dependencies (npm ci)…")
        cmd = ["npm", "ci"] if (engine / "package-lock.json").exists() else ["npm", "install"]
        subprocess.run(cmd + ["--no-audit", "--no-fund"], cwd=engine, check=True)
    print(f"[init] project ready: {proj}")


if __name__ == "__main__":
    main()
