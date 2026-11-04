# Keyboard Shortcuts Reference

Accelerate your editing workflow with Hyperion's native keyboard navigation commands:

## Playback & Navigation

| Shortcut | Action | Description |
|---|---|---|
| <kbd>Space</kbd> | **Play / Pause** | Toggles real-time canvas playback and audio synchronization |
| <kbd>Home</kbd> | **Jump to Start** | Moves playhead marker immediately to `00:00:00.00` |
| <kbd>End</kbd> | **Jump to End** | Moves playhead marker to the tail of the longest active clip |
| <kbd>←</kbd> | **Step Back 1 Frame** | Moves playhead backward by exact frame duration (`1/FPS`) |
| <kbd>→</kbd> | **Step Forward 1 Frame** | Moves playhead forward by exact frame duration (`1/FPS`) |
| <kbd>Shift</kbd> + <kbd>←</kbd> | **Jump Back 10 Frames** | Fast scrub backward |
| <kbd>Shift</kbd> + <kbd>→</kbd> | **Jump Forward 10 Frames** | Fast scrub forward |

## Clip Editing Operations

| Shortcut | Action | Description |
|---|---|---|
| <kbd>S</kbd> | **Razor Split** | Slices the clip directly beneath the playhead into two pieces |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | **Undo** | Reverts the most recent timeline modification |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> | **Redo** | Re-applies the reverted operation |
| <kbd>Backspace</kbd> / <kbd>Delete</kbd> | **Delete Clip** | Removes the currently selected clip from the timeline |
| <kbd>M</kbd> | **Add Marker** | Drops a persistent reference flag on the timeline ruler |

## Project & Layout

| Shortcut | Action | Description |
|---|---|---|
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | **Save Project** | Persists timeline state to local IndexedDB storage |
| <kbd>Ctrl</kbd> + <kbd>E</kbd> | **Open Export** | Opens the FFmpeg export and render parameter modal |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | **Quick Search** | Opens the global documentation and action palette |
