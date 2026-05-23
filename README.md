# Visualiser

A real-time audio visualizer desktop application built with Electron, React, Three.js, and the Web Audio API. Features GPU-accelerated particle systems, GLSL shader effects, and a modular plugin architecture.

## Tech Stack

- **Runtime:** Electron
- **UI:** React 18 + TailwindCSS (dark cyberpunk theme)
- **3D Engine:** Three.js with custom GLSL shaders
- **Audio:** Web Audio API (FFT analysis)
- **Build:** Vite + TypeScript (strict mode)
- **Testing:** Vitest
- **Packaging:** electron-builder

## Installation

```bash
# Install dependencies
pnpm install
```

## Development

```bash
# Start the development server (Vite + Electron)
pnpm dev
```

This launches the Vite dev server for the renderer process and starts Electron pointing at it.

## Build

```bash
# Type-check and bundle for production
pnpm build

# Type-check only
pnpm typecheck
```

The build produces:
- `dist/renderer/` - bundled React app
- `dist/main/` - compiled Electron main process

## Testing

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test -- --run
```

## Project Structure

```
src/
  main/           - Electron main process (BrowserWindow, IPC)
  renderer/       - React application entry point
  core/           - Engine orchestrator
  audio-engine/   - Web Audio API analysis
  render-engine/  - Three.js rendering pipeline
  shaders/        - GLSL shader files (vertex, fragment, post-processing)
  scenes/         - Visualizer scene implementations
  effects/        - Post-processing effects
  particles/      - GPU particle systems
  camera/         - Camera control system
  presets/        - Preset management
  plugins/        - Plugin architecture
  community/      - Community sharing features
  ui/             - React UI components, panels, layouts
  utils/          - Utility functions
  config/         - Configuration defaults
  assets/         - Static assets
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development (Vite + Electron) |
| `pnpm build` | Production build |
| `pnpm typecheck` | Type-check all code |
| `pnpm test` | Run test suite |
| `pnpm lint` | Lint source files |
