/**
 * Toggle switch component.
 */

import React from 'react';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  className = '',
}) => {
  return (
    <label className={`flex items-center justify-between cursor-pointer ${className}`}>
      <span className="text-xs font-mono text-gray-400">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-9 h-5 rounded-full transition-all duration-200 ${
            checked ? 'bg-cyan-500/40 border-cyan-500/60' : 'bg-gray-700 border-gray-600'
          } border`}
        />
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all duration-200 ${
            checked ? 'translate-x-4 bg-cyan-400 shadow-neon' : 'bg-gray-400'
          }`}
        />
      </div>
    </label>
  );
};
