import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useProjectAssets, type ProjectAssets } from "./lib/assets";
import { cameraAt } from "./lib/camera";
import { ensureFonts } from "./lib/fonts";
import { makeViewport, PERSPECTIVE } from "./lib/mercator";
import { SceneClock } from "./lib/timing";
import { TileLayer } from "./layers/TileLayer";
import { ContextLayer, FeatureLayer, PlaneDefs } from "./layers/GeoLayer";
import { Subtitles } from "./components/Subtitles";
import { CalloutArrow, Counter, DistanceRuler, HookTitle, HotspotPin, Label, QuestionMarks, StatBadge, TravelArc } from "./components/screen";
import { FlagWithTugArms } from "./components/FlagWithTugArms";
import { GlowingBorderBar, ShiftingBorderSpline, TrueScaleCityCompare } from "./components/plane";
import type { ElementProps } from "./components/ctx";
import type { ProjectData, SceneSpec, SceneTiming } from "./types";

export const SCREEN_ELEMENTS: Record<string, React.FC<ElementProps>> = {
  CalloutArrow,
  QuestionMarks,
  DistanceRuler,
  TravelArc,
  FlagWithTugArms,
  StatBadge,
  HotspotPin,
  Counter,
  Label,
  HookTitle,
};
export const PLANE_ELEMENTS: Record<string, React.FC<ElementProps>> = {
  GlowingBorderBar,
  ShiftingBorderSpline,
  TrueScaleCityCompare,
};

/** Mystery silhouette helper: a feature drawn as `silhouette` style + QuestionMarks — see storyboard docs. */

const Scene: React.FC<{ scene: SceneSpec; timing: SceneTiming; data: ProjectData; assets: ProjectAssets; index: number }> = ({
  scene,
  timing,
  data,
  assets,
  index,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const clock = new SceneClock(scene, timing, data.timestamps.words);
  const t = frame / fps;
  const cam = cameraAt(scene.camera, clock, t);
  // scene-in punch: slight zoom settle + dip from black (not on the very first scene)
  const inP = index === 0 ? 1 : Math.min(1, frame / 8);
  const punch = 1 + (1 - inP) * 0.06;
  const vp = makeViewport(W, H, cam);
  const dc = assets.colors.defaults.dark_cutaway;
  let mode = scene.mode;
  for (const m of scene.mode_at ?? []) if (t >= clock.at(m)) mode = m.mode;
  const ctx = { vp, assets, clock, frame, fps, mode };
  const elements = scene.elements ?? [];
  const timed = (el: any) => {
    const startF = Math.round(clock.at(el) * fps);
    const endF = Math.round(clock.until(el) * fps);
    return { startF, endF, visible: frame >= startF && frame <= endF + 12 };
  };
  return (
    <AbsoluteFill style={{ backgroundColor: mode === "dark_cutaway" ? dc.background : "#05070A", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        <AbsoluteFill style={{ perspective: `${PERSPECTIVE}px`, perspectiveOrigin: "50% 50%" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: W,
              height: H,
              transformOrigin: "50% 50%",
              transform: `rotateX(${cam.pitch}deg) rotateZ(${-cam.bearing}deg)`,
              transformStyle: "flat",
            }}
          >
            {mode === "satellite" ? <TileLayer vp={vp} tiles={assets.tiles} maxZoom={assets.maxTileZoom} /> : null}
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <PlaneDefs hatch={dc.hatch} />
              <ContextLayer vp={vp} assets={assets} mode={mode} show={scene.show_context_borders ?? true} />
              {(scene.layers ?? []).map((l, i) => (
                <FeatureLayer key={`${l.feature}-${i}`} spec={l} vp={vp} assets={assets} clock={clock} frame={frame} fps={fps} mode={mode} />
              ))}
              {elements.map((el, i) => {
                const C = PLANE_ELEMENTS[el.type];
                if (!C) return null;
                const tm = timed(el);
                return tm.visible ? <C key={i} spec={el} ctx={ctx} startF={tm.startF} endF={tm.endF} /> : null;
              })}
            </svg>
          </div>
        </AbsoluteFill>
        {mode === "satellite" ? (
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)" }} />
        ) : null}
        {elements.map((el, i) => {
          const C = SCREEN_ELEMENTS[el.type];
          if (!C) return null;
          const tm = timed(el);
          return tm.visible ? <C key={i} spec={el} ctx={ctx} startF={tm.startF} endF={tm.endF} /> : null;
        })}
      </AbsoluteFill>
      {index > 0 ? <AbsoluteFill style={{ backgroundColor: "#000", opacity: (1 - inP) * 0.55, pointerEvents: "none" }} /> : null}
    </AbsoluteFill>
  );
};

export const MapExplainer: React.FC<ProjectData & { audio?: boolean } & Record<string, unknown>> = (data) => {
  ensureFonts();
  const assets = useProjectAssets();
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  if (!assets) return null;
  const { storyboard: sb, timestamps: ts } = data;
  const sub = sb.meta.subtitles ?? {};
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {sb.scenes.map((scene, i) => {
        const timing = ts.scenes.find((s) => s.id === scene.id);
        if (!timing) return null;
        const from = Math.round(timing.start * fps);
        const dur = Math.max(1, Math.round(timing.end * fps) - from);
        return (
          <Sequence key={scene.id} from={from} durationInFrames={dur} name={scene.id}>
            <Scene scene={scene} timing={timing} data={data} assets={assets} index={i} />
          </Sequence>
        );
      })}
      <Subtitles words={ts.words} t={frame / fps} W={W} H={H} yPct={sub.y_pct} maxWords={sub.max_words} />
      {data.audio ? <Audio src={staticFile("assets/audio/mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
