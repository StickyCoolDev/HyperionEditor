# Visual Effects (VFX Engine)

Hyperion features a hardware-accelerated Visual Effects (VFX) pipeline that operates directly within the HTML5 Canvas 2D and WebGL rendering pipeline. Effects can be applied globally to master preview frames or customized per individual clip.

## Built-In Shader Filters

The core VFX module exposes six fundamental parametric color grading and spatial transformation filters:

| Filter Name | Parameter Range | Default | Performance Profile |
|---|---|---|---|
| **Gaussian Blur** | `0px - 20px` | `0px` | High (Multi-pass convolution) |
| **Grayscale** | `0% - 100%` | `0%` | Very High (Matrix multiply) |
| **Invert** | `0% - 100%` | `0%` | Very High (Linear inversion) |
| **Sepia** | `0% - 100%` | `0%` | Very High (Color matrix) |
| **Saturation** | `0% - 300%` | `100%` | Very High (Luma preserved) |
| **Contrast** | `0% - 200%` | `100%` | Very High (Midtone clamp) |

## Filter Pipeline Execution

Filters are chained before frame serialization. During preview playback, the engine compiles active parameters into a hardware-accelerated canvas filter string:

```javascript
// Sample active filter chain evaluation
const filterString = `
  blur(${clip.vfx.blur}px)
  grayscale(${clip.vfx.grayscale}%)
  contrast(${clip.vfx.contrast}%)
  saturate(${clip.vfx.saturation}%)
`.trim();

ctx.filter = filterString;
ctx.drawImage(sourceVideo, sx, sy, sw, sh, dx, dy, dw, dh);
ctx.filter = 'none'; // reset state for next layer
```

## Real-Time Preview vs Export Accuracy

During interactive scrubbing, CSS canvas filters leverage GPU hardware rasterization for instantaneous 60 FPS feedback. When exporting, these parameters are translated into exact FFmpeg video filtergraph equations (e.g., `hue=s=1.5,eq=contrast=1.2,gblur=sigma=4`) to ensure bit-perfect render reproducibility.
