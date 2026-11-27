import React from "react";
import { AbsoluteFill } from "remotion";
import { StoryboardConfig } from "../types/scene";
import { MapCanvas } from "./MapCanvas";
import { OverlayLayer } from "./OverlayLayer";
import { Captions } from "./Captions";
import { AudioTrack } from "./AudioTrack";

export interface GeoExplainerVideoProps {
  storyboard: StoryboardConfig;
  enableAudio?: boolean;
}

export const GeoExplainerVideo: React.FC<GeoExplainerVideoProps> = ({
  storyboard,
  enableAudio = false,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0D12", overflow: "hidden" }}>
      <MapCanvas storyboard={storyboard} />
      <OverlayLayer callouts={storyboard.callouts} />
      <Captions cues={storyboard.captions} />
      <AudioTrack audio={storyboard.audio} enabled={enableAudio} />
    </AbsoluteFill>
  );
};
