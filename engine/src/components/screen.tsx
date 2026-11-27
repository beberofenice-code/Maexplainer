import React from "react";
import { AbsoluteFill } from "remotion";
import { clamp01, lerp, pop, presence } from "../lib/anim";
import { formatDistance, haversineKm } from "../lib/mercator";
import { colorOf, FONT, lngLatOf, point, TEXT_SHADOW, type ElementProps } from "./ctx";

const Svg: React.FC<{ children: React.ReactNode; W: number; H: number }> = ({ children, W, H }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
    <defs>
      <filter id="scr-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <filter id="scr-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000" floodOpacity="0.6" />
      </filter>
    </defs>
    {children}
  </svg>
);

const Pill: React.FC<{ x: number; y: number; text: string; sub?: string; scale?: number; color?: string; opacity?: number; size?: number }> = ({
  x,
  y,
  text,
  sub,
  scale = 1,
  color = "#FFFFFF",
  opacity = 1,
  size = 46,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${scale})`,
      opacity,
      background: "rgba(10,11,13,0.82)",
      border: `4px solid ${color}`,
      borderRadius: 22,
      padding: "12px 28px",
      fontFamily: FONT,
      fontWeight: 900,
      color: "#FFFFFF",
      fontSize: size,
      lineHeight: 1.05,
      textAlign: "center",
      whiteSpace: "nowrap",
      boxShadow: `0 10px 30px rgba(0,0,0,0.55), 0 0 26px ${color}55`,
    }}
  >
    {text}
    {sub ? <div style={{ fontSize: size * 0.5, fontWeight: 700, opacity: 0.85, marginTop: 4 }}>{sub}</div> : null}
  </div>
);

/** Big white map label (country / place name). */
export const Label: React.FC<ElementProps> = ({ spec, ctx, startF, endF }) => {
  const pt = point(spec, ctx);
  if (!pt) return null;
  const p = presence(ctx.frame, startF, endF, 10, 8);
  const s = pop(ctx.frame, startF, 12);
  const size = (spec.size as number) ?? 64;
  return (
    <div
      style={{
        position: "absolute",
        left: pt[0],
        top: pt[1],
        transform: `translate(-50%, -50%) scale(${s})`,
        opacity: p,
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        color: (spec.text_color as string) ?? "#FFFFFF",
        letterSpacing: 1,
        textTransform: spec.uppercase === false ? "none" : "uppercase",
        textShadow: TEXT_SHADOW,
        whiteSpace: "nowrap",
      }}
    >
      {spec.text as string}
    </div>
  );
};

/** Top hook banner with an accent word in highlight yellow. */
export const HookTitle: React.FC<ElementProps> = ({ spec, ctx, startF, endF }) => {
  const p = presence(ctx.frame, startF, endF, 8, 8);
  const s = pop(ctx.frame, startF, 14);
  const hl = colorOf({ ...spec, color: spec.color ?? "highlight" }, ctx);
  const text = (spec.text as string) ?? "";
  const accent = (spec.accent as string) ?? "";
  const y = ((spec.y_pct as number) ?? 15) * (ctx.vp.H / 100);
  return (
    <div
      style={{
        position: "absolute",
        left: ctx.vp.W / 2,
        top: y,
        width: ctx.vp.W - 120,
        transform: `translate(-50%, -50%) scale(${s})`,
        opacity: p,
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: (spec.size as number) ?? 84,
        lineHeight: 1.02,
        color: "#FFFFFF",
        textAlign: "center",
        textTransform: "uppercase",
        textShadow: TEXT_SHADOW,
      }}
    >
      {accent ? <div style={{ color: hl.fill, fontSize: "1.25em" }}>{accent}</div> : null}
      {text}
    </div>
  );
};

/** Curved hand-drawn arrow with draw-on animation and optional label at its tail. */
export const CalloutArrow: React.FC<ElementProps> = ({ spec, ctx, startF, endF }) => {
  const a = point(spec, ctx, "from");
  const b = point(spec, ctx, "to");
  if (!a || !b) return null;
  const c = colorOf(spec, ctx, "highlight");
  const p = presence(ctx.frame, startF, endF, 4, 8);
  const draw = clamp01((ctx.frame - startF) / Math.round(ctx.fps * 0.55));
  const ease = 1 - Math.pow(1 - draw, 3);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const bend = (spec.curve as number) ?? 0.3;
  const shorten = (spec.gap as number) ?? 26;
  const bx = b[0] - (dx / len) * shorten;
  const by = b[1] - (dy / len) * shorten;
  const cx = (a[0] + bx) / 2 - (dy / len) * len * bend;
  const cy = (a[1] + by) / 2 + (dx / len) * len * bend;
  const d = `M${a[0]},${a[1]} Q${cx},${cy} ${bx},${by}`;
  // arrow head orientation = tangent at end
  const tx = bx - cx;
  const ty = by - cy;
  const ang = (Math.atan2(ty, tx) * 180) / Math.PI;
  const headS = clamp01((ease - 0.85) / 0.15);
  return (
    <AbsoluteFill style={{ opacity: p }}>
      <Svg W={ctx.vp.W} H={ctx.vp.H}>
        <path d={d} pathLength={1} strokeDasharray={`${ease} 1`} fill="none" stroke="#000" strokeOpacity={0.55} strokeWidth={17} strokeLinecap="round" />
        <path d={d} pathLength={1} strokeDasharray={`${ease} 1`} fill="none" stroke={c.fill} strokeWidth={10} strokeLinecap="round" />
        <g transform={`translate(${bx},${by}) rotate(${ang}) scale(${headS})`}>
          <path d="M-34,-22 L4,0 L-34,22" fill="none" stroke="#000" strokeOpacity={0.55} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M-34,-22 L4,0 L-34,22" fill="none" stroke={c.fill} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </Svg>
      {spec.label ? <Pill x={a[0]} y={a[1] - 10} text={spec.label as string} color={c.fill} scale={pop(ctx.frame, startF, 10)} size={44} /> : null}
    </AbsoluteFill>
  );
};

/** Popping, bobbing "?" glyphs around a point. */
export const QuestionMarks: React.FC<ElementProps> = ({ spec, ctx, startF, endF }) => {
  const pt = point(spec, ctx);
  if (!pt) return null;
  const n = (spec.count as number) ?? 3;
  const r = (spec.radius as number) ?? 120;
  const c = colorOf(spec, ctx, "highlight");
  const p = presence(ctx.frame, startF, endF, 6, 8);
  const offsets = [
    [-1, -0.6, -16],
    [0.15, -1.05, 8],
    [1, -0.45, 18],
    [-0.6, 0.6, -6],
    [0.8, 0.65, 12],
  ];
  return (
    <AbsoluteFill style={{ opacity: p }}>
      {Array.from({ length: n }).map((_, i) => {
        const [ox, oy, rot] = offsets[i % offsets.length];
        const s = pop(ctx.frame, startF + i * 4, 10);
        const bob = Math.sin((ctx.frame - startF) / 7 + i * 1.7) * 8;
        const size = (spec.size as number) ?? 120 - i * 10;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pt[0] + ox * r,
              top: pt[1] + oy * r + bob,
              transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: size,
              color: c.fill,
              textShadow: TEXT_SHADOW,
            }}
          >
            ?
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Dashed measurement line with end ticks and an auto-computed "km (mi)" badge. */
export const DistanceRuler: React.FC<ElementProps> = ({ spec, ctx, startF, endF }) => {
  const a = point(spec, ctx, "from");
  const b = point(spec, ctx, "to");
  const la = lngLatOf(spec, ctx, "from");
  const lb = lngLatOf(spec, ctx, "to");
  if (!a || !b) return null;
  const c = colorOf({ ...spec, color: spec.color ?? "#FFFFFF" }, ctx);
  const p = presence(ctx.frame, startF, endF, 4, 8);
  const draw = 1 - Math.pow(1 - clamp01((ctx.frame - startF) / Math.round(ctx.fps * 0.7)), 3);
  const ex = lerp(a[0], b[0], draw);
  const ey = lerp(a[1], b[1], draw);
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const nx = -Math.sin(ang) * 22;
  const ny = Math.cos(ang) * 22;
  const label = (spec.label as string) ?? (la && lb ? formatDistance(haversineKm(la, lb)) : "");
  const off = (spec.label_offset as number) ?? -70;
  const mx = (a[0] + b[0]) / 2 + (-Math.sin(ang) * off);
  const my = (a[1] + b[1]) / 2 + (Math.cos(ang) * off);
  const s = pop(ctx.frame, startF + Math.round(ctx.fps * 0.5), 10);
  return (
    <AbsoluteFill style={{ opacity: p }}>
      <Svg W={ctx.vp.W} H={ctx.vp.H}>
        <g filter="url(#scr-shadow)">
          <line x1={a[0]} y1={a[1]} x2={ex} y2={ey} stroke={c.fill} strokeWidth={7} strokeDasharray="18 12" strokeLinecap="round" />
          <line x1={a[0] - nx} y1={a[1] - ny} x2={a[0] + nx} y2={a[1] + ny} stroke={c.fill} strokeWidth={7} strokeLinecap="round" />
          {draw > 0.98 ? <line x1={b[0] - nx} y1={b[1] - ny} x2={b[0] + nx} y2={b[1] + ny} stroke={c.fill} strokeWidth={7} strokeLinecap="round" /> : null}
        </g>
      </Svg>
      {label ? <Pill x={mx} y={my} text={label} scale={s} color={colorOf({ ...spec, color: spec.badge_color ?? "highlight" }, ctx).fill} size={42} /> : null}
    </AbsoluteFill>
  );
};

/** Lifted travel arc between two places with a moving head dot / plane. */
export const TravelArc: React.FC<ElementProps> = ({ spec, ctx, startF, endF }) => {
  const a = point(spec, ctx, "from");
  const b = point(spec, ctx, "to");
  if (!a || !b) return null;
  const c = colorOf(spec, ctx, "highlight");
  const p = presence(ctx.frame, startF, endF, 4, 10);
  const drawF = Math.round(((spec.draw_s as number) ?? 1.4) * ctx.fps);
  const x = clamp01((ctx.frame - startF) / drawF);
  const e = x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const h = ((spec.height as number) ?? 0.35) * len;
  // perpendicular to the chord, pointing "up" (or right for near-vertical chords); `side: -1` flips it
  let px = (b[1] - a[1]) / len;
  let py = -(b[0] - a[0]) / len;
  if (py > 0.2 || (Math.abs(py) <= 0.2 && px < 0)) {
    px = -px;
    py = -py;
  }
  const side = (spec.side as number) ?? 1;
  const cx = (a[0] + b[0]) / 2 + px * h * 2 * side;
  const cy = (a[1] + b[1]) / 2 + py * h * 2 * side;
  const d = `M${a[0]},${a[1]} Q${cx},${cy} ${b[0]},${b[1]}`;
  const q = (t: number) => [
    (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cx + t * t * b[0],
    (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cy + t * t * b[1],
  ];
  const [hx, hy] = q(e);
  const la = lngLatOf(spec, ctx, "from");
  const lb = lngLatOf(spec, ctx, "to");
  const label = spec.label === "auto" && la && lb ? formatDistance(haversineKm(la, lb)) : (spec.label as string | undefined);
  return (
    <AbsoluteFill style={{ opacity: p }}>
      <Svg W={ctx.vp.W} H={ctx.vp.H}>
        <path d={d} pathLength={1} strokeDasharray={`${e} 1`} fill="none" stroke={c.fill} strokeWidth={18} strokeOpacity={0.5} filter="url(#scr-glow)" />
        <path d={d} pathLength={1} strokeDasharray={`${e} 1`} fill="none" stroke={c.fill} strokeWidth={7} strokeLinecap="round" />
        <circle cx={a[0]} cy={a[1]} r={12} fill="#FFFFFF" stroke={c.fill} strokeWidth={5} />
        {e > 0 ? <circle cx={hx} cy={hy} r={15} fill={c.fill} stroke="#FFFFFF" strokeWidth={5} /> : null}
      </Svg>
      {label ? <Pill x={(a[0] + b[0]) / 4 + cx / 2} y={(a[1] + b[1]) / 4 + cy / 2} text={label} color={c.fill} scale={pop(ctx.frame, startF + drawF / 2, 10)} size={40} /> : null}
    </AbsoluteFill>
  );
};

/** Pill stat badge with count-up number. */
export const StatBadge: React.FC<ElementProps> = ({ spec, ctx, startF, endF }) => {
  const pt = point(spec, ctx) ?? [ctx.vp.W / 2, ctx.vp.H * 0.2];
  const c = colorOf(spec, ctx, "highlight");
  const p = presence(ctx.frame, startF, endF, 6, 8);
  const s = pop(ctx.frame, startF, 12);
  let text = (spec.text as string) ?? "";
  if (typeof spec.value === "number") {
    const cu = spec.count_up === false ? 1 : clamp01((ctx.frame - startF) / Math.round(ctx.fps * 0.9));
    const eased = 1 - Math.pow(1 - cu, 3);
    const v = (spec.value as number) * eased;
    const dec = (spec.decimals as number) ?? 0;
    text = `${spec.prefix ?? ""}${v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })}${spec.suffix ?? ""}`;
  }
  return <Pill x={pt[0]} y={pt[1]} text={text} sub={spec.label as string} scale={s} color={c.fill} opacity={p} size={(spec.size as number) ?? 64} />;
};

/** Teardrop pin that drops in, with pulsing rings and a label. */
export const HotspotPin: React.FC<ElementProps> = ({ spec, ctx, startF, endF }) => {
  const pt = point(spec, ctx);
  if (!pt) return null;
  const c = colorOf(spec, ctx, "highlight");
  const p = presence(ctx.frame, startF, endF, 6, 8);
  const s = pop(ctx.frame, startF, 12);
  const drop = (1 - clamp01((ctx.frame - startF) / 9)) * -60;
  const t = (ctx.frame - startF) / ctx.fps;
  const rings = [0, 0.5].map((o) => ((t + o) % 1.0 + 1) % 1.0);
  const size = (spec.size as number) ?? 1;
  return (
    <AbsoluteFill style={{ opacity: p }}>
      <Svg W={ctx.vp.W} H={ctx.vp.H}>
        {rings.map((r, i) => (
          <ellipse key={i} cx={pt[0]} cy={pt[1]} rx={20 + r * 70 * size} ry={(20 + r * 70 * size) * 0.55} fill="none" stroke={c.fill} strokeWidth={5} opacity={(1 - r) * 0.9} />
        ))}
        <g transform={`translate(${pt[0]},${pt[1] + drop}) scale(${s * size})`} filter="url(#scr-shadow)">
          <path d="M0,0 C-10,-22 -32,-38 -32,-62 A32,32 0 1 1 32,-62 C32,-38 10,-22 0,0 Z" fill={c.fill} stroke="#FFFFFF" strokeWidth={5} />
          <circle cx={0} cy={-62} r={12} fill="#FFFFFF" />
        </g>
      </Svg>
      {spec.label ? (
        <div
          style={{
            position: "absolute",
            left: pt[0] + ((spec.label_dx as number) ?? 0),
            top: pt[1] - 150 * size + ((spec.label_dy as number) ?? 0),
            transform: `translate(-50%, -50%) scale(${s})`,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: (spec.label_size as number) ?? 52,
            color: "#FFFFFF",
            textShadow: TEXT_SHADOW,
            whiteSpace: "nowrap",
            textTransform: "uppercase",
          }}
        >
          {spec.label as string}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Top yellow counter (dark_cutaway signature), steps keyed to words. */
export const Counter: React.FC<ElementProps> = ({ spec, ctx, startF, endF }) => {
  const steps = ((spec.steps as any[]) ?? []).map((st) => ({ f: Math.round(ctx.clock.at(st) * ctx.fps), v: st.value as number | string }));
  const active = steps.filter((st) => st.f <= ctx.frame);
  if (active.length === 0) return null;
  const cur = active[active.length - 1];
  const p = presence(ctx.frame, startF, endF, 6, 8);
  const s = pop(ctx.frame, cur.f, 10);
  const c = colorOf(spec, ctx, "highlight");
  const y = ((spec.y_pct as number) ?? 13) * (ctx.vp.H / 100);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", opacity: p, fontFamily: FONT, transform: "translateY(-50%)" }}>
      <div style={{ fontSize: (spec.size as number) ?? 210, fontWeight: 900, color: c.fill, lineHeight: 1, transform: `scale(${s})`, textShadow: "0 10px 30px rgba(0,0,0,0.6), 0 0 40px rgba(255,230,0,0.35)" }}>
        {cur.v}
      </div>
      {spec.label ? (
        <div style={{ fontSize: 56, fontWeight: 900, color: "#FFFFFF", letterSpacing: 6, textTransform: "uppercase", textShadow: TEXT_SHADOW }}>
          {spec.label as string}
        </div>
      ) : null}
    </div>
  );
};
