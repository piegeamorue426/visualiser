/**
 * Side control panel with tabs for audio, visual, camera, and colors settings.
 */

import React, { useState } from 'react';
import { Slider } from '../components/Slider';
import { Toggle } from '../components/Toggle';
import { ColorPicker } from '../components/ColorPicker';

type PanelTab = 'audio' | 'visual' | 'camera' | 'colors';

export interface ControlPanelSettings {
  audio: {
    sensitivity: number;
    smoothing: number;
  };
  visual: {
    bloom: boolean;
    bloomIntensity: number;
    chromaticAberration: boolean;
    vignette: boolean;
    filmGrain: boolean;
  };
  camera: {
    mode: string;
    shakeIntensity: number;
    orbitSpeed: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

interface ControlPanelProps {
  settings: ControlPanelSettings;
  onSettingsChange: (settings: ControlPanelSettings) => void;
  visible: boolean;
}

const tabs: { id: PanelTab; label: string }[] = [
  { id: 'audio', label: 'AUD' },
  { id: 'visual', label: 'VFX' },
  { id: 'camera', label: 'CAM' },
  { id: 'colors', label: 'CLR' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onSettingsChange,
  visible,
}) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('audio');

  if (!visible) return null;

  const updateAudio = (key: keyof ControlPanelSettings['audio'], value: number) => {
    onSettingsChange({
      ...settings,
      audio: { ...settings.audio, [key]: value },
    });
  };

  const updateVisual = (key: keyof ControlPanelSettings['visual'], value: boolean | number) => {
    onSettingsChange({
      ...settings,
      visual: { ...settings.visual, [key]: value },
    });
  };

  const updateCamera = (key: keyof ControlPanelSettings['camera'], value: string | number) => {
    onSettingsChange({
      ...settings,
      camera: { ...settings.camera, [key]: value },
    });
  };

  const updateColors = (key: keyof ControlPanelSettings['colors'], value: string) => {
    onSettingsChange({
      ...settings,
      colors: { ...settings.colors, [key]: value },
    });
  };

  return (
    <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl w-64 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-2 text-[10px] font-mono transition-all duration-200 ${
              activeTab === tab.id
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-3 space-y-3">
        {activeTab === 'audio' && (
          <>
            <Slider
              label="Sensitivity"
              value={settings.audio.sensitivity}
              min={0.1}
              max={3.0}
              step={0.1}
              onChange={(v) => updateAudio('sensitivity', v)}
            />
            <Slider
              label="Smoothing"
              value={settings.audio.smoothing}
              min={0.1}
              max={0.99}
              step={0.01}
              onChange={(v) => updateAudio('smoothing', v)}
            />
          </>
        )}

        {activeTab === 'visual' && (
          <>
            <Toggle
              label="Bloom"
              checked={settings.visual.bloom}
              onChange={(v) => updateVisual('bloom', v)}
            />
            {settings.visual.bloom && (
              <Slider
                label="Bloom Intensity"
                value={settings.visual.bloomIntensity}
                min={0}
                max={5}
                step={0.1}
                onChange={(v) => updateVisual('bloomIntensity', v)}
              />
            )}
            <Toggle
              label="Chromatic Aberration"
              checked={settings.visual.chromaticAberration}
              onChange={(v) => updateVisual('chromaticAberration', v)}
            />
            <Toggle
              label="Vignette"
              checked={settings.visual.vignette}
              onChange={(v) => updateVisual('vignette', v)}
            />
            <Toggle
              label="Film Grain"
              checked={settings.visual.filmGrain}
              onChange={(v) => updateVisual('filmGrain', v)}
            />
          </>
        )}

        {activeTab === 'camera' && (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono text-gray-400">Mode</span>
              <div className="flex gap-1">
                {['orbit', 'static', 'cinematic', 'follow'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateCamera('mode', mode)}
                    className={`px-2 py-1 rounded text-[10px] font-mono transition-all duration-200 ${
                      settings.camera.mode === mode
                        ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                        : 'text-gray-500 hover:text-gray-300 border border-transparent'
                    }`}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <Slider
              label="Shake Intensity"
              value={settings.camera.shakeIntensity}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => updateCamera('shakeIntensity', v)}
            />
            <Slider
              label="Orbit Speed"
              value={settings.camera.orbitSpeed}
              min={0}
              max={2}
              step={0.1}
              onChange={(v) => updateCamera('orbitSpeed', v)}
            />
          </>
        )}

        {activeTab === 'colors' && (
          <>
            <ColorPicker
              label="Primary"
              value={settings.colors.primary}
              onChange={(v) => updateColors('primary', v)}
            />
            <ColorPicker
              label="Secondary"
              value={settings.colors.secondary}
              onChange={(v) => updateColors('secondary', v)}
            />
            <ColorPicker
              label="Accent"
              value={settings.colors.accent}
              onChange={(v) => updateColors('accent', v)}
            />
            <ColorPicker
              label="Background"
              value={settings.colors.background}
              onChange={(v) => updateColors('background', v)}
            />
          </>
        )}
      </div>
    </div>
  );
};
