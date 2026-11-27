#!/usr/bin/env node
/**
 * Render preview stills (one bundle, many frames) for visual QA.
 *   node preview_stills.mjs projects/<slug> [--frames 30,120,300 | --per-scene 2] [--scale 0.5] [--out <dir>]
 * Default: 2 stills per scene (40% and 85% through each scene) into <project>/out/stills/.
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const argv = process.argv.slice(2);
const opt = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i < 0 ? d : argv[i + 1];
};
const project = path.resolve(argv.find((a) => !a.startsWith("--")) ?? ".");
let engine = opt("engine", process.env.MXP_ENGINE);
for (let d = project; !engine && d !== path.dirname(d); d = path.dirname(d)) if (fs.existsSync(path.join(d, "engine", "src", "index.ts"))) engine = path.join(d, "engine");
const req = createRequire(path.join(path.resolve(engine), "package.json"));
const { bundle } = req("@remotion/bundler");
const { renderStill, selectComposition } = req("@remotion/renderer");

const sb = JSON.parse(fs.readFileSync(path.join(project, "storyboard.json"), "utf8"));
const tsFile = path.join(project, "assets", "audio", "timestamps.json");
const ts = fs.existsSync(tsFile) ? JSON.parse(fs.readFileSync(tsFile, "utf8")) : null;
const fps = sb.meta.fps ?? 30;
const outDir = path.resolve(opt("out", path.join(project, "out", "stills")));
fs.mkdirSync(outDir, { recursive: true });

const stage = fs.mkdtempSync(path.join(os.tmpdir(), "mxp-public-"));
fs.copyFileSync(path.join(project, "storyboard.json"), path.join(stage, "storyboard.json"));
fs.symlinkSync(path.join(project, "assets"), path.join(stage, "assets"), "dir");
const serveUrl = await bundle({ entryPoint: path.join(engine, "src", "index.ts"), publicDir: stage, ignoreRegisterRootWarning: true });
const composition = await selectComposition({ serveUrl, id: "MapExplainer", inputProps: {} });
let frames;
if (opt("frames")) frames = opt("frames").split(",").map(Number);
else {
  const per = Number(opt("per-scene", 2));
  const scenes = ts?.scenes ?? [];
  frames = scenes.flatMap((s) => Array.from({ length: per }, (_, k) => Math.round((s.start + (s.end - s.start) * (per === 1 ? 0.6 : 0.4 + (0.45 * k) / (per - 1))) * fps)));
}
for (const frame of frames.filter((f) => f < composition.durationInFrames)) {
  const output = path.join(outDir, `frame_${String(frame).padStart(5, "0")}.png`);
  await renderStill({ composition, serveUrl, frame, output, scale: Number(opt("scale", 0.5)), inputProps: {} });
  console.log("[stills]", output);
}
