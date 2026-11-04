# Timeline & Canvas Engine

The Hyperion timeline engine is engineered to handle non-linear multi-track video editing with high rendering precision. This section details the coordinate math, track layers, and playhead synchronization algorithms.

## Coordinate System & Time Mapping

The timeline operates on a continuous floating-point time coordinate system mapped directly to horizontal canvas pixels:

```math
pixelX = timeInSeconds * pixelsPerSecond
```

By default, the zoom ratio is calibrated at `100px = 1.0 second`. This linear relationship allows seamless scrubbing without cumulative rounding errors across hours of footage:

- **100px = 1 second**: 1 frame at 60 FPS corresponds to `~1.667px`.
- **Zoom In**: Scales up to `400px/s` for sub-frame razor edits and audio transient alignment.
- **Zoom Out**: Scales down to `20px/s` for macro project overview.

## Track Hierarchy & Layering

Hyperion supports independent audio and visual tracks layered vertically:

- **Track V2 (Top Video Layer)**: Overlay graphics, lower thirds, reaction PIP windows, and watermarks.
- **Track V1 (Base Video Layer)**: Primary footage, A-roll, background plates, and canvas transitions.
- **Track A1 (Primary Audio)**: Dialogue, voiceover, and primary clip sync tracks.
- **Track A2 (Secondary Audio)**: Background music bed, sound effects (SFX), and ambient room tone.

During frame rendering, visual tracks are composited from bottom to top (`V1` followed by `V2`) onto the master canvas using standard source-over alpha blending.

## Editing & Razor Splitting

Hyperion delivers responsive non-destructive trimming and clip separation:

- **Playhead Razor Split**: Position the playhead marker anywhere over an active clip and press <kbd>S</kbd>. The clip is sliced into two discrete segments maintaining original source offsets.
- **Edge Trimming**: Hovering over the left or right boundary of any clip activates the trim handle. Dragging adjusts the in/out point of the media segment in real-time.
- **Magnetic Snapping**: When moving clips, boundaries automatically snap to adjacent clip edges or the current playhead marker within a 10-pixel threshold.
