/**
 * BackgroundSelector - UI component for selecting and configuring backgrounds.
 */

import React, { useState } from 'react';
import type { BackgroundType, BackgroundConfig } from '@effects/BackgroundRenderer';

interface BackgroundSelectorProps {
  onChange?: (config: BackgroundConfig) => void;
}

type TabType = 'solid' | 'gradient' | 'image' | 'transparent';

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('solid');
  const [solidColor, setSolidColor] = useState('#0a0a0f');
  const [gradientStart, setGradientStart] = useState('#000000');
  const [gradientEnd, setGradientEnd] = useState('#1a1a2e');

  const emitChange = (type: BackgroundType, overrides?: Partial<BackgroundConfig>) => {
    const config: BackgroundConfig = { type, ...overrides };
    onChange?.(config);
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'solid', label: 'Solid' },
    { id: 'gradient', label: 'Gradient' },
    { id: 'image', label: 'Image' },
    { id: 'transparent', label: 'Transparent' },
  ];

  return (
    <div className="bg-black/80 backdrop-blur-xl border border-gray-700/50 rounded-lg p-3">
      <h4 className="text-[10px] font-mono text-gray-400 uppercase mb-2">
        Background
      </h4>

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'transparent') {
                emitChange('transparent');
              }
            }}
            className={`text-[9px] font-mono px-2 py-1 rounded transition-colors ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'bg-gray-800/50 text-gray-500 border border-gray-700/30 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'solid' && (
        <div className="space-y-2">
          <input
            type="color"
            value={solidColor}
            onChange={(e) => {
              setSolidColor(e.target.value);
              emitChange('solid', { color: e.target.value });
            }}
            className="w-full h-8 rounded border border-gray-700 cursor-pointer"
          />
          <div
            className="w-full h-6 rounded border border-gray-700"
            style={{ backgroundColor: solidColor }}
          />
        </div>
      )}

      {activeTab === 'gradient' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[9px] font-mono text-gray-500 block mb-1">Start</label>
              <input
                type="color"
                value={gradientStart}
                onChange={(e) => {
                  setGradientStart(e.target.value);
                  emitChange('gradient', {
                    gradientStart: e.target.value,
                    gradientEnd,
                  });
                }}
                className="w-full h-6 rounded border border-gray-700 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <label className="text-[9px] font-mono text-gray-500 block mb-1">End</label>
              <input
                type="color"
                value={gradientEnd}
                onChange={(e) => {
                  setGradientEnd(e.target.value);
                  emitChange('gradient', {
                    gradientStart,
                    gradientEnd: e.target.value,
                  });
                }}
                className="w-full h-6 rounded border border-gray-700 cursor-pointer"
              />
            </div>
          </div>
          <div
            className="w-full h-6 rounded border border-gray-700"
            style={{
              background: `linear-gradient(to bottom, ${gradientStart}, ${gradientEnd})`,
            }}
          />
        </div>
      )}

      {activeTab === 'image' && (
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                emitChange('image', { imageUrl: url });
              }
            }}
            className="w-full text-[10px] font-mono text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-mono file:bg-gray-800 file:text-gray-300"
          />
        </div>
      )}

      {activeTab === 'transparent' && (
        <p className="text-[10px] font-mono text-gray-500">
          Background will be transparent. Useful for OBS window capture with
          chroma key or transparent window mode.
        </p>
      )}
    </div>
  );
};
