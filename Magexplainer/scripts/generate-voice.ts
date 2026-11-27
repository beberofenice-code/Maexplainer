/**
 * Narrates a project with ElevenLabs and writes word-level captions.
 *
 *   npm run voice -- <slug> [--voice <voiceId>] [--model <modelId>] [--speed 1.05] [--force]
 *   npm run voice -- <slug> --timing-only      # no TTS: captions.json from storyboard timing
 *
 * Input:  storyboard.json "captions" (phrase cues = script + intended timing), optional "voice".
 * Output: projects/<slug>/voice.mp3 and projects/<slug>/captions.json
 *         (@remotion/captions `Caption[]`, one entry per word, ms from video start).
 *
 * Each sentence (consecutive cues up to . ? !) is synthesised separately via
 * /v1/text-to-speech/{voice}/with-timestamps (with previous/next text for natural
 * prosody) and placed at its first cue's start, so the voice stays locked to the
 * storyboard's camera moves. A sentence that runs long pushes the next one later;
 * the script reports any drift. Clips are cached in .voice-cache/, so re-runs
 * only pay for sentences whose text changed.
 *
 * Needs ELEVENLABS_API_KEY (and ffmpeg via `npx remotion ffmpeg`).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import type { CaptionCue, StoryboardConfig, WordCaption } from "../src/types/scene";
import { ROOT, isMain, parseArgs, projectDir, readStoryboard } from "./lib";

const API = "https://api.elevenlabs.io/v1";
const DEFAULT_MODEL = "eleven_multilingual_v2";
const GAP_MS = 120; // minimum silence between sentences

interface Sentence {
  text: string;
  startMs: number;
  /** Start of the next sentence's first cue (the time budget for this one). */
  budgetEndMs: number;
}

interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

const framesToMs = (f: number, fps: number) => Math.round((f / fps) * 1000);

export function sentencesFrom(cues: CaptionCue[], fps: number): Sentence[] {
  const sorted = [...cues].sort((a, b) => a.startFrame - b.startFrame);
  const out: Sentence[] = [];
  let cur: { parts: string[]; start: number } | null = null;
  for (const cue of sorted) {
    if (!cur) cur = { parts: [], start: cue.startFrame };
    cur.parts.push(cue.text.trim());
    if (/[.?!…]["”')\]]*$/.test(cue.text.trim())) {
      out.push({ text: cur.parts.join(" "), startMs: framesToMs(cur.start, fps), budgetEndMs: 0 });
      cur = null;
    }
  }
  if (cur) out.push({ text: cur.parts.join(" "), startMs: framesToMs(cur.start, fps), budgetEndMs: 0 });
  out.forEach((s, i) => (s.budgetEndMs = out[i + 1]?.startMs ?? Infinity));
  return out;
}

/** Turn ElevenLabs character timings into Remotion word captions (leading-space convention). */
export function wordsFromAlignment(a: Alignment, offsetMs: number, first: boolean): WordCaption[] {
  const words: WordCaption[] = [];
  let text = "";
  let start = -1;
  let end = 0;
  const flush = () => {
    if (!text) return;
    words.push({
      text: (words.length === 0 && first ? "" : " ") + text,
      startMs: Math.round(offsetMs + start * 1000),
      endMs: Math.round(offsetMs + end * 1000),
      timestampMs: null,
      confidence: null,
    });
    text = "";
    start = -1;
  };
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) return flush();
    if (start < 0) start = a.character_start_times_seconds[i];
    end = a.character_end_times_seconds[i];
    text += ch;
  });
  flush();
  return words;
}

/** Fallback without TTS: spread each cue's words over its duration, weighted by length. */
export function timingOnlyCaptions(sb: StoryboardConfig): WordCaption[] {
  const out: WordCaption[] = [];
  for (const cue of [...sb.captions].sort((a, b) => a.startFrame - b.startFrame)) {
    const words = cue.text.trim().split(/\s+/);
    const start = framesToMs(cue.startFrame, sb.fps);
    const dur = framesToMs(cue.endFrame, sb.fps) - start;
    const total = words.reduce((s, w) => s + w.length + 1, 0);
    let t = start;
    for (const w of words) {
      const d = (dur * (w.length + 1)) / total;
      out.push({
        text: (out.length ? " " : "") + w,
        startMs: Math.round(t),
        endMs: Math.round(t + d),
        timestampMs: null,
        confidence: null,
      });
      t += d;
    }
  }
  return out;
}

async function pickVoice(key: string): Promise<{ id: string; name: string }> {
  const res = await fetch(`${API}/voices`, { headers: { "xi-api-key": key } });
  if (!res.ok) throw new Error(`GET /voices failed: ${res.status} ${await res.text()}`);
  const { voices } = (await res.json()) as { voices: { voice_id: string; name: string }[] };
  if (!voices.length) throw new Error("No ElevenLabs voices on this account");
  console.log(`  no voice set — using "${voices[0].name}". Set storyboard.voice.voiceId or --voice to choose.`);
  return { id: voices[0].voice_id, name: voices[0].name };
}

async function tts(
  key: string,
  body: Record<string, unknown>,
  voiceId: string,
  cacheDir: string
): Promise<{ mp3: string; alignment: Alignment; durationMs: number }> {
  const hash = crypto.createHash("sha1").update(JSON.stringify({ voiceId, body })).digest("hex").slice(0, 16);
  const mp3 = path.join(cacheDir, `${hash}.mp3`);
  const meta = path.join(cacheDir, `${hash}.json`);
  if (fs.existsSync(mp3) && fs.existsSync(meta)) {
    return { mp3, ...JSON.parse(fs.readFileSync(meta, "utf8")) };
  }
  const res = await fetch(`${API}/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { audio_base64: string; alignment: Alignment };
  const ends = data.alignment.character_end_times_seconds;
  const durationMs = Math.round((ends[ends.length - 1] ?? 0) * 1000);
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(mp3, Buffer.from(data.audio_base64, "base64"));
  fs.writeFileSync(meta, JSON.stringify({ alignment: data.alignment, durationMs }));
  return { mp3, alignment: data.alignment, durationMs };
}

function mixClips(clips: { file: string; atMs: number }[], totalMs: number, out: string) {
  const args = ["remotion", "ffmpeg", "-y", "-hide_banner", "-loglevel", "error"];
  clips.forEach((c) => args.push("-i", c.file));
  const filters = clips.map((c, i) => `[${i}:a]aresample=44100,adelay=${c.atMs}|${c.atMs}[a${i}]`);
  const inputs = clips.map((_, i) => `[a${i}]`).join("");
  filters.push(`${inputs}amix=inputs=${clips.length}:normalize=0:dropout_transition=0,apad,atrim=0:${totalMs / 1000}[out]`);
  args.push("-filter_complex", filters.join(";"), "-map", "[out]", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "192k", out);
  execFileSync("npx", args, { cwd: ROOT, stdio: "inherit" });
}

export async function generateVoice(
  slug: string,
  opts: { voice?: string; model?: string; speed?: number; timingOnly?: boolean } = {}
) {
  const dir = projectDir(slug);
  const sb = readStoryboard(slug);
  const captionsOut = path.join(dir, "captions.json");

  if (opts.timingOnly) {
    const words = timingOnlyCaptions(sb);
    fs.writeFileSync(captionsOut, JSON.stringify(words, null, 0).replace(/\},\{/g, "},\n{") + "\n");
    console.log(`[${slug}] wrote captions.json from storyboard timing (${words.length} words, no audio)`);
    return;
  }

  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set (or pass --timing-only for captions without audio)");

  const voiceId = opts.voice ?? sb.voice?.voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? (await pickVoice(key)).id;
  const modelId = opts.model ?? sb.voice?.modelId ?? DEFAULT_MODEL;
  const speed = opts.speed ?? sb.voice?.speed;
  const sentences = sentencesFrom(sb.captions, sb.fps);
  const totalMs = framesToMs(sb.durationInFrames, sb.fps);
  const cacheDir = path.join(dir, ".voice-cache");

  console.log(`[${slug}] ${sentences.length} sentences, voice ${voiceId}, model ${modelId}`);
  const words: WordCaption[] = [];
  const clips: { file: string; atMs: number }[] = [];
  let cursor = 0;
  let maxDrift = 0;

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const body: Record<string, unknown> = {
      text: s.text,
      model_id: modelId,
      previous_text: sentences[i - 1]?.text,
      next_text: sentences[i + 1]?.text,
      ...(speed ? { voice_settings: { speed } } : {}),
    };
    const clip = await tts(key, body, voiceId, cacheDir);
    const atMs = Math.max(s.startMs, cursor);
    const drift = atMs - s.startMs;
    maxDrift = Math.max(maxDrift, drift);
    const over = atMs + clip.durationMs - s.budgetEndMs;
    console.log(
      `  ${String(i + 1).padStart(2)}. @${(atMs / 1000).toFixed(2)}s ${(clip.durationMs / 1000).toFixed(2)}s` +
        (drift > 0 ? ` (late ${drift}ms)` : "") +
        (over > 0 && Number.isFinite(over) ? ` ⚠ overruns by ${over}ms` : "") +
        `  ${s.text.slice(0, 60)}`
    );
    words.push(...wordsFromAlignment(clip.alignment, atMs, i === 0));
    clips.push({ file: clip.mp3, atMs });
    cursor = atMs + clip.durationMs + GAP_MS;
  }

  if (cursor > totalMs) {
    console.warn(`  ⚠ narration ends at ${(cursor / 1000).toFixed(1)}s but the video is ${(totalMs / 1000).toFixed(1)}s — it will be cut off`);
  }
  if (maxDrift > 500) {
    console.warn(`  ⚠ up to ${maxDrift}ms behind the storyboard — shorten lines, raise voice.speed, or retime cues`);
  }

  mixClips(clips, totalMs, path.join(dir, "voice.mp3"));
  fs.writeFileSync(captionsOut, JSON.stringify(words, null, 0).replace(/\},\{/g, "},\n{") + "\n");
  console.log(`[${slug}] wrote voice.mp3 + captions.json (${words.length} words)`);
}

if (isMain(import.meta.url)) {
  const { positional, flags } = parseArgs();
  const slug = positional[0];
  if (!slug) {
    console.error("usage: npm run voice -- <project-slug> [--voice id] [--model id] [--speed n] [--timing-only]");
    process.exit(1);
  }
  generateVoice(slug, {
    voice: typeof flags.voice === "string" ? flags.voice : undefined,
    model: typeof flags.model === "string" ? flags.model : undefined,
    speed: typeof flags.speed === "string" ? Number(flags.speed) : undefined,
    timingOnly: !!flags["timing-only"],
  }).catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  });
}
