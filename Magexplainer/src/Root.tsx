import React from "react";
import { Composition } from "remotion";
import { MapVideo } from "./MapVideo";
import { loadProjects } from "./project";

/**
 * One composition per projects/<slug>/storyboard.json, all 1080x1920 @ 30fps
 * (taken from the storyboard). Adding a project folder is enough to register it.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {loadProjects().map((project) => (
        <Composition
          key={project.slug}
          id={project.storyboard.id}
          component={MapVideo}
          durationInFrames={project.storyboard.durationInFrames}
          fps={project.storyboard.fps}
          width={project.storyboard.width}
          height={project.storyboard.height}
          defaultProps={{ project }}
        />
      ))}
    </>
  );
};
