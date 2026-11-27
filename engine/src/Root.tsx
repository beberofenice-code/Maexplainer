import React from "react";
import { Composition, staticFile, type CalculateMetadataFunction } from "remotion";
import { MapExplainer } from "./MapExplainer";
import { estimateTimestamps } from "./lib/timing";
import type { ProjectData, Storyboard, Timestamps } from "./types";

type Props = ProjectData & { audio?: boolean } & Record<string, unknown>;

const fetchJson = async <T,>(p: string): Promise<T | null> => {
  try {
    const r = await fetch(staticFile(p));
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
};

/**
 * The project directory is the Remotion public dir (render_chunks.mjs passes --public-dir).
 * storyboard.json + assets/audio/timestamps.json define everything, including duration.
 */
const calculateMetadata: CalculateMetadataFunction<Props> = async ({ props }) => {
  const storyboard = (props.storyboard?.scenes?.length ? props.storyboard : await fetchJson<Storyboard>("storyboard.json")) as Storyboard;
  if (!storyboard) throw new Error("storyboard.json not found in the public dir (pass --public-dir=projects/<slug>)");
  const timestamps =
    (props.timestamps?.scenes?.length ? props.timestamps : await fetchJson<Timestamps>("assets/audio/timestamps.json")) ??
    estimateTimestamps(storyboard);
  const fps = storyboard.meta.fps ?? 30;
  return {
    props: { ...props, storyboard, timestamps },
    durationInFrames: Math.max(1, Math.round(timestamps.total_s * fps)),
    fps,
    width: storyboard.meta.width ?? 1080,
    height: storyboard.meta.height ?? 1920,
  };
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MapExplainer"
    component={MapExplainer}
    durationInFrames={300}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ storyboard: { scenes: [] } as unknown as Storyboard, timestamps: { scenes: [] } as unknown as Timestamps, audio: false } as Props}
    calculateMetadata={calculateMetadata}
  />
);
