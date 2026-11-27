import { continueRender, delayRender, staticFile } from "remotion";

let started = false;
/** Load Montserrat (cached by fetch_geo_and_tiles.py into assets/fonts). Falls back to Inter/system. */
export const ensureFonts = () => {
  if (started || typeof document === "undefined") return;
  started = true;
  const handle = delayRender("fonts");
  const faces = [
    { weight: "700", file: "assets/fonts/Montserrat-700.woff2" },
    { weight: "900", file: "assets/fonts/Montserrat-900.woff2" },
  ];
  Promise.all(
    faces.map(async ({ weight, file }) => {
      try {
        const ff = new FontFace("Montserrat", `url(${staticFile(file)}) format('woff2')`, { weight });
        await ff.load();
        (document.fonts as unknown as { add: (f: FontFace) => void }).add(ff);
      } catch {
        /* fallback fonts in FONT stack */
      }
    }),
  ).finally(() => continueRender(handle));
};
