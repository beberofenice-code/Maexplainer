# Audio Assets

Place your optional audio files here:

- `narration.mp3` — Voiceover track (e.g. ElevenLabs / recorded narration)
- `bgm.mp3` — Subtle background music bed
- `sfx/whoosh.mp3` — Camera zoom transition whoosh
- `sfx/pop.mp3` — Label / counter pop sound

Then set `enableAudio={true}` in `src/engine/GeoExplainerVideo.tsx` (or pass it via Remotion input props) to mix audio into the rendered MP4.
