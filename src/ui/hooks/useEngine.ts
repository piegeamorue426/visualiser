/**
 * React hook to create, initialize, and manage the Engine instance.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { Engine } from '@core/Engine';
import type { AudioState } from '@audio/types';
import { createDefaultAudioState } from '@audio/types';
import type { RenderStats } from '@render/types';

export interface UseEngineReturn {
  engine: Engine | null;
  audioState: AudioState;
  stats: RenderStats;
  isPlaying: boolean;
  initCanvas: (canvas: HTMLCanvasElement) => void;
  start: () => void;
  stop: () => void;
  loadScene: (sceneId: string) => void;
  loadPreset: (presetId: string) => void;
  startMicrophone: () => Promise<void>;
}

export function useEngine(): UseEngineReturn {
  const engineRef = useRef<Engine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>(createDefaultAudioState());
  const [stats, setStats] = useState<RenderStats>({
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    memoryUsage: 0,
  });

  // Create the engine once
  if (!engineRef.current) {
    engineRef.current = new Engine();
  }

  const initCanvas = useCallback((canvas: HTMLCanvasElement) => {
    if (engineRef.current) {
      engineRef.current.init(canvas);
    }
  }, []);

  const start = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.start();
      setIsPlaying(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      setIsPlaying(false);
    }
  }, []);

  const loadScene = useCallback((sceneId: string) => {
    if (engineRef.current) {
      engineRef.current.loadScene(sceneId);
    }
  }, []);

  const loadPreset = useCallback((presetId: string) => {
    if (engineRef.current) {
      engineRef.current.loadPreset(presetId);
    }
  }, []);

  const startMicrophone = useCallback(async () => {
    if (engineRef.current) {
      await engineRef.current.startMicrophone();
    }
  }, []);

  // Poll for audio state and stats at 60fps, but only update React state when values change
  useEffect(() => {
    let rafId: number;
    let lastFps = 0;
    let lastEnergy = 0;
    let lastBeatDetected = false;

    const update = () => {
      if (engineRef.current && engineRef.current.getIsRunning()) {
        const newAudio = engineRef.current.getAudioState();
        const newStats = engineRef.current.getPerformanceStats();

        // Only trigger React re-renders when meaningful values change
        const energyChanged = Math.abs(newAudio.energy - lastEnergy) > 0.01;
        const beatChanged = newAudio.beatDetected !== lastBeatDetected;
        if (energyChanged || beatChanged) {
          lastEnergy = newAudio.energy;
          lastBeatDetected = newAudio.beatDetected;
          setAudioState(newAudio);
        }

        const fpsChanged = Math.abs(newStats.fps - lastFps) > 1;
        if (fpsChanged) {
          lastFps = newStats.fps;
          setStats(newStats);
        }
      }
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, []);

  return {
    engine: engineRef.current,
    audioState,
    stats,
    isPlaying,
    initCanvas,
    start,
    stop,
    loadScene,
    loadPreset,
    startMicrophone,
  };
}
