# Audio Mixing & Processing

Audio fidelity in Hyperion is driven by the browser's native **Web Audio API**. This architecture provides sample-accurate mixing, dynamic volume automation, and multi-track ducking without digital clipping.

## Web Audio Graph Architecture

Each clip positioned on audio tracks `A1` and `A2` connects to an isolated `GainNode` sub-tree before routing into a master summing bus:

```
[ Clip Buffer Source ] ──> [ Track Gain Node ] ──> [ Master Bus ] ──> [ AudioDestination ]
                                                        │
                                                        ▼
                                              [ AnalyserNode (Meters) ]
```

## Sample Rates & Bitrate Settings

Hyperion allows setting output audio sample rate and bitrate in project settings:

- **44.1 kHz (CD Quality)**: Optimal for general web video, social media podcasts, and standard stereo exports.
- **48.0 kHz (Cinema / Broadcast Standard)**: Recommended for synchronization with video recorded at 24/30/60 FPS to prevent progressive audio clock drift.

### Audio Bitrate Presets

| Preset | Target Bitrate | Recommended Usage |
|---|---|---|
| **Standard** | `128 kbps` | Social media shorts, quick draft previews |
| **High Fidelity** | `192 kbps` | YouTube standard, commercial productions |
| **Studio Master** | `320 kbps` | High-fidelity music videos, pristine voiceovers |

## Real-Time Peak Metering

The timeline master output incorporates a real-time `AnalyserNode` polling RMS power and peak levels at 60 Hz. This drives the visual stereo decibel meters in the transport panel, providing instant warning if overall gain approaches `0 dBFS` clipping.
