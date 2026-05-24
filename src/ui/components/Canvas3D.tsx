/**
 * Canvas3D component wrapping the Three.js renderer canvas.
 * Handles resize via ResizeObserver.
 */

import React, { useRef, useEffect } from 'react';

interface Canvas3DProps {
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
  onResize: (width: number, height: number) => void;
  className?: string;
}

export const Canvas3D: React.FC<Canvas3DProps> = ({
  onCanvasReady,
  onResize,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      onCanvasReady(canvasRef.current);
    }
  }, [onCanvasReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          onResize(width, height);
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [onResize]);

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
