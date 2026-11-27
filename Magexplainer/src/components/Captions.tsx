import React, { useMemo } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CaptionCue, WordCaption } from "../types/scene";
import { THEME } from "../styles/theme";

/** Max time span / characters of words grouped into one on-screen line. */
const PAGE_MS = 1300;
const PAGE_CHARS = 30;

interface Page {
  startMs: number;
  endMs: number;
  words: WordCaption[];
}

/** Group words into short lines, never running across a sentence end. */
export const paginate = (words: WordCaption[]): Page[] => {
  const pages: Page[] = [];
  let cur: Page | null = null;
  for (const w of words) {
    const prev = cur?.words[cur.words.length - 1];
    const chars = cur ? cur.words.map((x) => x.text).join("").length + w.text.length : 0;
    if (
      !cur ||
      /[.?!…]["”')]*$/.test(prev!.text) ||
      w.startMs - cur.startMs > PAGE_MS ||
      chars > PAGE_CHARS
    ) {
      cur = { startMs: w.startMs, endMs: w.endMs, words: [] };
      pages.push(cur);
    }
    cur.words.push(w);
    cur.endMs = w.endMs;
  }
  return pages;
};

const Frame: React.FC<{ appearAt: number; children: React.ReactNode }> = ({ appearAt, children }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [appearAt, appearAt + 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 430,
        display: "flex",
        justifyContent: "center",
        padding: "0 72px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: THEME.fonts.body,
          fontWeight: 700,
          fontSize: 44,
          lineHeight: 1.25,
          textAlign: "center",
          color: "#FFFFFF",
          whiteSpace: "pre-wrap",
          textShadow: "0 4px 16px rgba(0,0,0,0.95), 0 1px 4px rgba(0,0,0,1)",
          opacity: progress,
          transform: `translateY(${(1 - progress) * 8}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Word-synced captions (captions.json); the active word is highlighted. */
const WordCaptions: React.FC<{ words: WordCaption[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  const pages = useMemo(() => paginate(words), [words]);
  const page = pages.find(
    (p, i) => ms >= p.startMs && ms < Math.min(pages[i + 1]?.startMs ?? Infinity, p.endMs + 400)
  );
  if (!page) return null;

  return (
    <Frame appearAt={Math.round((page.startMs / 1000) * fps)}>
      {page.words.map((w, i) => {
        const active = ms >= w.startMs && ms < w.endMs;
        return (
          <span
            key={`${w.startMs}-${i}`}
            style={{
              color: active ? THEME.colors.accentYellow : "#FFFFFF",
              display: "inline-block",
              transform: `scale(${active ? 1.06 : 1})`,
            }}
          >
            {i === 0 ? w.text.trimStart() : w.text}
          </span>
        );
      })}
    </Frame>
  );
};

/** Phrase captions straight from storyboard.captions (used when there is no captions.json). */
const CueCaptions: React.FC<{ cues: CaptionCue[] }> = ({ cues }) => {
  const frame = useCurrentFrame();
  const active = cues.find((c) => frame >= c.startFrame && frame <= c.endFrame);
  if (!active) return null;
  return <Frame appearAt={active.startFrame}>{active.text}</Frame>;
};

export const Captions: React.FC<{ words: WordCaption[] | null; cues: CaptionCue[] }> = ({
  words,
  cues,
}) => (words && words.length > 0 ? <WordCaptions words={words} /> : <CueCaptions cues={cues} />);
