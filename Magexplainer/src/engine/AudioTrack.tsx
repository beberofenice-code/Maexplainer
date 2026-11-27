import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { StoryboardConfig } from "../types/scene";

/**
 * Optional audio track player.
 * Drop narration.mp3, bgm.mp3, and sfx/*.mp3 into public/audio/ and enable
 * enableAudio={true} in GeoExplainerVideo.tsx to mix audio into renders.
 */
export const AudioTrack: React.FC<{
  audio?: StoryboardConfig["audio"];
  enabled?: boolean;
}> = ({ audio, enabled = false }) => {
  if (!enabled || !audio) return null;

  return (
    <>
      {audio.narration && (
        <Sequence from={audio.narration.startFrame}>
          <Audio src={staticFile(audio.narration.src)} volume={audio.narration.volume ?? 1} />
        </Sequence>
      )}
      {audio.bgm && (
        <Sequence from={audio.bgm.startFrame}>
          <Audio src={staticFile(audio.bgm.src)} volume={audio.bgm.volume ?? 0.18} />
        </Sequence>
      )}
      {audio.sfx?.map((cue, idx) => (
        <Sequence key={`${cue.src}-${idx}`} from={cue.startFrame}>
          <Audio src={staticFile(cue.src)} volume={cue.volume ?? 0.55} />
        </Sequence>
      ))}
    </>
  );
};
