/**
 * Color picker input wrapper component.
 */

import React from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="text-xs font-mono text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-gray-500">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded border border-white/10 cursor-pointer bg-transparent"
        />
      </div>
    </div>
  );
};
