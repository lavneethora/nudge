import { Config } from "@remotion/cli/config";

// H.264 in yuv420p pixel format is required for iOS/Safari playback.
// crf 26 targets ~5–8MB for a 22s @ 1080p30 clip.
Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setCrf(26);
