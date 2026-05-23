/**
 * Streaming configuration for OBS/streaming software compatibility.
 */

export type StreamingMode =
  | 'normal'
  | 'obs-optimized'
  | 'transparent'
  | 'chroma-key'
  | 'ui-hidden'
  | 'wallpaper';

export interface StreamingConfig {
  mode: StreamingMode;
  chromaKeyColor: string;
  targetFps: number;
  reducedUI: boolean;
  transparentBackground: boolean;
}

export const DEFAULT_STREAMING_CONFIG: StreamingConfig = {
  mode: 'normal',
  chromaKeyColor: '#00ff00',
  targetFps: 60,
  reducedUI: false,
  transparentBackground: false,
};

export const STREAMING_PRESETS: Record<string, Partial<StreamingConfig>> = {
  normal: {
    mode: 'normal',
    targetFps: 60,
    reducedUI: false,
    transparentBackground: false,
  },
  'obs-optimized': {
    mode: 'obs-optimized',
    targetFps: 60,
    reducedUI: true,
    transparentBackground: false,
  },
  transparent: {
    mode: 'transparent',
    targetFps: 60,
    reducedUI: true,
    transparentBackground: true,
  },
  'chroma-key': {
    mode: 'chroma-key',
    chromaKeyColor: '#00ff00',
    targetFps: 60,
    reducedUI: true,
    transparentBackground: false,
  },
  'ui-hidden': {
    mode: 'ui-hidden',
    targetFps: 60,
    reducedUI: true,
    transparentBackground: false,
  },
  wallpaper: {
    mode: 'wallpaper',
    targetFps: 30,
    reducedUI: true,
    transparentBackground: false,
  },
};
