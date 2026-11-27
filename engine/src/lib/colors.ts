import type { ColorEntry, CountryColors } from "../types";

export const hexToRgba = (hex: string, alpha: number) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

export interface ResolvedColor {
  key: string;
  fill: string;
  tint: string;
  border: string;
  glow: string;
}

/**
 * Resolve a color key ("spain", "llivia", "nyc_size_overlay", "highlight") or a raw hex.
 * Territories / enclaves inherit everything from their parent country unless overridden.
 */
export const resolveColor = (key: string | undefined, colors: CountryColors): ResolvedColor => {
  const d = colors.defaults;
  if (!key) key = "highlight";
  if (key.startsWith("#")) {
    return { key, fill: key, tint: hexToRgba(key, d.tint_opacity), border: d.border, glow: hexToRgba(key, 0.9) };
  }
  const lookup = (k: string): ColorEntry | undefined => colors.countries[k] ?? colors.overlays[k] ?? colors.territories[k];
  let entry = lookup(key);
  const chain: ColorEntry[] = [];
  let guard = 0;
  while (entry && guard++ < 6) {
    chain.push(entry);
    if (!entry.parent) break;
    entry = lookup(entry.parent);
  }
  if (chain.length === 0) {
    // Unknown key: deterministic neutral-ish hue so nothing is ever unstyled.
    let h = 0;
    for (const c of key) h = (h * 31 + c.charCodeAt(0)) % 360;
    const fill = `hsl(${h}, 55%, 52%)`;
    return { key, fill, tint: `hsla(${h}, 55%, 52%, ${d.tint_opacity})`, border: d.border, glow: d.glow };
  }
  // child fields override parent fields; fill is inherited from the root country if absent
  const merged: Partial<ColorEntry> = {};
  for (let i = chain.length - 1; i >= 0; i--) Object.assign(merged, Object.fromEntries(Object.entries(chain[i]).filter(([, v]) => v !== undefined)));
  const fill = merged.fill ?? "#FFE600";
  return {
    key,
    fill,
    tint: merged.tint ?? hexToRgba(fill, d.tint_opacity),
    border: merged.border ?? d.border,
    glow: merged.glow ?? d.glow,
  };
};
