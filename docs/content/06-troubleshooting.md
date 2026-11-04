# Troubleshooting & Diagnostics

This section addresses common edge cases, browser security configurations, WebAssembly memory bounds, and rendering performance diagnostics.

## WebAssembly Memory Allocation Failures

Because Hyperion runs FFmpeg inside a 32-bit WebAssembly environment, memory address space is strictly limited to 2 GB or 4 GB depending on browser flags.

### Common Symptoms & Solutions:
- **`RuntimeError: memory access out of bounds`**:
  Occurs when rendering excessively long 4K projects in a single continuous pass. To prevent this, reduce export resolution to 1080p or lower the frame rate to 30 FPS.
- **`OOM (Out of Memory) Worker Crash`**:
  Close background browser tabs to free physical RAM and refresh the editor tab to purge unreferenced canvas texture buffers.

## Cross-Origin Isolation Check

If FFmpeg fails to load with an error stating `SharedArrayBuffer is not defined`:

1. Inspect the network response headers of your page in Chrome DevTools (`F12` -> Network -> Headers).
2. Verify both headers are returned with exact casing:
   ```http
   Cross-Origin-Opener-Policy: same-origin
   Cross-Origin-Embedder-Policy: credentialless
   ```
3. If hosting via static CDN or external storage, ensure CORS headers permit worker script evaluation.

## Hardware Acceleration Diagnostics

Ensure your browser is using discrete or integrated GPU acceleration for canvas compositing:

- **Chrome / Chromium**: Navigate to `chrome://gpu` and verify **Rasterization** and **Canvas** display `Hardware accelerated`.
- **Firefox**: Check `about:support` under **Graphics** -> **Compositing: WebRender**.
