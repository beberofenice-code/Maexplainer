import { Config } from "@remotion/cli/config";

// CPU-only, WebGL-free pipeline: JPEG frames are the fastest to encode.
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
Config.setOverwriteOutput(true);
