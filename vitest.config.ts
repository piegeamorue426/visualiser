import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@audio': path.resolve(__dirname, 'src/audio-engine'),
      '@render': path.resolve(__dirname, 'src/render-engine'),
      '@shaders': path.resolve(__dirname, 'src/shaders'),
      '@scenes': path.resolve(__dirname, 'src/scenes'),
      '@effects': path.resolve(__dirname, 'src/effects'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@presets': path.resolve(__dirname, 'src/presets'),
      '@particles': path.resolve(__dirname, 'src/particles'),
      '@camera': path.resolve(__dirname, 'src/camera'),
      '@plugins': path.resolve(__dirname, 'src/plugins'),
      '@community': path.resolve(__dirname, 'src/community'),
    },
  },
});
