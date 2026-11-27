import React from "react";
import { Composition } from "remotion";
import { GeoExplainerVideo } from "./engine/GeoExplainerVideo";
import { SPAIN_BORDERS_STORYBOARD } from "./data/spainBordersStoryboard";
import { ITALY_BORDERS_STORYBOARD } from "./data/italyBordersStoryboard";
import { FRANCE_BORDERS_STORYBOARD } from "./data/franceBordersStoryboard";
import { GERMANY_BORDERS_STORYBOARD } from "./data/germanyBordersStoryboard";

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
      <Composition
        id="FrancesStrangestBorders"
        component={GeoExplainerVideo}
        durationInFrames={FRANCE_BORDERS_STORYBOARD.durationInFrames}
        fps={FRANCE_BORDERS_STORYBOARD.fps}
        width={FRANCE_BORDERS_STORYBOARD.width}
        height={FRANCE_BORDERS_STORYBOARD.height}
        defaultProps={{
          storyboard: FRANCE_BORDERS_STORYBOARD,
        }}
      />
      <Composition
        id="GermanysStrangestBorders"
        component={GeoExplainerVideo}
        durationInFrames={GERMANY_BORDERS_STORYBOARD.durationInFrames}
        fps={GERMANY_BORDERS_STORYBOARD.fps}
        width={GERMANY_BORDERS_STORYBOARD.width}
        height={GERMANY_BORDERS_STORYBOARD.height}
        defaultProps={{
          storyboard: GERMANY_BORDERS_STORYBOARD,
        }}
      />
    </>
  );
};
