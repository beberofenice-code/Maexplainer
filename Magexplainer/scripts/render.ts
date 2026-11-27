/**
 * Full build for one project → out/<slug>.mp4 (1080x1920, 30fps, H.264).
 *
 *   npm run render -- <slug> [--still <frame>] [--refresh-geo] [--revoice] [--no-voice] [-- …remotion flags]
 *
 * 1. geo.json   — fetched if storyboard.geoSources has ids missing from it (or --refresh-geo)
 * 2. voice      — voice.mp3 + captions.json via ElevenLabs if missing (or --revoice);
 *                 without ELEVENLABS_API_KEY (or with --no-voice) only timing captions are written
 * 3. remotion   — renders the composition whose id is storyboard.id
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fetchGeojson } from "./fetch-geojson";
import { generateVoice } from "./generate-voice";
import { ROOT, parseArgs, projectDir, readStoryboard } from "./lib";

async function main() {
  const dashdash = process.argv.indexOf("--");
  const own = dashdash >= 0 ? process.argv.slice(2, dashdash) : process.argv.slice(2);
  const passthrough = dashdash >= 0 ? process.argv.slice(dashdash + 1) : [];
  const { positional, flags } = parseArgs(own);
  const slug = positional[0];
  if (!slug) {
    console.error("usage: npm run render -- <project-slug> [--still <frame>] [--refresh-geo] [--revoice] [--no-voice]");
    process.exit(1);
  }
  const dir = projectDir(slug);
  const sb = readStoryboard(slug);

  // 1. Geometry
  const geoIds = Object.keys(sb.geoSources ?? {});
  const geoFile = path.join(dir, "geo.json");
  const have = fs.existsSync(geoFile)
    ? new Set(JSON.parse(fs.readFileSync(geoFile, "utf8")).features.map((f: { id: string }) => f.id))
    : new Set();
  if (geoIds.length && (flags["refresh-geo"] || geoIds.some((id) => !have.has(id)))) {
    console.log("▸ fetching geometry");
    await fetchGeojson(slug, { refresh: !!flags["refresh-geo"] });
  }

  // 2. Voice + captions
  const hasVoice = fs.existsSync(path.join(dir, "voice.mp3"));
  const hasCaptions = fs.existsSync(path.join(dir, "captions.json"));
  if (flags.revoice || (!flags["no-voice"] && !hasVoice && process.env.ELEVENLABS_API_KEY)) {
    console.log("▸ generating voice");
    await generateVoice(slug);
  } else if (!hasCaptions) {
    console.log("▸ no voice — writing timing-only captions");
    await generateVoice(slug, { timingOnly: true });
  }

  // 3. Render
  fs.mkdirSync(path.join(ROOT, "out"), { recursive: true });
  const args =
    flags.still !== undefined
      ? ["remotion", "still", "src/index.ts", sb.id, `out/${slug}-${flags.still}.png`, `--frame=${flags.still}`]
      : ["remotion", "render", "src/index.ts", sb.id, `out/${slug}.mp4`, "--codec=h264", "--pixel-format=yuv420p"];
  console.log(`▸ ${args.slice(1, 2).join("")} ${sb.id} → ${args[4]}`);
  execFileSync("npx", [...args, ...passthrough], { cwd: ROOT, stdio: "inherit" });
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
