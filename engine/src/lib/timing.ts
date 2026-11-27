import type { EndSpec, SceneSpec, SceneTiming, Storyboard, TimeSpec, Timestamps, Word } from "../types";

/** Must match mxp_common.norm_word() in the Python pipeline. */
export const normWord = (w: string): string =>
  w
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Fallback timeline when sound_engine.py has not produced timestamps.json yet. */
export const estimateTimestamps = (sb: Storyboard): Timestamps => {
  let t = 0;
  const scenes: SceneTiming[] = [];
  const words: Word[] = [];
  for (const sc of sb.scenes) {
    const toks = sc.narration.split(/\s+/).filter(Boolean);
    const per = 0.36;
    const voLen = toks.length * per;
    const dur = Math.max(sc.min_duration_s ?? 0, voLen + (sc.tail_s ?? 0.5) + 0.15);
    toks.forEach((w, i) => words.push({ word: w, start: t + 0.15 + i * per, end: t + 0.15 + (i + 1) * per - 0.04, scene: sc.id }));
    scenes.push({ id: sc.id, start: t, end: t + dur, vo_start: t + 0.15, vo_end: t + 0.15 + voLen });
    t += dur;
  }
  return { fps: sb.meta.fps, total_s: t, provider: "estimate", scenes, words };
};

export class SceneClock {
  readonly words: Word[];
  constructor(readonly scene: SceneSpec, readonly timing: SceneTiming, allWords: Word[]) {
    this.words = allWords.filter((w) => w.scene === scene.id);
  }
  get duration() {
    return this.timing.end - this.timing.start;
  }
  /** Scene-local seconds of the n-th occurrence of a word, or null. */
  wordTime(word: string, occurrence = 1, edge: "start" | "end" = "start"): number | null {
    const target = normWord(word);
    let n = 0;
    for (const w of this.words) {
      if (normWord(w.word) === target || (target.length > 3 && normWord(w.word).startsWith(target))) {
        n++;
        if (n === occurrence) return (edge === "start" ? w.start : w.end) - this.timing.start;
      }
    }
    return null;
  }
  /** Resolve a TimeSpec to scene-local seconds. */
  at(spec: TimeSpec, fallback = 0): number {
    if (spec.at_word) {
      const wt = this.wordTime(spec.at_word, spec.occurrence ?? 1);
      if (wt !== null) return Math.max(0, wt + (spec.offset ?? 0));
    }
    if (typeof spec.t === "number") return spec.t + (spec.offset ?? 0);
    return fallback + (spec.offset ?? 0);
  }
  /** Resolve the end of a timed thing (scene-local seconds). */
  until(spec: TimeSpec & EndSpec): number {
    const start = this.at(spec);
    if (typeof spec.duration === "number") return start + spec.duration;
    if (spec.until_word) {
      const wt = this.wordTime(spec.until_word, spec.until_occurrence ?? 1);
      if (wt !== null) return wt + (spec.until_offset ?? 0);
    }
    if (typeof spec.until_t === "number") return spec.until_t;
    return this.duration + 1; // persist to scene end
  }
}
