import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { MapCanvas } from "./components/MapCanvas";
import { CalloutLayer } from "./components/CalloutLayer";
import { Captions } from "./components/Captions";
import { hasStaticFile, MapProject } from "./project";
import { AudioCue } from "./types/scene";

export type MapVideoProps = {
  project: MapProject;
};

const Cue: React.FC<{ cue: AudioCue; defaultVolume: number }> = ({ cue, defaultVolume }) =>
  hasStaticFile(cue.src) ? (
    <Sequence from={cue.startFrame}>
      <Audio src={staticFile(cue.src)} volume={cue.volume ?? defaultVolume} />
    </Sequence>
  ) : null;

/** Master timeline: map + callouts + captions + audio, all driven by storyboard.json. */
export const MapVideo: React.FC<MapVideoProps> = ({ project }) => {
  const { storyboard, captions, voiceSrc } = project;
  const audio = storyboard.audio;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0D12", overflow: "hidden" }}>
      <MapCanvas storyboard={storyboard} />
      <CalloutLayer callouts={storyboard.callouts} />
      <Captions words={captions} cues={storyboard.captions} />

      {voiceSrc && (
        <Sequence from={audio?.narration?.startFrame ?? 0}>
          <Audio src={staticFile(voiceSrc)} volume={audio?.narration?.volume ?? 1} />
        </Sequence>
      )}
      {audio?.bgm && <Cue cue={audio.bgm} defaultVolume={0.18} />}
      {audio?.sfx?.map((cue, i) => <Cue key={`${cue.src}-${i}`} cue={cue} defaultVolume={0.55} />)}
    </AbsoluteFill>
  );
};
