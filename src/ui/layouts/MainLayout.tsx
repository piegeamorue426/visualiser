/**
 * Main application layout with canvas background and overlay UI.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas3D } from '../components/Canvas3D';
import { PerformanceOverlay } from '../components/PerformanceOverlay';
import { AudioMeter } from '../components/AudioMeter';
import { SceneSelector } from '../components/SceneSelector';
import { PresetBrowser } from '../components/PresetBrowser';
import { ControlPanel } from '../panels/ControlPanel';
import type { ControlPanelSettings } from '../panels/ControlPanel';
import { StreamingPanel } from '../panels/StreamingPanel';
import { WallpaperPanel } from '../panels/WallpaperPanel';
import { Button } from '../components/Button';
import { useEngine } from '../hooks/useEngine';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { builtInPresets } from '@presets/built-in';
import type { SceneConfig } from '@scenes/types';

interface SceneEntry {
  id: string;
  config: SceneConfig;
}

export const MainLayout: React.FC = () => {
  const {
    engine,
    audioState,
    stats,
    isPlaying,
    initCanvas,
    start,
    stop,
    loadScene,
    loadPreset,
    startMicrophone,
  } = useEngine();

  const [uiVisible, setUiVisible] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showSceneSelector, setShowSceneSelector] = useState(false);
  const [showPresetBrowser, setShowPresetBrowser] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(true);
  const [showStreamingPanel, setShowStreamingPanel] = useState(false);
  const [showWallpaperPanel, setShowWallpaperPanel] = useState(false);
  const [audioPermissionAsked, setAudioPermissionAsked] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState<string | null>('circular-spectrum');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [scenes, setScenes] = useState<SceneEntry[]>([]);

  const [controlSettings, setControlSettings] = useState<ControlPanelSettings>({
    audio: { sensitivity: 1.0, smoothing: 0.8 },
    visual: {
      bloom: true,
      bloomIntensity: 1.5,
      chromaticAberration: true,
      vignette: true,
      filmGrain: false,
    },
    camera: { mode: 'orbit', shakeIntensity: 0.1, orbitSpeed: 0.3 },
    colors: {
      primary: '#00ffcc',
      secondary: '#ff00ff',
      accent: '#7b2dff',
      background: '#0a0a0f',
    },
  });

  const sceneIdsRef = useRef<string[]>([]);

  // Populate scenes list from engine
  useEffect(() => {
    if (!engine) return;
    const manager = engine.getSceneManager();
    const available = manager.getAvailableScenes();
    setScenes(available);
    sceneIdsRef.current = available.map((s) => s.id);
  }, [engine]);

  const handleCanvasReady = useCallback(
    (canvas: HTMLCanvasElement) => {
      initCanvas(canvas);
      start();
    },
    [initCanvas, start]
  );

  const handleResize = useCallback(
    (width: number, height: number) => {
      if (engine) {
        engine.resize(width, height);
      }
    },
    [engine]
  );

  const handleStartAudio = useCallback(async () => {
    try {
      await startMicrophone();
      setAudioPermissionAsked(true);
    } catch {
      setAudioPermissionAsked(true);
    }
  }, [startMicrophone]);

  const handleSelectScene = useCallback(
    (sceneId: string) => {
      loadScene(sceneId);
      setActiveSceneId(sceneId);
      setShowSceneSelector(false);
    },
    [loadScene]
  );

  const handleSelectPreset = useCallback(
    (presetId: string) => {
      loadPreset(presetId);
      setActivePresetId(presetId);
      setShowPresetBrowser(false);
    },
    [loadPreset]
  );

  const handleNextScene = useCallback(() => {
    const ids = sceneIdsRef.current;
    if (ids.length === 0) return;
    const currentIndex = ids.indexOf(activeSceneId ?? '');
    const nextIndex = (currentIndex + 1) % ids.length;
    handleSelectScene(ids[nextIndex]);
  }, [activeSceneId, handleSelectScene]);

  const handlePreviousScene = useCallback(() => {
    const ids = sceneIdsRef.current;
    if (ids.length === 0) return;
    const currentIndex = ids.indexOf(activeSceneId ?? '');
    const prevIndex = (currentIndex - 1 + ids.length) % ids.length;
    handleSelectScene(ids[prevIndex]);
  }, [activeSceneId, handleSelectScene]);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handlePresetSelect = useCallback(
    (index: number) => {
      const presets = builtInPresets;
      if (index < presets.length) {
        handleSelectPreset(presets[index].id);
      }
    },
    [handleSelectPreset]
  );

  const handleToggleFavorite = useCallback(
    (presetId: string) => {
      if (engine) {
        engine.getPresetManager().toggleFavorite(presetId);
      }
    },
    [engine]
  );

  useKeyboardShortcuts({
    onTogglePlay: () => (isPlaying ? stop() : start()),
    onToggleFullscreen: handleToggleFullscreen,
    onNextScene: handleNextScene,
    onPreviousScene: handlePreviousScene,
    onToggleUI: () => setUiVisible((v) => !v),
    onShowUI: () => {
      setUiVisible(true);
      setShowSceneSelector(false);
      setShowPresetBrowser(false);
    },
    onPresetSelect: handlePresetSelect,
  });

  const allPresets = engine ? engine.getPresetManager().getAll() : builtInPresets;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-cyber-bg">
      {/* Canvas background */}
      <div className="absolute inset-0 z-0">
        <Canvas3D onCanvasReady={handleCanvasReady} onResize={handleResize} />
      </div>

      {/* UI overlay container - pointer-events-none by default */}
      {uiVisible && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between p-3 pointer-events-auto">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-mono font-bold text-cyan-400">
                VISUALISER
              </h1>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  className="!px-2 !py-1 text-[10px]"
                  onClick={() => setShowSceneSelector((v) => !v)}
                >
                  SCENES
                </Button>
                <Button
                  variant="ghost"
                  className="!px-2 !py-1 text-[10px]"
                  onClick={() => setShowPresetBrowser((v) => !v)}
                >
                  PRESETS
                </Button>
                <Button
                  variant="ghost"
                  className="!px-2 !py-1 text-[10px]"
                  onClick={() => setShowControlPanel((v) => !v)}
                >
                  CTRL
                </Button>
                <Button
                  variant="ghost"
                  className="!px-2 !py-1 text-[10px]"
                  onClick={() => setShowStreamingPanel((v) => !v)}
                >
                  STREAM
                </Button>
                <Button
                  variant="ghost"
                  className="!px-2 !py-1 text-[10px]"
                  onClick={() => setShowWallpaperPanel((v) => !v)}
                >
                  WALLPAPER
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStats((v) => !v)}
                className="text-[10px] font-mono text-gray-500 hover:text-gray-300 transition-colors"
              >
                STATS
              </button>
              <PerformanceOverlay stats={stats} visible={showStats} />
            </div>
          </div>

          {/* Middle area with overlays */}
          <div className="flex-1 flex items-start justify-center p-4 relative">
            {/* Scene selector overlay */}
            {showSceneSelector && (
              <div className="pointer-events-auto absolute left-4 top-0">
                <SceneSelector
                  scenes={scenes}
                  activeSceneId={activeSceneId}
                  onSelect={handleSelectScene}
                  onClose={() => setShowSceneSelector(false)}
                />
              </div>
            )}

            {/* Preset browser overlay */}
            {showPresetBrowser && (
              <div className="pointer-events-auto absolute left-4 top-0">
                <PresetBrowser
                  presets={allPresets}
                  activePresetId={activePresetId}
                  onSelect={handleSelectPreset}
                  onToggleFavorite={handleToggleFavorite}
                  onImport={() => {}}
                  onExport={() => {}}
                  onClose={() => setShowPresetBrowser(false)}
                />
              </div>
            )}

            {/* Audio permission prompt */}
            {!audioPermissionAsked && (
              <div className="pointer-events-auto mt-8">
                <div className="bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-6 text-center">
                  <p className="text-sm font-mono text-gray-300 mb-4">
                    Enable microphone for audio reactivity?
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="primary" onClick={handleStartAudio}>
                      Enable Audio
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setAudioPermissionAsked(true)}
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="absolute top-16 right-3 pointer-events-auto space-y-2">
            <ControlPanel
              settings={controlSettings}
              onSettingsChange={setControlSettings}
              visible={showControlPanel}
            />
            <StreamingPanel
              visible={showStreamingPanel}
              onClose={() => setShowStreamingPanel(false)}
            />
            <WallpaperPanel
              visible={showWallpaperPanel}
              onClose={() => setShowWallpaperPanel(false)}
            />
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between p-3 pointer-events-auto">
            <AudioMeter audioState={audioState} />
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-gray-500">
                {activeSceneId?.replace(/-/g, ' ').toUpperCase() ?? 'NO SCENE'}
              </span>
              <Button
                variant="ghost"
                className="!px-2 !py-1 text-[10px]"
                onClick={() => (isPlaying ? stop() : start())}
              >
                {isPlaying ? 'PAUSE' : 'PLAY'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
