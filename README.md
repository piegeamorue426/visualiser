# Visualiser

A real-time audio visualizer desktop application built with Electron, React, Three.js, and Web Audio API. Features GPU-accelerated 3D graphics, 12 distinct visualization scenes, a preset system, plugin architecture, and streaming/OBS compatibility.

## Features

- **Real-time Audio Analysis** - FFT spectrum analysis, beat detection, BPM estimation, frequency band isolation
- **12 Visualization Scenes** - Circular spectrum, waveform terrain, particle nebula, geometric tunnel, frequency bars, audio landscape, plasma field, star field, fractal tree, DNA helix, ocean waves, northern lights
- **Preset System** - Save, load, and share visualization configurations with categorized presets
- **Plugin Architecture** - Extensible plugin system for custom visualizations and behaviors
- **Post-Processing Pipeline** - Bloom, chromatic aberration, vignette, film grain effects
- **GPU Particle Engine** - Up to 100,000 particles with physics simulation
- **Camera System** - Orbit, static, cinematic, and follow camera modes with audio-reactive shake
- **Streaming Support** - OBS-optimized modes, transparent background, chroma key
- **Wallpaper Mode** - Low-CPU desktop wallpaper mode with configurable FPS limits
- **Community Architecture** - Prepared for preset sharing and community features
- **Keyboard Shortcuts** - Fully configurable keyboard bindings
- **System Tray** - Quick access via system tray with scene and preset switching

## Tech Stack

- **Electron** - Desktop application framework
- **React** - UI components and state management
- **Three.js** - 3D rendering and WebGL
- **Web Audio API** - Real-time audio analysis
- **Vite** - Build tooling and HMR
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **Vitest** - Unit testing

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd visualiser

# Install dependencies
pnpm install
```

## Development

```bash
# Start in development mode with hot reload
pnpm dev
```

## Building

```bash
# Build for production
pnpm build

# Type check
pnpm typecheck
```

## Testing

```bash
# Run tests
pnpm test

# Run tests once (no watch)
pnpm test -- --run
```

## Architecture

```
src/
  main/           - Electron main process, IPC handlers, system tray
  renderer/       - React application entry point
  core/           - Engine orchestrator, event bus, global state
  audio-engine/   - Audio analysis, beat detection, frequency bands
  render-engine/  - Three.js render pipeline, post-processing
  shaders/        - GLSL vertex and fragment shaders
  scenes/         - 12 visualization scene implementations
  effects/        - Background renderer, overlay renderer
  particles/      - GPU particle system with emitters
  camera/         - Camera modes and audio-reactive movement
  presets/        - Preset management and built-in presets
  plugins/        - Plugin system and lifecycle management
  community/      - Community features architecture (stub)
  ui/             - React components, panels, hooks, layouts
  utils/          - Math utilities, export helpers
  config/         - Configuration (streaming, wallpaper, shortcuts)
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause visualizer |
| F | Toggle fullscreen |
| Right Arrow | Next scene |
| Left Arrow | Previous scene |
| Up Arrow | Next preset |
| Down Arrow | Previous preset |
| H | Hide/show UI overlay |
| Ctrl+S | Capture screenshot |
| P | Toggle control panel |
| Escape | Close active overlay |
| 1-9 | Load preset by number |
| M | Toggle audio input mute |
| R | Load random scene |
| C | Cycle camera mode |
| B | Toggle bloom effect |

## Customization

### Presets

Presets configure the entire visualizer state including scene, audio sensitivity, post-processing effects, camera mode, and colors. Use the preset browser (PRESETS button) to switch between built-in presets or create your own.

### Colors

Each preset includes a color palette with primary, secondary, accent, and background colors that drive the visualization appearance.

### Post-Processing

Effects can be toggled individually:
- **Bloom** - Glow effect on bright elements
- **Chromatic Aberration** - Color fringing at edges
- **Vignette** - Darkened corners
- **Film Grain** - Subtle noise overlay

## Plugin Development

Plugins extend the visualizer with custom behaviors. Create a plugin by implementing the `Plugin` interface:

```typescript
import type { Plugin, PluginContext } from '@plugins/types';

const myPlugin: Plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'A custom plugin',
  author: 'Your Name',

  init(context: PluginContext) {
    // Access audio state, scene manager, event bus
    context.eventBus.on('beat', (data) => {
      // React to beats
    });

    // Register custom commands
    context.registerCommand('my-action', () => {
      // Custom action
    });
  },

  destroy() {
    // Cleanup resources
  },

  onAudioUpdate(audioState) {
    // Called every frame with current audio analysis
  },

  onRender(deltaTime) {
    // Called every render frame
  },
};
```

Register plugins with the engine:

```typescript
engine.getPluginManager().register(myPlugin);
```

### Plugin Context API

- `audioState()` - Get current audio analysis state
- `sceneManager.loadScene(id)` - Switch to a scene
- `sceneManager.getActiveSceneId()` - Get current scene ID
- `eventBus.on(event, handler)` - Subscribe to events (beat, drop, sceneChange)
- `eventBus.off(event, handler)` - Unsubscribe from events
- `registerCommand(name, handler)` - Register a named command

## Streaming Setup

### OBS Studio

1. Open the Streaming panel (STREAM button in the top bar)
2. Select a streaming mode:
   - **OBS Optimized** - Stable FPS with reduced UI
   - **Transparent** - Transparent background for window capture
   - **Chroma Key** - Solid color background for chroma key filtering
   - **UI Hidden** - No overlay UI rendered
3. In OBS, add a Window Capture source pointing to the Visualiser window
4. For chroma key mode, add a Chroma Key filter in OBS

### Transparent Window Capture

Set the mode to "Transparent" for alpha-channel rendering. Use Window Capture in OBS with the "Allow Transparency" option enabled.

## Wallpaper Mode

Wallpaper mode reduces CPU/GPU usage for long-running desktop wallpaper use:

1. Open the Wallpaper panel (WALLPAPER button)
2. Enable Wallpaper Mode
3. Configure FPS limit (5-60 FPS)
4. Enable Low CPU Mode for minimal resource usage
5. Optionally enable "Auto-start with System"

When in wallpaper mode, the visualizer reduces particle counts and rendering complexity to maintain low resource usage.

## License

MIT
