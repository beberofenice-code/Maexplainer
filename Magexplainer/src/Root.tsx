import React from "react";
import { Composition } from "remotion";
import { GeoExplainerVideo } from "./engine/GeoExplainerVideo";
import { SPAIN_BORDERS_STORYBOARD } from "./data/spainBordersStoryboard";
import { ITALY_BORDERS_STORYBOARD } from "./data/italyBordersStoryboard";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SpainsStrangestBorders"
        component={GeoExplainerVideo}
        durationInFrames={SPAIN_BORDERS_STORYBOARD.durationInFrames}
        fps={SPAIN_BORDERS_STORYBOARD.fps}
        width={SPAIN_BORDERS_STORYBOARD.width}
        height={SPAIN_BORDERS_STORYBOARD.height}
        defaultProps={{
          storyboard: SPAIN_BORDERS_STORYBOARD,
        }}
      />
      <Composition
        id="ItalysStrangestBorders"
        component={GeoExplainerVideo}
        durationInFrames={ITALY_BORDERS_STORYBOARD.durationInFrames}
        fps={ITALY_BORDERS_STORYBOARD.fps}
        width={ITALY_BORDERS_STORYBOARD.width}
        height={ITALY_BORDERS_STORYBOARD.height}
        defaultProps={{
          storyboard: ITALY_BORDERS_STORYBOARD,
        }}
      />
    </>
  );
};
