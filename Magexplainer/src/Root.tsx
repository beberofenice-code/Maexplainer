import React from "react";
import { Composition } from "remotion";
import { GeoExplainerVideo } from "./engine/GeoExplainerVideo";
import { SPAIN_BORDERS_STORYBOARD } from "./data/spainBordersStoryboard";

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
    </>
  );
};
