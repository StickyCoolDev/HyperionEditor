# Export & Encoding Pipeline

The export subsystem compiles project clips, canvas compositing operations, applied VFX shaders, and multi-track audio into a standalone MP4 file using an in-browser WebAssembly build of **FFmpeg**.

## Encoding Process Flow

When the user initiates an export, Hyperion executes a multi-stage compilation pipeline:

1. **Frame Extraction**: Iterates chronologically through the timeline from project start to end at the configured export frame rate (e.g. 30 or 60 FPS).
2. **Canvas Rasterization**: Composites active video layers, overlay graphics, and VFX filters onto an off-screen render buffer.
3. **Piped Frame Ingestion**: Raw video frames are encoded via the FFmpeg WASM virtual filesystem (`FS.writeFile`).
4. **Audio Summing & Resampling**: Multi-track audio is rendered offline using `OfflineAudioContext`, matched to the target sample rate, and written as an intermediate PCM WAV file.
5. **Muxing & FastStart Optimization**: FFmpeg multiplexes audio and video streams using H.264 video and AAC audio codecs.

## FastStart MP4 Optimization (`+faststart`)

By default, FFmpeg places the MP4 index (`moov` atom) at the end of the compiled file after all raw media chunks (`mdat`). Hyperion applies the `-movflags +faststart` flag:

```bash
ffmpeg -framerate 30 -i input_%05d.png -i audio.wav -c:v libx264 -pix_fmt yuv420p -movflags +faststart -c:a aac output.mp4
```

This rearranges the metadata index to the front of the output file, allowing web browsers to start progressive streaming and instant scrubbing without downloading the entire video first.

## Resolution Presets

Hyperion provides one-click export configurations:

| Profile | Resolution | Aspect Ratio | Target Bitrate |
|---|---|---|---|
| **Full HD 1080p** | `1920 × 1080` | `16:9` | `8,000 kbps` |
| **4K Ultra HD** | `3840 × 2160` | `16:9` | `24,000 kbps` |
| **Vertical Reel / Shorts** | `1080 × 1920` | `9:16` | `6,500 kbps` |
| **Square Social** | `1080 × 1080` | `1:1` | `5,000 kbps` |
| **720p Fast Preview** | `1280 × 720` | `16:9` | `3,500 kbps` |
