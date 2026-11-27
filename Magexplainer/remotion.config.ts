import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// "angle" is fastest on a machine with a GPU; use REMOTION_GL=swangle on headless servers.
Config.setChromiumOpenGlRenderer(
  (process.env.REMOTION_GL as "angle" | "swangle" | "egl" | "swiftshader" | "vulkan" | undefined) ?? "angle"
);
// Optional: render with a system Chrome/Chromium (e.g. one that trusts a corporate proxy CA).
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
// Each project folder (voice.mp3, shared audio in _shared/) is served as a static file.
Config.setPublicDir("./projects");
