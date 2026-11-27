#!/usr/bin/env node
/**
 * Stage 5 of /map-explainer-pro: resumable chunked Remotion render + FFmpeg concat + audio mux.
 *
 *   node render_chunks.mjs projects/<slug> [--out out/<name>.mp4] [--scenes 1-2 | --seconds 0-12]
 *        [--chunk 150] [--concurrency N] [--crf 18] [--fresh] [--no-audio] [--engine path/to/engine]
 *
 * - The project dir is used as Remotion's public dir (storyboard.json, assets/geo, assets/tiles, ...).
 * - Frames are rendered in independent 150-frame H.264 chunks under <project>/chunks/<range>/.
 *   A crash / timeout only loses the current chunk: re-run the same command to resume.
 *   Chunks are invalidated automatically when the storyboard, timestamps, tiles or engine change.
 * - Chunks are joined losslessly (concat demuxer, -c copy) and muxed with assets/audio/mix.wav
 *   trimmed to the same time range (AAC 192k, +faststart).
 */
import { createRequire } from "node:module";
import { execFileSync, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return def;
  const v = argv[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
};
const positional = argv.filter((a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--") && !["--fresh", "--no-audio"].includes(argv[i - 1])));
if (!positional[0]) {
  console.error("usage: node render_chunks.mjs projects/<slug> [--out ...] [--scenes 1-2 | --seconds 0-12] [--chunk 150]");
  process.exit(1);
}
const log = (...a) => console.log("[render]", ...a);
const project = path.resolve(positional[0]);
const read = (p, d) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : d);

// ---------------------------------------------------------------- locate engine
const findEngine = () => {
  const cands = [opt("engine"), process.env.MXP_ENGINE];
  for (let d = project; d !== path.dirname(d); d = path.dirname(d)) cands.push(path.join(d, "engine"));
  for (let d = process.cwd(); d !== path.dirname(d); d = path.dirname(d)) cands.push(path.join(d, "engine"));
  return cands.filter(Boolean).map((c) => path.resolve(c)).find((c) => fs.existsSync(path.join(c, "src", "index.ts")));
};
const engine = findEngine();
if (!engine) throw new Error("engine/ not found: pass --engine or set MXP_ENGINE");
if (!fs.existsSync(path.join(engine, "node_modules", "remotion"))) {
  log("installing engine dependencies…");
  execFileSync("npm", ["ci", "--no-audit", "--no-fund"], { cwd: engine, stdio: "inherit" });
}
const req = createRequire(path.join(engine, "package.json"));
const { bundle } = req("@remotion/bundler");
const { renderMedia, selectComposition } = req("@remotion/renderer");

// ---------------------------------------------------------------- inputs
const sb = read(path.join(project, "storyboard.json"));
if (!sb) throw new Error(`no storyboard.json in ${project}`);
const tsPath = path.join(project, "assets", "audio", "timestamps.json");
const ts = read(tsPath);
if (!ts) log("WARNING: no timestamps.json (run sound_engine.py) — using estimated timing, rendering silent");
const fps = sb.meta.fps ?? 30;

const hashFiles = (files) => {
  const h = crypto.createHash("sha1");
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const st = fs.statSync(f);
    if (st.isDirectory()) {
      const walk = (d) =>
        fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).forEach((e) => {
          const p = path.join(d, e.name);
          if (e.isDirectory()) walk(p);
          else h.update(p + fs.readFileSync(p));
        });
      walk(f);
    } else h.update(f + fs.readFileSync(f));
  }
  return h.digest("hex").slice(0, 12);
};

// ---------------------------------------------------------------- bundle (cached)
const engineHash = hashFiles([path.join(engine, "src"), path.join(engine, "package.json")]);
const assetHash = hashFiles([path.join(project, "assets", "tiles", "manifest.json"), path.join(project, "assets", "geo", "features.geojson"), path.join(project, "assets", "fonts"), path.join(project, "assets", "country-colors.json")]);
const inputHash = hashFiles([path.join(project, "storyboard.json"), tsPath]);
// Bundle + staged public dir live OUTSIDE the project (never copy out/ or chunks/ into the bundle).
const cacheRoot = path.join(process.env.MXP_CACHE ?? path.join(os.homedir(), ".cache", "map-explainer-pro"), "bundles");
const projKey = crypto.createHash("sha1").update(project).digest("hex").slice(0, 8);
const stage = path.join(cacheRoot, `public-${sb.meta.slug}-${projKey}`);
fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });
fs.copyFileSync(path.join(project, "storyboard.json"), path.join(stage, "storyboard.json"));
fs.symlinkSync(path.join(project, "assets"), path.join(stage, "assets"), "dir");
const bundleDir = path.join(cacheRoot, `bundle-${sb.meta.slug}-${projKey}-${engineHash}-${assetHash}-${inputHash}`);
let serveUrl;
if (fs.existsSync(path.join(bundleDir, "index.html")) && !opt("fresh", false)) {
  serveUrl = bundleDir;
  log(`reusing bundle ${path.basename(bundleDir)}`);
} else {
  for (const d of fs.existsSync(cacheRoot) ? fs.readdirSync(cacheRoot) : [])
    if (d.startsWith(`bundle-${sb.meta.slug}-${projKey}-`)) fs.rmSync(path.join(cacheRoot, d), { recursive: true, force: true });
  log("bundling engine (public dir = staged storyboard.json + assets/)…");
  const t0 = Date.now();
  serveUrl = await bundle({ entryPoint: path.join(engine, "src", "index.ts"), publicDir: stage, outDir: bundleDir, ignoreRegisterRootWarning: true });
  log(`bundled in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

const inputProps = { audio: false };
const composition = await selectComposition({ serveUrl, id: "MapExplainer", inputProps });
const total = composition.durationInFrames;

// ---------------------------------------------------------------- frame range
let [f0, f1] = [0, total - 1];
const scenesArg = opt("scenes");
const secondsArg = opt("seconds");
if (scenesArg && ts) {
  const ids = sb.scenes.map((s) => s.id);
  const picked = [];
  for (const part of String(scenesArg).split(",")) {
    const m = part.match(/^(\d+)-(\d+)$/);
    if (m) for (let i = +m[1]; i <= +m[2]; i++) picked.push(ids[i - 1]);
    else picked.push(/^\d+$/.test(part) ? ids[+part - 1] : part);
  }
  const tim = ts.scenes.filter((s) => picked.includes(s.id));
  f0 = Math.round(Math.min(...tim.map((s) => s.start)) * fps);
  f1 = Math.round(Math.max(...tim.map((s) => s.end)) * fps) - 1;
} else if (secondsArg) {
  const [a, b] = String(secondsArg).split("-").map(Number);
  f0 = Math.round(a * fps);
  f1 = Math.round(b * fps) - 1;
}
f1 = Math.min(f1, total - 1);
const chunk = Number(opt("chunk", 150));
const concurrency = Number(opt("concurrency", Math.max(1, os.cpus().length)));
const crf = Number(opt("crf", 18));
const rangeKey = `f${f0}-${f1}`;
const chunkDir = path.join(project, "chunks", rangeKey);
const stateFile = path.join(chunkDir, "state.json");
const signature = `${engineHash}-${assetHash}-${inputHash}-${crf}`;
if (fs.existsSync(stateFile) && (read(stateFile).signature !== signature || opt("fresh", false))) {
  log("inputs changed since last run -> discarding old chunks");
  fs.rmSync(chunkDir, { recursive: true, force: true });
}
fs.mkdirSync(chunkDir, { recursive: true });
fs.writeFileSync(stateFile, JSON.stringify({ signature, f0, f1, chunk }, null, 1));

const outPath = path.resolve(project, String(opt("out", path.join("out", `${sb.meta.slug}-${rangeKey}.mp4`))));
fs.mkdirSync(path.dirname(outPath), { recursive: true });
log(`composition ${composition.width}x${composition.height}@${composition.fps} total ${total}f | rendering ${f0}-${f1} (${((f1 - f0 + 1) / fps).toFixed(2)}s) in ${chunk}-frame chunks, concurrency ${concurrency}`);

const probeFrames = (file) => {
  const r = spawnSync("ffprobe", ["-v", "error", "-count_packets", "-select_streams", "v:0", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", file], { encoding: "utf8" });
  return parseInt((r.stdout || "0").trim(), 10) || 0;
};

// ---------------------------------------------------------------- render chunks
const chunkFiles = [];
const tAll = Date.now();
for (let a = f0; a <= f1; a += chunk) {
  const b = Math.min(f1, a + chunk - 1);
  const file = path.join(chunkDir, `chunk_${String(a).padStart(6, "0")}_${String(b).padStart(6, "0")}.mp4`);
  chunkFiles.push(file);
  if (fs.existsSync(file) && probeFrames(file) === b - a + 1) {
    log(`chunk ${a}-${b} ✓ (cached)`);
    continue;
  }
  const t0 = Date.now();
  let last = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf,
    pixelFormat: "yuv420p",
    imageFormat: "jpeg",
    jpegQuality: 92,
    muted: true,
    frameRange: [a, b],
    outputLocation: file + ".part.mp4",
    inputProps,
    concurrency,
    timeoutInMilliseconds: 120000,
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 10);
      if (p !== last) {
        last = p;
        process.stdout.write(`\r[render] chunk ${a}-${b}: ${p * 10}%   `);
      }
    },
  });
  fs.renameSync(file + ".part.mp4", file);
  process.stdout.write("\n");
  log(`chunk ${a}-${b} done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

// ---------------------------------------------------------------- concat + mux
const list = path.join(chunkDir, "concat.txt");
fs.writeFileSync(list, chunkFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n") + "\n");
const silent = path.join(chunkDir, "video_concat.mp4");
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", silent]);
const mix = path.join(project, "assets", "audio", "mix.wav");
const start = (f0 / fps).toFixed(4);
const dur = ((f1 - f0 + 1) / fps).toFixed(4);
if (!opt("no-audio", false) && fs.existsSync(mix) && ts) {
  execFileSync("ffmpeg", [
    "-loglevel", "error", "-y", "-i", silent, "-ss", start, "-t", dur, "-i", mix,
    "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-af", `afade=t=out:st=${Math.max(0, Number(dur) - 0.25).toFixed(3)}:d=0.25`,
    "-shortest", "-movflags", "+faststart", outPath,
  ]);
} else {
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", silent, "-c", "copy", "-movflags", "+faststart", outPath]);
}
log(`✔ ${outPath}  (${(fs.statSync(outPath).size / 1e6).toFixed(2)} MB, ${dur}s, total ${((Date.now() - tAll) / 1000).toFixed(1)}s)`);
