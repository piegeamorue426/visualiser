/**
 * Tooltip wrapper component.
 */

import React, { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, className = '' }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-mono text-white bg-gray-900 border border-white/10 rounded whitespace-nowrap z-50">
          {text}
        </div>
      )}
    </div>
  );
};
