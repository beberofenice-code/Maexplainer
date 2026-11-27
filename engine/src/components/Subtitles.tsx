import React, { useMemo } from "react";
import type { Word } from "../types";
import { FONT } from "./ctx";

interface Chunk {
  words: Word[];
  start: number;
  end: number;
}

/** Group narration words into 2–4 word lower-third chunks (break on punctuation / pauses). */
export const chunkWords = (words: Word[], maxWords = 3): Chunk[] => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) out.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (cur.length && (prev.scene !== w.scene || w.start - prev.end > 0.35)) flush();
    cur.push(w);
    const punct = /[.,!?;:—–]$/.test(w.word);
    if (cur.length >= maxWords || (punct && cur.length >= 2) || /[.!?]$/.test(w.word)) flush();
  });
  flush();
  // merge single-word orphans into previous chunk when close
  const merged: Chunk[] = [];
  for (const c of out) {
    const last = merged[merged.length - 1];
    if (c.words.length === 1 && last && last.words.length < 4 && c.start - last.end < 0.2 && last.words[0].scene === c.words[0].scene) {
      last.words.push(...c.words);
      last.end = c.end;
    } else merged.push({ ...c, words: [...c.words] });
  }
  return merged;
};

export const Subtitles: React.FC<{ words: Word[]; t: number; W: number; H: number; yPct?: number; maxWords?: number }> = ({
  words,
  t,
  W,
  H,
  yPct = 76,
  maxWords = 3,
}) => {
  const chunks = useMemo(() => chunkWords(words, maxWords), [words, maxWords]);
  const idx = chunks.findIndex((c, i) => t >= c.start - 0.05 && t < (chunks[i + 1] ? Math.min(chunks[i + 1].start - 0.05, c.end + 0.6) : c.end + 0.6));
  if (idx < 0) return null;
  const c = chunks[idx];
  const age = t - c.start;
  const s = age < 0.12 ? 0.88 + (age / 0.12) * 0.12 : 1;
  // shrink long chunks so 2–4 words stay on one line (Montserrat 900 ≈ 0.78em per uppercase glyph)
  const chars = c.words.reduce((n, w) => n + w.word.length, 0) + (c.words.length - 1);
  // a single very long word (e.g. a 31-letter Cree place name) may go below 54 px so it never clips
  const longest = c.words.reduce((n, w) => Math.max(n, w.word.length), 0);
  const minSize = Math.min(54, (W - 140) / (longest * 0.78));
  const fontSize = Math.max(minSize, Math.min(78, ((W - 140) / (chars * 0.78))));
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: (yPct / 100) * H,
        transform: `translateY(-50%) scale(${s})`,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "0 20px",
        width: W - 120,
      }}
    >
      {c.words.map((w, i) => {
        const active = t >= w.start - 0.03;
        return (
          <span
            key={i}
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize,
              lineHeight: 1.12,
              textTransform: "uppercase",
              color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)",
              textShadow: "0 0 3px #000, 0 4px 0 #000, 0 0 18px rgba(0,0,0,0.85)",
              WebkitTextStroke: "3px rgba(0,0,0,0.9)",
              paintOrder: "stroke fill",
            }}
          >
            {w.word.replace(/[,;:]$/, "")}
          </span>
        );
      })}
    </div>
  );
};
