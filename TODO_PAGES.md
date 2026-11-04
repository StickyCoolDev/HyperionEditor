# Hyperion Editor: Multi-Page Application (MPA) Roadmap & Specifications

This document defines the architectural specification, information architecture, and planned milestones for upcoming pages in the Hyperion Video Editor Vite MPA structure.

---

## 1. Overview & Vite MPA Routing Structure

The application is built using a native **Vite Multi-Page Application (MPA)** architecture configured via `vite.config.js`. Each route is an independent HTML entry point bundled and minified at build-time with compiled Tailwind CSS v4 and native Cross-Origin Isolation (`COOP` / `COEP`) headers for FFmpeg WebAssembly.

### Active Routes
| Route | Entry File | Description | Status |
|---|---|---|---|
| `/` | `index.html` | Core video editing studio (Canvas timeline, Media Bin, VFX engine, FFmpeg export) | **Production Active** |
| `/docs/` | `docs/index.html` | Official documentation, modular Markdown compiled at build-time, DevDojo Pines UI (White Mode) | **Production Active** |
| `/forum/` | `forum/index.html` | Community discussions, category filters, thread creation modal, DevDojo Pines UI (White Mode) | **Production Active** |

---

## 2. Documentation Route (`/docs/`) Specification

### 2.1 Information Architecture & Hierarchy
1. **Getting Started**
   - System requirements & browser compatibility (SharedArrayBuffer support).
   - Importing video, audio, and image assets.
   - Understanding the multi-track timeline and playhead controls.
2. **Timeline & Canvas Engine**
   - Pixel-to-time coordinate system (`100px = 1 second`).
   - Track types: Video (`V1`, `V2`), Audio (`A1`, `A2`), and VFX layers.
   - Ripple split (<kbd>S</kbd>), drag-and-drop snapping, and in/out boundaries.
3. **Visual Effects (VFX Engine)**
   - Blur, Grayscale, Invert, Sepia, Saturation, Brightness, and Contrast.
   - Custom parameter keyframing and overlay blending.
4. **Audio Mixing & Processing**
   - Web Audio API gain nodes, sample rate selection (44.1kHz vs 48kHz).
   - Bitrate selection (128kbps, 192kbps, 320kbps).
5. **Export & Encoding Pipeline**
   - In-browser FFmpeg WebAssembly compilation.
   - FastStart (moov atom at start of MP4) optimization.
   - Resolution presets (1080p, 4K UHD, 9:16 Vertical Shorts/Reels, 1:1 Square).
6. **Troubleshooting & Diagnostics**
   - Common WebAssembly memory limits and solutions.
   - Hardware acceleration verification.

---

## 3. Community Forum Route (`/forum/`) Specification

### 3.1 Discussion Channels
1. **Help & Troubleshooting (`/forum/c/help`)**: User-to-user support for browser-specific rendering questions and codec inquiries.
2. **Feature Requests & Ideas (`/forum/c/ideas`)**: Upvoting new tools (e.g. waveform display, chroma key green screen, text overlays).
3. **Showcase & Reels (`/forum/c/showcase`)**: Video creators sharing projects and export recipes created inside Hyperion.
4. **Community Presets & Templates (`/forum/c/templates`)**: Downloadable timeline configurations and VFX color grade packs.

### 3.2 Planned Technical Integration
- Authentication: Firebase Auth or OAuth 2.0 provider integration.
- Data Storage: Cloud Firestore or relational PostgreSQL with threads, comments, and reaction counts.
- Search: Client-side instant filter or server-side text indexing.

---

## 4. Planned Future MPA Routes

- `/templates/`: Interactive gallery of pre-configured video projects (YouTube Intro, TikTok/Reel split-screen, Podcast teaser).
- `/changelog/`: Release history with interactive demos of newly introduced timeline tools.
- `/diagnostic/`: Hardware capability probe (WebGL 2.0, WebGPU, WebAssembly SIMD, available RAM).
