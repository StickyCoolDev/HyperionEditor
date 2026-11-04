# Getting Started

Welcome to the official developer and creator documentation for Hyperion Video Editor. Hyperion is a client-side video production studio that runs entirely inside modern web browsers. It eliminates cloud rendering costs by leveraging hardware-accelerated WebAssembly (FFmpeg) and HTML5 Canvas compositing directly on the client machine.

## Architecture Overview

Hyperion operates as a self-contained Single-Page/Multi-Page Application. Rather than uploading multi-gigabyte raw video files to external processing servers, your media stays private on your local machine:

- **Local Media Bin**: Assets are registered into an in-memory blob cache and indexed via client-side IndexedDB stores.
- **Canvas Timeline Engine**: Renders composite video frames at up to 60 FPS using an off-screen HTML5 `<canvas>` context with sub-pixel playhead precision.
- **Web Audio Pipeline**: Routes multi-track audio through Web Audio API GainNode networks, ensuring synchronized real-time playback and level monitoring.
- **In-Browser FFmpeg WASM**: Encodes output video streams to MP4 (H.264 / AAC) using WebAssembly threads and SIMD acceleration.

## System Requirements

To ensure stable playback and WebAssembly video compilation, the following browser capabilities are required:

| Component | Minimum Requirement | Recommended |
|---|---|---|
| Browser | Chromium 92+, Firefox 90+, Safari 16.4+ | Chrome / Edge 115+ with WebGPU & SIMD |
| Memory (RAM) | 4 GB free system memory | 8 GB+ free memory for 4K timelines |
| CPU | Multi-core 64-bit processor | 6+ physical CPU cores for WASM threads |
| Storage | 2 GB free disk space (temporary blob storage) | Fast NVMe SSD storage |

## Cross-Origin Isolation Requirements

Hyperion utilizes `SharedArrayBuffer` to execute multi-threaded FFmpeg encoding inside Web Workers. To satisfy modern browser security restrictions, the server hosting Hyperion must serve the following HTTP response headers:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
```

When running in local development mode or behind proxy gateways, ensure these headers are configured in your development server headers profile.

## Importing Media Assets

Hyperion supports dragging and dropping media files directly onto the workspace or importing via the **Media Bin**:

1. Click **Add Media** in the left sidebar or drag media files directly into the timeline canvas.
2. Supported container formats include `.mp4`, `.webm`, `.mov`, `.mp3`, `.wav`, `.png`, and `.jpg`.
3. Clips appear in the **Media Bin** with automatic thumbnail generation and audio duration probes.
